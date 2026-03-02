import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { DayPlan } from '../../types/itinerary';
import { DAY_COLORS } from '../../utils/constants';
import { useUIStore } from '../../store/uiStore';

// Fix default marker icon issue with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

function createNumberedIcon(number: number, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background-color: ${color};
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FitBounds({ days }: { days: DayPlan[] }) {
  const map = useMap();

  useEffect(() => {
    const allCoords: [number, number][] = [];
    days.forEach((day) => {
      day.activities.forEach((a) => {
        if (a.lat && a.lng) allCoords.push([a.lat, a.lng]);
      });
    });
    if (allCoords.length > 0) {
      map.fitBounds(allCoords, { padding: [30, 30] });
    }
  }, [days, map]);

  return null;
}

function ThemeTileLayer() {
  const theme = useUIStore((s) => s.theme);
  const map = useMap();

  // Determine if dark mode
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const url = isDark ? TILE_URLS.dark : TILE_URLS.light;

  // Force re-render tile layer when theme changes
  useEffect(() => {
    map.invalidateSize();
  }, [isDark, map]);

  return (
    <TileLayer
      key={isDark ? 'dark' : 'light'}
      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      url={url}
    />
  );
}

interface Props {
  itinerary: DayPlan[];
}

export default function TripMap({ itinerary }: Props) {
  const selectedDay = useUIStore((s) => s.selectedDay);
  const setSelectedActivity = useUIStore((s) => s.setSelectedActivity);

  const daysToShow =
    selectedDay !== null ? [itinerary[selectedDay]] : itinerary;

  return (
    <MapContainer
      center={[48.8566, 2.3522]}
      zoom={13}
      className="h-full w-full rounded-xl"
    >
      <ThemeTileLayer />
      <FitBounds days={daysToShow} />

      {daysToShow.map((day) => {
        const color = DAY_COLORS[(day.day_number - 1) % DAY_COLORS.length];
        const positions = day.activities
          .filter((a) => a.lat && a.lng)
          .map((a) => [a.lat, a.lng] as [number, number]);

        return (
          <span key={day.day_number}>
            {positions.length > 1 && (
              <Polyline
                positions={positions}
                pathOptions={{ color, weight: 3, opacity: 0.7, dashArray: '8 4' }}
              />
            )}
            {day.activities.map((activity, actIdx) =>
              activity.lat && activity.lng ? (
                <Marker
                  key={`${day.day_number}-${actIdx}`}
                  position={[activity.lat, activity.lng]}
                  icon={createNumberedIcon(actIdx + 1, color)}
                  eventHandlers={{
                    click: () =>
                      setSelectedActivity({
                        dayIdx: day.day_number - 1,
                        actIdx,
                      }),
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>{activity.name}</strong>
                      <br />
                      {activity.start_time} - {activity.end_time}
                      <br />
                      {activity.category} | ${activity.cost_estimate_usd}
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}
          </span>
        );
      })}
    </MapContainer>
  );
}
