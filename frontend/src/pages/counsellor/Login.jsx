import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GraduationCap, Lock, Mail } from 'lucide-react';

export default function CounsellorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password, role: 'counsellor' });
      authLogin(res.data);
      navigate('/counsellor/dashboard');
    } catch (error) {
      showError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 w-full max-w-md space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-black">Counsellor login</h1>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500">Email</label>
          <div className="flex items-center gap-2 border rounded-xl px-3">
            <Mail className="w-4 h-4 text-slate-400" />
            <input required type="email" className="py-2.5 flex-1 outline-none text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500">Password</label>
          <div className="flex items-center gap-2 border rounded-xl px-3">
            <Lock className="w-4 h-4 text-slate-400" />
            <input required type="password" className="py-2.5 flex-1 outline-none text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Sign in'}</button>
        <Link to="/" className="block text-center text-xs text-slate-500">Back to website</Link>
      </form>
    </div>
  );
}
