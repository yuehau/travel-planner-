import { getSupabaseClient } from '../lib/supabase';
import type { ItineraryNode } from '../types/database';
import type { TravelDataClient } from './travelData';

export type ReplanNodeAction = 'keep' | 'modify' | 'cancel' | 'insert';

export type ReplanUpdatedNode = {
  node_id: string | null;
  action: ReplanNodeAction;
  title: string;
  day_number: number;
  sequence_index: number;
  start_time: string | null;
  end_time: string | null;
  estimated_cost: number;
  notes: string | null;
  parent_node_id: string | null;
};

export type ReplanProposal = {
  summary: string;
  updated_nodes: ReplanUpdatedNode[];
  total_estimated_cost: number;
  within_budget: boolean;
};

export class ReplanValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReplanValidationError';
  }
}

/** Walks parent_node_id links to find every node transitively below rootId. */
export const computeDescendants = (nodes: Pick<ItineraryNode, 'id' | 'parent_node_id'>[], rootId: string): string[] => {
  const childrenByParent = new Map<string, string[]>();

  for (const node of nodes) {
    if (!node.parent_node_id) continue;
    const siblings = childrenByParent.get(node.parent_node_id) ?? [];
    siblings.push(node.id);
    childrenByParent.set(node.parent_node_id, siblings);
  }

  const visited = new Set<string>();
  const queue = [...(childrenByParent.get(rootId) ?? [])];

  while (queue.length > 0) {
    const id = queue.shift() as string;
    if (visited.has(id)) continue;
    visited.add(id);
    queue.push(...(childrenByParent.get(id) ?? []));
  }

  return [...visited];
};

const isNullableString = (value: unknown): value is string | null => value === null || typeof value === 'string';

const validateUpdatedNode = (raw: unknown, knownNodeIds: Set<string>, index: number): ReplanUpdatedNode => {
  if (typeof raw !== 'object' || raw === null) {
    throw new ReplanValidationError(`updated_nodes[${index}] is not an object.`);
  }

  const node = raw as Record<string, unknown>;

  const action = node.action;
  if (action !== 'keep' && action !== 'modify' && action !== 'cancel' && action !== 'insert') {
    throw new ReplanValidationError(`updated_nodes[${index}] has an invalid action.`);
  }

  const nodeId = node.node_id;
  if (!isNullableString(nodeId)) {
    throw new ReplanValidationError(`updated_nodes[${index}] has a malformed node_id.`);
  }
  if ((action === 'modify' || action === 'cancel' || action === 'keep') && !nodeId) {
    throw new ReplanValidationError(`updated_nodes[${index}] action "${action}" requires a node_id.`);
  }
  if (nodeId && !knownNodeIds.has(nodeId)) {
    throw new ReplanValidationError(`updated_nodes[${index}] references unknown node_id "${nodeId}".`);
  }

  const parentNodeId = node.parent_node_id;
  if (!isNullableString(parentNodeId)) {
    throw new ReplanValidationError(`updated_nodes[${index}] has a malformed parent_node_id.`);
  }
  if (parentNodeId && !knownNodeIds.has(parentNodeId)) {
    throw new ReplanValidationError(`updated_nodes[${index}] references unknown parent_node_id "${parentNodeId}".`);
  }

  if (typeof node.title !== 'string' || !node.title.trim()) {
    throw new ReplanValidationError(`updated_nodes[${index}] is missing a title.`);
  }

  if (!Number.isInteger(node.day_number) || (node.day_number as number) < 1) {
    throw new ReplanValidationError(`updated_nodes[${index}] has an invalid day_number.`);
  }

  if (!Number.isInteger(node.sequence_index)) {
    throw new ReplanValidationError(`updated_nodes[${index}] has an invalid sequence_index.`);
  }

  if (typeof node.estimated_cost !== 'number' || !Number.isFinite(node.estimated_cost) || node.estimated_cost < 0) {
    throw new ReplanValidationError(`updated_nodes[${index}] has an invalid estimated_cost.`);
  }

  const startTime = node.start_time;
  const endTime = node.end_time;
  const notes = node.notes;
  if (!isNullableString(startTime) || !isNullableString(endTime) || !isNullableString(notes)) {
    throw new ReplanValidationError(`updated_nodes[${index}] has malformed optional fields.`);
  }

  return {
    node_id: nodeId,
    action,
    title: node.title.trim(),
    day_number: node.day_number as number,
    sequence_index: node.sequence_index as number,
    start_time: startTime,
    end_time: endTime,
    estimated_cost: node.estimated_cost,
    notes,
    parent_node_id: parentNodeId,
  };
};

