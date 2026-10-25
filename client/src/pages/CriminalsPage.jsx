import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import NewCriminalModal from '../components/criminals/NewCriminalModal';
import { Users, Search, Plus, CheckCircle2, ShieldAlert } from 'lucide-react';

const INITIAL_CRIMINALS = [
  {
    id: 1,
    first_name: 'Raju',
    last_name: 'Gaikwad',
    alias: 'Chhota Raju',
    dob: '1987-05-14',
    gender: 'Male',
    physical_description: 'Trident (Trishul) tattoo on right wrist, deep scar near left ear, walks with slight swagger.',
    station_id: 1,
    station_name: 'Azad Maidan HQ',
    status: 'In Custody (Lockup 2)',
    linked_case: 'CASE-2026-001 (Zaveri Bazaar Dacoity)',
  },
  {
    id: 2,
    first_name: 'Munna',
    last_name: 'Qureshi',
    alias: 'Munna Supari',
    dob: '1982-11-20',
    gender: 'Male',
    physical_description: 'Gold tooth in upper jaw, thick mustache, limps slightly on left leg from old bullet wound.',
    station_id: 1,
    station_name: 'Azad Maidan HQ',
    status: 'Active Warrant (WAR-2026-001)',
    linked_case: 'CASE-2026-002 (Nariman Point Vehicle Syndicate)',
  },
  {
    id: 3,
    first_name: 'Sunita',
    last_name: 'Jadhav',
    alias: 'Mami',
    dob: '1991-03-12',
    gender: 'Female',
    physical_description: 'Small black mole on right cheek, prominent silver ring on left thumb, fair complexion.',
    station_id: 2,
    station_name: 'Bandra Police Stn',
    status: 'Bail Granted (₹75,000)',
    linked_case: 'CASE-2026-004 (Bandra WEH Drug Consignment)',
  },
  {
    id: 4,
    first_name: 'Sameer',
    last_name: 'Merchant',
    alias: 'Hacker Sam',
    dob: '1995-08-22',
    gender: 'Male',
    physical_description: 'Wears spectacles, burns scar on forearm, operates darknet crypto laundering.',
    station_id: 2,
    station_name: 'Bandra Police Stn',
    status: 'Under Investigation',
    linked_case: 'CASE-2026-003 (BKC Corporate Ransomware)',
  },
  {
    id: 5,
    first_name: 'Sanjay',
    last_name: 'Gaikwad',
    alias: 'Hathoda',
    dob: '1980-04-18',
    gender: 'Male',
    physical_description: 'Heavily built, missing tip of left index finger, multiple assault charges.',
    station_id: 1,
    station_name: 'Azad Maidan HQ',
    status: 'Under Investigation',
    linked_case: 'CASE-2026-005 (Sassoon Docks Homicide)',
  },
];

