import { describe, expect, it } from 'vitest';
import { computeDescendants, ReplanValidationError, validateReplanProposal } from './replan';

const baseNodes = [
  { id: 'n1', parent_node_id: null },
  { id: 'n2', parent_node_id: 'n1' },
  { id: 'n3', parent_node_id: 'n2' },
  { id: 'n4', parent_node_id: 'n2' },
  { id: 'n5', parent_node_id: null },
];

describe('computeDescendants', () => {
  it('finds every node transitively below the root, across branches', () => {
    expect(new Set(computeDescendants(baseNodes, 'n1'))).toEqual(new Set(['n2', 'n3', 'n4']));
  });

  it('returns an empty list for a leaf node', () => {
    expect(computeDescendants(baseNodes, 'n3')).toEqual([]);
  });

  it('does not include unrelated siblings or roots', () => {
    expect(computeDescendants(baseNodes, 'n1')).not.toContain('n5');
  });

  it('is safe against a cyclic parent chain', () => {
    const cyclic = [
      { id: 'a', parent_node_id: 'b' },
      { id: 'b', parent_node_id: 'a' },
    ];

    expect(() => computeDescendants(cyclic, 'a')).not.toThrow();
  });
});

const validUpdatedNode = {
  node_id: 'n2',
  action: 'modify',
  title: 'Rescheduled museum visit',
  day_number: 1,
  sequence_index: 2,
  start_time: '14:00',
  end_time: '16:00',
  estimated_cost: 30,
  notes: null,
  parent_node_id: 'n1',
};

const knownNodeIds = new Set(['n1', 'n2', 'n3']);

describe('validateReplanProposal', () => {
  it('accepts a well-formed proposal', () => {
    const raw = {
      summary: 'Moved the museum visit later and dropped the walking tour.',
      updated_nodes: [validUpdatedNode, { ...validUpdatedNode, node_id: 'n3', action: 'cancel' }],
      total_estimated_cost: 30,
      within_budget: true,
    };

    const result = validateReplanProposal(raw, { knownNodeIds });
    expect(result.updated_nodes).toHaveLength(2);
    expect(result.summary).toBe(raw.summary);
  });

  it('rejects a node_id that is not part of the trip', () => {
    const raw = {
      summary: 'x',
      updated_nodes: [{ ...validUpdatedNode, node_id: 'unknown-node' }],
      total_estimated_cost: 30,
      within_budget: true,
    };

    expect(() => validateReplanProposal(raw, { knownNodeIds })).toThrow(ReplanValidationError);
  });

  it('rejects a parent_node_id that is not part of the trip', () => {
    const raw = {
      summary: 'x',
      updated_nodes: [{ ...validUpdatedNode, parent_node_id: 'unknown-parent' }],
      total_estimated_cost: 30,
      within_budget: true,
    };

    expect(() => validateReplanProposal(raw, { knownNodeIds })).toThrow(ReplanValidationError);
  });

  it('rejects an action that requires a node_id but omits one', () => {
    const raw = {
      summary: 'x',
      updated_nodes: [{ ...validUpdatedNode, action: 'cancel', node_id: null }],
      total_estimated_cost: 30,
      within_budget: true,
    };

    expect(() => validateReplanProposal(raw, { knownNodeIds })).toThrow(ReplanValidationError);
  });

  it('rejects a proposal missing required top-level fields', () => {
    expect(() => validateReplanProposal({ updated_nodes: [] }, { knownNodeIds })).toThrow(ReplanValidationError);
  });

  it('rejects a total_estimated_cost that does not match the proposed nodes', () => {
    const raw = {
      summary: 'x',
      updated_nodes: [validUpdatedNode],
      total_estimated_cost: 9999,
      within_budget: true,
    };

    expect(() => validateReplanProposal(raw, { knownNodeIds })).toThrow(ReplanValidationError);
  });
});
