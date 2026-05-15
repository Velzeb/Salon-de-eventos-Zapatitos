import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '../../services/authService';
import logo from '../../assets/logoZapatitos.webp';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.login(email, password);
      const roles = authService.getRoles();
      
      if (roles.includes('Administrador') || roles.includes('Empleado')) {
        navigate('/admin/dashboard');
      } else if (roles.includes('Cliente')) {
        navigate('/cliente/dashboard');
      } else {
        navigate('/'); // Fallback
      }
    } catch (err: any) {
      // Intentar extraer el error de múltiples formatos posibles del backend
      const data = err.response?.data;
      const errorMsg = Array.isArray(data) ? data[0] : 
                       data?.Errors ? data.Errors[0] :
                       data?.errors ? data.errors[0] :
                       data?.message || 'Credenciales inválidas o error de conexión';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-dark relative overflow-hidden p-6">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-10 shadow-2xl z-10"
      >
        <div className="text-center mb-10 space-y-4">
          <img src={logo} alt="Zapatitos Logo" className="w-24 h-auto mx-auto mb-6 drop-shadow-2xl" />
          <h1 className="text-3xl font-display font-black text-white tracking-tight">Zapatitos Portal</h1>
          <p className="text-slate-400 font-medium">Panel de gestión y administración</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest ml-1">
              <Mail size={14} className="text-primary" /> Correo Electrónico
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@zapatitos.com"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest ml-1">
              <Lock size={14} className="text-primary" /> Contraseña
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="text-red-400 text-sm font-bold bg-red-400/10 px-4 py-2 rounded-xl text-center"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                Entrar <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-slate-500 text-sm font-medium">© 2026 Zapatitos Management System</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
