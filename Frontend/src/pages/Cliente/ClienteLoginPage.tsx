import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { authService } from '../../services/authService';
import logo from '../../assets/logoZapatitos.webp';

const ClienteLoginPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    nombreCompleto: '',
    email: '',
    telefono: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.login(loginData.email, loginData.password);
      const queryParams = new URLSearchParams(window.location.search);
      const redirectPath = queryParams.get('redirect');
      navigate(redirectPath || '/cliente/dashboard');
    } catch (err: any) {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.register({
        username: registerData.username,
        nombreCompleto: registerData.nombreCompleto,
        email: registerData.email,
        telefono: registerData.telefono || undefined,
        password: registerData.password
      });
      
      // Auto-login after registration
      await authService.login(registerData.email, registerData.password);
      const queryParams = new URLSearchParams(window.location.search);
      const redirectPath = queryParams.get('redirect');
      navigate(redirectPath || '/cliente/dashboard');
    } catch (err: any) {
      const data = err.response?.data;
      const errorMsg = Array.isArray(data) ? data[0] :
        data?.Errors ? data.Errors[0] :
        data?.errors ? data.errors[0] :
        data?.message || 'Error al registrarse';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[var(--bg-main)] relative overflow-hidden selection:bg-primary selection:text-white">
      {/* DECORATION */}
      <div className="absolute top-0 right-0 w-1/2 h-screen bg-primary/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-82 h-82 bg-purple-100/30 rounded-full blur-3xl pointer-events-none" />
      
      {/* Floating Bubbles */}
      <div className="absolute top-20 right-12 w-8 h-8 rounded-full bg-pink-300/30 blur-[1px] floating-bubble-slow pointer-events-none" />
      <div className="absolute bottom-20 left-16 w-12 h-12 rounded-full bg-purple-300/20 blur-[1px] floating-bubble-slower pointer-events-none" />

      <div className="w-full max-w-xl relative animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="glass-effect rounded-[3.5rem] p-10 lg:p-16 border border-white">
          <div className="flex flex-col items-center text-center space-y-6 mb-12">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-2 shadow-md border border-purple-50">
              <img src={logo} alt="Zapatitos" className="w-12 h-12 object-contain" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-display font-bold text-[var(--text-main)] text-playful-shadow">
                {mode === 'login' ? 'Portal de Clientes' : 'Crear Cuenta'}
              </h1>
              <p className="text-slate-500 font-medium text-sm">
                {mode === 'login' 
                  ? 'Gestiona tus eventos, pagos e invitaciones en un solo lugar.' 
                  : 'Regístrate para comenzar a planificar tu evento mágico.'}
              </p>
            </div>
          </div>

          <div className="flex p-1.5 bg-purple-50/70 rounded-2xl border border-purple-100/50 mb-10">
            <button
              className={`flex-1 py-3.5 rounded-xl font-display font-bold text-xs uppercase tracking-widest transition-all ${
                mode === 'login' ? 'bg-white text-primary shadow-md' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setMode('login')}
            >
              Iniciar Sesión
            </button>
            <button
              className={`flex-1 py-3.5 rounded-xl font-display font-bold text-xs uppercase tracking-widest transition-all ${
                mode === 'register' ? 'bg-white text-primary shadow-md' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setMode('register')}
            >
              Registrarme
            </button>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div 
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-5"
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        className="w-full bg-white/70 border border-purple-100/70 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:bg-white focus:border-primary-light outline-none transition-all"
                        placeholder="alex123"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        className="w-full bg-white/70 border border-purple-100/70 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:bg-white focus:border-primary-light outline-none transition-all"
                        placeholder="Alex García"
                        value={registerData.nombreCompleto}
                        onChange={(e) => setRegisterData({ ...registerData, nombreCompleto: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="email"
                  className="w-full bg-white/70 border border-purple-100/70 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:bg-white focus:border-primary-light outline-none transition-all"
                  placeholder="tu@email.com"
                  value={mode === 'login' ? loginData.email : registerData.email}
                  onChange={(e) => mode === 'login' 
                    ? setLoginData({ ...loginData, email: e.target.value })
                    : setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    className="w-full bg-white/70 border border-purple-100/70 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:bg-white focus:border-primary-light outline-none transition-all"
                    placeholder="+54 11 1234 5678"
                    value={registerData.telefono}
                    onChange={(e) => setRegisterData({ ...registerData, telefono: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="password"
                  className="w-full bg-white/70 border border-purple-100/70 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:bg-white focus:border-primary-light outline-none transition-all"
                  placeholder="••••••••"
                  value={mode === 'login' ? loginData.password : registerData.password}
                  onChange={(e) => mode === 'login'
                    ? setLoginData({ ...loginData, password: e.target.value })
                    : setRegisterData({ ...registerData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-medium"
              >
                <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-xs">!</div>
                {error}
              </motion.div>
            )}

            <button 
              className="w-full py-5 rounded-[1.8rem] candy-bubble-btn flex items-center justify-center gap-3 text-xs" 
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' ? 'Entrar al Portal' : 'Crear mi Cuenta'}
                  </span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <Link 
              to="/" 
              className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles size={12} className="text-primary animate-pulse" /> Volver a la página principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteLoginPage;
