import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { admin } = useAuth();
  const location = useLocation();
  const isPublicForm = ['/employee-registry', '/cl-registry'].includes(location.pathname);
  const shouldShowSidebar = !isPublicForm || admin;

  return (
    <div className="flex h-screen overflow-hidden bg-obsidian-950 relative">
      {shouldShowSidebar && <Sidebar />}
      <main className="flex-1 overflow-y-auto bg-transparent">
        <div className="min-h-full p-6 md:p-8 page-enter relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
