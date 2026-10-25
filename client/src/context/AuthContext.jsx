import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const DEFAULT_STATIONS = [
  {
    id: 1,
    name: 'Mumbai Police HQ & Azad Maidan Police Station',
    station_code: 'MUM-AZAD-01',
    zone_division: 'Zone 1, South Region',
    jurisdiction_area_sq_km: 14.50,
    location: 'Mahapalika Marg, Dhobi Talao, Fort, Mumbai-400001',
    contact_details: '022-22620111 / controlroom@mahapolice.gov.in',
    lockup_capacity: 20,
    lockup_rooms: 'Cell 1 (General Male), Cell 2 (Remand), Cell 3 (High-Security)',
    evidence_vault_location: 'Azad Maidan Malkhana Vault Ground Floor Sector-A',
    evidence_vault_capacity: 150,
  },
  {
    id: 2,
    name: 'Bandra Police Station (Zone IX)',
    station_code: 'MUM-BND-09',
    zone_division: 'Zone 9, Western Region',
    jurisdiction_area_sq_km: 18.20,
    location: 'Hill Road, Bandra West, Mumbai-400050',
    contact_details: '022-26422222 / bandraps@mahapolice.gov.in',
    lockup_capacity: 15,
    lockup_rooms: 'Cell 1 (General Male), Female Lockup Cell 1, Cell 2 (Remand)',
    evidence_vault_location: 'Bandra Malkhana Vault Room 104',
    evidence_vault_capacity: 100,
  },
  {
    id: 3,
    name: 'Shivaji Nagar Police Station (Pune Zone I)',
    station_code: 'PUN-SHIV-01',
    zone_division: 'Pune City Zone 1',
    jurisdiction_area_sq_km: 22.00,
    location: 'Shivajinagar, Pune-411005',
    contact_details: '020-25532222 / shivajinagarps@punepolice.gov.in',
    lockup_capacity: 18,
    lockup_rooms: 'Secure Holding Cell A, Cell B (General Male), Cell C (Remand)',
    evidence_vault_location: 'Pune Malkhana Secure Bay Room 12',
    evidence_vault_capacity: 120,
  },
  {
    id: 4,
    name: 'Andheri Police Station (Zone-10)',
    station_code: 'MUM-AND-10',
    zone_division: 'Zone 10, Western Region',
    jurisdiction_area_sq_km: 16.80,
    location: 'Veera Desai Road, Andheri - West, Mumbai-400053',
    contact_details: '022-22558852 / andherips@mahagove.ps.in',
    lockup_capacity: 12,
    lockup_rooms: 'Cell 1 (General), Cell 2 (Holding)',
    evidence_vault_location: 'Andheri Malkhana Vault Bay 3',
    evidence_vault_capacity: 80,
  },
  {
    id: 5,
    name: 'Dadar Police Station',
    station_code: 'MUM-DAD-05',
    zone_division: 'Zone 5, Central Region',
    jurisdiction_area_sq_km: 11.40,
    location: 'Dadar West, Mumbai-400028',
    contact_details: '022-24220011 / dadarps@mahapolice.gov.in',
    lockup_capacity: 10,
    lockup_rooms: 'Cell 1 (General), Cell 2 (Custody)',
    evidence_vault_location: 'Dadar Malkhana Vault Room 101',
    evidence_vault_capacity: 60,
  },
];

export const DEFAULT_OFFICERS = [
  {
    id: 1,
    badge_number: 'MH-HQ-001',
    first_name: 'Asha',
    last_name: 'Kulkarni',
    rank_title: 'Director General of Police (DGP)',
    role: 'System-Admin',
    station_id: 1,
    station_name: 'Mumbai Police HQ & Azad Maidan Police Station',
    email: 'asha.kulkarni@mahapolice.gov.in',
    phone: '+91-9820112233',
  },
  {
    id: 2,
    badge_number: 'MH-MUM-101',
    first_name: 'Vikram',
    last_name: 'Shinde',
    rank_title: 'Senior Police Inspector (Sr. PI)',
    role: 'Head-Officer',
    station_id: 1,
    station_name: 'Mumbai Police HQ & Azad Maidan Police Station',
    email: 'vikram.shinde@mahapolice.gov.in',
    phone: '+91-9820223344',
  },
  {
    id: 3,
    badge_number: 'MH-MUM-102',
    first_name: 'Pravin',
    last_name: 'Deshmukh',
    rank_title: 'Assistant Commissioner of Police (ACP)',
    role: 'Head-Officer',
    station_id: 2,
    station_name: 'Bandra Police Station (Zone IX)',
    email: 'pravin.deshmukh@mahapolice.gov.in',
    phone: '+91-9820334455',
  },
  {
    id: 13,
    badge_number: 'MH-PUN-103',
    first_name: 'Vikram',
    last_name: 'Rane',
    rank_title: 'Deputy Commissioner of Police (DCP)',
    role: 'Head-Officer',
    station_id: 3,
    station_name: 'Shivaji Nagar Police Station (Zone I Pune)',
    email: 'vikram.rane@mahapolice.gov.in',
    phone: '+91-9820998877',
  },
  {
    id: 4,
    badge_number: 'MH-MUM-201',
    first_name: 'Sachin',
    last_name: 'Sawant',
    rank_title: 'Police Sub-Inspector (PSI - Crime Branch)',
    role: 'Officer',
    station_id: 1,
    station_name: 'Mumbai Police HQ & Azad Maidan Police Station',
    email: 'sachin.sawant@mahapolice.gov.in',
    phone: '+91-9820445566',
  },
  {
    id: 5,
    badge_number: 'MH-MUM-202',
    first_name: 'Ananya',
    last_name: 'Patil',
    rank_title: 'Assistant Police Inspector (API - Detection)',
    role: 'Officer',
    station_id: 2,
    station_name: 'Bandra Police Station (Zone IX)',
    email: 'ananya.patil@mahapolice.gov.in',
    phone: '+91-9820556677',
  },
  {
    id: 12,
    badge_number: 'MH-MUM-203',
    first_name: 'Priya',
    last_name: 'Kadam',
    rank_title: 'Assistant Commissioner of Police (ACP)',
    role: 'Officer',
    station_id: 2,
    station_name: 'Bandra Police Station (Zone IX)',
    email: 'priya.kadam@mahapolice.gov.in',
    phone: '+91-9820556688',
  },
  {
    id: 6,
    badge_number: 'MH-MUM-301',
    first_name: 'Ganesh',
    last_name: 'More',
    rank_title: 'Malkhana Incharge & Head Constable',
    role: 'Evidence-Manager',
    station_id: 1,
    station_name: 'Mumbai Police HQ & Azad Maidan Police Station',
    email: 'ganesh.more@mahapolice.gov.in',
    phone: '+91-9820667788',
  },
];

