import { useCallback, useEffect, useState } from 'react';
import { applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from '@xyflow/react';
import type { CatalogPlace } from '../data/catalog';
import { placeInputFromCatalog } from '../data/catalog';
import type { PlaceCreateInput, PlaceUpdateInput, TravelDataClient } from '../services/travelData';
import type { Place, PlaceLink, TransportMode } from '../types/database';
import { linkToEdge, linksToEdges, placeToNode, placesToNodes, type PlaceNode, type RouteEdge } from '../utils/boardGraph';

const messageFrom = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

/** Board state for one trip: React Flow nodes/edges backed by the travel data client. */
export const useTripBoard = (tripId: string, travelData: TravelDataClient) => {
  const [nodes, setNodes] = useState<PlaceNode[]>([]);
  const [edges, setEdges] = useState<RouteEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [places, links] = await Promise.all([travelData.listPlaces(tripId), travelData.listPlaceLinks(tripId)]);
        if (!isMounted) return;
        setNodes(placesToNodes(places));
        setEdges(linksToEdges(links));
      } catch (loadError) {
        if (isMounted) setError(messageFrom(loadError, 'Could not load this board.'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [travelData, tripId]);

  const onNodesChange = useCallback((changes: NodeChange<PlaceNode>[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange<RouteEdge>[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  }, []);

  const addPlaceFromCatalog = useCallback(async (catalogPlace: CatalogPlace, position: { x: number; y: number }) => {
    setError(null);
    try {
      const place = await travelData.createPlace(tripId, placeInputFromCatalog(catalogPlace, position));
      setNodes((current) => [...current, placeToNode(place)]);
      return place;
    } catch (createError) {
      setError(messageFrom(createError, 'Could not add this place to the board.'));
      return null;
    }
  }, [travelData, tripId]);

  /** Adds a place that is not in the catalog (or any prepared input) at the given position. */
  const addCustomPlace = useCallback(async (input: PlaceCreateInput, position: { x: number; y: number }) => {
    setError(null);
    try {
      const place = await travelData.createPlace(tripId, {
        ...input,
        source: input.source ?? 'custom',
        position_x: Math.round(position.x),
        position_y: Math.round(position.y),
      });
      setNodes((current) => [...current, placeToNode(place)]);
      return place;
    } catch (createError) {
      setError(messageFrom(createError, 'Could not add this place to the board.'));
      return null;
    }
  }, [travelData, tripId]);

  const updatePlace = useCallback(async (placeId: string, input: PlaceUpdateInput) => {
    setError(null);
    try {
      const place = await travelData.updatePlace(placeId, input);
      setNodes((current) => current.map((node) => (node.id === place.id ? { ...node, data: { place } } : node)));
      return place;
    } catch (updateError) {
      setError(messageFrom(updateError, 'Could not save this place.'));
      return null;
    }
  }, [travelData]);

  const duplicatePlace = useCallback(async (place: Place) => {
    setError(null);
    try {
      const copy = await travelData.createPlace(tripId, {
        name: place.name,
        catalog_id: place.catalog_id,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        source: place.source,
        notes: place.notes,
        photo_url: place.photo_url,
        rating: place.rating,
        label: place.label,
        day_number: place.day_number,
        start_time: place.start_time,
        position_x: Math.round(place.position_x + 40),
        position_y: Math.round(place.position_y + 40),
      });
      setNodes((current) => [...current, placeToNode(copy)]);
      return copy;
    } catch (duplicateError) {
      setError(messageFrom(duplicateError, 'Could not duplicate this place.'));
      return null;
    }
  }, [travelData, tripId]);

  /** Toolbar delete: removes the card and its routes locally, then on the server (which cascades links). */
  const removePlace = useCallback(async (place: Place) => {
    setError(null);
    setNodes((current) => current.filter((node) => node.id !== place.id));
    setEdges((current) => current.filter((edge) => edge.source !== place.id && edge.target !== place.id));
    try {
      await travelData.deletePlace(place.id);
    } catch (deleteError) {
      setError(messageFrom(deleteError, 'Could not delete this place. Reload to see the saved state.'));
    }
  }, [travelData]);

  const savePositions = useCallback(async (movedNodes: PlaceNode[]) => {
    try {
      await Promise.all(movedNodes.map((node) => travelData.updatePlace(node.id, {
        position_x: Math.round(node.position.x),
        position_y: Math.round(node.position.y),
      })));
    } catch (moveError) {
      setError(messageFrom(moveError, 'Could not save the new position.'));
    }
  }, [travelData]);

  const connectPlaces = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    setError(null);
    try {
      const link = await travelData.createPlaceLink(tripId, {
        source_place_id: connection.source,
        target_place_id: connection.target,
        transport_mode: 'walk',
      });
      setEdges((current) => [...current, linkToEdge(link)]);
    } catch (connectError) {
      setError(messageFrom(connectError, 'Could not connect these places.'));
    }
  }, [travelData, tripId]);

  const changeTransport = useCallback(async (link: PlaceLink, mode: TransportMode) => {
    setError(null);
    const optimistic = { ...link, transport_mode: mode };
    setEdges((current) => current.map((edge) => (edge.id === link.id ? linkToEdge(optimistic) : edge)));
    try {
      const updated = await travelData.updatePlaceLink(link.id, { transport_mode: mode });
      setEdges((current) => current.map((edge) => (edge.id === link.id ? linkToEdge(updated) : edge)));
    } catch (updateError) {
      setEdges((current) => current.map((edge) => (edge.id === link.id ? linkToEdge(link) : edge)));
      setError(messageFrom(updateError, 'Could not update the route.'));
    }
  }, [travelData]);

  const removeLink = useCallback(async (link: PlaceLink) => {
    setError(null);
    setEdges((current) => current.filter((edge) => edge.id !== link.id));
    try {
      await travelData.deletePlaceLink(link.id);
    } catch (deleteError) {
      setEdges((current) => [...current, linkToEdge(link)]);
      setError(messageFrom(deleteError, 'Could not remove the route.'));
    }
  }, [travelData]);

  /** Persists deletions React Flow already applied locally (Delete key, etc.). */
  const removeItems = useCallback(async ({ nodes: removedNodes, edges: removedEdges }: { nodes: PlaceNode[]; edges: RouteEdge[] }) => {
    setError(null);
    const removedNodeIds = new Set(removedNodes.map((node) => node.id));
    // Links attached to a deleted place are removed by the server cascade.
    const standaloneEdges = removedEdges.filter((edge) => !removedNodeIds.has(edge.source) && !removedNodeIds.has(edge.target));

    try {
      await Promise.all([
        ...removedNodes.map((node) => travelData.deletePlace(node.id)),
        ...standaloneEdges.map((edge) => travelData.deletePlaceLink(edge.id)),
      ]);
    } catch (deleteError) {
      setError(messageFrom(deleteError, 'Could not delete from the board. Reload to see the saved state.'));
    }
  }, [travelData]);

  return {
    nodes,
    edges,
    isLoading,
    error,
    clearError: () => setError(null),
    dayFilter,
    setDayFilter,
    onNodesChange,
    onEdgesChange,
    addPlaceFromCatalog,
    addCustomPlace,
    updatePlace,
    duplicatePlace,
    removePlace,
    savePositions,
    connectPlaces,
    changeTransport,
    removeLink,
    removeItems,
  };
};
