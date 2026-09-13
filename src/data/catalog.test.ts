import { describe, expect, it } from 'vitest';
import { catalogPlaces, catalogRegions, getCatalogPlace, placeInputFromCatalog, popularPlaces, regionCoverImage, searchCatalog } from './catalog';

// Vite resolves the glob at transform time, so this lists the committed illustrations.
const illustrations = new Set(
  Object.keys(import.meta.glob('../../public/{places,regions,news}/*.svg')).map((path) => path.replace('../../public', '')),
);

describe('malaysia catalog', () => {
  it('has unique ids and a generated illustration for every place', () => {
    expect(catalogPlaces.length).toBeGreaterThanOrEqual(80);
    expect(new Set(catalogPlaces.map((place) => place.id)).size).toBe(catalogPlaces.length);
    for (const place of catalogPlaces) {
      expect(illustrations.has(place.image)).toBe(true);
      expect(place.reviews.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('covers every region with a cover illustration', () => {
    expect(catalogRegions).toHaveLength(13);
    for (const region of catalogRegions) {
      expect(catalogPlaces.filter((place) => place.region === region).length).toBeGreaterThanOrEqual(3);
      expect(illustrations.has(regionCoverImage(region))).toBe(true);
    }
    expect(regionCoverImage('Cameron Highlands')).toBe('/regions/cameron-highlands.svg');
  });

  it('searches by name, city, vibe and filters', () => {
    expect(searchCatalog('petronas').map((place) => place.id)).toEqual(['kl-petronas-towers']);
    expect(searchCatalog('george town').every((place) => place.region === 'Penang')).toBe(true);
    expect(searchCatalog('sunset').length).toBeGreaterThan(3);
    expect(searchCatalog('', { region: 'Langkawi' }).every((place) => place.region === 'Langkawi')).toBe(true);
    expect(searchCatalog('', { category: 'cafe' }).every((place) => place.category === 'cafe')).toBe(true);
    expect(searchCatalog('zzz-nothing')).toEqual([]);
  });

  it('exposes popular places for the dashboard banner', () => {
    expect(popularPlaces.length).toBeGreaterThanOrEqual(8);
    expect(popularPlaces.every((place) => place.popular)).toBe(true);
  });

  it('snapshots a catalog place into a board place input', () => {
    const place = getCatalogPlace('lk-sky-bridge');
    if (!place) throw new Error('missing');
    expect(placeInputFromCatalog(place, { x: 12.7, y: 99.2 })).toMatchObject({
      name: 'Langkawi Sky Bridge',
      catalog_id: 'lk-sky-bridge',
      source: 'catalog',
      photo_url: '/places/lk-sky-bridge.svg',
      position_x: 13,
      position_y: 99,
    });
    expect(getCatalogPlace('nope')).toBeNull();
    expect(getCatalogPlace(null)).toBeNull();
  });
});
