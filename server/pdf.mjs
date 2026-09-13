import PDFDocument from 'pdfkit';

const margin = 56;
const ink = '#1b2559';
const inkMuted = '#5b6591';
const primary = '#4f6bd8';
const accent = '#7f9bf2';

const transportSpeeds = { walk: 4.5, train: 55, bus: 22, car: 38 };
const transportLabels = { walk: 'Walk', train: 'Train', bus: 'Bus', car: 'Car' };

const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
};

const toRadians = (degrees) => (degrees * Math.PI) / 180;

// Mirrors src/utils/routeEstimate.ts so the PDF and the board agree on leg estimates.
const haversineKm = (from, to) => {
  if (from.latitude == null || from.longitude == null || to.latitude == null || to.longitude == null) return null;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
};

const estimateMinutes = (distanceKm, mode) => {
  if (distanceKm === null) return null;
  const buffer = mode === 'walk' ? 0 : mode === 'car' ? 5 : 10;
  return Math.max(1, Math.round(((distanceKm * 1.25) / (transportSpeeds[mode] ?? 30)) * 60 + buffer));
};

const formatDuration = (minutes) => {
  if (minutes === null) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

const formatDistance = (distanceKm) => {
  if (distanceKm === null) return null;
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
};

// Mirrors orderPlacesByLinks in src/utils/boardGraph.ts.
const orderPlacesByLinks = (places, links) => {
  const placeById = new Map(places.map((place) => [place.id, place]));
  const outgoing = new Map();
  const incomingCount = new Map();

  for (const link of links) {
    if (!placeById.has(link.source_place_id) || !placeById.has(link.target_place_id)) continue;
    outgoing.set(link.source_place_id, [...(outgoing.get(link.source_place_id) ?? []), link]);
    incomingCount.set(link.target_place_id, (incomingCount.get(link.target_place_id) ?? 0) + 1);
  }

  const ordered = [];
  const visited = new Set();
  const visit = (id) => {
    if (visited.has(id)) return;
    visited.add(id);
    const place = placeById.get(id);
    if (!place) return;
    ordered.push(place);
    for (const link of outgoing.get(id) ?? []) visit(link.target_place_id);
  };

  const byCreated = [...places].sort((first, second) => first.created_at.localeCompare(second.created_at));
  for (const place of byCreated) {
    if ((incomingCount.get(place.id) ?? 0) === 0) visit(place.id);
  }
  for (const place of byCreated) visit(place.id);
  return ordered;
};

const ensureSpace = (doc, height = 80) => {
  if (doc.y + height > doc.page.height - margin) {
    doc.addPage();
  }
};

const formatTime = (value) => {
  if (!value) return null;
  const [hours = '0', minutes = '00'] = value.split(':');
  const hour = Number(hours);
  const suffix = hour >= 12 ? 'pm' : 'am';
  return `${((hour + 11) % 12) + 1}:${minutes} ${suffix}`;
};

export const streamTripPdf = (res, data) => {
  const { trip, places, links, owner = null, photos = new Map() } = data;
  const doc = new PDFDocument({ size: 'A4', margin });

  doc.pipe(res);

  doc.rect(0, 0, doc.page.width, 8).fill(primary);
  doc.moveDown(0.5);
  doc.fontSize(26).fillColor(ink).text(trip.destination, { lineGap: 3 });
  doc.moveDown(0.25);
  doc.fontSize(11).fillColor(inkMuted).text([
    trip.region,
    `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`,
    owner?.full_name ? `by ${owner.full_name}` : null,
  ].filter(Boolean).join('  ·  '));
  if (trip.description) {
    doc.moveDown(0.75);
    doc.fontSize(12).fillColor(inkMuted).text(trip.description, { lineGap: 4 });
  }

  doc.moveDown(1.2);
  doc.fontSize(10).fillColor(inkMuted).text('ROUTE', { characterSpacing: 1.4 });
  doc.moveDown(0.45);

  const ordered = orderPlacesByLinks(places, links);
  if (ordered.length === 0) {
    doc.fontSize(11).fillColor(inkMuted).text('No places on this board yet.');
  }

  const printed = [];
  ordered.forEach((place, index) => {
    ensureSpace(doc, 110);

    const incoming = links.find((link) => link.target_place_id === place.id && printed.includes(link.source_place_id));
    if (incoming) {
      const source = places.find((item) => item.id === incoming.source_place_id);
      const distanceKm = haversineKm(source, place);
      const legParts = [
        `by ${transportLabels[incoming.transport_mode] ?? incoming.transport_mode}`,
        formatDuration(estimateMinutes(distanceKm, incoming.transport_mode)) && `~${formatDuration(estimateMinutes(distanceKm, incoming.transport_mode))}`,
        formatDistance(distanceKm),
      ].filter(Boolean);
      doc.fontSize(10).fillColor(accent).text(`↓  from ${source.label ?? source.name}  ·  ${legParts.join('  ·  ')}`, { indent: 18 });
      doc.moveDown(0.4);
    } else if (index > 0) {
      doc.fontSize(10).fillColor(inkMuted).text('—  new branch', { indent: 18 });
      doc.moveDown(0.4);
    }

    const photo = photos.get(place.id);
    const textStart = doc.y;
    const textIndent = photo ? 78 : 0;
    if (photo) {
      try {
        doc.image(photo, margin, textStart, { fit: [64, 48], align: 'center', valign: 'center' });
      } catch {
        // A bad image should never break the export.
      }
    }

    const title = place.label ? `${place.label}  (${place.name})` : place.name;
    doc.fontSize(14).fillColor(ink).text(`${index + 1}. ${title}`, margin + textIndent, textStart, { width: doc.page.width - margin * 2 - textIndent });
    const schedule = [place.day_number ? `Day ${place.day_number}` : null, formatTime(place.start_time)].filter(Boolean).join(' · ');
    const meta = [schedule, place.address, place.rating ? `${Number(place.rating).toFixed(1)} ★` : null].filter(Boolean).join('  ·  ');
    if (meta) {
      doc.fontSize(10).fillColor(inkMuted).text(meta, margin + textIndent + 18, doc.y, { width: doc.page.width - margin * 2 - textIndent - 18 });
    }
    if (place.notes) {
      doc.fontSize(10).fillColor(ink).text(place.notes, margin + textIndent + 18, doc.y, { width: doc.page.width - margin * 2 - textIndent - 18, lineGap: 2 });
    }
    if (photo && doc.y < textStart + 52) doc.y = textStart + 52;
    doc.x = margin;
    doc.moveDown(0.7);
    printed.push(place.id);
  });

  doc.moveDown(1);
  doc.x = margin;
  doc.fontSize(9).fillColor(inkMuted).text(`Generated by TravelPlanner · ${new Date().toLocaleDateString('en-MY')} · Leg times are rough estimates.${photos.size ? ' Photos © Google and their contributors.' : ''}`);

  doc.end();
};
