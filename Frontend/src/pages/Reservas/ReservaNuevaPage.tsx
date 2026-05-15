import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Check, RefreshCw, User, Calendar, DollarSign, ChevronRight } from 'lucide-react';
import { useReservaForm } from './hooks/useReservaForm';
import StepClientInfo from './components/ReservaSteps/StepClientInfo';
import StepKidsSelection from './components/ReservaSteps/StepKidsSelection';
import StepEventDetails from './components/ReservaSteps/StepEventDetails';
import StepFinancials from './components/ReservaSteps/StepFinancials';

const ReservaNuevaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  
  const rawDate = location.state?.selectedDate;
  const initialDate = rawDate ? new Date(rawDate) : null;
  const isValidDate = initialDate && !isNaN(initialDate.getTime());
  const finalInitialDate = isValidDate ? initialDate : null;

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
  } = useReservaForm(true, finalInitialDate, () => navigate('/admin/reservas'), () => navigate('/admin/reservas'));

  const steps = [
    { id: 1, name: 'Anfitriones', icon: User, desc: 'Clientes y Niños' },
    { id: 2, name: 'Operativa', icon: Calendar, desc: 'Fecha, Hora y Pack' },
    { id: 3, name: 'Financiero', icon: DollarSign, desc: 'Inversión y Pago' }
  ];

  const handleNext = () => {
    // Basic validation before moving next could be added here
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else navigate(-1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-24">
      {/* STEPS INDICATOR */}
      <div className="flex items-center justify-between bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-50">
          <div 
            className="h-full bg-primary transition-all duration-700 ease-in-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center gap-4 relative z-10">
            <div className={`
              w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500
              ${currentStep >= step.id ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-slate-50 text-slate-300'}
            `}>
              <step.icon size={20} />
            </div>
            <div className="hidden md:flex flex-col">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${currentStep >= step.id ? 'text-bg-dark' : 'text-slate-300'}`}>
                Paso 0{step.id}
              </span>
              <span className={`text-xs font-black uppercase tracking-tight ${currentStep >= step.id ? 'text-primary' : 'text-slate-300'}`}>
                {step.name}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className="mx-4 text-slate-100 hidden md:block" size={20} />
            )}
          </div>
        ))}
      </div>

      {/* MAIN FORM AREA */}
      <div className="min-h-[600px] flex flex-col">
        {currentStep === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 hover:shadow-premium transition-all duration-500">
                <StepClientInfo 
                  clienteIds={formData.clienteIds}
                  clientes={clientes}
                  onAddCliente={(id) => setFormData(prev => ({ ...prev, clienteIds: [...prev.clienteIds, id] }))}
                  onRemoveCliente={(id) => setFormData(prev => ({ ...prev, clienteIds: prev.clienteIds.filter(cid => cid !== id) }))}
                  onRefreshClientes={async () => {
                    const updated = await import('../../services/clientesService').then(m => m.clientesService.getClientes());
                    setClientes(updated);
                  }}
                  error={errors.clienteIds}
                />
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 hover:shadow-premium transition-all duration-500">
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
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 hover:shadow-premium transition-all duration-500">
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
                availableSlots={availableSlots}
                loadingSlots={loadingSlots}
                errors={errors}
                onUpdateForm={(data) => setFormData(prev => ({ ...prev, ...data }))}
                onRefreshPaquetes={reloadPaquetes}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-3xl mx-auto w-full">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors" />
              
              <div className="relative z-10 space-y-10">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-display font-black text-bg-dark uppercase tracking-tight">Finalizar Reserva</h2>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Revisa la inversión total y confirma el agendamiento</p>
                </div>

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
        )}
      </div>

      {/* FOOTER NAVIGATION */}
      <div className="flex items-center justify-between pt-10">
        <button 
          onClick={handleBack}
          className="flex items-center gap-4 px-10 py-5 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-slate-50 transition-all active:scale-95"
        >
          <ChevronLeft size={20} />
          {currentStep === 1 ? 'Cancelar' : 'Atrás'}
        </button>

        <div className="flex items-center gap-6">
          {currentStep < 3 ? (
            <button 
              onClick={handleNext}
              className="bg-bg-dark text-white flex items-center gap-4 px-12 py-5 rounded-2xl shadow-xl hover:bg-primary transition-all active:scale-95 group"
            >
              <span className="font-bold uppercase tracking-widest text-xs">Siguiente Paso</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-primary text-white flex items-center gap-4 px-12 py-5 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={24} />
              ) : (
                <>
                  <Check size={20} />
                  <span className="font-bold uppercase tracking-widest text-xs">Confirmar y Agendar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservaNuevaPage;
