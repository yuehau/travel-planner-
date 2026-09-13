import { getSupabaseClient } from '../lib/supabase';
import type {
  BudgetItem,
  ItineraryItem,
  ItineraryNode,
  ItineraryNodeStatus,
  ItineraryNodeType,
  PackingItem,
  Place,
  ReplanEvent,
  Trip,
  TripCollection,
  TripCollectionStatus,
  TripInfo,
  TripMember,
  TripTodo,
  TripTodoPriority,
  UserSettings,
} from '../types/database';

export type TripCreateInput = {
  destination: string;
  start_date: string;
  end_date: string;
  description?: string;
};

export type ItineraryCreateInput = {
  day_number: number;
  activity: string;
  place_id?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
};

export type PlaceCreateInput = {
  name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  source?: string;
  notes?: string;
  photo_url?: string;
  rating?: number | null;
};

export type BudgetCreateInput = {
  category: string;
  amount: number;
  currency?: string;
  is_paid?: boolean;
};

export type PackingCreateInput = {
  category?: string;
  item: string;
  is_packed?: boolean;
};

export type TripInfoCreateInput = {
  category: string;
  label: string;
  value: string;
  url?: string;
};

export type TripTodoCreateInput = {
  title: string;
  due_date?: string;
  priority?: TripTodoPriority;
  is_completed?: boolean;
};

export type ItineraryNodeCreateInput = {
  day_number: number;
  title: string;
  parent_node_id?: string | null;
  place_id?: string | null;
  sequence_index?: number;
  node_type?: ItineraryNodeType;
  start_time?: string;
  end_time?: string;
  estimated_cost?: number;
  currency?: string;
  notes?: string;
  ai_generated?: boolean;
};

export type ItineraryNodeUpdateInput = Partial<{
  title: string;
  day_number: number;
  sequence_index: number;
  parent_node_id: string | null;
  place_id: string | null;
  node_type: ItineraryNodeType;
  status: ItineraryNodeStatus;
  start_time: string | null;
  end_time: string | null;
  estimated_cost: number;
  currency: string;
  notes: string | null;
  ai_generated: boolean;
}>;

export type ReplanEventCreateInput = {
  broken_node_id?: string | null;
  reason: string;
  ai_request?: Record<string, unknown> | null;
  ai_response?: Record<string, unknown> | null;
  applied?: boolean;
};

export type TripMemberCreateInput = {
  invited_email: string;
  role?: 'member';
};

export type TripCollectionCreateInput = {
  destination: string;
  status?: TripCollectionStatus;
  notes?: string;
  visited_at?: string;
};

export type UserSettingsUpdateInput = Partial<Pick<UserSettings, 'theme' | 'currency' | 'distance_unit' | 'time_format' | 'dashboard_widgets'>>;

export type TravelDataClient = {
  readonly isReadOnly: boolean;
  listTrips: () => Promise<Trip[]>;
  createTrip: (input: TripCreateInput) => Promise<Trip>;
  getTrip: (tripId: string) => Promise<Trip | null>;
  listItineraryItems: (tripId: string) => Promise<ItineraryItem[]>;
  createItineraryItem: (tripId: string, input: ItineraryCreateInput) => Promise<ItineraryItem>;
  listItineraryNodes: (tripId: string) => Promise<ItineraryNode[]>;
  createItineraryNode: (tripId: string, input: ItineraryNodeCreateInput) => Promise<ItineraryNode>;
  updateItineraryNode: (id: string, input: ItineraryNodeUpdateInput) => Promise<ItineraryNode>;
  markNodeBroken: (id: string, reason: string) => Promise<ItineraryNode>;
  createReplanEvent: (tripId: string, input: ReplanEventCreateInput) => Promise<ReplanEvent>;
  listPlaces: (tripId: string) => Promise<Place[]>;
  createPlace: (tripId: string, input: PlaceCreateInput) => Promise<Place>;
  listBudgetItems: (tripId: string) => Promise<BudgetItem[]>;
  createBudgetItem: (tripId: string, input: BudgetCreateInput) => Promise<BudgetItem>;
  updateBudgetItemPaid: (id: string, isPaid: boolean) => Promise<BudgetItem>;
  listPackingItems: (tripId: string) => Promise<PackingItem[]>;
  createPackingItem: (tripId: string, input: PackingCreateInput) => Promise<PackingItem>;
  updatePackingItemPacked: (id: string, isPacked: boolean) => Promise<PackingItem>;
  listTripInfos: (tripId: string) => Promise<TripInfo[]>;
  createTripInfo: (tripId: string, input: TripInfoCreateInput) => Promise<TripInfo>;
  listTodos: (tripId: string) => Promise<TripTodo[]>;
  createTodo: (tripId: string, input: TripTodoCreateInput) => Promise<TripTodo>;
  updateTodoCompleted: (id: string, isCompleted: boolean) => Promise<TripTodo>;
  listTripMembers: (tripId: string) => Promise<TripMember[]>;
  inviteTripMember: (tripId: string, input: TripMemberCreateInput) => Promise<TripMember>;
  listTripCollections: () => Promise<TripCollection[]>;
  createTripCollection: (input: TripCollectionCreateInput) => Promise<TripCollection>;
  updateTripCollectionStatus: (id: string, status: TripCollectionStatus) => Promise<TripCollection>;
  deleteTripCollection: (id: string) => Promise<void>;
  getUserSettings: () => Promise<UserSettings>;
  updateUserSettings: (input: UserSettingsUpdateInput) => Promise<UserSettings>;
};

