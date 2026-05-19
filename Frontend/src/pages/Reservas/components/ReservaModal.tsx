import { X, Calendar, Check, RefreshCw } from 'lucide-react';
import { useReservaForm } from '../hooks/useReservaForm';
import StepClientInfo from './ReservaSteps/StepClientInfo';
import StepKidsSelection from './ReservaSteps/StepKidsSelection';
import StepEventDetails from './ReservaSteps/StepEventDetails';
import StepFinancials from './ReservaSteps/StepFinancials';

interface ReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date | null;
}

const ReservaModal = ({ isOpen, onClose, onSuccess, initialDate }: ReservaModalProps) => {
  const {
    formData,
    setFormData,
    clientes,
    setClientes,
    availableNinos,
    loadNinos,
    paquetes,
    servicios,
    articulos,
    reloadPaquetes,
    loading,
    errors,
    availableSlots,
    loadingSlots,
    recommendedPrice,
    handleSubmit,
    calculateAge
  } = useReservaForm(isOpen, initialDate, onSuccess, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-bg-dark/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-50 h-full shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-700">
        {/* HEADER */}
        <div className="flex items-center justify-between p-10 bg-white border-b border-slate-100 sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Calendar size={28} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 italic leading-none">Nueva Reserva</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{formData.fechaEvento || 'Configurando Detalles...'}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-bg-dark hover:text-white transition-all shadow-sm active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar scroll-smooth">
          <div className="space-y-12">
            <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-500">
              <StepClientInfo 
                clienteIds={formData.clienteIds}
                clientes={clientes}
                onAddCliente={(id) => setFormData(prev => ({ ...prev, clienteIds: [...prev.clienteIds, id] }))}
                onRemoveCliente={(id) => setFormData(prev => ({ ...prev, clienteIds: prev.clienteIds.filter(cid => cid !== id) }))}
                onRefreshClientes={async () => {
                  const updated = await import('../../../services/clientesService').then(m => m.clientesService.getClientes());
                  setClientes(updated);
                }}
                error={errors.clienteIds}
              />
            </div>

            <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-500">
              <StepKidsSelection 
                cumpleaneros={formData.cumpleaneros}
                availableNinos={availableNinos}
                clienteIds={formData.clienteIds}
                fechaEvento={formData.fechaEvento}
                onUpdateCumpleaneros={(entries) => setFormData(prev => ({ ...prev, cumpleaneros: entries }))}
                onRefreshNinos={loadNinos}
                calculateAge={calculateAge}
                error={errors.cumpleaneros}
              />
            </div>

            <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-500">
              <StepEventDetails 
                paqueteId={formData.paqueteId}
                paquetes={paquetes}
                items={formData.items}
                articulos={articulos}
                servicios={servicios}
                fechaEvento={formData.fechaEvento}
                horaInicio={formData.horaInicio}
                horaFin={formData.horaFin}
                cantidadNinosEstimada={formData.cantidadNinosEstimada}
                notasAdmin={formData.notasAdmin}
                tematica={formData.tematica}
                availableSlots={availableSlots}
                loadingSlots={loadingSlots}
                errors={errors}
                onUpdateForm={(data) => setFormData(prev => ({ ...prev, ...data }))}
                onRefreshPaquetes={reloadPaquetes}
              />
            </div>

            <div className="bg-bg-dark p-10 rounded-3xl shadow-2xl border border-slate-800">
              <StepFinancials 
                pagoInicial={formData.pagoInicial}
                precioFinal={formData.precioFinal}
                recommendedPrice={recommendedPrice}
                isManualPrice={formData.isManualPrice}
                onUpdateForm={(data) => setFormData(prev => ({ ...prev, ...data }))}
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-10 bg-white border-t border-slate-100 shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.1)] sticky bottom-0 z-20">
          <div className="flex items-center justify-between gap-10">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400  mb-1">Monto de Operación</span>
              <span className="text-4xl font-bold text-bg-dark tracking-tighter italic leading-none">${formData.precioFinal.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={onClose}
                className="flex-1 py-5 rounded-2xl text-xs font-semibold text-slate-500 uppercase tracking-wider hover:bg-slate-50 hover:text-bg-dark transition-all"
              >
                Descartar
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="flex-[2] btn-primary-glow py-5 flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95 transition-all"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <>
                    <Check size={20} />
                    <span className="font-bold  text-xs">Crear Reserva</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservaModal;




