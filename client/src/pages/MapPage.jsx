import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import CrimeMap from '../components/map/CrimeMap';
import { MapPin, Navigation, Filter, Layers, RefreshCw } from 'lucide-react';

const INITIAL_INCIDENTS = [
  {
    id: 1,
    fir_number: 'FIR-2026-001',
    crime_type: 'Armed Dacoity (IPC 395/397)',
    description: 'Four armed assailants entered Tribhovandas Zaveri jewelry showroom.',
    latitude: 18.9502,
    longitude: 72.8318,
    station_id: 1,
    station_name: 'Azad Maidan HQ',
    priority: 'Critical',
  },
  {
    id: 2,
    fir_number: 'FIR-2026-002',
    crime_type: 'Vehicle Theft (IPC 379)',
    description: 'Toyota Fortuner stolen from outside Hotel Trident.',
    latitude: 18.9256,
    longitude: 72.8242,
    station_id: 1,
    station_name: 'Azad Maidan HQ',
    priority: 'High',
  },
  {
    id: 3,
    fir_number: 'FIR-2026-003',
    crime_type: 'Cyber Extortion (IT Act 66D)',
    description: 'Corporate ransomware locking accounting servers demanding 15 Bitcoin.',
    latitude: 19.0657,
    longitude: 72.8687,
    station_id: 2,
    station_name: 'Bandra Police Stn',
    priority: 'High',
  },
  {
    id: 4,
    fir_number: 'FIR-2026-004',
    crime_type: 'Narcotics Trafficking (NDPS 21/22)',
    description: 'Nakabandi vehicle check intercepted Hyundai Verna carrying 450g Mephedrone.',
    latitude: 19.0553,
    longitude: 72.8420,
    station_id: 2,
    station_name: 'Bandra Police Stn',
    priority: 'Medium',
  },
  {
    id: 5,
    fir_number: 'FIR-2026-005',
    crime_type: 'Homicide (IPC 302)',
    description: 'Unidentified male corpse recovered floating near Sassoon Docks jetty.',
    latitude: 18.9135,
    longitude: 72.8245,
    station_id: 1,
    station_name: 'Azad Maidan HQ',
    priority: 'Critical',
  },
  {
    id: 6,
    fir_number: 'FIR-2026-006',
    crime_type: 'Arms Act Violation (Sec 25)',
    description: 'Unregistered foreign pistols seized during raid.',
    latitude: 18.5308,
    longitude: 73.8475,
    station_id: 3,
    station_name: 'Shivaji Nagar Police Station, Pune',
    priority: 'High',
  },
];

export default function MapPage() {
  const { user, stationFilter } = useAuth();
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchIncidents() {
      setLoading(true);
      try {
        const queryParam = stationFilter !== 'all' ? `?station_id=${stationFilter}` : '';
        const res = await api.get(`/fir${queryParam}`);
        if (isMounted && res.success && res.data && res.data.length > 0) {
          const mapped = res.data.map((f) => ({
            id: f.id,
            fir_number: f.fir_number,
            crime_type: f.crime_type,
            description: f.description,
            latitude: parseFloat(f.latitude),
            longitude: parseFloat(f.longitude),
            station_id: f.station_id,
            station_name: f.station_name,
            priority: f.crime_type.includes('Dacoity') || f.crime_type.includes('Homicide') ? 'Critical' : 'High',
          }));
          setIncidents(mapped);
        }
      } catch (_) {
        if (isMounted) setIncidents(INITIAL_INCIDENTS);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchIncidents();
    return () => { isMounted = false; };
  }, [stationFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide uppercase font-sans flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <span>Crime Incident GIS Geospatial Map (Leaflet.js)</span>
          </h2>
          <p className="text-xs text-hq-muted mt-1">
            Real-time GPS incident pinning with precinct jurisdictional boundary radii (WGS-84)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-hq-border text-xs text-blue-400 font-mono font-bold">
            Incidents Plotted: {incidents.length}
          </span>
        </div>
      </div>

      {/* Interactive Map Component */}
      <CrimeMap incidents={incidents} selectedStation={stationFilter} />
    </div>
  );
}
