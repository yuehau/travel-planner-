import type { Edge, Node } from '@xyflow/react';
import type { Place, PlaceLink } from '../types/database';

export type PlaceNodeData = { place: Place } & Record<string, unknown>;
export type RouteEdgeData = { link: PlaceLink } & Record<string, unknown>;

export type PlaceNode = Node<PlaceNodeData, 'place'>;
export type RouteEdge = Edge<RouteEdgeData, 'route'>;

export const placeToNode = (place: Place): PlaceNode => ({
  id: place.id,
  type: 'place',
  position: { x: place.position_x, y: place.position_y },
  data: { place },
});

export const placesToNodes = (places: Place[]) => places.map(placeToNode);

export const linkToEdge = (link: PlaceLink): RouteEdge => ({
  id: link.id,
  type: 'route',
  source: link.source_place_id,
  target: link.target_place_id,
  data: { link },
});

export const linksToEdges = (links: PlaceLink[]) => links.map(linkToEdge);

/**
 * Orders places the way a traveller would read the board: start from places nothing points to,
 * follow outgoing links depth-first, then append anything unreachable. Used for exports.
 */
export const orderPlacesByLinks = (places: Place[], links: PlaceLink[]) => {
  const placeById = new Map(places.map((place) => [place.id, place]));
  const outgoing = new Map<string, PlaceLink[]>();
  const incomingCount = new Map<string, number>();

  for (const link of links) {
    if (!placeById.has(link.source_place_id) || !placeById.has(link.target_place_id)) continue;
    outgoing.set(link.source_place_id, [...(outgoing.get(link.source_place_id) ?? []), link]);
    incomingCount.set(link.target_place_id, (incomingCount.get(link.target_place_id) ?? 0) + 1);
  }

  const ordered: Place[] = [];
  const visited = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const place = placeById.get(id);
    if (!place) return;
    ordered.push(place);
    for (const link of outgoing.get(id) ?? []) visit(link.target_place_id);
  };

  const byCreated = [...places].sort((first, second) => first.created_at.localeCompare(second.created_at));
  for (const place of byCreated) {
    if ((incomingCount.get(place.id) ?? 0) === 0) visit(place.id);
  }
  for (const place of byCreated) visit(place.id);

  return ordered;
};

/** Number of calendar days a trip spans (inclusive), floored at 1. */
export const tripDayCount = (startDate: string, endDate: string) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Number.isFinite(days) && days > 0 ? days : 1;
};

/** Groups places by day (sorted by start time within a day); unscheduled places land under `null`. */
export const groupPlacesByDay = (places: Place[]) => {
  const groups = new Map<number | null, Place[]>();
  for (const place of places) {
    const key = place.day_number ?? null;
    groups.set(key, [...(groups.get(key) ?? []), place]);
  }
  const ordered = [...groups.entries()].sort(([first], [second]) => {
    if (first === null) return 1;
    if (second === null) return -1;
    return first - second;
  });
  return ordered.map(([day, items]) => ({
    day,
    places: [...items].sort((first, second) => (first.start_time ?? '99:99').localeCompare(second.start_time ?? '99:99')),
  }));
};

export const formatStartTime = (value: string | null) => {
  if (!value) return null;
  const [hours = '0', minutes = '00'] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
};

export const placeDisplayName = (place: Pick<Place, 'name' | 'label'>) => place.label?.trim() || place.name;
