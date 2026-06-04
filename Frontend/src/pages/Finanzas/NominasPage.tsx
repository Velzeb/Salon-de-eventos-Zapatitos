import { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Upload,
  X,
  FileText,
  Check,
  ExternalLink,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { finanzasService, type NominaEmpleado } from '../../services/finanzasService';
import { uploadService } from '../../services/uploadService';

interface SelectionState {
  [empleadoId: number]: number[]; // list of selected eventIds
}

interface PeriodState {
  [empleadoId: number]: string;
}

interface ComprobanteState {
  [empleadoId: number]: string; // URL of uploaded receipt
}

interface UploadingState {
  [empleadoId: number]: boolean;
}

const NominasPage = () => {
  const [nominas, setNominas] = useState<NominaEmpleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Custom states
  const [expandedEmployees, setExpandedEmployees] = useState<{ [id: number]: boolean }>({});
  const [selectedEvents, setSelectedEvents] = useState<SelectionState>({});
  const [customPeriods, setCustomPeriods] = useState<PeriodState>({});
  const [comprobantes, setComprobantes] = useState<ComprobanteState>({});
  const [uploading, setUploading] = useState<UploadingState>({});
  
  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [employeeHistory, setEmployeeHistory] = useState<any[]>([]);

  useEffect(() => {
    loadNominas();
  }, []);

  const loadNominas = async () => {
    setLoading(true);
    try {
      const data = await finanzasService.getNominasPendientes();
      setNominas(data);
      
      // Initialize states
      const initialSelection: SelectionState = {};
      const initialPeriods: PeriodState = {};
      data.forEach(n => {
        initialSelection[n.empleadoId] = n.detalles.map(d => d.eventoId);
        initialPeriods[n.empleadoId] = `Pago staff - ${n.eventosPendientes} eventos finalizados - ${new Date().toLocaleDateString('es-ES')}`;
      });
      setSelectedEvents(initialSelection);
      setCustomPeriods(initialPeriods);
    } catch (err) {
      console.error('Error al cargar nóminas', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (id: number) => {
    setExpandedEmployees(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleEventSelection = (empleadoId: number, eventId: number) => {
    setSelectedEvents(prev => {
      const current = prev[empleadoId] || [];
      const updated = current.includes(eventId)
        ? current.filter(id => id !== eventId)
        : [...current, eventId];
      
      // Update period text dynamically
      setCustomPeriods(periods => ({
        ...periods,
        [empleadoId]: `Pago staff - ${updated.length} eventos finalizados - ${new Date().toLocaleDateString('es-ES')}`
      }));

      return {
        ...prev,
        [empleadoId]: updated
      };
    });
  };

  const handleFileUpload = async (empleadoId: number, file: File) => {
    setUploading(prev => ({ ...prev, [empleadoId]: true }));
    try {
      const url = await uploadService.uploadImagen(file, 'nominas');
      setComprobantes(prev => ({ ...prev, [empleadoId]: url }));
    } catch (err) {
      console.error('Error al subir comprobante', err);
      alert('Error al subir el comprobante. Por favor intenta de nuevo.');
    } finally {
      setUploading(prev => ({ ...prev, [empleadoId]: false }));
    }
  };

  const removeComprobante = (empleadoId: number) => {
    setComprobantes(prev => {
      const copy = { ...prev };
      delete copy[empleadoId];
      return copy;
    });
  };

  const handlePagar = async (empleadoId: number, basePago: number) => {
    const selectedIds = selectedEvents[empleadoId] || [];
    if (selectedIds.length === 0) {
      alert('Por favor selecciona al menos un evento para pagar.');
      return;
    }

    const total = selectedIds.length * basePago;
    if (!window.confirm(`¿Confirmas el pago de $${total.toLocaleString()} por ${selectedIds.length} eventos finalizados seleccionados? Se registrará como un egreso en caja.`)) return;
    
    setProcessingId(empleadoId);
    try {
      await finanzasService.pagarNomina(
        empleadoId,
        comprobantes[empleadoId],
        selectedIds,
        customPeriods[empleadoId]
      );
      // Clear specific inputs
      removeComprobante(empleadoId);
      await loadNominas();
    } catch (err) {
      console.error('Error al procesar pago', err);
      alert('Error al procesar el pago.');
    } finally {
      setProcessingId(null);
    }
  };

  const openHistory = async (empleadoId: number, nombre: string) => {
    setSelectedEmployeeName(nombre);
    setEmployeeHistory([]);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const data = await finanzasService.getEmpleadoNominas(empleadoId);
      setEmployeeHistory(data);
    } catch (err) {
      console.error('Error al cargar historial', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-black text-lg uppercase tracking-widest animate-pulse">Calculando pagos pendientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="space-y-2 z-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Pagos al Staff</h1>
          <p className="text-indigo-200/80 text-sm max-w-xl">Liquida honorarios por eventos ya finalizados. Cada pago se registra como egreso en caja y queda en el historial del empleado.</p>
        </div>
        <button 
          onClick={loadNominas}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 shadow-md shadow-indigo-900/20 z-10 self-start md:self-center"
        >
          <RefreshCw size={18} /> Actualizar pendientes
        </button>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-2xl px-5 py-4 flex items-start gap-3">
        <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-sm font-medium leading-relaxed">
          Esta pantalla sólo muestra eventos en estado finalizado o terminado. Si una fiesta aún está en preparación o en vivo, no aparecerá para pago del staff.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {nominas.length > 0 ? (
          nominas.map((n) => {
            const selectedIds = selectedEvents[n.empleadoId] || [];
            const calculatedTotal = selectedIds.length * n.pagoPorEvento;
            const isExpanded = expandedEmployees[n.empleadoId];

            return (
              <div 
                key={n.empleadoId} 
                className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl border border-indigo-100">
                      {n.nombreEmpleado.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                        {n.nombreEmpleado}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500 font-medium">
                        <span>Honorarios: <strong className="text-indigo-600">${n.pagoPorEvento}</strong> por evento</span>
                        <span>•</span>
                        <span>{n.eventosPendientes} eventos finalizados por liquidar</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => openHistory(n.empleadoId, n.nombreEmpleado)}
                      className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      <History size={16} /> Ver Historial
                    </button>

                    <button
                      onClick={() => toggleEmployee(n.empleadoId)}
                      className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {isExpanded ? (
                        <>Contraer <ChevronUp size={16} /></>
                      ) : (
                        <>Ver Detalles ({n.eventosPendientes}) <ChevronDown size={16} /></>
                      )}
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE SECTION FOR DETAILED SELECTION & PAYMENT CONFIG */}
                <div className={`mt-6 space-y-6 transition-all duration-300 ${isExpanded ? 'block' : 'hidden md:block'}`}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* COLUMN 1: SELECTABLE EVENTS LIST */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Eventos finalizados a pagar ({selectedIds.length}/{n.eventosPendientes})
                        </label>
                        <span className="text-xs font-semibold text-slate-500">
                          {selectedIds.length === n.eventosPendientes ? 'Todos seleccionados' : `${selectedIds.length} seleccionados`}
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                        {n.detalles.map((d) => {
                          const isSelected = selectedIds.includes(d.eventoId);
                          return (
                            <div 
                              key={d.eventoId}
                              onClick={() => toggleEventSelection(n.empleadoId, d.eventoId)}
                              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer select-none
                                ${isSelected 
                                  ? 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-300' 
                                  : 'bg-slate-50/30 border-slate-200 hover:bg-slate-50/80 hover:border-slate-300'
                                }`}
                            >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all
                                ${isSelected 
                                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                                  : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check size={14} strokeWidth={3} />}
                              </div>
                              
                              <Calendar size={18} className={isSelected ? 'text-indigo-500' : 'text-slate-400'} />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 text-sm truncate">{d.paquete}</p>
                                <p className="text-xs font-semibold text-slate-400 mt-0.5">ID Evento: #{d.eventoId}</p>
                              </div>
                              <span className={`text-xs font-bold px-3 py-1 rounded-full
                                ${isSelected 
                                  ? 'bg-indigo-100 text-indigo-700' 
                                  : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {d.fecha}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* COLUMN 2: PAYMENT SUM AND RECEIPT SUBMISSION */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-extrabold text-slate-700">Resumen de Liquidación</h4>
                        
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-bold text-slate-500">Monto Unitario</span>
                          <span className="text-sm font-semibold text-slate-700">${n.pagoPorEvento}</span>
                        </div>

                        <div className="flex items-baseline justify-between border-b border-slate-200 pb-4">
                          <span className="text-xs font-bold text-slate-500">Eventos finalizados</span>
                          <span className="text-sm font-bold text-slate-800">x {selectedIds.length}</span>
                        </div>

                        <div className="flex items-baseline justify-between pt-2">
                          <span className="text-sm font-black text-slate-600 uppercase tracking-wider">Total</span>
                          <span className="text-2xl font-black text-indigo-600">${calculatedTotal.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* CUSTOM PERIOD / CONCEPTO */}
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Concepto de Pago</label>
                        <input
                          type="text"
                          value={customPeriods[n.empleadoId] || ''}
                          onChange={(e) => setCustomPeriods(prev => ({ ...prev, [n.empleadoId]: e.target.value }))}
                          placeholder="Ej: Pago staff eventos de mayo"
                          className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-slate-700"
                        />
                      </div>

                      {/* FILE UPLOAD COMPROBANTE */}
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Comprobante de Pago (Opcional)</label>
                        
                        {comprobantes[n.empleadoId] ? (
                          <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold truncate">
                              <FileText size={16} />
                              <span className="truncate">Comprobante cargado</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <a 
                                href={comprobantes[n.empleadoId]} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-1 hover:bg-indigo-100 text-indigo-600 rounded-md transition-colors"
                              >
                                <ExternalLink size={14} />
                              </a>
                              <button 
                                onClick={() => removeComprobante(n.empleadoId)}
                                className="p-1 hover:bg-red-100 text-red-500 rounded-md transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              id={`upload-${n.empleadoId}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(n.empleadoId, file);
                              }}
                              className="hidden"
                              disabled={uploading[n.empleadoId]}
                            />
                            <label
                              htmlFor={`upload-${n.empleadoId}`}
                              className={`w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/30 p-3 rounded-xl cursor-pointer transition-all text-xs font-bold text-slate-500 hover:text-indigo-600
                                ${uploading[n.empleadoId] ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <Upload size={16} />
                              {uploading[n.empleadoId] ? 'Subiendo...' : 'Subir Comprobante (Img/PDF)'}
                            </label>
                          </div>
                        )}
                      </div>

                      <button 
                        className={`
                          w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-900/10
                          ${processingId === n.empleadoId || selectedIds.length === 0
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.02]'
                          }
                        `}
                        onClick={() => handlePagar(n.empleadoId, n.pagoPorEvento)}
                        disabled={processingId === n.empleadoId || selectedIds.length === 0}
                      >
                        {processingId === n.empleadoId ? (
                          <RefreshCw className="animate-spin" size={18} />
                        ) : (
                          <>
                            <DollarSign size={18} />
                            Liquidar ${calculatedTotal.toLocaleString()}
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-24 flex flex-col items-center justify-center space-y-4 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100">
              <CheckCircle2 size={32} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-extrabold text-slate-800">¡Todo al día!</h2>
              <p className="text-slate-500 text-sm mt-1">No hay eventos finalizados pendientes de pago para el staff.</p>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Historial de Pagos</h3>
                <p className="text-slate-500 text-sm mt-0.5">{selectedEmployeeName}</p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1">
              {historyLoading ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="animate-spin text-indigo-600" size={32} />
                  <p className="text-slate-500 text-sm font-semibold">Cargando registros históricos...</p>
                </div>
              ) : employeeHistory.length > 0 ? (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                          <th className="p-4">Fecha Pago</th>
                          <th className="p-4">Período / Concepto</th>
                          <th className="p-4 text-right">Monto</th>
                          <th className="p-4 text-center">Comprobante</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        {employeeHistory.map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50/55 transition-colors">
                            <td className="p-4 text-slate-500">
                              {new Date(h.fechaPago).toLocaleDateString('es-ES')}
                            </td>
                            <td className="p-4 font-bold text-slate-800">
                              {h.periodo || 'Pago de nómina'}
                            </td>
                            <td className="p-4 text-right font-extrabold text-indigo-600">
                              ${h.monto.toLocaleString()}
                            </td>
                            <td className="p-4 text-center">
                              {h.comprobanteUrl ? (
                                <a 
                                  href={h.comprobanteUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                                >
                                  <FileText size={12} /> Ver
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400 italic">No disponible</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <AlertCircle size={40} className="text-slate-300 mx-auto" />
                  <p className="text-slate-500 font-bold text-base">Sin pagos registrados</p>
                  <p className="text-slate-400 text-xs max-w-xs mx-auto">Este empleado aún no cuenta con registros históricos de cobro procesados.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NominasPage;
