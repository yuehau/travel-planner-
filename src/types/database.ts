export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

export type Trip = {
  id: string;
  user_id: string;
  destination: string;
  home_base: string | null;
  start_date: string;
  end_date: string;
  description: string | null;
  budget_cap: number | null;
  group_open: boolean;
  group_capacity: number | null;
  created_at: string;
};

export type TripInfo = {
  id: string;
  trip_id: string;
  category: string;
  label: string;
  value: string;
  url: string | null;
  created_at: string;
};

export type ItineraryItem = {
  id: string;
  trip_id: string;
  place_id: string | null;
  day_number: number;
  activity: string;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
};

export type ItineraryNodeType = 'activity' | 'transport' | 'lodging' | 'meal' | 'other';
export type ItineraryNodeStatus = 'planned' | 'broken' | 'replanned' | 'cancelled';

export type ItineraryNode = {
  id: string;
  trip_id: string;
  parent_node_id: string | null;
  place_id: string | null;
  day_number: number;
  sequence_index: number;
  title: string;
  node_type: ItineraryNodeType;
  status: ItineraryNodeStatus;
  start_time: string | null;
  end_time: string | null;
  estimated_cost: number;
  currency: string;
  notes: string | null;
  break_reason: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
};

export type ReplanEvent = {
  id: string;
  trip_id: string;
  broken_node_id: string | null;
  reason: string;
  ai_request: Record<string, unknown> | null;
  ai_response: Record<string, unknown> | null;
  applied: boolean;
  created_at: string;
};

export type Place = {
  id: string;
  trip_id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  source: string;
  notes: string | null;
  photo_url: string | null;
  rating: number | null;
  created_at: string;
};

export type BudgetItem = {
  id: string;
  trip_id: string;
  category: string;
  amount: number;
  currency: string;
  is_paid: boolean;
  created_at: string;
};

export type PackingItem = {
  id: string;
  trip_id: string;
  category: string;
  item: string;
  is_packed: boolean;
  created_at: string;
};

export type TripTodoPriority = 'low' | 'medium' | 'high';

export type TripTodo = {
  id: string;
  trip_id: string;
  title: string;
  due_date: string | null;
  priority: TripTodoPriority;
  is_completed: boolean;
  created_at: string;
};

export type TripMemberRole = 'owner' | 'member';
export type TripMemberStatus = 'pending' | 'accepted';

export type TripMember = {
  id: string;
  trip_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: TripMemberRole;
  status: TripMemberStatus;
  created_at: string;
};

export type TripCollectionStatus = 'want_to_go' | 'visited';

export type TripCollection = {
  id: string;
  user_id: string;
  destination: string;
  status: TripCollectionStatus;
  notes: string | null;
  visited_at: string | null;
  created_at: string;
};

export type UserSettings = {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  currency: string;
  distance_unit: 'km' | 'mi';
  time_format: '12h' | '24h';
  dashboard_widgets: string[];
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      trips: {
        Row: Trip;
        Insert: {
          id?: string;
          user_id: string;
          destination: string;
          home_base?: string | null;
          start_date: string;
          end_date: string;
          description?: string | null;
          budget_cap?: number | null;
          group_open?: boolean;
          group_capacity?: number | null;
          created_at?: string;
        };
        Update: Partial<Omit<Trip, 'created_at'>>;
        Relationships: [];
      };
      itinerary_items: {
        Row: ItineraryItem;
        Insert: {
          id?: string;
          trip_id: string;
          place_id?: string | null;
          day_number: number;
          activity: string;
          location?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Omit<ItineraryItem, 'created_at'>>;
        Relationships: [];
      };
      itinerary_nodes: {
        Row: ItineraryNode;
        Insert: {
          id?: string;
          trip_id: string;
          parent_node_id?: string | null;
          place_id?: string | null;
          day_number: number;
          sequence_index?: number;
          title: string;
          node_type?: ItineraryNodeType;
          status?: ItineraryNodeStatus;
          start_time?: string | null;
          end_time?: string | null;
          estimated_cost?: number;
          currency?: string;
          notes?: string | null;
          break_reason?: string | null;
          ai_generated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ItineraryNode, 'created_at'>>;
        Relationships: [];
      };
      replan_events: {
        Row: ReplanEvent;
        Insert: {
          id?: string;
          trip_id: string;
          broken_node_id?: string | null;
          reason: string;
          ai_request?: Record<string, unknown> | null;
          ai_response?: Record<string, unknown> | null;
          applied?: boolean;
          created_at?: string;
        };
        Update: Partial<Omit<ReplanEvent, 'created_at'>>;
        Relationships: [];
      };
      places: {
        Row: Place;
        Insert: {
          id?: string;
          trip_id: string;
          name: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          source?: string;
          notes?: string | null;
          photo_url?: string | null;
          rating?: number | null;
          created_at?: string;
        };
        Update: Partial<Omit<Place, 'created_at'>>;
        Relationships: [];
      };
      budget_items: {
        Row: BudgetItem;
        Insert: {
          id?: string;
          trip_id: string;
          category: string;
          amount: number;
          currency?: string;
          is_paid?: boolean;
          created_at?: string;
        };
        Update: Partial<Omit<BudgetItem, 'created_at'>>;
        Relationships: [];
      };
      packing_items: {
        Row: PackingItem;
        Insert: {
          id?: string;
          trip_id: string;
          category?: string;
          item: string;
          is_packed?: boolean;
          created_at?: string;
        };
        Update: Partial<Omit<PackingItem, 'created_at'>>;
        Relationships: [];
      };
      trip_infos: {
        Row: TripInfo;
        Insert: {
          id?: string;
          trip_id: string;
          category: string;
          label: string;
          value: string;
          url?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<TripInfo, 'created_at'>>;
        Relationships: [];
      };
      trip_todos: {
        Row: TripTodo;
        Insert: {
          id?: string;
          trip_id: string;
          title: string;
          due_date?: string | null;
          priority?: TripTodoPriority;
          is_completed?: boolean;
          created_at?: string;
        };
        Update: Partial<Omit<TripTodo, 'created_at'>>;
        Relationships: [];
      };
      trip_members: {
        Row: TripMember;
        Insert: {
          id?: string;
          trip_id: string;
          user_id?: string | null;
          invited_email?: string | null;
          role?: TripMemberRole;
          status?: TripMemberStatus;
          created_at?: string;
        };
        Update: Partial<Omit<TripMember, 'created_at'>>;
        Relationships: [];
      };
      user_settings: {
        Row: UserSettings;
        Insert: {
          user_id: string;
          theme?: 'light' | 'dark' | 'system';
          currency?: string;
          distance_unit?: 'km' | 'mi';
          time_format?: '12h' | '24h';
          dashboard_widgets?: string[];
          updated_at?: string;
        };
        Update: Partial<UserSettings>;
        Relationships: [];
      };
      trip_collections: {
        Row: TripCollection;
        Insert: {
          id?: string;
          user_id: string;
          destination: string;
          status?: TripCollectionStatus;
          notes?: string | null;
          visited_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<TripCollection, 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
