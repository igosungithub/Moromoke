import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, Lock, User, Eye, EyeOff, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { useStaffStore } from '../store/staffStore';
import { validatePasswordStrength } from '../utils/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, changePassword, isAuthenticated, currentUser } = useStaffStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forced password change after first login
  const [forceChange, setForceChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect away if already authenticated and not forced to change
  useEffect(() => {
    if (isAuthenticated && !currentUser?.mustChangePassword && !forceChange) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, currentUser, forceChange, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(username, password);
      if (!res.ok) {
        setError(res.reason);
        return;
      }
      if (res.mustChangePassword) {
        setForceChange(true);
      } else {
        navigate('/', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const check = validatePasswordStrength(newPassword);
    if (!check.valid) { setError(check.reason!); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!currentUser) { setError('No user signed in'); return; }
    setLoading(true);
    try {
      const res = await changePassword(currentUser.id, password, newPassword);
      if (!res.ok) { setError(res.reason!); return; }
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo + branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-3">
            <Hospital size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Moromoke EMR</h1>
          <p className="text-sm text-gray-500 mt-1">Hospital Electronic Medical Records</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {!forceChange ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in to your account</h2>
              <p className="text-xs text-gray-500 mb-6">Use your hospital staff credentials.</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="label flex items-center gap-1.5"><User size={14} /> Username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field"
                    placeholder="e.g., sjohnson"
                    autoFocus
                    autoComplete="username"
                    required
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-1.5"><Lock size={14} /> Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pr-10"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-2">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  Sign in
                </button>
              </form>

              <details className="mt-6 text-xs text-gray-500">
                <summary className="cursor-pointer font-medium text-gray-600 hover:text-gray-900">Demo credentials</summary>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-1 font-mono">
                  <p><strong>admin</strong> / password  (System Administrator)</p>
                  <p><strong>sjohnson</strong> / password  (Dr. Sarah Johnson — Physician)</p>
                  <p><strong>mokonkwo</strong> / password  (Dr. Michael Okonkwo — Physician)</p>
                  <p><strong>adeyemi</strong> / password  (Nurse Adeyemi)</p>
                  <p><strong>fatima</strong> / password  (Nurse Fatima)</p>
                  <p><strong>bnwosu</strong> / password  (Dr. Blessing Nwosu — NP)</p>
                </div>
                <p className="mt-2 italic">You will be prompted to change the password on first login.</p>
              </details>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1 text-amber-700">
                <KeyRound size={18} />
                <h2 className="text-lg font-semibold">Change your password</h2>
              </div>
              <p className="text-xs text-gray-500 mb-6">
                You are using a default password. Please choose a new password to continue.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters with at least one letter and one number.</p>
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    required
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-2">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  Update password & continue
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          All data stored locally in your browser. No information leaves your device.
        </p>
      </div>
    </div>
  );
}