export class TravelDataError extends Error {
  code: 'read_only' | 'not_found' | 'data_error' | 'validation_error';

  constructor(message: string, code: TravelDataError['code']) {
    super(message);
    this.code = code;
    this.name = 'TravelDataError';
  }
}

const requireWritableDemo = () => {
  throw new TravelDataError('Demo mode is read-only. Sign in to save changes.', 'read_only');
};

const normalizeOptional = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const requireText = (value: string | undefined, label: string) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new TravelDataError(`${label} is required.`, 'validation_error');
  }

  return trimmed;
};

const validateTripDates = (startDate: string, endDate: string) => {
  if (new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) {
    throw new TravelDataError('End date must be after the start date.', 'validation_error');
  }
};

const validateAmount = (amount: number) => {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new TravelDataError('Amount must be a positive number.', 'validation_error');
  }
};

const validateRating = (rating: number | null | undefined) => {
  if (rating === null || rating === undefined) return null;
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    throw new TravelDataError('Rating must be between 0 and 5.', 'validation_error');
  }

  return rating;
};

const validateEmail = (email: string | undefined) => {
  const trimmed = requireText(email, 'Email').toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new TravelDataError('Enter a valid email address.', 'validation_error');
  }

  return trimmed;
};

const getVisitedAt = (status: TripCollectionStatus, visitedAt?: string) => {
  if (status === 'want_to_go') return null;
  return normalizeOptional(visitedAt) ?? new Date().toISOString();
};

const defaultSettings = (userId: string): UserSettings => ({
  user_id: userId,
  theme: 'system',
  currency: 'MYR',
  distance_unit: 'km',
  time_format: '12h',
  dashboard_widgets: ['places', 'todos', 'budget'],
  updated_at: new Date(0).toISOString(),
});

const handleSingle = <T>(data: T | null, error: { message: string } | null, fallbackMessage: string) => {
  if (error) {
    throw new TravelDataError(error.message || fallbackMessage, 'data_error');
  }

  if (!data) {
    throw new TravelDataError(fallbackMessage, 'not_found');
  }

  return data;
};

