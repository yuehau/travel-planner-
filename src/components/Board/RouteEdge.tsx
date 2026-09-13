import { memo, useEffect, useRef, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useNodesData, type EdgeProps } from '@xyflow/react';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.mjs';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs';
import type { PlaceNode, RouteEdge as RouteEdgeType } from '../../utils/boardGraph';
import { describeLeg } from '../../utils/routeEstimate';
import { getTransportOption, transportOptions } from '../../utils/transport';
import { useBoardActions } from './boardContext';

const RouteEdge = ({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }: EdgeProps<RouteEdgeType>) => {
  const { changeTransport, removeLink } = useBoardActions();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const endpoints = useNodesData<PlaceNode>([source, target]);
  const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 18 });

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  if (!data) return <BaseEdge id={id} path={edgePath} />;

  const { link } = data;
  const transport = getTransportOption(link.transport_mode);
  const TransportIcon = transport.icon;
  const sourcePlace = endpoints[0]?.data.place;
  const targetPlace = endpoints[1]?.data.place;
  const leg = sourcePlace && targetPlace ? describeLeg(sourcePlace, targetPlace, link.transport_mode) : null;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{ strokeWidth: selected ? 3 : 2.25 }} />
      <EdgeLabelRenderer>
        <div
          ref={menuRef}
          className="nodrag nopan absolute"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: 'all' }}
        >
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold shadow-md shadow-mist-950/15 transition ${
              isOpen || selected
                ? 'border-accent bg-accent text-on-accent'
                : 'border-line bg-surface-raised text-ink hover:border-accent hover:text-accent-hover'
            }`}
            aria-label={`Transit from ${sourcePlace?.name ?? 'place'} to ${targetPlace?.name ?? 'place'}: ${transport.label}`}
          >
            <TransportIcon size={14} />
            <span>{transport.label}</span>
            {leg?.duration && <span className="opacity-70">· {leg.duration}</span>}
            <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute left-1/2 top-10 z-30 w-44 -translate-x-1/2 rounded-2xl border border-line bg-surface-raised p-1.5 shadow-xl shadow-mist-950/20 animate-rise-in">
              {transportOptions.map((option) => {
                const Icon = option.icon;
                const optionLeg = sourcePlace && targetPlace ? describeLeg(sourcePlace, targetPlace, option.mode) : null;
                const isActive = option.mode === link.transport_mode;
                return (
                  <button
                    key={option.mode}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      if (!isActive) changeTransport(link, option.mode);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition ${
                      isActive ? 'bg-primary font-semibold text-on-primary' : 'text-ink hover:bg-surface-sunken'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{option.label}</span>
                    {optionLeg?.duration && <span className="ml-auto opacity-70">{optionLeg.duration}</span>}
                  </button>
                );
              })}
              {leg?.distance && (
                <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-widest text-ink-faint">≈ {leg.distance} straight line</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  removeLink(link);
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-line px-3 py-2 text-left text-xs text-danger transition hover:bg-mist-100 dark:hover:bg-mist-950/40"
              >
                <Trash2 size={14} />
                Remove route
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(RouteEdge);
