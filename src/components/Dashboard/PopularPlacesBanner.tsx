import Sparkles from 'lucide-react/dist/esm/icons/sparkles.mjs';
import Star from 'lucide-react/dist/esm/icons/star.mjs';
import { categoryLabels, popularPlaces, type CatalogPlace } from '../../data/catalog';

type PopularPlacesBannerProps = {
  onSelectPlace: (place: CatalogPlace) => void;
  onPlanRegion: (region: string) => void;
};

const PopularPlacesBanner = ({ onSelectPlace, onPlanRegion }: PopularPlacesBannerProps) => (
  <section className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-mist-950 via-mist-900 to-mist-800 p-6 text-mist-50 shadow-xl shadow-mist-950/20 md:p-8">
    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-mist-700/30 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-mist-300/30 blur-3xl" />

    <div className="relative mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-mist-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
          <Sparkles size={14} />
          Popular right now in Malaysia
        </p>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Places travellers are adding to their boards</h2>
      </div>
      <p className="max-w-sm text-sm text-mist-100/80">
        Tap a place for reviews and a map, or start a trip in that region and drag it onto your board.
      </p>
    </div>

    <div className="relative -mx-2 flex snap-x gap-4 overflow-x-auto px-2 pb-2 [scrollbar-width:thin]">
      {popularPlaces.map((place) => (
        <article
          key={place.id}
          className="group w-56 shrink-0 snap-start overflow-hidden rounded-2xl bg-surface-raised text-ink shadow-lg shadow-mist-950/20 transition-transform hover:-translate-y-1"
        >
          <button type="button" onClick={() => onSelectPlace(place)} className="block w-full text-left" aria-label={`Open details for ${place.name}`}>
            <div className="aspect-[16/10] overflow-hidden bg-surface-sunken">
              <img src={place.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink-faint">{categoryLabels[place.category]} · {place.region}</p>
              <h3 className="truncate text-sm font-semibold">{place.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                <Star size={12} className="fill-accent text-accent" />
                {place.rating.toFixed(1)} · {place.reviewCount.toLocaleString()} reviews
              </p>
            </div>
          </button>
          <div className="border-t border-line px-4 py-2">
            <button
              type="button"
              onClick={() => onPlanRegion(place.region)}
              className="text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              Plan a trip in {place.region} →
            </button>
          </div>
        </article>
      ))}
    </div>
  </section>
);

export default PopularPlacesBanner;
