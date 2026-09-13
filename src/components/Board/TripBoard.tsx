import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type IsValidConnection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ListOrdered from 'lucide-react/dist/esm/icons/list-ordered.mjs';
import PanelLeft from 'lucide-react/dist/esm/icons/panel-left.mjs';
import PanelLeftClose from 'lucide-react/dist/esm/icons/panel-left-close.mjs';
import X from 'lucide-react/dist/esm/icons/x.mjs';
import { getCatalogPlace, type CatalogPlace } from '../../data/catalog';
import { useTripBoard } from '../../hooks/useTripBoard';
import type { PlaceCreateInput, TravelDataClient } from '../../services/travelData';
import type { Place, PlaceLink, Trip } from '../../types/database';
import type { PlaceNode as PlaceNodeType, RouteEdge as RouteEdgeType } from '../../utils/boardGraph';
import { linksToEdges, placesToNodes, tripDayCount } from '../../utils/boardGraph';
import BoardDayBar from './BoardDayBar';
import BoardSidebar, { placeDragType } from './BoardSidebar';
import { BoardActionsContext, type BoardActions } from './boardContext';
import PlaceEditDialog from './PlaceEditDialog';
import PlaceFocusModal from './PlaceFocusModal';
import PlaceNode from './PlaceNode';
import RouteEdge from './RouteEdge';
import RouteSummaryPanel from './RouteSummaryPanel';

const nodeTypes = { place: PlaceNode };
const edgeTypes = { route: RouteEdge };

type Board = ReturnType<typeof useTripBoard>;

type TripBoardCanvasProps = {
  trip: Trip;
  board: Board;
  readOnly: boolean;
  showSummary: boolean;
};

const isWide = () => typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches;

