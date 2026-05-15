import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  RefreshCw, 
  CreditCard, 
  ReceiptText, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Camera,
  ExternalLink
} from 'lucide-react';
import {
  finanzasService,
  type Pago,
  type Gasto,
  type CategoriaFinanciera,
  type MetodoPago,
  type CuentaPendiente,
  type RegisterPagoCommand,
  type AddGastoCommand,
  type RentabilidadReporte
} from '../../services/finanzasService';

const FinanzasPage = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cuentas, setCuentas] = useState<CuentaPendiente[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanciera[]>([]);
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [reporte, setReporte] = useState<RentabilidadReporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPago, setSavingPago] = useState(false);
  const [savingGasto, setSavingGasto] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState<string | null>(null);

  const [pagoForm, setPagoForm] = useState<RegisterPagoCommand>({
    eventoId: 0,
    metodoPagoId: undefined,
    monto: 0,
    referencia: ''
  });

  const [gastoForm, setGastoForm] = useState<AddGastoCommand>({
    categoriaId: 0,
    monto: 0,
    descripcion: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pagosData, gastosData, categoriasData, metodosData, reporteData] = await Promise.all([
        finanzasService.getPagos(),
        finanzasService.getGastos(),
        finanzasService.getCategorias(),
        finanzasService.getMetodosPago(),
        finanzasService.getReporteRentabilidad()
      ]);
      setPagos(pagosData);
      setGastos(gastosData);
      setCategorias(categoriasData);
      setMetodos(metodosData.filter(m => m.activo));
      setReporte(reporteData);
      const cuentasData = await finanzasService.getCuentasPendientes();
      setCuentas(cuentasData);
    } catch (err) {
      console.error('Error al cargar finanzas', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePagoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagoForm.eventoId || pagoForm.monto <= 0) return;

    setSavingPago(true);
    try {
      await finanzasService.registerPago({
        ...pagoForm,
        metodoPagoId: pagoForm.metodoPagoId || undefined,
        referencia: pagoForm.referencia || undefined
      });
      setPagoForm({ eventoId: 0, metodoPagoId: undefined, monto: 0, referencia: '' });
      await loadData();
    } catch (err: any) {
      console.error('Error al registrar pago', err);
      toast.error(err.response?.data?.join?.(', ') || err.response?.data?.title || 'Error al registrar el pago');
    } finally {
      setSavingPago(false);
    }
  };

  const handleGastoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gastoForm.categoriaId || gastoForm.monto <= 0 || !gastoForm.descripcion) return;

    setSavingGasto(true);
    try {
      await finanzasService.addGasto(gastoForm);
      setGastoForm({ categoriaId: 0, monto: 0, descripcion: '' });
      await loadData();
    } catch (err: any) {
      console.error('Error al registrar gasto', err);
      toast.error(err.response?.data?.join?.(', ') || err.response?.data?.title || 'Error al registrar gasto');
    } finally {
      setSavingGasto(false);
    }
  };

  const handleVerifyPago = async (pagoId: number, isAccepted: boolean) => {
    setVerifyingId(pagoId);
    try {
      await finanzasService.verifyPago(pagoId, isAccepted);
      toast.success(isAccepted ? 'Pago verificado correctamente' : 'Pago rechazado');
      await loadData();
    } catch (err) {
      toast.error('Error al procesar la verificación');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Activity size={24} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-800">
              Control Financiero
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Gestión de Ingresos, Egresos y Rentabilidad
            </p>
          </div>
        </div>

        <button 
          onClick={loadData}
          className="w-12 h-12 bg-white border border-slate-200 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* RENTABILIDAD DASHBOARD */}
      {reporte && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Ingresos</span>
            </div>
            <div className="space-y-1 mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800">${reporte.totalIngresos.toLocaleString()}</span>
                <ArrowUpRight size={20} className="text-emerald-500" />
              </div>
              <p className="text-xs text-slate-400">Flujo Positivo</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Egresos</span>
            </div>
            <div className="space-y-1 mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800">${reporte.totalEgresos.toLocaleString()}</span>
                <ArrowDownRight size={20} className="text-rose-500" />
              </div>
              <p className="text-xs text-slate-400">Gasto Corriente</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Utilidad Neta</span>
            </div>
            <div className="space-y-1 mt-4">
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black ${reporte.utilidadNeta < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
                  ${reporte.utilidadNeta.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-400">Balance del Periodo</p>
            </div>
          </div>
        </div>
      )}

      {/* QUEUE DE VERIFICACIÓN (PAGOS PENDIENTES) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
              <RefreshCw size={20} className={verifyingId ? 'animate-spin' : ''} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Pagos por Verificar</h4>
              <p className="text-xs text-slate-500">Comprobantes subidos por clientes esperando aprobación</p>
            </div>
          </div>
          <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-black text-[10px] uppercase">
            {pagos.filter(p => p.estado === 'Pendiente').length} Pendientes
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Evento</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Monto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Comprobante</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagos.filter(p => p.estado === 'Pendiente').map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-indigo-600">#{p.eventoId}</td>
                  <td className="px-6 py-4 font-black text-slate-800">${p.monto.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{p.fechaPago}</td>
                  <td className="px-6 py-4">
                    {p.comprobanteUrl ? (
                      <button 
                        onClick={() => setShowReceipt(p.comprobanteUrl || null)}
                        className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline"
                      >
                        <Camera size={14} /> Ver Ticket
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Sin imagen</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        disabled={verifyingId !== null}
                        onClick={() => handleVerifyPago(p.id, true)}
                        className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        title="Aprobar Pago"
                      >
                        {verifyingId === p.id ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={18} />}
                      </button>
                      <button 
                        disabled={verifyingId !== null}
                        onClick={() => handleVerifyPago(p.id, false)}
                        className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        title="Rechazar Pago"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagos.filter(p => p.estado === 'Pendiente').length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                    No hay pagos pendientes de verificación. Todo está al día.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTION FORMS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* REGISTRAR PAGO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Registrar Ingreso</h3>
              <p className="text-xs text-slate-500">Pago manual por evento</p>
            </div>
          </div>
          
          <form onSubmit={handlePagoSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Evento con Saldo Pendiente</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm text-slate-800 cursor-pointer"
                  value={pagoForm.eventoId || ''}
                  onChange={(e) => setPagoForm({ ...pagoForm, eventoId: parseInt(e.target.value) || 0 })}
                >
                  <option value="">Seleccionar evento...</option>
                  {cuentas.map((c) => (
                    <option key={c.eventoId} value={c.eventoId}>
                      #{c.eventoId} — {c.clientes.join(', ')} — Pendiente: ${c.saldoPendiente.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Método</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm text-slate-800 cursor-pointer"
                  value={pagoForm.metodoPagoId || ''}
                  onChange={(e) => setPagoForm({ ...pagoForm, metodoPagoId: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">Seleccionar</option>
                  {metodos.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Importe Recibido</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-4 py-3 outline-none focus:border-indigo-500 transition-colors font-bold text-xl text-slate-800"
                  value={pagoForm.monto || ''}
                  onChange={(e) => setPagoForm({ ...pagoForm, monto: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Referencia</label>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm text-slate-800"
                value={pagoForm.referencia || ''}
                onChange={(e) => setPagoForm({ ...pagoForm, referencia: e.target.value })}
                placeholder="Opcional..."
              />
            </div>

            <button 
              type="submit" 
              disabled={savingPago}
              className="w-full bg-indigo-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {savingPago ? <RefreshCw className="animate-spin" size={20} /> : <span className="text-sm">Registrar Pago</span>}
            </button>
          </form>
        </div>

        {/* REGISTRAR GASTO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
              <ReceiptText size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Declarar Egreso</h3>
              <p className="text-xs text-slate-500">Gasto operativo</p>
            </div>
          </div>

          <form onSubmit={handleGastoSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Categoría</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm text-slate-800 cursor-pointer"
                value={gastoForm.categoriaId || ''}
                onChange={(e) => setGastoForm({ ...gastoForm, categoriaId: parseInt(e.target.value) || 0 })}
                required
              >
                <option value="">Seleccionar Categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Monto de Egreso</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-4 py-3 outline-none focus:border-indigo-500 transition-colors font-bold text-xl text-slate-800"
                  value={gastoForm.monto || ''}
                  onChange={(e) => setGastoForm({ ...gastoForm, monto: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Concepto</label>
              <input
                required
                placeholder="Motivo del gasto..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm text-slate-800"
                value={gastoForm.descripcion}
                onChange={(e) => setGastoForm({ ...gastoForm, descripcion: e.target.value })}
              />
            </div>

            <button 
              type="submit" 
              disabled={savingGasto}
              className="w-full bg-rose-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {savingGasto ? <RefreshCw className="animate-spin" size={20} /> : <span className="text-sm">Registrar Egreso</span>}
            </button>
          </form>
        </div>
      </div>

      {/* CUENTAS POR COBRAR (EVENTOS PRÓXIMOS) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <Calendar size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Cuentas por Cobrar</h4>
              <p className="text-xs text-slate-500">Saldos Pendientes en Eventos Agendados</p>
            </div>
          </div>
          <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">
            Recuperación Pendiente
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Expediente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Evento</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Responsables</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Seleccionado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Saldo Deudor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cuentas.map((c) => (
                <tr key={c.eventoId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-indigo-600">#{c.eventoId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{c.fechaEvento}</span>
                      <span className="text-xs text-slate-500">Programado</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">{c.clientes.join(', ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
                      {c.paquete}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-rose-600">${c.saldoPendiente.toLocaleString()}</span>
                      <span className="text-xs text-rose-500 mt-1">Pendiente de Liquidación</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRANSACTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ÚLTIMOS INGRESOS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h4 className="font-bold text-slate-800">Últimos Ingresos</h4>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Método</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagos.slice(0, 8).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-emerald-600">+ ${p.monto.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {p.metodoPago || 'Efectivo'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {p.fechaPago}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ÚLTIMOS EGRESOS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h4 className="font-bold text-slate-800">Últimos Egresos</h4>
            <TrendingDown size={20} className="text-rose-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gastos.slice(0, 8).map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-rose-600">- ${g.monto.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {g.categoria}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {g.fecha}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL PARA VER COMPROBANTE */}
      {showReceipt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowReceipt(null)} />
          <div className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Comprobante de Pago</h3>
                <button onClick={() => setShowReceipt(null)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                   <XCircle size={24} />
                </button>
             </div>
             <div className="p-8 bg-slate-50 flex justify-center">
                <img src={showReceipt} alt="Comprobante" className="max-h-[60vh] rounded-lg shadow-lg object-contain" />
             </div>
             <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
                <a 
                  href={showReceipt} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
                >
                  <ExternalLink size={16} /> Abrir Original
                </a>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanzasPage;
