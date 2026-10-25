import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PriorityBadge } from '../common/StatusBadge';
import { Navigation, MapPin, Calendar, User } from 'lucide-react';

// Custom glowing vector markers for law enforcement incident mapping
const createIncidentIcon = (priority) => {
  const p = (priority || 'Medium').toLowerCase();
  const color =
    p === 'critical' ? '#ef4444' : p === 'high' ? '#f59e0b' : '#3b82f6';

  return L.divIcon({
    className: 'custom-police-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 0 12px ${color}, 0 0 4px #000000;
        cursor: pointer;
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
};

// Precinct Jurisdiction Headquarters & Boundary definitions
const PRECINCT_BOUNDARIES = [
  {
    id: 1,
    name: 'Mumbai HQ & Azad Maidan (Zone I)',
    center: [18.9502, 72.8318],
    radius: 3200,
    color: '#3b82f6',
    head: 'Addl. CP Asha Kulkarni',
  },
  {
    id: 2,
    name: 'Bandra Police Station (Zone IX)',
    center: [19.0553, 72.842],
    radius: 3800,
    color: '#8b5cf6',
    head: 'Sr. PI Vikram Shinde',
  },
  {
    id: 3,
    name: 'Shivaji Nagar Police Station (Pune Central)',
    center: [18.5308, 73.8475],
    radius: 4200,
    color: '#10b981',
    head: 'Inspector S. V. Mahajan',
  },
  {
    id: 4,
    name: 'Andheri Police Station (Zone-1)',
    center: [19.1197, 72.8464],
    radius: 3600,
    color: '#f59e0b',
    head: 'Inspector Andheri Division',
  },
];

// Map Pan/Zoom Updater Hook
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function CrimeMap({ incidents, selectedStation = 'all' }) {
  // Determine appropriate center and zoom based on station filter
  let mapCenter = [18.9502, 72.8318]; // Default Mumbai
  let mapZoom = 12;

  if (selectedStation === '1') {
    mapCenter = [18.9400, 72.8300];
    mapZoom = 14;
  } else if (selectedStation === '2') {
    mapCenter = [19.0553, 72.8420];
    mapZoom = 14;
  } else if (selectedStation === '3') {
    mapCenter = [18.5308, 73.8475];
    mapZoom = 13;
  } else if (selectedStation === '4') {
    mapCenter = [19.1197, 72.8464];
    mapZoom = 14;
  }

  const filteredIncidents =
    selectedStation === 'all'
      ? incidents
      : incidents.filter((inc) => String(inc.station_id) === String(selectedStation));

  const filteredPrecincts =
    selectedStation === 'all'
      ? PRECINCT_BOUNDARIES
      : PRECINCT_BOUNDARIES.filter((p) => String(p.id) === String(selectedStation));

  return (
    <div className="w-full h-[520px] rounded-xl overflow-hidden border border-hq-border shadow-lg relative bg-hq-bg">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ minHeight: '100%', background: '#0b0f19' }}
      >
        <ChangeMapView center={mapCenter} zoom={mapZoom} />

        {/* High-Contrast CARTO Dark Matter Tiles with authenticated key */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${import.meta.env.VITE_CARTO_API_KEY || 'cb1_4ttt_1_0174f4a43439f5e5c8cca861'}`}
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Precinct Jurisdiction Boundary Radii */}
        {filteredPrecincts.map((precinct) => (
          <Circle
            key={precinct.id}
            center={precinct.center}
            radius={precinct.radius}
            pathOptions={{
              color: precinct.color,
              fillColor: precinct.color,
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '4, 6',
            }}
          />
        ))}

        {/* Crime Incident Markers */}
        {filteredIncidents.map((inc) => {
          const lat = parseFloat(inc.latitude || inc.coords?.split(',')[0]);
          const lng = parseFloat(inc.longitude || inc.coords?.split(',')[1]);

          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={inc.id}
              position={[lat, lng]}
              icon={createIncidentIcon(inc.priority || 'Medium')}
            >
              <Popup className="police-incident-popup">
                <div className="p-1 min-w-[220px] text-xs font-sans text-slate-900 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-mono font-bold text-blue-700">
                      {inc.fir_number || `INC-${inc.id}`}
                    </span>
                    <span className="font-bold text-[10px] uppercase text-red-600">
                      {inc.priority || 'Active'}
                    </span>
                  </div>

                  <p className="font-bold text-slate-800 text-xs">
                    {inc.crime_type}
                  </p>

                  <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                    {inc.description || inc.title}
                  </p>

                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{inc.station_name || inc.station}</span>
                    <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 backdrop-blur-sm border border-hq-border rounded-lg p-3 text-[11px] text-hq-muted shadow-xl space-y-1.5">
        <span className="font-bold text-white uppercase text-[10px] tracking-wider block mb-1">
          Crime Severity
        </span>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span>
          <span className="text-slate-300">Critical (Homicide, Dacoity)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span>
          <span className="text-slate-300">High (Narcotics, Ransomware)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span>
          <span className="text-slate-300">Medium (Theft, Burglary)</span>
        </div>
      </div>
    </div>
  );
}