export function AuthProvider({ children }) {
  // Safe authentication state initialized strictly from localStorage session (no default bypass)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('phdms_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('phdms_token') || '');
  const [stations, setStations] = useState(DEFAULT_STATIONS);
  const [officers, setOfficers] = useState(() => {
    try {
      const saved = localStorage.getItem('phdms_officers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_OFFICERS;
  });
  const [stationFilter, setStationFilterState] = useState(() => {
    const savedStation = localStorage.getItem('phdms_station_filter');
    return savedStation || 'all';
  });
  const [loading, setLoading] = useState(false);

  // Fetch stations dynamically from MySQL backend
  const fetchStations = async () => {
    try {
      const res = await api.get('/stations');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setStations(res.data);
      }
    } catch (_) {
      // Retain fallback list if offline
    }
  };

  // Fetch officers dynamically from MySQL backend
  const fetchOfficers = async () => {
    try {
      const res = await api.get('/officers');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setOfficers(res.data);
        localStorage.setItem('phdms_officers', JSON.stringify(res.data));
      }
    } catch (_) {
      // Retain current officers list if offline
    }
  };

  useEffect(() => {
    fetchStations();
    fetchOfficers();
  }, [token, user?.id]);

  const addStationToState = (newStation) => {
    setStations((prev) => {
      const exists = prev.some((s) => s.id === newStation.id);
      if (exists) {
        return prev.map((s) => (s.id === newStation.id ? newStation : s));
      }
      return [...prev, newStation];
    });
  };

  const addOfficerToState = (newOfficer) => {
    setOfficers((prev) => {
      const exists = prev.some((o) => o.badge_number === newOfficer.badge_number || o.id === newOfficer.id);
      const updated = exists
        ? prev.map((o) => (o.badge_number === newOfficer.badge_number ? newOfficer : o))
        : [newOfficer, ...prev];
      localStorage.setItem('phdms_officers', JSON.stringify(updated));
      return updated;
    });
  };

  // Synchronize state with LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('phdms_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('phdms_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('phdms_token', token);
    } else {
      localStorage.removeItem('phdms_token');
    }
  }, [token]);

  // Set station filter with strict ABAC & precinct enforcement
  const setStationFilter = (stationId) => {
    // Only System-Admin can browse all stations statewide
    if (user?.role !== 'System-Admin') {
      const lockedId = String(user?.station_id || 1);
      setStationFilterState(lockedId);
      localStorage.setItem('phdms_station_filter', lockedId);
      return;
    }
    setStationFilterState(stationId);
    localStorage.setItem('phdms_station_filter', stationId);
  };

  // Enforce precinct lockdown whenever user changes
  useEffect(() => {
    if (user) {
      if (user.role === 'System-Admin') {
        const saved = localStorage.getItem('phdms_station_filter');
        setStationFilterState(saved || 'all');
      } else {
        const lockedId = String(user.station_id || 1);
        setStationFilterState(lockedId);
        localStorage.setItem('phdms_station_filter', lockedId);
      }
    }
  }, [user?.role, user?.station_id]);

  // Secure individual officer login via REST API
  const login = async (badge_number, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { badge_number, password });
      if (res && res.success && res.data) {
        const authenticatedOfficer = res.data.user || res.data.officer;
        setUser(authenticatedOfficer);
        setToken(res.data.token);

        // Set station jurisdiction according to rank & clearance
        if (authenticatedOfficer.role === 'System-Admin') {
          setStationFilter('all');
        } else {
          const precinctId = String(authenticatedOfficer.station_id || 1);
          setStationFilterState(precinctId);
          localStorage.setItem('phdms_station_filter', precinctId);
        }
        return { success: true };
      }
      return { success: false, message: res?.message || 'Invalid badge number or password.' };
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Authentication failed: Invalid credentials or network error.';
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Secure session logout
  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('phdms_user');
    localStorage.removeItem('phdms_token');
    localStorage.removeItem('phdms_station_filter');
    try {
      api.post('/auth/logout').catch(() => {});
    } catch (_) {}
  };

  const value = {
    user,
    token,
    stations,
    fetchStations,
    addStationToState,
    officers,
    fetchOfficers,
    addOfficerToState,
    stationFilter,
    setStationFilter,
    isAuthenticated: Boolean(user && token),
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
