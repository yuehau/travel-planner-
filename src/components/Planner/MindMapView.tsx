import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle.mjs';
import Clock from 'lucide-react/dist/esm/icons/clock.mjs';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.mjs';
import Wallet from 'lucide-react/dist/esm/icons/wallet.mjs';
import type { ItineraryNode } from '../../types/database';
import type { TravelDataClient } from '../../services/travelData';
import { applyReplanProposal, computeDescendants, requestReplan, type ReplanProposal } from '../../services/replan';

type MindMapViewProps = {
  tripId: string;
  travelData: TravelDataClient;
};

const BREAK_REASONS = ['Delayed', 'Cancelled or venue closed', 'Person dropped out'] as const;

const formatTime = (time: string | null) => {
  if (!time) return null;

  const [hours = '0', minutes = '0'] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
};

const statusBorderClass = (node: ItineraryNode, isUnderReview: boolean) => {
  if (isUnderReview) return 'border-l-amber-500';
  if (node.status === 'broken') return 'border-l-red-500';
  if (node.status === 'replanned') return 'border-l-emerald-500';
  if (node.status === 'cancelled') return 'border-l-zinc-300 dark:border-l-zinc-700';
  return 'border-l-zinc-300 dark:border-l-zinc-700';
};

const MindMapView: React.FC<MindMapViewProps> = ({ tripId, travelData }) => {
  const [nodes, setNodes] = useState<ItineraryNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [breakingNodeId, setBreakingNodeId] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  const [descendantIds, setDescendantIds] = useState<Set<string>>(new Set());
  const [activeBrokenNodeId, setActiveBrokenNodeId] = useState<string | null>(null);
  const [activeReason, setActiveReason] = useState<string>('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [proposal, setProposal] = useState<ReplanProposal | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connectorPaths, setConnectorPaths] = useState<{ id: string; d: string }[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadNodes = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const loaded = await travelData.listItineraryNodes(tripId);
        if (isMounted) setNodes(loaded);
      } catch (error) {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Could not load the mind map.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadNodes();

    return () => {
      isMounted = false;
    };
  }, [travelData, tripId]);

  const days = useMemo(() => {
    const byDay = new Map<number, ItineraryNode[]>();
    for (const node of nodes) {
      const list = byDay.get(node.day_number) ?? [];
      list.push(node);
      byDay.set(node.day_number, list);
    }
    for (const list of byDay.values()) {
      list.sort((a, b) => a.sequence_index - b.sequence_index);
    }
    return [...byDay.entries()].sort(([a], [b]) => a - b);
  }, [nodes]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const paths: { id: string; d: string }[] = [];

    for (const node of nodes) {
      if (!node.parent_node_id) continue;
      const parentEl = cardRefs.current.get(node.parent_node_id);
      const childEl = cardRefs.current.get(node.id);
      if (!parentEl || !childEl) continue;

      const parentRect = parentEl.getBoundingClientRect();
      const childRect = childEl.getBoundingClientRect();

      const px = parentRect.left + parentRect.width / 2 - containerRect.left;
      const py = parentRect.bottom - containerRect.top;
      const cx = childRect.left + childRect.width / 2 - containerRect.left;
      const cy = childRect.top - containerRect.top;
      const dy = cy - py;

      paths.push({
        id: `${node.parent_node_id}-${node.id}`,
        d: `M ${px} ${py} C ${px} ${py + dy / 2}, ${cx} ${cy - dy / 2}, ${cx} ${cy}`,
      });
    }

    setConnectorPaths(paths);
  }, [nodes, days]);

  const resetReplanState = () => {
    setBreakingNodeId(null);
    setCustomReason('');
    setDescendantIds(new Set());
    setActiveBrokenNodeId(null);
    setActiveReason('');
    setProposal(null);
    setProposalError(null);
  };

  const handleBreak = async (nodeId: string, reason: string) => {
    setBreakingNodeId(null);
    setCustomReason('');
    setProposalError(null);

    const descendants = computeDescendants(nodes, nodeId);
    setDescendantIds(new Set([nodeId, ...descendants]));
    setActiveBrokenNodeId(nodeId);
    setActiveReason(reason);
    setIsRequesting(true);

    try {
      const brokenNode = await travelData.markNodeBroken(nodeId, reason);
      setNodes((current) => current.map((node) => (node.id === brokenNode.id ? brokenNode : node)));

      const knownNodeIds = new Set(nodes.map((node) => node.id));
      const nextProposal = await requestReplan(tripId, nodeId, reason, knownNodeIds);
      setProposal(nextProposal);
    } catch (error) {
      setProposalError(error instanceof Error ? error.message : 'Could not get a re-plan proposal.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleApply = async () => {
    if (!proposal || !activeBrokenNodeId) return;

    setIsApplying(true);
    setProposalError(null);

    try {
      await applyReplanProposal(travelData, tripId, activeBrokenNodeId, activeReason, proposal);
      const refreshed = await travelData.listItineraryNodes(tripId);
      setNodes(refreshed);
      resetReplanState();
    } catch (error) {
      setProposalError(error instanceof Error ? error.message : 'Could not apply the proposal.');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">Loading mind map...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tighter">Mind Map</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Every stop is a node. Mark one broken and see how the plan re-flows.
        </p>
      </div>

      {loadError && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}

      {proposalError && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{proposalError}</div>
      )}

      {!isLoading && nodes.length === 0 && !loadError && (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">No mind-map nodes for this trip yet.</div>
      )}

      <div ref={containerRef} className="relative flex gap-8 overflow-x-auto pb-4">
        <svg className="absolute inset-0 h-full w-full pointer-events-none" style={{ overflow: 'visible' }}>
          {connectorPaths.map((path) => (
            <path key={path.id} d={path.d} fill="none" stroke="currentColor" className="text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} />
          ))}
        </svg>

        {days.map(([dayNumber, dayNodes]) => (
          <div key={dayNumber} className="relative z-10 flex w-72 shrink-0 flex-col gap-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Day {dayNumber}</div>

            {dayNodes.map((node) => {
              const isUnderReview = descendantIds.has(node.id) && (isRequesting || proposal !== null);
              const time = formatTime(node.start_time);

              return (
                <div
                  key={node.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(node.id, el);
                    else cardRefs.current.delete(node.id);
                  }}
                  className={`rounded-xl border border-zinc-200 dark:border-zinc-800 border-l-4 bg-white dark:bg-zinc-900 p-4 shadow-sm transition-all duration-500 ${statusBorderClass(node, isUnderReview)} ${node.status === 'cancelled' ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {time && (
                        <div className="flex items-center gap-1 text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1 uppercase tracking-wider">
                          <Clock size={12} />
                          {time}
                        </div>
                      )}
                      <h3 className={`text-sm font-semibold ${node.status === 'cancelled' ? 'line-through text-zinc-400' : ''}`}>
                        {node.title}
                      </h3>
                      {node.notes && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{node.notes}</p>}
                      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                        <Wallet size={12} />
                        {node.currency} {node.estimated_cost}
                        {node.ai_generated && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Sparkles size={12} /> AI
                          </span>
                        )}
                      </div>
                      {node.status === 'broken' && node.break_reason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">Broken: {node.break_reason}</p>
                      )}
                    </div>

                    {!travelData.isReadOnly && node.status === 'planned' && !proposal && (
                      <button
                        type="button"
                        onClick={() => setBreakingNodeId(breakingNodeId === node.id ? null : node.id)}
                        aria-label={`Something broke with ${node.title}`}
                        className="p-1 text-zinc-300 dark:text-zinc-700 hover:text-red-500 transition-colors"
                      >
                        <AlertTriangle size={16} />
                      </button>
                    )}
                  </div>

                  {breakingNodeId === node.id && (
                    <div className="mt-3 flex flex-col gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      {BREAK_REASONS.map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => handleBreak(node.id, reason)}
                          className="text-left text-xs px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          {reason}
                        </button>
                      ))}
                      <div className="flex gap-2">
                        <input
                          value={customReason}
                          onChange={(event) => setCustomReason(event.target.value)}
                          placeholder="Custom reason"
                          className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none"
                        />
                        <button
                          type="button"
                          disabled={!customReason.trim()}
                          onClick={() => handleBreak(node.id, customReason.trim())}
                          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-40"
                        >
                          Go
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {(isRequesting || proposal) && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="max-w-6xl mx-auto">
            {isRequesting && <div className="text-sm text-zinc-500 dark:text-zinc-400">Asking Claude how to re-plan around this...</div>}

            {proposal && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{proposal.summary}</p>
                  {!proposal.within_budget && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      This proposal exceeds the trip's budget cap (estimated total: {proposal.total_estimated_cost}).
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={resetReplanState}
                    disabled={isApplying}
                    className="px-4 py-2 rounded-full text-sm font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={isApplying}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isApplying ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMapView;
