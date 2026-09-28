import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const { login, admin, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (admin) navigate('/employees');
  }, [admin, navigate]);

  const handle = async e => {
    e.preventDefault();
    const res = await login(form.username, form.password);
    if (res.success) { toast.success('Welcome back'); navigate('/employees'); }
    else toast.error(res.message);
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #d4a833 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl" />

      <div className="relative w-full md:max-w-lg lg:max-w-md mx-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          {/* <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #d4a833, #f5d98b)' }}>
            <span className=" font-bold text-2xl text-obsidian-950">H</span>
          </div> */}
          <div className="inline-flex items-center justify-center">
          {/* <img src="/assets/logo.svg" alt="logo" className='w-28' /> */}
          <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="linear-gradient" y1="1" x2="1" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="#973cfd"/>
      <stop offset="0.508" stop-color="#df4bc9"/>
      <stop offset="1" stop-color="#fb9759"/>
    </linearGradient>
  </defs>
  <g id="Group_3444" data-name="Group 3444" transform="translate(5.027 9)">
    <circle id="Ellipse_104" data-name="Ellipse 104" cx="512" cy="512" r="512" transform="translate(-5.027 -9)" fill="url(#linear-gradient)"/>
    <g id="Group_3447" data-name="Group 3447" transform="translate(189.48 113.329)">
      <path id="Path_7078" data-name="Path 7078" d="M494.246,158.351a2.285,2.285,0,0,0,0,.74,177.035,177.035,0,0,1-61.15,189.5,178.819,178.819,0,0,1-62.818,31.475A184.33,184.33,0,0,1,149.2,264.485,182.813,182.813,0,0,1,247.3,36.027a3.937,3.937,0,0,0,0-7.233A222.24,222.24,0,0,0,184.57,10.709a2.015,2.015,0,0,0-.992,0,235.227,235.227,0,0,0,53.21,415.841,237.812,237.812,0,0,0,241.957-48.928,234.781,234.781,0,0,0,66.741-236.451,172.738,172.738,0,0,0-28.181-53.188,1.407,1.407,0,0,0-2.479.492C508.877,108.781,507.637,117.495,494.246,158.351Z" transform="translate(0 334.84)" fill="#fff"/>
      <path id="Path_7079" data-name="Path 7079" d="M86.82,85.482,109.715,6.244a238.134,238.134,0,0,1,85.291,53.143,256.414,256.414,0,0,1,57.85,84.787,301.082,301.082,0,0,1,20.911,95.362c5.206,115.389-61.241,196.619-79.341,217.253-4.71,5.377-10.332,10.663-13.139,13.524,4.627-7.454,12.4-19.246,19.337-32.51,15.042-28.781,31.408-60.165,38.349-94.755a222.986,222.986,0,0,0-14.546-127.265,225.052,225.052,0,0,0-78.018-94.15c-20.164-14.911-58.845-27.742-61.572-28.956" transform="translate(136.766 196.807)" fill="#fff"/>
      <path id="Path_7081" data-name="Path 7081" d="M86.172,48.916l40.908-37.1a186.385,186.385,0,0,1,59.589,68.313,199.2,199.2,0,0,1,20.617,95.633,198.219,198.219,0,0,1-27.227,93.794,161.752,161.752,0,0,1-15.209,20.285,159.785,159.785,0,0,0,23.639-71.78,164.057,164.057,0,0,0-15.95-83.4c-16.945-35.33-44.55-63.8-78.514-80.969-3.554-1.91-6.613-3.3-8.68-4.248" transform="translate(153.27 377.405)" fill="#fff"/>
      <path id="Path_7084" data-name="Path 7084" d="M147.358,128a64,64,0,1,0-64-64A64,64,0,0,0,147.358,128Z" transform="translate(79.832 3.854)" fill="#fff"/>
      <path id="Path_7086" data-name="Path 7086" d="M86.914,122.988C98.978,83.2,112.285,40.629,124.352.924,181.981,21.471,229.523,65.1,256.585,122.294a278.418,278.418,0,0,1,25.538,81.752,457.234,457.234,0,0,1-8.265,203.9C237.08,540.936,145.012,619.915,113.692,644.19a406.813,406.813,0,0,0,69.01-93.372,340.21,340.21,0,0,0,41.324-143.65,335.56,335.56,0,0,0-39.672-175.033A324.473,324.473,0,0,0,115.1,146.222c-11.82-10.4-26.282-20.633-26.282-20.633l-1.736-1.3v-.953" transform="translate(204.277 22.931)" fill="#fff"/>
      <path id="Path_7088" data-name="Path 7088" d="M131.756,105.406a50,50,0,1,0-50-50A50,50,0,0,0,131.756,105.406Z" transform="translate(39.845 177.646)" fill="#fff"/>
    </g>
  </g>
</svg>

        </div>
          </div>
          <h1 className="md:text-4xl lg:text-3xl text-slate-700">Grail HRMS</h1>
          <p className="text-slate-400 md:text-md lg:text-sm mt-1 tracking-widest">ADMIN ACCESS</p>
        </div>

        {/* Card */}
        <div className="luxury-card p-8">
          <div className="gold-line mb-8" />
          <form onSubmit={handle} className="space-y-5">
            <div>
              <label className="block text-xs  text-slate-500 uppercase tracking-widest mb-2">Username</label>
              <input
                type="text"
                className="luxury-input"
                placeholder="admin"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs  text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                className="luxury-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full mt-2 py-3">
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>
          <div className="gold-line mt-8" />
          <p className="text-center text-slate-300 text-xs mt-4">
  Please sign in to continue
</p>
        </div>
      </div>
    </div>
  );
}
