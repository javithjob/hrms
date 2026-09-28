import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { EmployeeVisibilityProvider } from './context/EmployeeVisibilityContext';
import AttendancePage from './pages/AttendancePage';
import EmployeeRegistry from './pages/EmployeeRegistry';
import EmployeesPage from './pages/EmployeesPage';
import LoginPage from './pages/LoginPage';
import PayrollPage from './pages/PayrollPage';
import LeavePortal from './pages/LeavePortal';
import Administration from './pages/Administration';

export default function App() {
  return (
    <AuthProvider>
      <EmployeeVisibilityProvider>
        <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid rgba(63, 103, 117, 0.14)',
              borderRadius: '18px',
              boxShadow: '0 18px 36px rgba(47, 67, 77, 0.12)',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#355664', secondary: '#ffffff' } },
            error: { iconTheme: { primary: '#a95549', secondary: '#ffffff' } },
          }}
        />

        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={<Layout />}>
            {/* Public Registry Routes */}
            <Route path="employee-registry" element={<EmployeeRegistry />} />
            <Route path="cl-registry" element={<LeavePortal />} />

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="administration" element={<Administration />} />
              <Route index element={<Navigate to="/employees" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </EmployeeVisibilityProvider>
  </AuthProvider>
  );
}
