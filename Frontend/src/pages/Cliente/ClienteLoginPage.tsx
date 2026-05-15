import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
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
      navigate('/cliente/dashboard');
    } catch (err: any) {
      const data = err.response?.data;
      const errorMsg = Array.isArray(data) ? data[0] :
        data?.Errors ? data.Errors[0] :
        data?.errors ? data.errors[0] :
        data?.message || 'Credenciales invalidas o error de conexion';
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
      setMode('login');
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
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden selection:bg-primary selection:text-white">
      {/* DECORATION */}
      <div className="absolute top-0 right-0 w-1/2 h-screen bg-primary/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-xl relative animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 lg:p-16 shadow-xl shadow-slate-200/50">
          <div className="flex flex-col items-center text-center space-y-6 mb-12">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-2">
              <img src={logo} alt="Zapatitos" className="w-12 h-12 object-contain" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-800">
                {mode === 'login' ? 'Portal de Clientes' : 'Crear Cuenta'}
              </h1>
              <p className="text-slate-500 font-medium text-sm">
                {mode === 'login' 
                  ? 'Gestiona tus eventos, pagos e invitaciones en un solo lugar.' 
                  : 'Regístrate para comenzar a planificar tu evento mágico.'}
              </p>
            </div>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl mb-10">
            <button
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setMode('login')}
            >
              Iniciar Sesión
            </button>
            <button
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${mode === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setMode('register')}
            >
              Registrarme
            </button>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Usuario</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      placeholder="alex123"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Nombre Completo</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      placeholder="Alex García"
                      value={registerData.nombreCompleto}
                      onChange={(e) => setRegisterData({ ...registerData, nombreCompleto: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Correo Electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
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
                <label className="text-xs font-bold text-slate-600">Teléfono</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    placeholder="+54 11 1234 5678"
                    value={registerData.telefono}
                    onChange={(e) => setRegisterData({ ...registerData, telefono: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
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
                className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 text-sm font-medium"
              >
                <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-xs">!</div>
                {error}
              </motion.div>
            )}

            <button 
              className="w-full bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-3 py-4 hover:bg-indigo-700 transition-colors disabled:opacity-50 group font-bold shadow-sm" 
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-sm">
                    {mode === 'login' ? 'Entrar al Portal' : 'Crear mi Cuenta'}
                  </span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link 
              to="/" 
              className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              ← Volver a la página principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteLoginPage;
