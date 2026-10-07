'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Wrench } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(type: 'admin' | 'tech' | 'viewer') {
    const creds = {
      admin: { email: 'admin@maintainai.com', password: 'admin123' },
      tech: { email: 'sahil@maintainai.com', password: 'tech123' },
      viewer: { email: 'viewer@maintainai.com', password: 'viewer123' },
    };
    setEmail(creds[type].email);
    setPassword(creds[type].password);
    setError('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1e35] via-[#1e3a5f] to-[#0f1e35] flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 25px 25px, white 2px, transparent 0)',
        backgroundSize: '50px 50px',
      }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-600 shadow-lg mb-4">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MaintainAI</h1>
          <p className="text-slate-400 mt-1 text-sm">Equipment Maintenance Triage Assistant</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Sign in</h2>
          <p className="text-slate-500 text-sm mb-6">Enter your credentials to access the dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center mb-3">Demo accounts — click to fill</p>
            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'tech', 'viewer'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => fillDemo(type)}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-orange-300 text-slate-600 font-medium capitalize transition-all"
                >
                  {type === 'tech' ? 'Technician' : type === 'admin' ? 'Admin' : 'Viewer'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Safety notice */}
        <p className="text-center text-slate-500 text-xs mt-6 px-4">
          ⚠ AI recommendations are advisory only. Always verify findings before performing maintenance.
        </p>
      </div>
    </div>
  );
}
