import { RefreshCw, Save, AlertTriangle, CheckCircle2, Info, Users, Clock, CalendarCheck, Package, ListChecks } from 'lucide-react';
import type { EventoOperativo } from '../../../services/operativoService';

interface Props {
  data: EventoOperativo;
  progreso: number;
  riesgosOperativos: string[];
  notas: string;
  savingNotas: boolean;
  onNotasChange: (v: string) => void;
  onSaveNotas: () => void;
  onSetTab: (tab: string) => void;
  onConfirmar: () => void;
  onRechazar: () => void;
  onOpenPagos: () => void;
}

export default function ResumenTab({
  data, progreso, riesgosOperativos, notas, savingNotas, onNotasChange, onSaveNotas, onSetTab,
  onConfirmar, onRechazar, onOpenPagos
}: Props) {
  const estado = data.estado.toLowerCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
      {/* Main Column */}
      <div className="space-y-6">
        {/* Stat shortcuts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Preparación', value: `${Math.round(progreso)}%`, tab: 'preparacion', icon: ListChecks, color: progreso === 100 ? 'text-emerald-600' : 'text-indigo-600', bg: 'bg-indigo-50 text-indigo-500' },
            { label: 'Personal', value: Array.from(new Set(data.tareas.map(t => t.asignadoA).filter(Boolean))).length, tab: 'preparacion', icon: Users, color: 'text-slate-900', bg: 'bg-slate-100 text-slate-500' },
            { label: 'Invitados', value: `${data.invitados.filter(i => i.ingreso).length}/${data.invitados.length}`, tab: 'durantefiesta', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 text-amber-500' },
            { label: 'Agenda', value: data.cronograma.length, tab: 'durantefiesta', icon: Clock, color: 'text-slate-900', bg: 'bg-slate-100 text-slate-500' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onSetTab(item.tab)}
                className="group relative bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-indigo-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2 rounded-lg ${item.bg}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <p className={`text-2xl font-bold tracking-tight ${item.color}`}>{item.value}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">{item.label}</p>
                <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-indigo-500/10 pointer-events-none transition-colors" />
              </button>
            );
          })}
        </div>

        {/* Servicios contratados */}
        {data.items.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Package size={16} className="text-slate-400" /> Servicios contratados
              </h3>
              <span className="text-xs font-medium bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-500">
                {data.items.length} items
              </span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {data.items.map(item => (
                  <div key={item.id} className="group relative flex flex-col items-center p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-3 shadow-sm">
                      {item.imagenUrl ? (
                        item.imagenUrl.match(/\.(mp4|webm|ogg|mov)$/i) || item.imagenUrl.includes('/videos/') ? (
                          <video src={item.imagenUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                        ) : (
                          <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        )
                      ) : (
                        <Package size={24} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="text-center w-full">
                      <p className="text-xs font-semibold text-slate-900 leading-snug truncate" title={item.nombre}>{item.nombre}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">x{item.cantidad} unidad{item.cantidad !== 1 && 'es'}</p>
                      <div className="mt-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          item.esIncluidoEnPaquete ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {item.esIncluidoEnPaquete ? 'Paquete' : 'Extra'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Notas internas */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Info size={16} className="text-slate-400" /> Notas internas operativas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 ml-6">Sincronizadas con la reserva del cliente.</p>
            </div>
            <button onClick={onSaveNotas} disabled={savingNotas} className="self-end sm:self-auto flex items-center gap-2 text-indigo-600 text-xs font-semibold bg-indigo-50 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors">
              {savingNotas ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />} Guardar notas
            </button>
          </div>
          <textarea
            className="w-full h-32 p-5 text-sm text-slate-700 outline-none focus:ring-inset focus:ring-2 focus:ring-indigo-500 resize-none transition-shadow"
            value={notas}
            onChange={e => onNotasChange(e.target.value)}
            placeholder="Escribe aquí consideraciones especiales para el equipo (ej. alergias, preferencias, ubicación de mesas)..."
          />
        </section>
      </div>

      {/* Sidebar Column */}
      <aside className="space-y-6">
        {/* Next Action Box */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <CalendarCheck size={12} /> Siguiente paso
            </h3>
          </div>
          <div className="p-5">
            {estado === 'provisional' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">Revisión de Reserva</h4>
                <p className="text-xs text-slate-600 leading-relaxed">Verifica los datos del cliente y confirma para avanzar a la preparación.</p>
                <div className="flex gap-2 pt-2">
                  <button onClick={onRechazar} className="flex-1 py-2 bg-white text-rose-700 rounded border border-rose-200 text-xs font-medium hover:bg-rose-50 transition-colors">Rechazar</button>
                  <button onClick={onConfirmar} className="flex-1 py-2 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors">Confirmar</button>
                </div>
              </div>
            )}
            {estado === 'confirmado' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">Fase de Preparación</h4>
                <p className="text-xs text-slate-600 leading-relaxed">Asigna responsables y verifica el stock de productos.</p>
                <button onClick={() => onSetTab('preparacion')} className="w-full mt-1 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors">
                  Ir a Preparación →
                </button>
              </div>
            )}
            {estado === 'encurso' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">Fiesta Activa</h4>
                <p className="text-xs text-slate-600 leading-relaxed">Gestiona ingresos y tiempos desde el panel de control.</p>
                <button onClick={() => onSetTab('durantefiesta')} className="w-full mt-1 py-2 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors">
                  Abrir Panel de Control →
                </button>
              </div>
            )}
            {(estado === 'finalizado') && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">Cierre de Evento</h4>
                <p className="text-xs text-slate-600 leading-relaxed">Sube fotos, verifica deudas y archiva la fiesta.</p>
                <button onClick={() => onSetTab('cierre')} className="w-full mt-1 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors">
                  Ir a Cierre →
                </button>
              </div>
            )}
            {estado === 'terminado' && (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-slate-400" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Archivado</h4>
                  <p className="text-xs text-slate-500">Solo consulta</p>
                </div>
              </div>
            )}
            {estado === 'cancelado' && (
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-rose-400" />
                <div>
                  <h4 className="text-sm font-semibold text-rose-700">Cancelada</h4>
                  <p className="text-xs text-rose-500">Esta reserva fue rechazada.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Alertas */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle size={12} /> Alertas
            </h3>
          </div>
          <div className="p-5">
            {riesgosOperativos.length > 0 ? (
              <div className="space-y-2">
                {riesgosOperativos.map((riesgo, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded border border-amber-200 bg-amber-50 p-3">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-amber-900 leading-snug">{riesgo}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>
                <p className="text-xs font-medium text-emerald-700">Todo en orden</p>
                <p className="text-[10px] text-emerald-600/70 mt-0.5">No hay alertas activas</p>
              </div>
            )}
          </div>
        </section>

        {/* Detalles Rápidos */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Info size={12} /> Detalles
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Temática</p>
              <p className="text-sm font-medium text-slate-800">{data.tematica || 'No definida'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Cumpleañeros</p>
              {data.protagonistas.length > 0 ? data.protagonistas.map((p, i) => (
                <p key={i} className="text-sm font-medium text-slate-800">{p.nombre} · {p.edadCumplir} años</p>
              )) : (
                <p className="text-sm text-slate-500 italic">No registrado</p>
              )}
            </div>
            {data.saldoPendiente > 0 && (
              <div className="pt-2">
                <div className="rounded border border-rose-200 bg-rose-50 p-3 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">Saldo Pendiente</p>
                    <p className="text-base font-bold text-rose-700 mt-0.5">${data.saldoPendiente.toLocaleString()}</p>
                  </div>
                  <button onClick={onOpenPagos} className="text-xs text-rose-600 font-semibold hover:underline">Gestionar</button>
                </div>
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