export default function CriminalsPage() {
  const { user, stationFilter } = useAuth();
  const [criminals, setCriminals] = useState(INITIAL_CRIMINALS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Authorized roles for registering suspects: System-Admin, Head-Officer, Officer
  const canAddCriminal = user?.role === 'System-Admin' || user?.role === 'Head-Officer' || user?.role === 'Officer';

  useEffect(() => {
    let isMounted = true;
    async function fetchCriminals() {
      setLoading(true);
      try {
        const queryParam = stationFilter !== 'all' ? `?station_id=${stationFilter}` : '';
        const res = await api.get(`/criminals${queryParam}`);
        if (isMounted && res.success && res.data) {
          setCriminals(res.data);
        }
      } catch (_) {
        if (isMounted) {
          const filtered = stationFilter === 'all'
            ? INITIAL_CRIMINALS
            : INITIAL_CRIMINALS.filter((c) => String(c.station_id) === String(stationFilter));
          setCriminals(filtered);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchCriminals();
    return () => { isMounted = false; };
  }, [stationFilter]);

  const handleCriminalCreated = (newCriminal) => {
    setCriminals((prev) => [
      {
        ...newCriminal,
        station_id: user?.station_id || 1,
        station_name: user?.station_name || 'Azad Maidan HQ',
        status: 'Profile Created',
      },
      ...prev,
    ]);
    setToastMessage(`Criminal profile for ${newCriminal.first_name} ${newCriminal.last_name} registered.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const filteredCriminals = (stationFilter === 'all'
    ? criminals
    : criminals.filter((c) => String(c.station_id) === String(stationFilter))
  ).filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.first_name?.toLowerCase().includes(term) ||
      c.last_name?.toLowerCase().includes(term) ||
      c.alias?.toLowerCase().includes(term) ||
      c.physical_description?.toLowerCase().includes(term) ||
      c.linked_case?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center space-x-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide uppercase font-sans flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>Criminal Dossiers & Identification Records</span>
          </h2>
          <p className="text-xs text-hq-muted mt-1">
            Suspect Profiles, Distinctive Marks & Case Involvement • Full-Text Index: <code className="text-blue-400">ft_criminal_search</code>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-64 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
            <input
              type="text"
              placeholder="Search alias, marks, tattoo, case..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          {/* Only authorized roles (System-Admin, Head-Officer, Officer) see Register Suspect */}
          {canAddCriminal && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register Suspect</span>
            </button>
          )}
        </div>
      </div>

      {/* Criminal Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCriminals.map((c) => (
          <div
            key={c.id}
            className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm hover:border-blue-500/50 transition flex flex-col justify-between"
          >
            <div>
              {/* Profile Header */}
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl text-blue-400 shadow-inner">
                  👤
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm truncate">
                      {c.first_name} {c.last_name}
                    </h3>
                    {c.threat_level && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.threat_level.includes('Critical')
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : c.threat_level === 'High'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {c.threat_level}
                      </span>
                    )}
                  </div>
                  {c.alias && (
                    <p className="text-xs text-amber-400 font-semibold font-mono">
                      Alias: "{c.alias}"
                    </p>
                  )}
                  {c.father_name && (
                    <p className="text-[11px] text-slate-400">
                      S/o: {c.father_name}
                    </p>
                  )}
                  <p className="text-[11px] text-blue-400">
                    Precinct: {c.station_name || 'State Command'}
                  </p>
                </div>
              </div>

              {/* Legal & Intelligence Dossier */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 mb-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">Gang Syndicate</span>
                  <span className="text-white font-medium truncate block">{c.gang_affiliation || 'Independent'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Prior Convictions</span>
                  <span className="text-amber-400 font-bold font-mono">{c.prior_convictions_count ?? 0} priors</span>
                </div>
                {c.fingerprint_id && (
                  <div>
                    <span className="text-slate-500 block text-[10px]">AFIS Fingerprint</span>
                    <span className="text-blue-300 font-mono text-[10px]">{c.fingerprint_id}</span>
                  </div>
                )}
                {c.known_territory && (
                  <div>
                    <span className="text-slate-500 block text-[10px]">Known Adda</span>
                    <span className="text-slate-300 truncate block">{c.known_territory}</span>
                  </div>
                )}
              </div>

              {/* Physical Identification Box */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-1 mb-3">
                <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                  Identification Traits:
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {c.physical_description || 'No distinctive identification marks logged.'}
                </p>
              </div>

              {/* Linked Case & ID Proof */}
              <div className="text-[11px] text-hq-muted flex justify-between">
                <span><span className="font-semibold text-slate-400">Case:</span> {c.linked_case || 'Pending linkage'}</span>
                {c.id_proof_number && (
                  <span className="font-mono text-slate-400">{c.id_proof_number}</span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 mt-3 border-t border-hq-border flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-red-400">
                {c.status || 'Active Suspect'}
              </span>
              <button
                onClick={() =>
                  alert(
                    `Criminal Dossier Inspector:\nName: ${c.first_name} ${c.last_name} (${c.alias || 'No alias'})\nPhysical: ${c.physical_description}\nCase: ${c.linked_case || 'None'}`
                  )
                }
                className="text-blue-400 hover:text-blue-300 font-semibold text-xs transition"
              >
                View Dossier →
              </button>
            </div>
          </div>
        ))}

        {filteredCriminals.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-hq-border rounded-xl">
            <p className="text-xs text-hq-muted">
              No criminal dossiers found in current precinct jurisdiction.
            </p>
          </div>
        )}
      </div>

      {/* New Criminal Registration Modal */}
      <NewCriminalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCriminalCreated={handleCriminalCreated}
      />
    </div>
  );
}
