import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';

type PlaceMapProps = {
  latitude: number;
  longitude: number;
  name: string;
};

/** Leaflet map for one place. Loaded lazily so Leaflet stays out of the main bundle. */
const PlaceMap = ({ latitude, longitude, name }: PlaceMapProps) => (
  <MapContainer center={[latitude, longitude]} zoom={14} className="h-full w-full" scrollWheelZoom={false}>
    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <CircleMarker center={[latitude, longitude]} radius={10} pathOptions={{ color: '#28536b', fillColor: '#c2948a', fillOpacity: 0.9, weight: 3 }}>
      <Popup>{name}</Popup>
    </CircleMarker>
  </MapContainer>
);

export default PlaceMap;
