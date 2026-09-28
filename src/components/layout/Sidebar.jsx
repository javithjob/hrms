import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HiOutlineChevronRight,
  HiOutlineClipboardList,
  HiOutlineCurrencyDollar,
  HiOutlineLogout,
  HiOutlineMenuAlt2,
  HiOutlineUserAdd,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineShieldCheck,
  HiX,
} from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";

const adminLinks = [
  { to: "/employees", icon: HiOutlineUsers, label: "Employees" },
  { to: "/attendance", icon: HiOutlineClipboardList, label: "Attendance" },
  { to: "/payroll", icon: HiOutlineCurrencyDollar, label: "Payroll" },
  { to: "/administration", icon: HiOutlineShieldCheck, label: "Credential" },
];

const publicLinks = [
  {
    to: "/employee-registry",
    icon: HiOutlineUserAdd,
    label: "Employee Registry",
  },
  { to: "/cl-registry", icon: HiOutlineCalendar, label: "Leave Portal" },
];

export default function Sidebar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");

    if (confirmLogout) {
      logout();
      navigate("/login");
    }
  };

  const linkClassName = ({ isActive }, collapsedMode) => `
    flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 group relative border
    ${
      isActive
        ? "text-black border-gold-500/20 shadow-gold bg-white/80"
        : "text-white/90 hover:text-slate-900 hover:bg-white/80 border-transparent"
    }
    ${collapsedMode ? "justify-center" : ""}
  `;

  const sidebarContent = (
    // bg-[#020617]
    <div className="flex flex-col h-full bg-[#53140d]">
      <div
        onClick={() => navigate("/employees")}
        className={`cursor-pointer flex flex-col px-5 pt-6 pb-2 border-b border-gold-500/10 items-center gap-1 ${collapsed ? "justify-center px-3" : ""}`}
      >
        {/* <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gold-gradient shadow-gold">
          <span className="text-white font-display font-bold text-base">H</span>
        </div> */}
        {/* <img src="/assets/logo.svg" alt="logo" className='w-24' /> */}

        <div>
          <img src="/assets/massaed_logo.jpg" alt="" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-semibold text-2xl leading-tight">
              MassaedHRMS
            </div>
            {/* <div className="text-slate-500 text-xs tracking-[0.3em] uppercase">Luxury Desk</div> */}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2 text-xs text-[#f5ada5] font-medium tracking-[0.1em] uppercase">
            Portal
          </div>
        )}

        {publicLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={(state) => linkClassName(state, collapsed)}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-[13px] font-medium tracking-[0.05em]">
                {label}
              </span>
            )}
          </NavLink>
        ))}

        {admin && (
          <>
            {!collapsed && (
              <div className="px-3 pt-4 pb-2 text-xs text-[#f5ada5] font-medium tracking-[0.1em] uppercase">
                Administration
              </div>
            )}

            {collapsed && <div className="gold-line my-3 mx-2 opacity-40" />}

            {adminLinks.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={(state) => linkClassName(state, collapsed)}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="flex-1 text-[13px] font-medium tracking-[0.05em]">
                    {label}
                  </span>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-gold-500/10 p-3">
        {admin ? (
          <div
            className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
          >
            {!collapsed && (
              <div className="flex-1 min-w-0">
                {/* <div className="text-white/60 text-sm font-semibold truncate">{admin.username}</div> */}
                <div className="text-white/80 text-xs uppercase tracking-[0.1em]">
                  {admin.role}
                </div>
              </div>
            )}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 rounded-xl text-white/80 hover:text-crimson-400 hover:bg-crimson-500/10 transition-all"
              title="Logout"
            >
              <HiOutlineLogout className="w-5 h-5" />
            </button>
          </div>
        ) : (
          !collapsed && (
            <NavLink
              to="/login"
              className="flex items-center gap-2 px-3 py-2 text-gold-600 hover:text-gold-500 text-sm transition-colors"
            >
              <HiOutlineChevronRight className="w-4 h-4" />
              Admin Login
            </NavLink>
          )
        )}
      </div>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowLogoutConfirm(false)}
          />

          {/* Bottom Sheet */}
          <div className="relative w-full bg-[#020617] rounded-t-3xl p-6 border-t border-gold-500/20 animate-slideUp">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

            <h2 className="text-center text-white text-lg font-semibold mb-2">
              Logout?
            </h2>
            <p className="text-center text-white/60 text-sm mb-6">
              You will need to login again to access your account.
            </p>

            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="w-full py-3 mb-2 rounded-xl bg-crimson-500 text-white font-medium"
            >
              Yes, Logout
            </button>

            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="w-full py-3 rounded-xl bg-white/10 text-white/80"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>
        {`
  @keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slideUp {
  animation: slideUp 0.25s ease-out;
}
  `}
      </style>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden md:flex flex-col h-full transition-all duration-300 flex-shrink-0 ${
          collapsed ? "w-[72px]" : "w-[260px]"
        } bg-[rgba(248,250,252,0.8)] backdrop-blur-xl border-r border-slate-200 shadow-[0_12px_40px_rgba(15,23,42,0.08)]`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-0 right-[-12px] z-10 w-9 h-9 bg-obsidian-900 border border-gold-500/20 rounded-[0_0_0_14px]
          flex items-center justify-center text-slate-500 hover:text-gold-600 transition-all shadow-gold"
        >
          <HiOutlineMenuAlt2
            className={`w-5 h-5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
        {sidebarContent}
      </aside>

      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-[rgba(248,250,252,0.95)] border border-slate-200 rounded-2xl text-slate-600 shadow-sm"
      >
        <HiOutlineMenuAlt2 className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-[rgba(29,26,22,0.28)] backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[260px] bg-[rgba(248,250,252,0.98)] backdrop-blur-xl border-r border-slate-200 h-full shadow-[0_20px_40px_rgba(15,23,42,0.14)]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900"
            >
              <HiX className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
