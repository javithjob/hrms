import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Field } from '../components/ui';
import { HiOutlineShieldCheck, HiOutlineLockClosed, HiOutlineUserCircle } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function Administration() {
  const { admin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: admin?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      return toast.error('New passwords do not match');
    }

    setLoading(true);
    try {
      const payload = { username: form.username };
      if (form.currentPassword && form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      await api.put('/auth/update', payload);
      toast.success('Admin credentials updated successfully');
      setForm({ ...form, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center'>
      {/* <PageHeader
        title="Credential Manager"
        subtitle="Manage secure access and credentials"
      /> */}

      <div className="my-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className=" text-4xl text-slate-700">Credential Manager</h1>
        </div>
        <p className="text-slate-500 text-sm ml-4 text-center">Manage secure access and credentials</p>
      </div>

      <div className="max-w-2xl">
        <div className="luxury-card p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-500">
              <HiOutlineShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-700">Security Settings</h3>
              <p className="text-slate-500 text-sm">Update your administrative login information</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Field label="Username" icon={HiOutlineUserCircle}>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="luxury-input"
                  placeholder="admin"
                  required
                />
              </Field>

              <div className="gold-line !my-1 opacity-20" />

              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Change Password</h4>
              
              <Field label="Current Password" icon={HiOutlineLockClosed}>
                <input
                  type="password"
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  className="luxury-input"
                  placeholder="••••••••"
                />
                <p className="text-xs text-slate-400 mt-1">Required only if changing password</p>
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="New Password" icon={HiOutlineLockClosed}>
                  <input
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    className="luxury-input"
                    placeholder="••••••••"
                  />
                </Field>
                <Field label="Confirm New Password" icon={HiOutlineLockClosed}>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="luxury-input"
                    placeholder="••••••••"
                  />
                </Field>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full md:w-auto px-12 py-3"
              >
                {loading ? 'Processing...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
