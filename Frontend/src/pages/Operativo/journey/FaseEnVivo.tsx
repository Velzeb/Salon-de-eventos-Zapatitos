import { useEffect, useState } from 'react';
import { Play, Square, QrCode, Users, Clock, ListOrdered, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'sonner';
import type { EventoOperativo } from '../../../services/operativoService';

interface Props {
  evento: EventoOperativo;
  runningTimers: Record<number, { startTime: number; duration: number; isActive: boolean }>;
  onToggleTimer: (itemId: number, durationMinutes: number) => void;
  onScanQR: (qr: string) => Promise<void>;
  onToggleActividad: (id: number) => Promise<void>;
  onGoBack: () => void;
  onAvanzar: () => void;
}

const formatTimer = (ms: number) => {
  const totalSecs = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const s = (totalSecs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function FaseEnVivo({ evento, runningTimers, onToggleTimer, onScanQR, onToggleActividad, onGoBack, onAvanzar }: Props) {
  const [, setTick] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isScanning) {
      scanner = new Html5QrcodeScanner('qr-reader-live', { fps: 10, qrbox: 250 }, false);
      scanner.render(async (text) => {
        try {
          await onScanQR(text);
          setIsScanning(false);
        } catch (err: any) {
          toast.error(err.response?.data?.Errors?.[0] || 'QR inválido');
        }
      }, () => {});
    }
    return () => { scanner?.clear().catch(() => {}); };
  }, [isScanning, onScanQR]);

  const servicios = evento.items.filter(i => i.requiereTemporizador);
  const agenda = [...evento.cronograma].sort((a, b) => a.orden - b.orden);
  const invitadosEnSalon = evento.invitados.filter(i => i.ingreso).length;

  return (
    <div className="min-h-full bg-slate-950 p-8 font-sans text-slate-300 relative overflow-hidden">
      {/* Luces de fondo (Acentos) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">Fiesta en Curso</h1>
            </div>
            <p className="text-slate-400 font-medium">Panel de control de tiempos, agenda y accesos en tiempo real.</p>
          </div>

          <div className="flex gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
              <Users size={24} className="text-indigo-400" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">En Salón</p>
                <p className="text-2xl font-bold text-white leading-none">{invitadosEnSalon} <span className="text-sm text-slate-600">/ {evento.invitados.length}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Cronómetros de Servicio */}
          <section>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock size={16} className="text-emerald-400" /> Tiempos de Servicio
            </h2>
            <div className="space-y-4">
              {servicios.map(item => {
                const timer = runningTimers[item.id];
                const isActive = Boolean(timer?.isActive);
                const remaining = timer ? Math.max(0, timer.startTime + timer.duration - Date.now()) : item.duracionMinutos * 60 * 1000;
                const progress = timer ? Math.min(100, Math.max(0, ((timer.duration - remaining) / timer.duration) * 100)) : 0;
                
                return (
                  <div key={item.id} className={`bg-slate-900 border rounded-2xl p-6 transition-all duration-500 ${isActive ? 'border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'border-slate-800'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-lg font-bold text-white">{item.nombre}</p>
                      <button
                        onClick={() => onToggleTimer(item.id, item.duracionMinutos)}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                          isActive ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        }`}
                      >
                        {isActive ? <><Square size={16} className="fill-current" /> Pausar</> : <><Play size={16} className="fill-current" /> Iniciar</>}
                      </button>
                    </div>
                    
                    <div className="flex items-end justify-between mb-3">
                      <span className={`text-5xl font-black font-mono tracking-tighter ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {formatTimer(remaining)}
                      </span>
                      <span className="text-sm font-bold text-slate-600">{Math.round(progress)}% consumido</span>
                    </div>
                    
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full ${isActive ? 'bg-emerald-500' : 'bg-slate-600'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Agenda & Control de Acceso */}
          <div className="space-y-8">
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <QrCode size={16} className="text-indigo-400" /> Control de Acceso
                </h2>
                {!isScanning && (
                  <button onClick={() => setIsScanning(true)} className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                    Activar Escáner
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isScanning && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 rounded-2xl overflow-hidden border border-indigo-500/30">
                    <div className="bg-indigo-500/10 p-3 flex justify-between items-center border-b border-indigo-500/20">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest animate-pulse">Cámara Activa</span>
                      <button onClick={() => setIsScanning(false)} className="text-slate-400 hover:text-white text-xs font-bold">Cerrar</button>
                    </div>
                    <div id="qr-reader-live" className="w-full bg-black aspect-video object-cover" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2">
                {evento.invitados.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl">
                    <p className={`text-sm font-bold ${inv.ingreso ? 'text-white' : 'text-slate-500'}`}>{inv.nombre}</p>
                    {inv.ingreso ? (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded border border-emerald-500/30">Adentro</span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded border border-slate-700">Por Llegar</span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <ListOrdered size={16} className="text-rose-400" /> Agenda (Timeline)
              </h2>
              <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 pb-4">
                {agenda.map(act => (
                  <div key={act.id} className="relative pl-6">
                    <button
                      onClick={() => onToggleActividad(act.id!)}
                      className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        act.completada ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'bg-slate-900 border-slate-600 hover:border-emerald-400'
                      }`}
                    >
                      {act.completada && <CheckCircle2 size={12} strokeWidth={4} />}
                    </button>
                    <div>
                      <p className={`text-xs font-bold font-mono mb-1 ${act.completada ? 'text-slate-600' : 'text-rose-400'}`}>{act.horaInicio} - {act.horaFin}</p>
                      <p className={`text-sm font-bold ${act.completada ? 'text-slate-600 line-through' : 'text-white'}`}>{act.nombre}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-800">
          <button onClick={onGoBack} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            Volver a Preparación
          </button>
          <button onClick={onAvanzar} className="flex items-center gap-2 bg-emerald-500 text-slate-950 font-bold text-sm px-8 py-3 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
            Finalizar Fiesta
          </button>
        </div>
      </div>
    </div>
  );
}
