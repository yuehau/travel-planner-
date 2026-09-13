/**
 * Supabase Edge Function — repair option generator.
 *
 * Runs server-side so the Anthropic API key never reaches the browser bundle.
 *
 * Division of labour, on purpose:
 *   - the model decides the STRATEGY (which bookings to move, which to drop,
 *     and how to explain the tradeoff to a group of friends)
 *   - the client computes the MONEY from those decisions
 *
 * The model never emits a figure. Every number on screen is arithmetic over the
 * trip's own rows, so nothing shown to a user can be hallucinated.
 *
 * Deploy:  supabase functions deploy repair
 * Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */
import Anthropic from 'npm:@anthropic-ai/sdk@^0.70.0'
import { z } from 'npm:zod@^3.23.8'
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@^0.70.0/helpers/zod'

const ActionSchema = z.object({
  itemId: z.string().describe('id of a broken item, exactly as given'),
  kind: z.enum(['move', 'drop']).describe('move = rebook it, drop = cancel it'),
})

const OptionSchema = z.object({
  id: z.enum(['preserve', 'economise', 'recover']),
  name: z.string().describe('Two or three words, e.g. "Preserve" or "Save the evening"'),
  strategy: z.string().describe('One short line naming the value this option protects'),
  actions: z.array(ActionSchema),
  rationale: z
    .string()
    .describe(
      'One or two sentences a friend would actually say to the group. Name who gains ' +
        'and who loses. Do NOT state any monetary amount — the app computes those.',
    ),
})

const ResponseSchema = z.object({
  options: z.array(OptionSchema).length(3),
})

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { trip, cascade } = await req.json()

    const broken = cascade.brokenIds
      .map((id: string) => trip.items.find((i: { id: string }) => i.id === id))
      .filter(Boolean)

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      system:
        'You repair broken travel plans for small groups of friends. You are given ' +
        'a trip, each traveller\'s stated preferences, and the bookings that a delay ' +
        'has just broken.\n\n' +
        'Produce exactly three recovery options that embody three DIFFERENT VALUES — ' +
        'not three points on one axis. Typically: protect what people flagged as ' +
        'must-dos; spend as little as possible; or keep the group together and shed ' +
        'the costly booking.\n\n' +
        'Rules:\n' +
        '- Never drop a booking that a surviving booking depends on.\n' +
        '- Name explicitly whose must-do is sacrificed, by their name.\n' +
        '- Never state a price, total or delta. The application computes all money.\n' +
        '- Write like a friend in the group chat, not a travel agent.',
      messages: [
        {
          role: 'user',
          content: JSON.stringify(
            {
              destination: trip.destination,
              travellers: trip.members.map((m: Record<string, unknown>) => ({
                name: m.name,
                preferences: m.preferences,
              })),
              brokenBookings: broken,
              stillStanding: cascade.safeIds.concat(cascade.shiftedIds),
              whatHappened: cascade.outcomes.filter(
                (o: { status: string }) => o.status !== 'safe',
              ),
            },
            null,
            2,
          ),
        },
      ],
      output_config: { format: zodOutputFormat(ResponseSchema) },
    })

    if (!response.parsed_output) {
      return new Response(JSON.stringify({ error: 'Model returned unparseable output' }), {
        status: 502,
        headers: { ...CORS, 'content-type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(response.parsed_output), {
      headers: { ...CORS, 'content-type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'content-type': 'application/json' },
    })
  }
})
