import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await login(email, password);
      // Redirect to intended route, or default
      const from = location.state?.from?.pathname || (res.user.is_admin ? '/admin' : '/client');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd logowania.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-surface p-8 rounded-2xl border border-stone-100 shadow-sm">
      <h1 className="text-2xl font-light mb-6 text-stone-800 text-center">Zaloguj się</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-stone-600 mb-1">Adres e-mail</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm text-stone-600 mb-1">Hasło</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
            required 
          />
        </div>
        
        <button type="submit" className="w-full bg-teal-600 text-white mt-2 px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors">
          Zaloguj się
        </button>
      </form>
    </div>
  );
}
