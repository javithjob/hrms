import React from 'react';

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div>
        <h1 className=" text-4xl text-slate-700 leading-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-2 max-w-3xl">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, accent = 'gold' }) {
  const colors = {
    gold: 'text-gold-600 bg-gold-500/10 border-gold-500/20',
    green: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-crimson-500 bg-crimson-500/10 border-crimson-500/20',
    blue: 'text-sapphire-500 bg-sapphire-500/10 border-sapphire-500/20',
  };

  return (
    <div className="luxury-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-600 font-medium text-xs uppercase tracking-[0.1em]">{label}</span>
        {Icon && (
          <div className={`p-2 rounded-2xl border ${colors[accent]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-3xl text-slate-700">{value}</div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(29,26,22,0.28)] backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} luxury-card animate-fade-in max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gold-500/10 flex-shrink-0">
          <h2 className="text-2xl text-slate-700">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 text-2xl leading-none">
            &times;
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    present: { cls: 'badge-present', label: 'Present' },
    permission: { cls: 'badge-present', label: 'Present' },
    absent: { cls: 'badge-absent', label: 'Absent' },
    official_leave: { cls: 'badge-ol', label: 'Official Leave' },
    casual_leave: { cls: 'badge-cl', label: 'Casual Leave' },
    on_duty: { cls: 'badge-od', label: 'On Duty' },
    half_day: { cls: 'badge-hd', label: 'Half Day' },
    weekly_off: { cls: 'badge-wo', label: 'Week Off' },
  };

  const value = map[status] || { cls: 'badge-present', label: status };
  return <span className={value.cls}>{value.label}</span>;
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="luxury-card flex flex-col items-center justify-center py-20 text-center px-6">
      {Icon && <Icon className="w-12 h-12 text-slate-600 mb-4" />}
      <div className="text-2xl text-slate-700 mb-2">{title}</div>
      {subtitle && <div className="text-slate-500 text-sm max-w-md">{subtitle}</div>}
    </div>
  );
}

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin`} />
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(29,26,22,0.28)]" onClick={onClose} />
      <div className="relative luxury-card rounded p-6 max-w-sm w-full animate-fade-in">
        <h3 className="text-xl text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button
            onClick={onConfirm}
            className={`text-sm py-2 px-4 rounded-2xl font-medium transition-all ${
              danger
                ? 'bg-crimson-500/15 border border-crimson-500/20 text-crimson-500 hover:bg-crimson-500/20'
                : 'btn-gold'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, required, error, children }) {
  return (
    <div>
      {label && (
        <label className="block text-[11px] text-slate-600 font-medium uppercase tracking-[0.1em] mb-2">
          {label}
          {required && <sup className="text-red-500 ml-1">*</sup>}
        </label>
      )}
      {children}
      {error && <p className="text-crimson-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function Select({ value, onChange, options, placeholder, className = '' }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`luxury-input appearance-none ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237b6d5c' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
