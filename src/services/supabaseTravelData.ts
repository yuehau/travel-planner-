import { getSupabaseClient } from '../lib/supabase';
import {
  TravelDataError,
  getVisitedAt,
  normalizeOptional,
  notAvailableInRemoteMode,
  removeUndefined,
  requireText,
  validateTripDates,
  type TravelDataClient,
} from './travelData';

const handleSingle = <T>(data: T | null, error: { message: string } | null, fallbackMessage: string) => {
  if (error) {
    throw new TravelDataError(error.message || fallbackMessage, 'data_error');
  }

  if (!data) {
    throw new TravelDataError(fallbackMessage, 'not_found');
  }

  return data;
};

/**
 * Remote (Supabase) client. Trips and collections work against the schema in supabase-schema.sql;
 * the board (places/links) and news are local-prototype features and throw until the remote path is built.
 */
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
      const destination = requireText(input.destination, 'Trip name');
      validateTripDates(input.start_date, input.end_date);

      const { data, error } = await supabase
        .from('trips')
        .insert({
          user_id: userId,
          destination,
          region: normalizeOptional(input.region),
          cover_image: normalizeOptional(input.cover_image),
          start_date: input.start_date,
          end_date: input.end_date,
          description: normalizeOptional(input.description),
        })
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not create trip.');
    },
    async updateTrip(id, input) {
      const currentTrip = await requireTrip(id);
      const startDate = input.start_date ?? currentTrip.start_date;
      const endDate = input.end_date ?? currentTrip.end_date;
      validateTripDates(startDate, endDate);

      const { data, error } = await supabase
        .from('trips')
        .update(removeUndefined({
          destination: input.destination === undefined ? undefined : requireText(input.destination, 'Trip name'),
          region: input.region === undefined ? undefined : normalizeOptional(input.region),
          cover_image: input.cover_image === undefined ? undefined : normalizeOptional(input.cover_image),
          start_date: input.start_date,
          end_date: input.end_date,
          description: input.description === undefined ? undefined : normalizeOptional(input.description),
          status: input.status,
        }))
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not update trip.');
    },
    async deleteTrip(id) {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new TravelDataError(error.message, 'data_error');
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
    async shareTrip() {
      throw notAvailableInRemoteMode('Sharing');
    },
    async unshareTrip() {
      throw notAvailableInRemoteMode('Sharing');
    },
    async listPlaces() {
      throw notAvailableInRemoteMode('The trip board');
    },
    async createPlace() {
      throw notAvailableInRemoteMode('The trip board');
    },
    async updatePlace() {
      throw notAvailableInRemoteMode('The trip board');
    },
    async deletePlace() {
      throw notAvailableInRemoteMode('The trip board');
    },
    async listPlaceLinks() {
      throw notAvailableInRemoteMode('The trip board');
    },
    async createPlaceLink() {
      throw notAvailableInRemoteMode('The trip board');
    },
    async updatePlaceLink() {
      throw notAvailableInRemoteMode('The trip board');
    },
    async deletePlaceLink() {
      throw notAvailableInRemoteMode('The trip board');
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
    async updateTripCollection(id, input) {
      const status = input.status;
      const { data, error } = await supabase
        .from('trip_collections')
        .update(removeUndefined({
          destination: input.destination === undefined ? undefined : requireText(input.destination, 'Destination'),
          status,
          notes: input.notes === undefined ? undefined : normalizeOptional(input.notes),
          visited_at: status === undefined
            ? input.visited_at
            : getVisitedAt(status, input.visited_at),
        }))
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .single();

      return handleSingle(data, error, 'Could not update saved destination.');
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
    async listNewsPosts() {
      throw notAvailableInRemoteMode('News');
    },
    async getNewsPost() {
      throw notAvailableInRemoteMode('News');
    },
    async toggleNewsLike() {
      throw notAvailableInRemoteMode('News');
    },
    async createNewsPost() {
      throw notAvailableInRemoteMode('News');
    },
    async updateNewsPost() {
      throw notAvailableInRemoteMode('News');
    },
    async deleteNewsPost() {
      throw notAvailableInRemoteMode('News');
    },
  };
};
