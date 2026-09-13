import { Suspense, lazy, useEffect, useState } from 'react';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.mjs';
import Clock from 'lucide-react/dist/esm/icons/clock.mjs';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2.mjs';
import Minimize2 from 'lucide-react/dist/esm/icons/minimize-2.mjs';
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs';
import Star from 'lucide-react/dist/esm/icons/star.mjs';
import X from 'lucide-react/dist/esm/icons/x.mjs';
import type { GooglePlaceDetails, Place } from '../../types/database';
import { categoryLabels, priceLevelLabel, type CatalogPlace } from '../../data/catalog';
import { useGooglePhotos } from '../../hooks/useGooglePhotos';
import { fetchGoogleDetails } from '../../services/publicApi';
import { formatStartTime, placeDisplayName } from '../../utils/boardGraph';
import PlaceImage from '../PlaceImage';

const PlaceMap = lazy(() => import('./PlaceMap'));

type PlaceFocusModalProps = {
  catalogPlace: CatalogPlace | null;
  place?: Place | null;
  onClose: () => void;
  action?: { label: string; onClick: () => void };
};

const formatReviewDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-MY', { month: 'short', year: 'numeric' }).format(date);
};

const Stars = ({ rating }: { rating: number }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5`}>
    {[1, 2, 3, 4, 5].map((step) => (
      <Star
        key={step}
        size={14}
        className={step <= Math.round(rating) ? 'fill-accent text-accent' : 'text-line-strong'}
      />
    ))}
  </span>
);

/** Remounts the content per place so map/Google state starts fresh for every card. */
const PlaceFocusModal = ({ catalogPlace, place = null, onClose, action }: PlaceFocusModalProps) => {
  if (!catalogPlace && !place) return null;
  return <PlaceFocusModalContent key={place?.id ?? catalogPlace?.id} catalogPlace={catalogPlace} place={place} onClose={onClose} action={action} />;
};

const PlaceFocusModalContent = ({ catalogPlace, place = null, onClose, action }: PlaceFocusModalProps) => {
  const googleEnabled = useGooglePhotos();
  const [google, setGoogle] = useState<GooglePlaceDetails | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!googleEnabled || !catalogPlace) return;
    let isMounted = true;
    fetchGoogleDetails(catalogPlace.id)
      .then((details) => {
        if (isMounted) setGoogle(details);
      })
      .catch(() => {
        // Fall back to the catalog's sample data silently.
      });
    return () => {
      isMounted = false;
    };
  }, [catalogPlace, googleEnabled]);

  const title = place ? placeDisplayName(place) : catalogPlace?.name ?? 'Place';
  const officialName = catalogPlace?.name ?? place?.name ?? null;
  const city = catalogPlace?.city ?? null;
  const address = catalogPlace?.address ?? place?.address ?? null;
  const description = google?.summary ?? catalogPlace?.description ?? null;
  const rating = google?.rating ?? catalogPlace?.rating ?? place?.rating ?? null;
  const reviewCount = google?.review_count ?? catalogPlace?.reviewCount ?? null;
  const reviews = google?.reviews?.length ? google.reviews : catalogPlace?.reviews ?? [];
  const reviewsSource = google?.reviews?.length ? 'google' : 'sample';
  const latitude = catalogPlace?.latitude ?? place?.latitude ?? null;
  const longitude = catalogPlace?.longitude ?? place?.longitude ?? null;
  const mapsQuery = latitude !== null && longitude !== null ? `${latitude},${longitude}` : address ?? title;
  const googleMapsUrl = google?.google_maps_uri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
  const priceLabel = priceLevelLabel(catalogPlace?.priceLevel);
  const schedule = place ? [place.day_number ? `Day ${place.day_number}` : null, formatStartTime(place.start_time)].filter(Boolean).join(' · ') : '';
  const hasMap = latitude !== null && longitude !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mist-950/60 px-4 py-6 backdrop-blur-md animate-fade-in">
      <button
        type="button"
        aria-label="Close place details"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-focus-title"
        className={`relative grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-line bg-surface-raised text-ink shadow-2xl shadow-mist-950/40 ${
          isMapExpanded ? 'grid-cols-1' : 'md:grid-cols-[1fr_1.05fr]'
        }`}
      >
        <button
          type="button"
          aria-label="Close place details"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-mist-950/50 p-2 text-mist-50 transition hover:bg-mist-950/80"
        >
          <X size={18} />
        </button>

        {isMapExpanded && hasMap ? (
          <div className="relative h-[60vh] min-h-[320px] bg-surface-sunken">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-ink-muted">Loading map…</div>}>
              <PlaceMap latitude={latitude} longitude={longitude} name={title} />
            </Suspense>
            <button
              type="button"
              onClick={() => setIsMapExpanded(false)}
              className="absolute left-4 top-4 z-[500] inline-flex items-center gap-2 rounded-full bg-surface-raised px-3 py-2 text-xs font-semibold text-ink shadow-lg"
            >
              <Minimize2 size={14} />
              Back to details
            </button>
          </div>
        ) : (
          <div className="relative min-h-[220px] bg-surface-sunken md:min-h-[560px]">
            <PlaceImage
              catalogId={catalogPlace?.id}
              fallback={catalogPlace?.image ?? place?.photo_url}
              width={1200}
              alt={title}
              loading="eager"
              className="h-full w-full object-cover object-left-bottom"
            />
            {catalogPlace && (
              <span className="absolute left-4 top-4 rounded-full bg-surface-raised/90 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-ink">
                {categoryLabels[catalogPlace.category]}
              </span>
            )}
            {google?.photo_attribution && googleEnabled && (
              <span className="absolute bottom-3 left-4 rounded-full bg-mist-950/60 px-2.5 py-1 text-[10px] text-mist-50">Photo: {google.photo_attribution} · Google</span>
            )}
          </div>
        )}

        <div className={`flex max-h-[92vh] flex-col overflow-y-auto p-6 md:p-8 ${isMapExpanded ? 'max-h-[32vh]' : ''}`}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-ink-faint">
            Place intel{catalogPlace ? ` · ${catalogPlace.region}` : ' · Custom place'}
          </p>
          <h2 id="place-focus-title" className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
          {officialName && officialName !== title && <p className="mt-1 text-sm text-ink-faint">{officialName}</p>}
          {city && <p className="mt-1 text-sm font-medium text-ink-muted">{city}</p>}

          <div className="mt-5 space-y-3 text-sm text-ink-muted">
            {schedule && (
              <p className="flex items-center gap-2 font-semibold text-ink">
                <CalendarDays size={17} className="shrink-0 text-accent" />
                {schedule}
              </p>
            )}
            {rating !== null && (
              <p className="flex flex-wrap items-center gap-2">
                <Stars rating={rating} />
                <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
                {reviewCount !== null && <span>({reviewCount.toLocaleString()} reviews{google ? ' on Google' : ''})</span>}
                {priceLabel && <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-semibold text-ink">{priceLabel}</span>}
              </p>
            )}
            {address && (
              <p className="flex gap-2">
                <MapPin size={17} className="mt-0.5 shrink-0 text-ink-faint" />
                <span>{address}</span>
              </p>
            )}
            {catalogPlace?.openingHours && (
              <p className="flex gap-2">
                <Clock size={17} className="mt-0.5 shrink-0 text-ink-faint" />
                <span>{catalogPlace.openingHours}</span>
              </p>
            )}
            {description && <p className="border-t border-line pt-4 leading-7 text-ink">{description}</p>}
            {place?.notes && (
              <p className="rounded-2xl bg-mist-200 px-4 py-3 text-sm text-ink dark:bg-mist-900/30 dark:text-mist-100">
                <span className="font-semibold">Your note:</span> {place.notes}
              </p>
            )}
          </div>

          {hasMap && !isMapExpanded && (
            <div className="relative mt-6 h-72 shrink-0 overflow-hidden rounded-2xl border border-line md:h-80">
              <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-ink-muted">Loading map…</div>}>
                <PlaceMap latitude={latitude} longitude={longitude} name={title} />
              </Suspense>
              <button
                type="button"
                onClick={() => setIsMapExpanded(true)}
                className="absolute right-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1.5 text-xs font-semibold text-ink shadow-lg transition hover:bg-surface-sunken"
              >
                <Maximize2 size={13} />
                Expand map
              </button>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-ink-faint">Reviews</h3>
                <span className="text-[11px] text-ink-faint">{reviewsSource === 'google' ? 'From Google' : 'Sample data for this prototype'}</span>
              </div>
              <ul className="space-y-3">
                {reviews.map((review) => (
                  <li key={`${review.author}-${review.date}`} className="rounded-2xl border border-line bg-surface px-4 py-3">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{review.author}</span>
                      <span className="flex items-center gap-2 text-xs text-ink-faint">
                        <Stars rating={review.rating} />
                        {('relative_time' in review && typeof review.relative_time === 'string' && review.relative_time) || formatReviewDate(review.date)}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-ink-muted">{review.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
            >
              <ExternalLink size={16} />
              Open in Google Maps
            </a>
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-sunken"
              >
                <Pencil size={15} />
                {action.label}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlaceFocusModal;
