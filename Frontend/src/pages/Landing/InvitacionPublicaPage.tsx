import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Clock, Calendar, Gift, RefreshCw } from 'lucide-react';
import { invitacionService, type InvitacionPublica } from '../../services/invitacionService';

const InvitacionPublicaPage = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<InvitacionPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    invitacionService.getInvitacionByToken(token)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-slate-500 font-black text-lg uppercase tracking-widest animate-pulse">Abriendo tu invitación...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-6">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-8 shadow-inner">
          <RefreshCw size={48} />
        </div>
        <h1 className="text-4xl font-display font-black text-bg-dark mb-4">¡Ops!</h1>
        <p className="text-slate-500 font-medium text-center max-w-sm">No pudimos encontrar esta invitación. Por favor, verifica el enlace o contacta al organizador.</p>
      </div>
    );
  }

  const config = data.configJson ? JSON.parse(data.configJson) : {};
  const titulo = config.titulo || '¡Estás Invitado!';
  const mensaje = config.mensaje || '¡Te esperamos para celebrar juntos este día tan especial!';

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6 selection:bg-primary selection:text-white">
      <div className="w-full max-w-lg relative animate-in zoom-in duration-700">
        {/* FLOATING DECO */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
        
        <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-white">
          <div className="relative h-48 bg-bg-dark flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="grid grid-cols-6 gap-4 p-4">
                {[...Array(24)].map((_, i) => <Gift key={i} size={32} className="text-white rotate-12" />)}
              </div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/40 -rotate-6">
                <Gift size={32} />
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-widest px-4 text-center">
                {titulo}
              </h1>
            </div>
          </div>

          <div className="p-10 lg:p-14 space-y-12 text-center">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">A la fiesta de:</p>
              <h2 className="text-5xl font-display font-black text-primary tracking-tighter">{data.nombreCumpleanero}</h2>
              {data.edad && (
                <div className="inline-block px-4 py-1.5 bg-amber-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">
                  ¡Cumple {data.edad} años!
                </div>
              )}
            </div>

            <div className="grid gap-8 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-6 group text-left">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Calendar size={24} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Cuándo?</span>
                  <p className="text-bg-dark font-black capitalize">
                    {new Date(data.fecha).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 group text-left">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Clock size={24} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Horario?</span>
                  <p className="text-bg-dark font-black tracking-tight">{data.horaInicio} — {data.horaFin} hs</p>
                </div>
              </div>

              <div className="flex items-center gap-6 group text-left">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <MapPin size={24} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Dónde?</span>
                  <p className="text-bg-dark font-black">{data.nombreNegocio || 'Salón Zapatitos'}</p>
                  <p className="text-[11px] font-bold text-slate-500 italic">{data.direccion || 'Dirección por confirmar'}</p>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.direccion || data.nombreNegocio)}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline mt-1 block"
                  >
                    Ver en mapa
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-6">
              <p className="text-slate-400 font-medium italic">{mensaje}</p>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="text-[10px] font-black text-bg-dark uppercase tracking-widest">Confirmar asistencia al organizador</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitacionPublicaPage;