export const validateReplanProposal = (raw: unknown, opts: { knownNodeIds: Set<string> }): ReplanProposal => {
  if (typeof raw !== 'object' || raw === null) {
    throw new ReplanValidationError('Response is not a valid proposal object.');
  }

  const proposal = raw as Record<string, unknown>;

  if (typeof proposal.summary !== 'string' || !proposal.summary.trim()) {
    throw new ReplanValidationError('Response is missing a summary.');
  }

  if (!Array.isArray(proposal.updated_nodes)) {
    throw new ReplanValidationError('Response is missing updated_nodes.');
  }

  if (typeof proposal.total_estimated_cost !== 'number' || !Number.isFinite(proposal.total_estimated_cost)) {
    throw new ReplanValidationError('Response is missing total_estimated_cost.');
  }

  if (typeof proposal.within_budget !== 'boolean') {
    throw new ReplanValidationError('Response is missing within_budget.');
  }

  const updatedNodes = proposal.updated_nodes.map((node, index) => validateUpdatedNode(node, opts.knownNodeIds, index));

  // Distrust the model's own arithmetic: the stated total should roughly match
  // the sum of what it's actually proposing to keep/modify/insert.
  const sumOfCosts = updatedNodes
    .filter((node) => node.action !== 'cancel')
    .reduce((total, node) => total + node.estimated_cost, 0);

  if (Math.abs(sumOfCosts - proposal.total_estimated_cost) > sumOfCosts * 0.2 + 1) {
    throw new ReplanValidationError('total_estimated_cost does not match the sum of the proposed nodes.');
  }

  return {
    summary: proposal.summary.trim(),
    updated_nodes: updatedNodes,
    total_estimated_cost: proposal.total_estimated_cost,
    within_budget: proposal.within_budget,
  };
};

export const requestReplan = async (
  tripId: string,
  brokenNodeId: string,
  reason: string,
  knownNodeIds: Set<string>,
): Promise<ReplanProposal> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('replan-node', {
    body: { tripId, brokenNodeId, reason },
  });

  if (error) {
    throw new ReplanValidationError(error.message || 'The re-plan request failed.');
  }

  return validateReplanProposal(data, { knownNodeIds });
};

export const applyReplanProposal = async (
  client: TravelDataClient,
  tripId: string,
  brokenNodeId: string,
  reason: string,
  proposal: ReplanProposal,
): Promise<void> => {
  for (const node of proposal.updated_nodes) {
    if (node.action === 'keep') continue;

    if (node.action === 'cancel') {
      await client.updateItineraryNode(node.node_id as string, { status: 'cancelled' });
      continue;
    }

    if (node.action === 'modify') {
      await client.updateItineraryNode(node.node_id as string, {
        title: node.title,
        day_number: node.day_number,
        sequence_index: node.sequence_index,
        parent_node_id: node.parent_node_id,
        start_time: node.start_time,
        end_time: node.end_time,
        estimated_cost: node.estimated_cost,
        notes: node.notes,
        status: 'replanned',
      });
      continue;
    }

    // action === 'insert'
    await client.createItineraryNode(tripId, {
      title: node.title,
      day_number: node.day_number,
      sequence_index: node.sequence_index,
      parent_node_id: node.parent_node_id,
      start_time: node.start_time ?? undefined,
      end_time: node.end_time ?? undefined,
      estimated_cost: node.estimated_cost,
      notes: node.notes ?? undefined,
      ai_generated: true,
    });
  }

  await client.createReplanEvent(tripId, {
    broken_node_id: brokenNodeId,
    reason,
    ai_response: proposal,
    applied: true,
  });
};