export const createSupabaseTravelDataClient = (userId: string): TravelDataClient => {
  const supabase = getSupabaseClient();

  const requireTrip = async (tripId: string) => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new TravelDataError(error.message, 'data_error');
    if (!data) throw new TravelDataError('Trip was not found or is not available to this account.', 'not_found');

    return data;
  };

  return {
    isReadOnly: false,
    async listTrips() {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: true });

      if (error) throw new TravelDataError(error.message, 'data_error');
      return data ?? [];
    },
    async createTrip(input) {
      const destination = requireText(input.destination, 'Destination');
      validateTripDates(input.start_date, input.end_date);

      const { data, error } = await supabase
        .from('trips')
        .insert({
          user_id: userId,
          destination,
          start_date: input.start_date,
          end_date: input.end_date,
          description: normalizeOptional(input.description),
        })
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not create trip.');
    },
    async getTrip(tripId) {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw new TravelDataError(error.message, 'data_error');
      return data;
    },
    async listItineraryItems(tripId) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw new TravelDataError(error.message, 'data_error');
      return data ?? [];
    },
    async createItineraryItem(tripId, input) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('itinerary_items')
        .insert({
          trip_id: tripId,
          place_id: normalizeOptional(input.place_id),
          day_number: input.day_number,
          activity: requireText(input.activity, 'Activity'),
          location: normalizeOptional(input.location),
          start_time: normalizeOptional(input.start_time),
          end_time: normalizeOptional(input.end_time),
          notes: normalizeOptional(input.notes),
          sort_order: Date.now(),
        })
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not create itinerary item.');
    },
    async listItineraryNodes(tripId) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('itinerary_nodes')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number', { ascending: true })
        .order('sequence_index', { ascending: true });

      if (error) throw new TravelDataError(error.message, 'data_error');
      return data ?? [];
    },
    async createItineraryNode(tripId, input) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('itinerary_nodes')
        .insert({
          trip_id: tripId,
          parent_node_id: normalizeOptional(input.parent_node_id ?? undefined),
          place_id: normalizeOptional(input.place_id ?? undefined),
          day_number: input.day_number,
          sequence_index: input.sequence_index ?? 0,
          title: requireText(input.title, 'Title'),
          node_type: input.node_type ?? 'activity',
          start_time: normalizeOptional(input.start_time),
          end_time: normalizeOptional(input.end_time),
          estimated_cost: input.estimated_cost ?? 0,
          currency: input.currency ?? 'MYR',
          notes: normalizeOptional(input.notes),
          ai_generated: input.ai_generated ?? false,
        })
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not create itinerary node.');
    },
    async updateItineraryNode(id, input) {
      const { data, error } = await supabase
        .from('itinerary_nodes')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not update itinerary node.');
    },
    async markNodeBroken(id, reason) {
      const { data, error } = await supabase
        .from('itinerary_nodes')
        .update({
          status: 'broken',
          break_reason: requireText(reason, 'Break reason'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not mark node as broken.');
    },
    async createReplanEvent(tripId, input) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('replan_events')
        .insert({
          trip_id: tripId,
          broken_node_id: normalizeOptional(input.broken_node_id ?? undefined),
          reason: requireText(input.reason, 'Reason'),
          ai_request: input.ai_request ?? null,
          ai_response: input.ai_response ?? null,
          applied: input.applied ?? false,
        })
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not record replan event.');
    },
    async listPlaces(tripId) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (error) throw new TravelDataError(error.message, 'data_error');
      return data ?? [];
    },
    async createPlace(tripId, input) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('places')
        .insert({
          trip_id: tripId,
          name: requireText(input.name, 'Place name'),
          address: normalizeOptional(input.address),
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          source: input.source ?? 'manual',
          notes: normalizeOptional(input.notes),
          photo_url: normalizeOptional(input.photo_url),
          rating: validateRating(input.rating),
        })
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not save place.');
    },
    async listBudgetItems(tripId) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (error) throw new TravelDataError(error.message, 'data_error');
      return data ?? [];
    },
    async createBudgetItem(tripId, input) {
      await requireTrip(tripId);
      validateAmount(input.amount);

      const { data, error } = await supabase
        .from('budget_items')
        .insert({
          trip_id: tripId,
          category: requireText(input.category, 'Category'),
          amount: input.amount,
          currency: input.currency ?? 'MYR',
          is_paid: input.is_paid ?? false,
        })
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not create budget item.');
    },
    async updateBudgetItemPaid(id, isPaid) {
      const { data, error } = await supabase
        .from('budget_items')
        .update({ is_paid: isPaid })
        .eq('id', id)
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not update budget item.');
    },
    async listPackingItems(tripId) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('packing_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (error) throw new TravelDataError(error.message, 'data_error');
      return data ?? [];
    },
    async createPackingItem(tripId, input) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('packing_items')
        .insert({
          trip_id: tripId,
          category: requireText(input.category ?? 'General', 'Category'),
          item: requireText(input.item, 'Item'),
          is_packed: input.is_packed ?? false,
        })
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not create packing item.');
    },
    async updatePackingItemPacked(id, isPacked) {
      const { data, error } = await supabase
        .from('packing_items')
        .update({ is_packed: isPacked })
        .eq('id', id)
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not update packing item.');
    },
    async listTripInfos(tripId) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('trip_infos')
        .select('*')
        .eq('trip_id', tripId)
        .order('category', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw new TravelDataError(error.message, 'data_error');
      return data ?? [];
    },
    async createTripInfo(tripId, input) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('trip_infos')
        .insert({
          trip_id: tripId,
          category: requireText(input.category, 'Category'),
          label: requireText(input.label, 'Label'),
          value: requireText(input.value, 'Value'),
          url: normalizeOptional(input.url),
        })
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not create trip info.');
    },
    async listTodos(tripId) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('trip_todos')
        .select('*')
        .eq('trip_id', tripId)
        .order('is_completed', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (error) throw new TravelDataError(error.message, 'data_error');
      return data ?? [];
    },
    async createTodo(tripId, input) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('trip_todos')
        .insert({
          trip_id: tripId,
          title: requireText(input.title, 'Task title'),
          due_date: normalizeOptional(input.due_date),
          priority: input.priority ?? 'medium',
          is_completed: input.is_completed ?? false,
        })
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not create task.');
    },
    async updateTodoCompleted(id, isCompleted) {
      const { data, error } = await supabase
        .from('trip_todos')
        .update({ is_completed: isCompleted })
        .eq('id', id)
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not update task.');
    },
    async listTripMembers(tripId) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (error) throw new TravelDataError(error.message, 'data_error');
      return data ?? [];
    },
    async inviteTripMember(tripId, input) {
      await requireTrip(tripId);

      const { data, error } = await supabase
        .from('trip_members')
        .insert({
          trip_id: tripId,
          invited_email: validateEmail(input.invited_email),
          role: input.role ?? 'member',
          status: 'pending',
        })
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not invite member.');
    },
    async listTripCollections() {
      const { data, error } = await supabase
        .from('trip_collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new TravelDataError(error.message, 'data_error');
      return data ?? [];
    },
    async createTripCollection(input) {
      const status = input.status ?? 'want_to_go';
      const { data, error } = await supabase
        .from('trip_collections')
        .insert({
          user_id: userId,
          destination: requireText(input.destination, 'Destination'),
          status,
          notes: normalizeOptional(input.notes),
          visited_at: getVisitedAt(status, input.visited_at),
        })
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not save destination.');
    },
    async updateTripCollectionStatus(id, status) {
      const { data, error } = await supabase
        .from('trip_collections')
        .update({
          status,
          visited_at: getVisitedAt(status),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not update saved destination.');
    },
    async deleteTripCollection(id) {
      const { error } = await supabase
        .from('trip_collections')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new TravelDataError(error.message, 'data_error');
    },
    async getUserSettings() {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw new TravelDataError(error.message, 'data_error');
      return data ?? defaultSettings(userId);
    },
    async updateUserSettings(input) {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...input,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not update settings.');
    },
  };
};

const demoTrips: Trip[] = [
  {
    id: 'demo-tokyo',
    user_id: 'demo-user-id',
    destination: 'Tokyo, Japan',
    home_base: 'Shinjuku',
    start_date: '2026-10-12',
    end_date: '2026-10-20',
    description: 'A deep dive into the contrast of futuristic neon and ancient traditions.',
    budget_cap: 3000,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-paris',
    user_id: 'demo-user-id',
    destination: 'Paris, France',
    home_base: 'Le Marais',
    start_date: '2026-05-01',
    end_date: '2026-05-10',
    description: 'Museums, slow mornings, and long walks along the Seine.',
    budget_cap: null,
    created_at: '2026-01-02T00:00:00Z',
  },
];

const demoItineraryItems: ItineraryItem[] = [
  {
    id: 'demo-itinerary-1',
    trip_id: 'demo-tokyo',
    place_id: 'demo-place-1',
    day_number: 1,
    activity: 'Breakfast at Tsukiji Outer Market',
    location: 'Tsukiji',
    start_time: '09:00',
    end_time: null,
    notes: 'Try the fresh tuna sushi.',
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-itinerary-2',
    trip_id: 'demo-tokyo',
    place_id: 'demo-place-2',
    day_number: 1,
    activity: 'TeamLab Borderless',
    location: 'Azabudai Hills',
    start_time: '11:00',
    end_time: null,
    notes: 'Book tickets in advance.',
    sort_order: 2,
    created_at: '2026-01-01T00:00:00Z',
  },
];

const demoItineraryNodes: ItineraryNode[] = [
  {
    id: 'demo-node-1',
    trip_id: 'demo-tokyo',
    parent_node_id: null,
    place_id: 'demo-place-1',
    day_number: 1,
    sequence_index: 1,
    title: 'Breakfast at Tsukiji Outer Market',
    node_type: 'meal',
    status: 'planned',
    start_time: '09:00',
    end_time: '10:00',
    estimated_cost: 20,
    currency: 'USD',
    notes: 'Try the fresh tuna sushi.',
    break_reason: null,
    ai_generated: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-node-2',
    trip_id: 'demo-tokyo',
    parent_node_id: 'demo-node-1',
    place_id: 'demo-place-2',
    day_number: 1,
    sequence_index: 2,
    title: 'teamLab Borderless',
    node_type: 'activity',
    status: 'planned',
    start_time: '11:00',
    end_time: '14:00',
    estimated_cost: 35,
    currency: 'USD',
    notes: 'Book tickets in advance.',
    break_reason: null,
    ai_generated: false,
    created_at: '2026-01-01T00:01:00Z',
    updated_at: '2026-01-01T00:01:00Z',
  },
];

const demoPlaces: Place[] = [
  {
    id: 'demo-place-1',
    trip_id: 'demo-tokyo',
    name: 'Tsukiji Outer Market',
    address: '4 Chome-16-2 Tsukiji, Chuo City, Tokyo',
    latitude: 35.6655,
    longitude: 139.7707,
    source: 'openstreetmap',
    notes: 'Best in the morning.',
    photo_url: null,
    rating: 4.8,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-place-2',
    trip_id: 'demo-tokyo',
    name: 'teamLab Borderless',
    address: 'Azabudai Hills, Tokyo',
    latitude: 35.6601,
    longitude: 139.7407,
    source: 'manual',
    notes: 'Pre-book tickets.',
    photo_url: null,
    rating: 4.7,
    created_at: '2026-01-01T00:01:00Z',
  },
];

const demoBudgetItems: BudgetItem[] = [
  { id: 'demo-budget-1', trip_id: 'demo-tokyo', category: 'Flights', amount: 1200, currency: 'USD', is_paid: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'demo-budget-2', trip_id: 'demo-tokyo', category: 'Hotel', amount: 800, currency: 'USD', is_paid: true, created_at: '2026-01-01T00:01:00Z' },
  { id: 'demo-budget-3', trip_id: 'demo-tokyo', category: 'Food', amount: 500, currency: 'USD', is_paid: false, created_at: '2026-01-01T00:02:00Z' },
];

const demoPackingItems: PackingItem[] = [
  { id: 'demo-packing-1', trip_id: 'demo-tokyo', category: 'Essentials', item: 'Passport', is_packed: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'demo-packing-2', trip_id: 'demo-tokyo', category: 'Electronics', item: 'Universal adapter', is_packed: false, created_at: '2026-01-01T00:01:00Z' },
  { id: 'demo-packing-3', trip_id: 'demo-tokyo', category: 'Clothing', item: 'Walking shoes', is_packed: true, created_at: '2026-01-01T00:02:00Z' },
];

const demoTripInfos: TripInfo[] = [
  { id: 'demo-info-1', trip_id: 'demo-tokyo', category: 'Confirmation', label: 'Flight BN123', value: 'A8K2L9P', url: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'demo-info-2', trip_id: 'demo-tokyo', category: 'Emergency', label: 'Local police', value: '+81 110', url: null, created_at: '2026-01-01T00:01:00Z' },
  { id: 'demo-info-3', trip_id: 'demo-tokyo', category: 'Address', label: 'Hotel', value: 'The Ritz-Carlton, Tokyo', url: null, created_at: '2026-01-01T00:02:00Z' },
];

const demoTodos: TripTodo[] = [
  { id: 'demo-todo-1', trip_id: 'demo-tokyo', title: 'Book TeamLab tickets', due_date: '2026-09-20', priority: 'high', is_completed: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'demo-todo-2', trip_id: 'demo-tokyo', title: 'Download offline maps', due_date: '2026-10-01', priority: 'medium', is_completed: true, created_at: '2026-01-01T00:01:00Z' },
];

const demoMembers: TripMember[] = [
  { id: 'demo-member-1', trip_id: 'demo-tokyo', user_id: 'demo-user-id', invited_email: 'demo@example.com', role: 'owner', status: 'accepted', created_at: '2026-01-01T00:00:00Z' },
  { id: 'demo-member-2', trip_id: 'demo-tokyo', user_id: null, invited_email: 'friend@example.com', role: 'member', status: 'pending', created_at: '2026-01-01T00:01:00Z' },
];

const demoCollections: TripCollection[] = [
  {
    id: 'demo-collection-1',
    user_id: 'demo-user-id',
    destination: 'Kyoto, Japan',
    status: 'want_to_go',
    notes: 'Temples, coffee shops, and a slower second week after Tokyo.',
    visited_at: null,
    created_at: '2026-01-03T00:00:00Z',
  },
  {
    id: 'demo-collection-2',
    user_id: 'demo-user-id',
    destination: 'Seoul, South Korea',
    status: 'want_to_go',
    notes: 'Food markets and design stores.',
    visited_at: null,
    created_at: '2026-01-04T00:00:00Z',
  },
  {
    id: 'demo-collection-3',
    user_id: 'demo-user-id',
    destination: 'Paris, France',
    status: 'visited',
    notes: 'Good reference trip for museum-heavy days.',
    visited_at: '2026-05-10T00:00:00Z',
    created_at: '2026-01-05T00:00:00Z',
  },
];

export const createDemoTravelDataClient = (): TravelDataClient => ({
  isReadOnly: true,
  async listTrips() {
    return demoTrips;
  },
  async createTrip() {
    return requireWritableDemo();
  },
  async getTrip(tripId) {
    return demoTrips.find((trip) => trip.id === tripId) ?? null;
  },
  async listItineraryItems(tripId) {
    return demoItineraryItems.filter((item) => item.trip_id === tripId);
  },
  async createItineraryItem() {
    return requireWritableDemo();
  },
  async listItineraryNodes(tripId) {
    return demoItineraryNodes.filter((node) => node.trip_id === tripId);
  },
  async createItineraryNode() {
    return requireWritableDemo();
  },
  async updateItineraryNode() {
    return requireWritableDemo();
  },
  async markNodeBroken() {
    return requireWritableDemo();
  },
  async createReplanEvent() {
    return requireWritableDemo();
  },
  async listPlaces(tripId) {
    return demoPlaces.filter((item) => item.trip_id === tripId);
  },
  async createPlace() {
    return requireWritableDemo();
  },
  async listBudgetItems(tripId) {
    return demoBudgetItems.filter((item) => item.trip_id === tripId);
  },
  async createBudgetItem() {
    return requireWritableDemo();
  },
  async updateBudgetItemPaid() {
    return requireWritableDemo();
  },
  async listPackingItems(tripId) {
    return demoPackingItems.filter((item) => item.trip_id === tripId);
  },
  async createPackingItem() {
    return requireWritableDemo();
  },
  async updatePackingItemPacked() {
    return requireWritableDemo();
  },
  async listTripInfos(tripId) {
    return demoTripInfos.filter((item) => item.trip_id === tripId);
  },
  async createTripInfo() {
    return requireWritableDemo();
  },
  async listTodos(tripId) {
    return demoTodos.filter((item) => item.trip_id === tripId);
  },
  async createTodo() {
    return requireWritableDemo();
  },
  async updateTodoCompleted() {
    return requireWritableDemo();
  },
  async listTripMembers(tripId) {
    return demoMembers.filter((item) => item.trip_id === tripId);
  },
  async inviteTripMember() {
    return requireWritableDemo();
  },
  async listTripCollections() {
    return demoCollections;
  },
  async createTripCollection() {
    return requireWritableDemo();
  },
  async updateTripCollectionStatus() {
    return requireWritableDemo();
  },
  async deleteTripCollection() {
    return requireWritableDemo();
  },
  async getUserSettings() {
    return defaultSettings('demo-user-id');
  },
  async updateUserSettings() {
    return requireWritableDemo();
  },
});
