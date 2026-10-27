import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';

// Pages
import DashboardPage from '../pages/DashboardPage';
import CasesPage from '../pages/CasesPage';
import FIRPage from '../pages/FIRPage';
import CriminalsPage from '../pages/CriminalsPage';
import EvidencePage from '../pages/EvidencePage';
import LegalPage from '../pages/LegalPage';
import MapPage from '../pages/MapPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import AuditPage from '../pages/AuditPage';
import StationsPage from '../pages/StationsPage';
import OfficersPage from '../pages/OfficersPage';
import LoginPage from '../pages/LoginPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Officer Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Law Enforcement Command Center */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="firs" element={<FIRPage />} />
        <Route path="criminals" element={<CriminalsPage />} />
        <Route path="evidence" element={<EvidencePage />} />
        <Route path="legal" element={<LegalPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        
        {/* System Administration & Personnel */}
        <Route
          path="stations"
          element={
            <ProtectedRoute allowedRoles={['System-Admin']}>
              <StationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="officers"
          element={
            <ProtectedRoute allowedRoles={['System-Admin', 'Head-Officer']}>
              <OfficersPage />
            </ProtectedRoute>
          }
        />

        {/* Audit Trail & Live SQL Execution Log */}
        <Route
          path="audit"
          element={
            <ProtectedRoute>
              <AuditPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
