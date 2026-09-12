import Anthropic from 'npm:@anthropic-ai/sdk@^0.32';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// SUPABASE_URL / SUPABASE_ANON_KEY are auto-injected into every Edge Function.
// ANTHROPIC_API_KEY is the one secret that must be set manually:
//   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref sevubkrirbaitcikpcjk
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

// Stand-in for step 3's not-yet-built group preference merge.
const DEMO_TRIP_PREFERENCES = 'Budget-conscious, prefers walking over taxis, vegetarian-friendly food.';

const PROPOSE_REPLAN_TOOL = {
  name: 'propose_replan',
  description:
    "Propose an updated itinerary node set that resolves the broken node and re-flows only the affected downstream nodes, respecting the trip's budget cap and preferences.",
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'One or two sentence human-readable explanation of the change.' },
      updated_nodes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            node_id: { type: ['string', 'null'] },
            action: { type: 'string', enum: ['keep', 'modify', 'cancel', 'insert'] },
            title: { type: 'string' },
            day_number: { type: 'integer' },
            sequence_index: { type: 'integer' },
            start_time: { type: ['string', 'null'] },
            end_time: { type: ['string', 'null'] },
            estimated_cost: { type: 'number' },
            notes: { type: ['string', 'null'] },
            parent_node_id: { type: ['string', 'null'] },
          },
          required: [
            'node_id',
            'action',
            'title',
            'day_number',
            'sequence_index',
            'start_time',
            'end_time',
            'estimated_cost',
            'notes',
            'parent_node_id',
          ],
          additionalProperties: false,
        },
      },
      total_estimated_cost: { type: 'number' },
      within_budget: { type: 'boolean' },
    },
    required: ['summary', 'updated_nodes', 'total_estimated_cost', 'within_budget'],
    additionalProperties: false,
  },
};

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header.' }, 401);
    }

    const { tripId, brokenNodeId, reason } = await req.json();
    if (!tripId || !brokenNodeId || !reason) {
      return jsonResponse({ error: 'tripId, brokenNodeId and reason are required.' }, 400);
    }

    // Built with the caller's own JWT (never the service-role key), so every
    // read below stays inside the same user_owns_trip() RLS as the rest of the app.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const [{ data: trip, error: tripError }, { data: nodes, error: nodesError }, { data: budgetItems, error: budgetError }] =
      await Promise.all([
        supabase.from('trips').select('*').eq('id', tripId).maybeSingle(),
        supabase.from('itinerary_nodes').select('*').eq('trip_id', tripId).order('day_number').order('sequence_index'),
        supabase.from('budget_items').select('amount').eq('trip_id', tripId),
      ]);

    if (tripError || nodesError || budgetError) {
      const message = tripError?.message ?? nodesError?.message ?? budgetError?.message ?? 'Could not load trip data.';
      return jsonResponse({ error: message }, 500);
    }

    if (!trip) {
      return jsonResponse({ error: 'Trip was not found or is not available to this account.' }, 404);
    }

    const brokenNode = (nodes ?? []).find((node) => node.id === brokenNodeId);
    if (!brokenNode) {
      return jsonResponse({ error: 'The broken node was not found on this trip.' }, 404);
    }

    const spentSoFar = (budgetItems ?? []).reduce((total, item) => total + Number(item.amount), 0);

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      tool_choice: { type: 'tool', name: 'propose_replan' },
      tools: [PROPOSE_REPLAN_TOOL],
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            instruction:
              "A node in this trip's itinerary just broke. Propose an updated set of itinerary nodes that resolves it and re-flows only the nodes affected downstream, respecting the budget cap and preferences below.",
            trip: {
              destination: trip.destination,
              start_date: trip.start_date,
              end_date: trip.end_date,
              budget_cap: trip.budget_cap,
              already_spent: spentSoFar,
            },
            preferences: DEMO_TRIP_PREFERENCES,
            broken_node: {
              id: brokenNode.id,
              title: brokenNode.title,
              reason,
            },
            nodes: (nodes ?? []).map((node) => ({
              id: node.id,
              parent_node_id: node.parent_node_id,
              day_number: node.day_number,
              sequence_index: node.sequence_index,
              title: node.title,
              node_type: node.node_type,
              status: node.status,
              start_time: node.start_time,
              end_time: node.end_time,
              estimated_cost: node.estimated_cost,
              notes: node.notes,
            })),
          }),
        },
      ],
    });

    const toolUse = message.content.find((block) => block.type === 'tool_use');
    if (!toolUse) {
      return jsonResponse({ error: 'The model did not return a proposal.' }, 502);
    }

    return jsonResponse(toolUse.input, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unexpected error.' }, 500);
  }
});
