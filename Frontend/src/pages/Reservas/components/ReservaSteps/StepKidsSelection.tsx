import { useState } from 'react';
import { Sparkles, Trash2, User, Calendar, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ninosService } from '../../../../services/ninosService';
import type { Nino } from '../../../../services/ninosService';
import type { CumpleaneroEntry } from '../../hooks/useReservaForm';

interface StepKidsSelectionProps {
  cumpleaneros: CumpleaneroEntry[];
  availableNinos: Nino[];
  clienteIds: number[];
  fechaEvento: string;
  onUpdateCumpleaneros: (entries: CumpleaneroEntry[]) => void;
  onRefreshNinos: () => void;
  calculateAge: (birthDate: string, eventDate: string) => string;
  error?: string;
}

const StepKidsSelection = ({
  cumpleaneros,
  availableNinos,
  clienteIds,
  fechaEvento,
  onUpdateCumpleaneros,
  onRefreshNinos,
  calculateAge,
  error
}: StepKidsSelectionProps) => {
  const [isAddingNino, setIsAddingNino] = useState<number | null>(null);
  const [newNinoData, setNewNinoData] = useState({
    nombre: '',
    fechaNacimiento: ''
  });

  const handleAddCumpleanero = () => {
    onUpdateCumpleaneros([...cumpleaneros, { ninoId: '', edad: '' }]);
  };

  const handleRemoveCumpleanero = (index: number) => {
    if (cumpleaneros.length > 1) {
      const newC = [...cumpleaneros];
      newC.splice(index, 1);
      onUpdateCumpleaneros(newC);
    }
  };

  const handleCreateNino = async (index: number) => {
    if (!newNinoData.nombre || !newNinoData.fechaNacimiento) {
      toast.error('Nombre y Fecha de Nacimiento son obligatorios.');
      return;
    }
    if (clienteIds.length === 0) {
      toast.error('Primero debes seleccionar al menos un responsable.');
      return;
    }

    try {
      const nId = await ninosService.createNino({
        nombre: newNinoData.nombre,
        fechaNacimiento: newNinoData.fechaNacimiento,
        clienteIds: clienteIds
      });
      onRefreshNinos();

      const newC = [...cumpleaneros];
      newC[index].ninoId = nId.toString();
      newC[index].edad = calculateAge(newNinoData.fechaNacimiento, fechaEvento);

      onUpdateCumpleaneros(newC);
      setIsAddingNino(null);
      setNewNinoData({ nombre: '', fechaNacimiento: '' });
      toast.success('Perfil del niño creado');
    } catch (err) {
      toast.error('Error al crear perfil del niño');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-primary" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Cumpleañeros Celebrados</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-xs font-bold text-slate-300  leading-none">Total: {cumpleaneros.length}</span>
        </div>
      </div>

      {error && <p className="text-xs font-bold text-rose-500  px-4 italic animate-bounce">! {error}</p>}

      <div className="space-y-8">
        {cumpleaneros.map((c, index) => (
          <div 
            key={index} 
            className="group relative bg-white border border-slate-100 rounded-3xl p-10 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-xl bg-bg-dark text-white flex items-center justify-center font-bold italic text-lg leading-none shadow-lg shadow-black/10">#{index + 1}</span>
                <span className="text-xs font-bold text-slate-400 ">Perfil del Protagonista</span>
              </div>
              {cumpleaneros.length > 1 && (
                <button 
                  onClick={() => handleRemoveCumpleanero(index)}
                  className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400  ml-1">Seleccionar Niño/a</label>
                <div className="relative group">
                  <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <select
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-10 py-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium text-slate-700 appearance-none cursor-pointer"
                    value={c.ninoId}
                    onChange={(e) => {
                      if (e.target.value === "NEW") {
                        setIsAddingNino(index);
                      } else {
                        const newC = [...cumpleaneros];
                        newC[index].ninoId = e.target.value;
                        const nino = availableNinos.find(n => n.id === parseInt(e.target.value));
                        if (nino && nino.fechaNacimiento) {
                          newC[index].edad = calculateAge(nino.fechaNacimiento, fechaEvento);
                        }
                        onUpdateCumpleaneros(newC);
                      }
                    }}
                  >
                    <option value="">-- Buscar Perfil --</option>
                    {availableNinos.map(n => (
                      <option key={n.id} value={n.id}>{n.nombre}</option>
                    ))}
                    <option value="NEW" className="text-primary font-bold">+ REGISTRAR NUEVO PERFIL...</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400  ml-1">Edad Proyectada</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="number"
                    min="0"
                    placeholder="Auto-calculada"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-lg italic tracking-tighter text-bg-dark shadow-inner"
                    value={c.edad}
                    onChange={(e) => {
                      const newC = [...cumpleaneros];
                      newC[index].edad = e.target.value;
                      onUpdateCumpleaneros(newC);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* INLINE REGISTRATION FOR NINO */}
            {isAddingNino === index && (
              <div className="mt-10 bg-slate-50 border border-slate-100 rounded-2xl p-8 space-y-8 animate-in slide-in-from-top-4">
                <div className="flex items-center gap-3 border-b border-slate-200/50 pb-4">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <span className="text-xs font-bold text-bg-dark  italic">Registro de Infante</span>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400  ml-1">Nombre Completo del Niño</label>
                    <input
                      className="w-full bg-white border border-slate-100 rounded-xl px-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-sm"
                      placeholder="Ej: Thiago Valentín..."
                      value={newNinoData.nombre}
                      onChange={e => setNewNinoData({ ...newNinoData, nombre: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400  ml-1">Fecha de Nacimiento</label>
                    <div className="relative group">
                      <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="date"
                        className="w-full bg-white border border-slate-100 rounded-xl pl-16 pr-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-sm"
                        value={newNinoData.fechaNacimiento}
                        onChange={e => setNewNinoData({ ...newNinoData, fechaNacimiento: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    className="flex-1 py-4 bg-bg-dark text-white rounded-2xl text-xs font-semibold uppercase tracking-wider hover:bg-primary transition-all shadow-lg active:scale-95" 
                    onClick={() => handleCreateNino(index)}
                  >
                    Confirmar Perfil
                  </button>
                  <button 
                    type="button" 
                    className="flex-1 py-4 bg-white text-slate-400 border border-slate-100 rounded-2xl text-xs font-semibold uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95" 
                    onClick={() => setIsAddingNino(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          className="w-full py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center gap-4 text-slate-400 hover:bg-white hover:border-primary/40 hover:text-primary transition-all group"
          onClick={handleAddCumpleanero}
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-xs font-bold ">Agregar otro cumpleañero</span>
        </button>
      </div>
    </div>
  );
};

export default StepKidsSelection;