const TripBoardCanvas = ({ trip, board, readOnly, showSummary }: TripBoardCanvasProps) => {
  const { screenToFlowPosition, getViewport } = useReactFlow();
  // Open by default on wide screens; on phones the panels overlay the canvas, so they start closed.
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !readOnly && isWide());
  const [isSummaryOpen, setIsSummaryOpen] = useState(() => showSummary && isWide());
  const [focusedPlace, setFocusedPlace] = useState<Place | null>(null);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [isSavingPlace, setIsSavingPlace] = useState(false);
  // Decided once at mount: React Flow would otherwise fit (and jump) on the first drop onto an empty board.
  const [fitViewOnLoad] = useState(() => board.nodes.length > 0);
  const dayCount = tripDayCount(trip.start_date, trip.end_date);

  const places = useMemo(() => board.nodes.map((node) => node.data.place), [board.nodes]);
  const links = useMemo(() => board.edges.map((edge) => edge.data?.link).filter((link): link is PlaceLink => Boolean(link)), [board.edges]);
  const placedCatalogIds = useMemo(() => new Set(
    places.map((place) => place.catalog_id).filter((id): id is string => Boolean(id)),
  ), [places]);

  const viewportCenter = useCallback(() => {
    const canvas = document.querySelector<HTMLElement>('.react-flow');
    const rect = canvas?.getBoundingClientRect();
    const center = rect
      ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      : { x: -getViewport().x + 200, y: -getViewport().y + 200 };
    // Nudge repeat adds so cards do not stack exactly on top of each other.
    const offset = (board.nodes.length % 5) * 24;
    return { x: center.x - 120 + offset, y: center.y - 80 + offset };
  }, [board.nodes.length, getViewport, screenToFlowPosition]);

  const addAtViewportCenter = useCallback((catalogPlace: CatalogPlace) => {
    board.addPlaceFromCatalog(catalogPlace, viewportCenter());
  }, [board, viewportCenter]);

  const addCustomAtCenter = useCallback((input: PlaceCreateInput) => board.addCustomPlace(input, viewportCenter()), [board, viewportCenter]);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (readOnly) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, [readOnly]);

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (readOnly) return;
    event.preventDefault();
    const catalogPlace = getCatalogPlace(event.dataTransfer.getData(placeDragType));
    if (!catalogPlace) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    board.addPlaceFromCatalog(catalogPlace, { x: position.x - 120, y: position.y - 40 });
  }, [board, readOnly, screenToFlowPosition]);

  const isValidConnection = useCallback<IsValidConnection<RouteEdgeType>>((connection) => {
    if (connection.source === connection.target) return false;
    return !board.edges.some((edge) => edge.source === connection.source && edge.target === connection.target);
  }, [board.edges]);

  const savePlace = useCallback(async (placeId: string, input: Parameters<Board['updatePlace']>[1]) => {
    setIsSavingPlace(true);
    try {
      const updated = await board.updatePlace(placeId, input);
      if (updated) {
        setEditingPlace(null);
        setFocusedPlace((current) => (current?.id === updated.id ? updated : current));
      }
      return updated;
    } finally {
      setIsSavingPlace(false);
    }
  }, [board]);

  const actions = useMemo<BoardActions>(() => ({
    readOnly,
    dayFilter: board.dayFilter,
    openPlace: setFocusedPlace,
    editPlace: (place) => {
      setFocusedPlace(null);
      setEditingPlace(place);
    },
    duplicatePlace: board.duplicatePlace,
    removePlace: (place) => {
      setFocusedPlace(null);
      board.removePlace(place);
    },
    changeTransport: board.changeTransport,
    removeLink: board.removeLink,
  }), [board, readOnly]);

  return (
    <BoardActionsContext.Provider value={actions}>
      <div className="relative flex h-full min-h-0">
        {!readOnly && (
          <div
            className={`absolute inset-y-0 left-0 z-20 w-[300px] transition-transform duration-300 md:static md:z-auto md:shrink-0 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
            }`}
          >
            <BoardSidebar
              defaultRegion={trip.region}
              placedCatalogIds={placedCatalogIds}
              placedCount={board.nodes.length}
              onAddPlace={addAtViewportCenter}
              onAddCustomPlace={addCustomAtCenter}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        )}

        <div className="relative min-w-0 flex-1 bg-surface" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow<PlaceNodeType, RouteEdgeType>
            nodes={board.nodes}
            edges={board.edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={board.onNodesChange}
            onEdgesChange={board.onEdgesChange}
            onConnect={(connection: Connection) => board.connectPlaces(connection)}
            onNodeDragStop={(_event, _node, draggedNodes) => board.savePositions(draggedNodes)}
            onDelete={readOnly ? undefined : board.removeItems}
            isValidConnection={isValidConnection}
            deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            edgesFocusable={!readOnly}
            elementsSelectable
            defaultEdgeOptions={{ type: 'route' }}
            connectionLineStyle={{ strokeWidth: 2.25 }}
            fitView={fitViewOnLoad}
            fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
            defaultViewport={{ x: 80, y: 80, zoom: 1 }}
            minZoom={0.2}
            maxZoom={1.6}
            proOptions={{ hideAttribution: false }}
            className="!bg-surface"
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.6} color="var(--board-dot)" />
            <Controls showInteractive={false} position="bottom-right" />
            <MiniMap
              pannable
              zoomable
              position="bottom-left"
              nodeColor="var(--primary)"
              maskColor="color-mix(in srgb, var(--surface) 70%, transparent)"
              className="!hidden md:!block"
              style={{ width: 150, height: 96 }}
            />
          </ReactFlow>

          <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap items-start gap-2">
            {!readOnly && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen((current) => !current)}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised px-3 py-2 text-xs font-semibold text-ink shadow-md shadow-mist-950/10 transition hover:border-mist-700"
                aria-label={isSidebarOpen ? 'Hide places panel' : 'Show places panel'}
              >
                {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
                <span>{isSidebarOpen ? 'Hide places' : 'Places'}</span>
              </button>
            )}
            <div className="pointer-events-auto min-w-0">
              <BoardDayBar dayCount={dayCount} places={places} dayFilter={board.dayFilter} onChange={board.setDayFilter} />
            </div>
            {showSummary && (
              <button
                type="button"
                onClick={() => setIsSummaryOpen((current) => !current)}
                className="pointer-events-auto ml-auto inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised px-3 py-2 text-xs font-semibold text-ink shadow-md shadow-mist-950/10 transition hover:border-mist-700"
                aria-label={isSummaryOpen ? 'Hide route summary' : 'Show route summary'}
              >
                <ListOrdered size={16} />
                <span>{isSummaryOpen ? 'Hide summary' : 'Summary'}</span>
              </button>
            )}
          </div>

          {board.nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="max-w-sm rounded-3xl border border-dashed border-line-strong bg-surface-raised/80 p-8 text-center shadow-lg shadow-mist-950/10 backdrop-blur">
                <p className="mb-2 text-lg font-semibold">{readOnly ? 'Nothing on this board yet' : 'Your board is empty'}</p>
                {!readOnly && (
                  <p className="text-sm text-ink-muted">
                    Drag a place from the left panel onto the canvas. Drag from the right handle of one card to the left handle of another to plan the route between them.
                  </p>
                )}
              </div>
            </div>
          )}

          {board.error && (
            <div className="absolute inset-x-3 top-16 z-20 flex items-start justify-between gap-3 rounded-2xl border border-mist-500 bg-mist-100 px-4 py-3 text-sm text-ink shadow-lg md:left-auto md:right-3 md:w-96 dark:bg-mist-950/80 dark:text-mist-100">
              <span>{board.error}</span>
              <button type="button" onClick={board.clearError} className="shrink-0 rounded-full p-1 hover:bg-mist-300/60" aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {showSummary && (
          <div
            className={`absolute inset-y-0 right-0 z-20 w-[320px] transition-transform duration-300 md:static md:z-auto md:shrink-0 ${
              isSummaryOpen ? 'translate-x-0' : 'translate-x-full md:hidden'
            }`}
          >
            <RouteSummaryPanel places={places} links={links} onOpenPlace={setFocusedPlace} onClose={() => setIsSummaryOpen(false)} />
          </div>
        )}
      </div>

      <PlaceFocusModal
        catalogPlace={focusedPlace ? getCatalogPlace(focusedPlace.catalog_id) : null}
        place={focusedPlace}
        onClose={() => setFocusedPlace(null)}
        action={!readOnly && focusedPlace ? { label: 'Edit card', onClick: () => actions.editPlace(focusedPlace) } : undefined}
      />

      {editingPlace && (
        <PlaceEditDialog
          key={editingPlace.id}
          place={editingPlace}
          dayCount={dayCount}
          isSaving={isSavingPlace}
          onClose={() => setEditingPlace(null)}
          onSave={savePlace}
        />
      )}
    </BoardActionsContext.Provider>
  );
};

