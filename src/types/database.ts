export type Gender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'self_describe';

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  gender?: Gender | null;
  gender_detail?: string | null;
  birth_date?: string | null;
  home_city?: string | null;
  country?: string | null;
  bio?: string | null;
  email?: string | null;
  updated_at: string | null;
};

export type ProfileUpdateInput = Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'gender' | 'gender_detail' | 'birth_date' | 'home_city' | 'country' | 'bio'>>;

export type TripPlanStatus = 'draft' | 'complete';

export type Trip = {
  id: string;
  user_id: string;
  destination: string;
  region: string | null;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  description: string | null;
  status: TripPlanStatus;
  share_token: string | null;
  created_at: string;
};

export type TransportMode = 'walk' | 'car' | 'bus' | 'train';

/** A place on a trip board. Board nodes are places with a position. */
export type Place = {
  id: string;
  trip_id: string;
  catalog_id: string | null;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  source: string;
  notes: string | null;
  photo_url: string | null;
  rating: number | null;
  /** Optional custom name shown instead of `name`. */
  label: string | null;
  day_number: number | null;
  start_time: string | null;
  position_x: number;
  position_y: number;
  created_at: string;
};

/** A directed route between two places on the same board. */
export type PlaceLink = {
  id: string;
  trip_id: string;
  source_place_id: string;
  target_place_id: string;
  transport_mode: TransportMode;
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

export type NewsCategory = 'cafe' | 'restaurant' | 'attraction' | 'event' | 'trip';
export type NewsKind = 'editorial' | 'trip';

export type NewsPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  city: string;
  category: NewsCategory;
  author: string;
  author_avatar?: string | null;
  published_at: string;
  cover_image: string;
  kind: NewsKind;
  user_id: string | null;
  trip_id: string | null;
  share_token: string | null;
  is_mine: boolean;
  like_count: number;
  liked: boolean;
};

/** A read-only board served from a share token (live trip in local mode, or a demo snapshot). */
export type SharedBoard = {
  token: string;
  trip: Trip;
  places: Place[];
  links: PlaceLink[];
  owner: { full_name: string | null; avatar_url: string | null };
  snapshot: boolean;
};

export type GooglePlaceDetails = {
  catalog_id: string;
  place_id: string | null;
  rating: number | null;
  review_count: number | null;
  reviews: { author: string; rating: number; text: string; date: string; relative_time?: string }[];
  google_maps_uri: string | null;
  summary: string | null;
  photo_attribution: string | null;
  has_photo: boolean;
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
          gender?: Gender | null;
          gender_detail?: string | null;
          birth_date?: string | null;
          home_city?: string | null;
          country?: string | null;
          bio?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Omit<Profile, 'email'>>;
        Relationships: [];
      };
      trips: {
        Row: Trip;
        Insert: {
          id?: string;
          user_id: string;
          destination: string;
          region?: string | null;
          cover_image?: string | null;
          start_date: string;
          end_date: string;
          description?: string | null;
          status?: TripPlanStatus;
          share_token?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Trip, 'created_at'>>;
        Relationships: [];
      };
      places: {
        Row: Place;
        Insert: {
          id?: string;
          trip_id: string;
          catalog_id?: string | null;
          name: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          source?: string;
          notes?: string | null;
          photo_url?: string | null;
          rating?: number | null;
          label?: string | null;
          day_number?: number | null;
          start_time?: string | null;
          position_x?: number;
          position_y?: number;
          created_at?: string;
        };
        Update: Partial<Omit<Place, 'created_at'>>;
        Relationships: [];
      };
      place_links: {
        Row: PlaceLink;
        Insert: {
          id?: string;
          trip_id: string;
          source_place_id: string;
          target_place_id: string;
          transport_mode?: TransportMode;
          created_at?: string;
        };
        Update: Partial<Omit<PlaceLink, 'created_at'>>;
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
