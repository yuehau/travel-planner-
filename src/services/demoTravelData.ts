import type { NewsPost, Place, PlaceLink, Profile, ProfileUpdateInput, Trip, TripCollection } from '../types/database';
import { buildSeedCollections, buildSeedRecords, demoUserId } from '../data/demoSeed';
import { bodyToParagraphs, newsSeeds, slugifyTitle, toNewsPost } from '../data/news';
import { uploadSharedSnapshot } from './publicApi';
import {
  TravelDataError,
  getVisitedAt,
  normalizeOptional,
  requireText,
  shareUrlFor,
  validateDayNumber,
  validatePosition,
  validateRating,
  validateTripDates,
  type TravelDataClient,
} from './travelData';

type DemoStore = {
  trips: Trip[];
  places: Place[];
  links: PlaceLink[];
  collections: TripCollection[];
  newsLikes: Record<string, boolean>;
  /** Posts the demo user published from a board. Local to this browser. */
  userPosts: NewsPost[];
  profile: Profile;
};

export const demoProfileDefaults: Profile = {
  id: demoUserId,
  full_name: 'Demo Traveler',
  avatar_url: null,
  gender: 'prefer_not_to_say',
  gender_detail: null,
  birth_date: null,
  home_city: 'Kuala Lumpur',
  country: 'Malaysia',
  bio: 'Trying the visual trip board.',
  email: 'demo@example.com',
  updated_at: null,
};

const demoStoreKey = 'travel_planner_demo_store_v2';
let demoMemoryStore: DemoStore | null = null;

const createDefaultDemoStore = (): DemoStore => {
  const seed = buildSeedRecords(demoUserId);
  return {
    trips: seed.trips,
    places: seed.places,
    links: seed.links,
    collections: buildSeedCollections(demoUserId),
    newsLikes: {},
    userPosts: [],
    profile: demoProfileDefaults,
  };
};

