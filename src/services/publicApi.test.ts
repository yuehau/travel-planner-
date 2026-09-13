import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadTripPdf, fetchConfig, fetchSharedBoard, googlePhotoUrl, pdfFilenameFor, resetConfigCache, uploadSharedSnapshot } from './publicApi';
import type { Trip } from '../types/database';

const trip: Trip = {
  id: 't1',
  user_id: 'u1',
  destination: 'KL City Lights',
  region: 'Kuala Lumpur',
  cover_image: null,
  start_date: '2026-11-06',
  end_date: '2026-11-09',
  description: null,
  status: 'draft',
  share_token: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

const jsonResponse = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
  ...init,
});

describe('publicApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetConfigCache();
  });

  it('builds photo URLs and PDF filenames', () => {
    expect(googlePhotoUrl('kl-batu-caves', 480)).toBe('/api/catalog/kl-batu-caves/photo?w=480');
    expect(pdfFilenameFor(trip)).toBe('travel-plan-kl-city-lights.pdf');
  });

  it('caches the config lookup and defaults to no photos on failure', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ googlePhotos: true }));
    await expect(fetchConfig()).resolves.toEqual({ googlePhotos: true });
    await expect(fetchConfig()).resolves.toEqual({ googlePhotos: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resetConfigCache();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await expect(fetchConfig()).resolves.toEqual({ googlePhotos: false });
  });

  it('returns null for unknown share tokens and uploads snapshots', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ message: 'nope' }, { status: 404 }))
      .mockResolvedValueOnce(jsonResponse({ token: 'abc' }, { status: 201 }));

    await expect(fetchSharedBoard('missing')).resolves.toBeNull();
    await expect(uploadSharedSnapshot({ trip, places: [], links: [], owner: { full_name: 'Demo', avatar_url: null } })).resolves.toEqual({ token: 'abc' });
    expect(fetchMock).toHaveBeenLastCalledWith('/api/shared', expect.objectContaining({ method: 'POST' }));
  });

  it('posts the board to the PDF endpoint and saves the file', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new Blob(['%PDF']), { status: 200, headers: { 'Content-Type': 'application/pdf' } }));
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.fn();
    const link: Record<string, unknown> = { click, remove };
    // The test runs in Node, so provide the tiny DOM surface the download helper touches.
    vi.stubGlobal('document', { createElement: () => link, body: { appendChild } });
    const createObjectURL = vi.fn(() => 'blob:pdf');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL, revokeObjectURL }));

    await downloadTripPdf({ trip, places: [], links: [] });

    expect(fetchMock).toHaveBeenCalledWith('/api/export/pdf', expect.objectContaining({ method: 'POST' }));
    expect(link.download).toBe('travel-plan-kl-city-lights.pdf');
    expect(appendChild).toHaveBeenCalledWith(link);
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:pdf');
    vi.unstubAllGlobals();
  });
});