type TripBoardProps = {
  trip: Trip;
  travelData: TravelDataClient;
  readOnly?: boolean;
  showSummary?: boolean;
  onBoardChange?: (state: { places: Place[]; links: PlaceLink[] }) => void;
};

/** Loads the board, then mounts the canvas so React Flow sees the real node count on its first render. */
const TripBoardLoader = ({ trip, travelData, readOnly = false, showSummary = false, onBoardChange }: TripBoardProps) => {
  const board = useTripBoard(trip.id, travelData);
  const places = useMemo(() => board.nodes.map((node) => node.data.place), [board.nodes]);
  const links = useMemo(() => board.edges.map((edge) => edge.data?.link).filter((link): link is PlaceLink => Boolean(link)), [board.edges]);

  useEffect(() => {
    onBoardChange?.({ places, links });
  }, [links, onBoardChange, places]);

  if (board.isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-surface text-sm font-semibold uppercase tracking-widest text-ink-muted">
        Loading board…
      </div>
    );
  }

  return <TripBoardCanvas trip={trip} board={board} readOnly={readOnly} showSummary={showSummary} />;
};

const TripBoard = (props: TripBoardProps) => (
  <ReactFlowProvider>
    <TripBoardLoader {...props} />
  </ReactFlowProvider>
);

export default TripBoard;

/** Static (already loaded) board for shared pages: no data client needed. */
type StaticBoardProps = {
  trip: Trip;
  places: Place[];
  links: PlaceLink[];
};

const noop = () => undefined;
const asyncNull = async () => null;

export const StaticTripBoard = ({ trip, places, links }: StaticBoardProps) => {
  const board = useMemo<Board>(() => ({
    nodes: placesToNodes(places),
    edges: linksToEdges(links),
    isLoading: false,
    error: null,
    clearError: noop,
    dayFilter: null,
    setDayFilter: noop,
    onNodesChange: noop,
    onEdgesChange: noop,
    addPlaceFromCatalog: asyncNull,
    addCustomPlace: asyncNull,
    updatePlace: asyncNull,
    duplicatePlace: asyncNull,
    removePlace: async () => undefined,
    savePositions: async () => undefined,
    connectPlaces: async () => undefined,
    changeTransport: async () => undefined,
    removeLink: async () => undefined,
    removeItems: async () => undefined,
  }), [links, places]);

  return (
    <ReactFlowProvider>
      <StaticCanvas trip={trip} board={board} />
    </ReactFlowProvider>
  );
};

/** Wraps the canvas with local day-filter state, since the static board object is memoised. */
const StaticCanvas = ({ trip, board }: { trip: Trip; board: Board }) => {
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const filteredBoard = useMemo(() => ({ ...board, dayFilter, setDayFilter }), [board, dayFilter]);
  return <TripBoardCanvas trip={trip} board={filteredBoard} readOnly showSummary />;
};