const createDemoId = (prefix: string) => `demo-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const isBrowserStorageAvailable = () => typeof window !== 'undefined' && Boolean(window.localStorage);

const getDemoStore = (): DemoStore => {
  if (!isBrowserStorageAvailable()) {
    demoMemoryStore ??= createDefaultDemoStore();
    return demoMemoryStore;
  }

  const fallbackStore = createDefaultDemoStore();
  const storedValue = window.localStorage.getItem(demoStoreKey);
  if (!storedValue) return fallbackStore;

  try {
    const parsedStore = JSON.parse(storedValue) as Partial<DemoStore>;
    return {
      ...fallbackStore,
      ...parsedStore,
      newsLikes: { ...parsedStore.newsLikes },
      userPosts: parsedStore.userPosts ?? [],
      profile: { ...fallbackStore.profile, ...parsedStore.profile },
    };
  } catch {
    window.localStorage.removeItem(demoStoreKey);
    return fallbackStore;
  }
};

const saveDemoStore = (store: DemoStore) => {
  if (!isBrowserStorageAvailable()) {
    demoMemoryStore = store;
    return;
  }
  window.localStorage.setItem(demoStoreKey, JSON.stringify(store));
};

/** Clears persisted demo data so the seeded trips come back. */
export const resetDemoStore = () => {
  demoMemoryStore = null;
  if (isBrowserStorageAvailable()) window.localStorage.removeItem(demoStoreKey);
};

const findDemoRecord = <T extends { id: string }>(records: T[], id: string, label: string) => {
  const record = records.find((item) => item.id === id);
  if (!record) throw new TravelDataError(`${label} was not found.`, 'not_found');
  return record;
};

const replaceDemoRecord = <T extends { id: string }>(records: T[], updatedRecord: T) => (
  records.map((item) => (item.id === updatedRecord.id ? updatedRecord : item))
);

const newsPostFromStore = (store: DemoStore, slug: string): NewsPost | null => {
  const liked = Boolean(store.newsLikes[slug]);
  const userPost = store.userPosts.find((post) => post.slug === slug);
  if (userPost) return { ...userPost, liked, like_count: userPost.like_count + (liked ? 1 : 0) };

  const seed = newsSeeds.find((post) => post.slug === slug);
  if (!seed) return null;
  return toNewsPost(seed, seed.baseLikes + (liked ? 1 : 0), liked);
};

/** Reads (and persists) the demo profile; exported so AuthContext can show it without a data client. */
export const getDemoProfile = (): Profile => getDemoStore().profile;

export const updateDemoProfile = (input: ProfileUpdateInput): Profile => {
  const store = getDemoStore();
  store.profile = { ...store.profile, ...input, updated_at: new Date().toISOString() };
  saveDemoStore(store);
  return store.profile;
};

export const createDemoTravelDataClient = (): TravelDataClient => ({
  async listTrips() {
    return [...getDemoStore().trips].sort((first, second) => first.start_date.localeCompare(second.start_date));
  },
  async createTrip(input) {
    const destination = requireText(input.destination, 'Trip name');
    validateTripDates(input.start_date, input.end_date);

    const store = getDemoStore();
    const trip: Trip = {
      id: createDemoId('trip'),
      user_id: demoUserId,
      destination,
      region: normalizeOptional(input.region),
      cover_image: normalizeOptional(input.cover_image),
      start_date: input.start_date,
      end_date: input.end_date,
      description: normalizeOptional(input.description),
      status: 'draft',
      share_token: null,
      created_at: new Date().toISOString(),
    };
    store.trips = [...store.trips, trip];
    saveDemoStore(store);
    return trip;
  },
  async updateTrip(id, input) {
    const store = getDemoStore();
    const trip = findDemoRecord(store.trips, id, 'Trip');
    const startDate = input.start_date ?? trip.start_date;
    const endDate = input.end_date ?? trip.end_date;
    validateTripDates(startDate, endDate);

    const updatedTrip: Trip = {
      ...trip,
      destination: input.destination === undefined ? trip.destination : requireText(input.destination, 'Trip name'),
      region: input.region === undefined ? trip.region : normalizeOptional(input.region),
      cover_image: input.cover_image === undefined ? trip.cover_image : normalizeOptional(input.cover_image),
      start_date: startDate,
      end_date: endDate,
      description: input.description === undefined ? trip.description : normalizeOptional(input.description),
      status: input.status ?? trip.status,
    };
    store.trips = replaceDemoRecord(store.trips, updatedTrip);
    saveDemoStore(store);
    return updatedTrip;
  },
  async deleteTrip(id) {
    const store = getDemoStore();
    findDemoRecord(store.trips, id, 'Trip');
    store.trips = store.trips.filter((item) => item.id !== id);
    store.places = store.places.filter((item) => item.trip_id !== id);
    store.links = store.links.filter((item) => item.trip_id !== id);
    store.userPosts = store.userPosts.filter((post) => post.trip_id !== id);
    saveDemoStore(store);
  },
  async getTrip(tripId) {
    return getDemoStore().trips.find((trip) => trip.id === tripId) ?? null;
  },
  async shareTrip(id) {
    const store = getDemoStore();
    const trip = findDemoRecord(store.trips, id, 'Trip');
    // Demo data lives in this browser, so a snapshot is uploaded for other people to view.
    const { token } = await uploadSharedSnapshot({
      trip: { ...trip, share_token: trip.share_token },
      places: store.places.filter((place) => place.trip_id === id),
      links: store.links.filter((link) => link.trip_id === id),
      owner: { full_name: store.profile.full_name, avatar_url: store.profile.avatar_url },
    });
    const updatedTrip: Trip = { ...trip, share_token: token };
    store.trips = replaceDemoRecord(store.trips, updatedTrip);
    saveDemoStore(store);
    return { share_token: token, url: shareUrlFor(token) };
  },
  async unshareTrip(id) {
    const store = getDemoStore();
    const trip = findDemoRecord(store.trips, id, 'Trip');
    const updatedTrip: Trip = { ...trip, share_token: null };
    store.trips = replaceDemoRecord(store.trips, updatedTrip);
    saveDemoStore(store);
    return updatedTrip;
  },
  async listPlaces(tripId) {
    return getDemoStore().places
      .filter((item) => item.trip_id === tripId)
      .sort((first, second) => first.created_at.localeCompare(second.created_at));
  },
  async createPlace(tripId, input) {
    const store = getDemoStore();
    findDemoRecord(store.trips, tripId, 'Trip');
    const place: Place = {
      id: createDemoId('place'),
      trip_id: tripId,
      catalog_id: normalizeOptional(input.catalog_id),
      name: requireText(input.name, 'Place name'),
      address: normalizeOptional(input.address),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      source: input.source ?? 'manual',
      notes: normalizeOptional(input.notes),
      photo_url: normalizeOptional(input.photo_url),
      rating: validateRating(input.rating),
      label: normalizeOptional(input.label),
      day_number: validateDayNumber(input.day_number),
      start_time: normalizeOptional(input.start_time),
      position_x: validatePosition(input.position_x),
      position_y: validatePosition(input.position_y),
      created_at: new Date().toISOString(),
    };
    store.places = [...store.places, place];
    saveDemoStore(store);
    return place;
  },
  async updatePlace(id, input) {
    const store = getDemoStore();
    const place = findDemoRecord(store.places, id, 'Place');
    const updatedPlace: Place = {
      ...place,
      catalog_id: input.catalog_id === undefined ? place.catalog_id : normalizeOptional(input.catalog_id),
      name: input.name === undefined ? place.name : requireText(input.name, 'Place name'),
      address: input.address === undefined ? place.address : normalizeOptional(input.address),
      latitude: input.latitude === undefined ? place.latitude : input.latitude,
      longitude: input.longitude === undefined ? place.longitude : input.longitude,
      source: input.source ?? place.source,
      notes: input.notes === undefined ? place.notes : normalizeOptional(input.notes),
      photo_url: input.photo_url === undefined ? place.photo_url : normalizeOptional(input.photo_url),
      rating: input.rating === undefined ? place.rating : validateRating(input.rating),
      label: input.label === undefined ? place.label : normalizeOptional(input.label),
      day_number: input.day_number === undefined ? place.day_number : validateDayNumber(input.day_number),
      start_time: input.start_time === undefined ? place.start_time : normalizeOptional(input.start_time),
      position_x: validatePosition(input.position_x, place.position_x),
      position_y: validatePosition(input.position_y, place.position_y),
    };
    store.places = replaceDemoRecord(store.places, updatedPlace);
    saveDemoStore(store);
    return updatedPlace;
  },
  async deletePlace(id) {
    const store = getDemoStore();
    findDemoRecord(store.places, id, 'Place');
    store.places = store.places.filter((item) => item.id !== id);
    store.links = store.links.filter((link) => link.source_place_id !== id && link.target_place_id !== id);
    saveDemoStore(store);
  },
  async listPlaceLinks(tripId) {
    return getDemoStore().links.filter((link) => link.trip_id === tripId);
  },
  async createPlaceLink(tripId, input) {
    const store = getDemoStore();
    findDemoRecord(store.trips, tripId, 'Trip');
    const source = findDemoRecord(store.places, input.source_place_id, 'Place');
    const target = findDemoRecord(store.places, input.target_place_id, 'Place');

    if (source.trip_id !== tripId || target.trip_id !== tripId) {
      throw new TravelDataError('Both places must be on this board.', 'validation_error');
    }
    if (source.id === target.id) {
      throw new TravelDataError('A place cannot link to itself.', 'validation_error');
    }
    if (store.links.some((link) => link.source_place_id === source.id && link.target_place_id === target.id)) {
      throw new TravelDataError('These places are already connected.', 'conflict');
    }

    const link: PlaceLink = {
      id: createDemoId('link'),
      trip_id: tripId,
      source_place_id: source.id,
      target_place_id: target.id,
      transport_mode: input.transport_mode ?? 'walk',
      created_at: new Date().toISOString(),
    };
    store.links = [...store.links, link];
    saveDemoStore(store);
    return link;
  },
  async updatePlaceLink(id, input) {
    const store = getDemoStore();
    const link = findDemoRecord(store.links, id, 'Route');
    const updatedLink: PlaceLink = { ...link, transport_mode: input.transport_mode ?? link.transport_mode };
    store.links = replaceDemoRecord(store.links, updatedLink);
    saveDemoStore(store);
    return updatedLink;
  },
  async deletePlaceLink(id) {
    const store = getDemoStore();
    findDemoRecord(store.links, id, 'Route');
    store.links = store.links.filter((link) => link.id !== id);
    saveDemoStore(store);
  },
  async listTripCollections() {
    return getDemoStore().collections;
  },
  async createTripCollection(input) {
    const status = input.status ?? 'want_to_go';
    const store = getDemoStore();
    const collection: TripCollection = {
      id: createDemoId('collection'),
      user_id: demoUserId,
      destination: requireText(input.destination, 'Destination'),
      status,
      notes: normalizeOptional(input.notes),
      visited_at: getVisitedAt(status, input.visited_at),
      created_at: new Date().toISOString(),
    };
    store.collections = [collection, ...store.collections];
    saveDemoStore(store);
    return collection;
  },
  async updateTripCollection(id, input) {
    const store = getDemoStore();
    const collection = findDemoRecord(store.collections, id, 'Saved destination');
    const status = input.status ?? collection.status;
    const updatedCollection: TripCollection = {
      ...collection,
      destination: input.destination === undefined ? collection.destination : requireText(input.destination, 'Destination'),
      status,
      notes: input.notes === undefined ? collection.notes : normalizeOptional(input.notes),
      visited_at: input.status === undefined
        ? (input.visited_at === undefined ? collection.visited_at : normalizeOptional(input.visited_at))
        : getVisitedAt(status, input.visited_at),
    };
    store.collections = replaceDemoRecord(store.collections, updatedCollection);
    saveDemoStore(store);
    return updatedCollection;
  },
  async updateTripCollectionStatus(id, status) {
    return this.updateTripCollection(id, { status });
  },
  async deleteTripCollection(id) {
    const store = getDemoStore();
    findDemoRecord(store.collections, id, 'Saved destination');
    store.collections = store.collections.filter((item) => item.id !== id);
    saveDemoStore(store);
  },
  async listNewsPosts() {
    const store = getDemoStore();
    return [...store.userPosts, ...newsSeeds]
      .map((post) => newsPostFromStore(store, post.slug))
      .filter((post): post is NewsPost => post !== null)
      .sort((first, second) => second.published_at.localeCompare(first.published_at));
  },
  async createNewsPost(input) {
    const store = getDemoStore();
    const trip = findDemoRecord(store.trips, input.trip_id, 'Trip');
    const title = requireText(input.title, 'Caption');
    const body = requireText(input.body, 'Story');
    const shareToken = trip.share_token ?? (await this.shareTrip(trip.id)).share_token;
    const id = createDemoId('post');
    const post: NewsPost = {
      id,
      slug: slugifyTitle(title, id.slice(-6)),
      title,
      excerpt: body.length > 160 ? `${body.slice(0, 157).trimEnd()}…` : body,
      body: bodyToParagraphs(body),
      city: trip.region ?? 'Malaysia',
      category: 'trip',
      author: getDemoStore().profile.full_name ?? 'Demo Traveler',
      author_avatar: getDemoStore().profile.avatar_url,
      published_at: new Date().toISOString().slice(0, 10),
      cover_image: trip.cover_image ?? '/regions/kuala-lumpur.svg',
      kind: 'trip',
      user_id: demoUserId,
      trip_id: trip.id,
      share_token: shareToken,
      is_mine: true,
      like_count: 0,
      liked: false,
    };
    const latest = getDemoStore();
    latest.userPosts = [post, ...latest.userPosts];
    saveDemoStore(latest);
    return post;
  },
  async updateNewsPost(slug, input) {
    const store = getDemoStore();
    const post = store.userPosts.find((item) => item.slug === slug);
    if (!post) throw new TravelDataError('Post was not found.', 'not_found');

    const title = input.title === undefined ? post.title : requireText(input.title, 'Caption');
    const bodyText = input.body === undefined ? post.body.join('\n\n') : requireText(input.body, 'Story');
    const updated: NewsPost = {
      ...post,
      title,
      body: bodyToParagraphs(bodyText),
      excerpt: bodyText.length > 160 ? `${bodyText.slice(0, 157).trimEnd()}…` : bodyText,
    };
    store.userPosts = store.userPosts.map((item) => (item.slug === slug ? updated : item));
    saveDemoStore(store);
    return newsPostFromStore(store, slug) as NewsPost;
  },
  async deleteNewsPost(slug) {
    const store = getDemoStore();
    if (!store.userPosts.some((item) => item.slug === slug)) throw new TravelDataError('Post was not found.', 'not_found');
    store.userPosts = store.userPosts.filter((item) => item.slug !== slug);
    delete store.newsLikes[slug];
    saveDemoStore(store);
  },
  async getNewsPost(slug) {
    return newsPostFromStore(getDemoStore(), slug);
  },
  async toggleNewsLike(slug) {
    const store = getDemoStore();
    const base = store.userPosts.find((post) => post.slug === slug)?.like_count
      ?? newsSeeds.find((post) => post.slug === slug)?.baseLikes;
    if (base === undefined) throw new TravelDataError('Post was not found.', 'not_found');

    const liked = !store.newsLikes[slug];
    store.newsLikes = { ...store.newsLikes, [slug]: liked };
    saveDemoStore(store);
    return { like_count: base + (liked ? 1 : 0), liked };
  },
});
