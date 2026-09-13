import { describe, expect, it } from 'vitest';
import type { Place, PlaceLink } from '../types/database';
import { groupPlacesByDay, linksToEdges, orderPlacesByLinks, placeDisplayName, placesToNodes, tripDayCount } from './boardGraph';

const place = (id: string, createdMinute: number, schedule: { day?: number; time?: string } = {}): Place => ({
  id,
  trip_id: 'trip',
  catalog_id: null,
  name: id,
  address: null,
  latitude: null,
  longitude: null,
  source: 'manual',
  notes: null,
  photo_url: null,
  rating: null,
  label: null,
  day_number: schedule.day ?? null,
  start_time: schedule.time ?? null,
  position_x: 10,
  position_y: 20,
  created_at: `2026-01-01T00:${String(createdMinute).padStart(2, '0')}:00.000Z`,
});

const link = (source: string, target: string): PlaceLink => ({
  id: `${source}->${target}`,
  trip_id: 'trip',
  source_place_id: source,
  target_place_id: target,
  transport_mode: 'walk',
  created_at: '2026-01-01T00:00:00.000Z',
});

describe('boardGraph', () => {
  it('maps places and links to React Flow nodes and edges', () => {
    const [node] = placesToNodes([place('a', 0)]);
    expect(node).toMatchObject({ id: 'a', type: 'place', position: { x: 10, y: 20 } });
    expect(node.data.place.name).toBe('a');

    const [edge] = linksToEdges([link('a', 'b')]);
    expect(edge).toMatchObject({ id: 'a->b', type: 'route', source: 'a', target: 'b' });
    expect(edge.data?.link.transport_mode).toBe('walk');
  });

  it('orders places by following routes from the starting points', () => {
    const places = [place('c', 2), place('a', 0), place('b', 1), place('lonely', 3)];
    const links = [link('a', 'b'), link('b', 'c')];

    expect(orderPlacesByLinks(places, links).map((item) => item.id)).toEqual(['a', 'b', 'c', 'lonely']);
  });

  it('counts trip days and groups places by day and time', () => {
    expect(tripDayCount('2026-11-06', '2026-11-09')).toBe(4);
    expect(tripDayCount('2026-11-06', '2026-11-06')).toBe(1);
    expect(tripDayCount('2026-11-09', '2026-11-06')).toBe(1);

    const groups = groupPlacesByDay([
      place('late', 0, { day: 2, time: '18:00' }),
      place('early', 1, { day: 2, time: '09:00' }),
      place('first', 2, { day: 1 }),
      place('loose', 3),
    ]);
    expect(groups.map((group) => group.day)).toEqual([1, 2, null]);
    expect(groups[1].places.map((item) => item.id)).toEqual(['early', 'late']);
  });

  it('prefers the custom label for display', () => {
    expect(placeDisplayName({ name: 'Batu Caves', label: null })).toBe('Batu Caves');
    expect(placeDisplayName({ name: 'Batu Caves', label: '  Morning caves ' })).toBe('Morning caves');
    expect(placeDisplayName({ name: 'Batu Caves', label: '   ' })).toBe('Batu Caves');
  });

  it('handles branches and cycles without repeating places', () => {
    const places = [place('a', 0), place('b', 1), place('c', 2), place('d', 3)];
    const links = [link('a', 'b'), link('a', 'c'), link('c', 'd'), link('d', 'a')];

    const ordered = orderPlacesByLinks(places, links).map((item) => item.id);
    expect(ordered).toHaveLength(4);
    expect(new Set(ordered).size).toBe(4);
    expect(ordered[0]).toBe('a');
  });
});
