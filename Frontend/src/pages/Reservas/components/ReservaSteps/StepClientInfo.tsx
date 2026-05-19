import { useState } from 'react';
import { Users, Search, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { clientesService } from '../../../../services/clientesService';
import type { Cliente } from '../../../../services/clientesService';

interface StepClientInfoProps {
  clienteIds: number[];
  clientes: Cliente[];
  onAddCliente: (id: number) => void;
  onRemoveCliente: (id: number) => void;
  onRefreshClientes: () => void;
  error?: string;
}

const StepClientInfo = ({ 
  clienteIds, 
  clientes, 
  onAddCliente, 
  onRemoveCliente, 
  onRefreshClientes,
  error 
}: StepClientInfoProps) => {
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientData, setNewClientData] = useState({
    nombreCompleto: '',
    telefono: '',
    direccion: ''
  });

  const handleCreateClient = async () => {
    if (!newClientData.nombreCompleto) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }
    try {
      const newId = await clientesService.createCliente(newClientData);
      onRefreshClientes();
      onAddCliente(newId);
      setIsAddingClient(false);
      setNewClientData({ nombreCompleto: '', telefono: '', direccion: '' });
      toast.success('Cliente registrado correctamente');
    } catch (err) {
      toast.error('Error al crear el cliente');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 px-2">
        <Users size={20} className="text-primary" />
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Responsables del Evento</h3>
      </div>

      {/* SELECTED CLIENTS CHIPS */}
      <div className="flex flex-wrap gap-4 min-h-[60px] p-6 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
        {clienteIds.map(cid => {
          const cliente = clientes.find(c => c.id === cid);
          return (
            <div key={cid} className="group flex items-center gap-3 pl-5 pr-3 py-2.5 bg-white border border-slate-100 rounded-full shadow-sm hover:shadow-md hover:border-primary/30 transition-all animate-in zoom-in-95">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{cliente?.nombreCompleto || 'Cargando...'}</span>
              <button 
                onClick={() => onRemoveCliente(cid)}
                className="w-6 h-6 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
        {clienteIds.length === 0 && (
          <div className="flex items-center gap-2 text-slate-300 px-4">
            <Users size={14} />
            <span className="text-xs font-semibold uppercase tracking-wider italic">No hay responsables seleccionados</span>
          </div>
        )}
      </div>
      {error && <p className="text-xs font-bold text-rose-500  px-4 italic animate-bounce">! {error}</p>}

      {/* SELECTION AREA */}
      <div className="flex gap-4">
        <div className="flex-1 relative group">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <select
            className="w-full bg-white border border-slate-100 rounded-xl pl-16 pr-10 py-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium text-slate-700 appearance-none cursor-pointer shadow-sm"
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val) onAddCliente(val);
              e.target.value = "";
            }}
            value=""
          >
            <option value="">Buscar y agregar responsable</option>
            {clientes
              .filter(c => !clienteIds.includes(c.id))
              .map(c => (
                <option key={c.id} value={c.id}>{c.nombreCompleto}</option>
              ))
            }
          </select>
        </div>
        <button 
          type="button" 
          className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${isAddingClient ? 'bg-bg-dark text-white' : 'bg-primary text-white hover:bg-bg-dark'}`}
          onClick={() => setIsAddingClient(!isAddingClient)}
        >
          <Plus size={24} className={isAddingClient ? 'rotate-45 transition-transform' : ''} />
        </button>
      </div>

      {/* INLINE REGISTRATION */}
      {isAddingClient && (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-xl space-y-8 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <span className="text-xs font-bold text-bg-dark  italic">Nuevo Registro Cliente</span>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400  ml-1">Nombre Completo</label>
              <input
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-sm"
                placeholder="Nombre y Apellidos del Responsable"
                value={newClientData.nombreCompleto}
                onChange={e => setNewClientData({ ...newClientData, nombreCompleto: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400  ml-1">Teléfono Móvil</label>
                <input
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-sm"
                  placeholder="+591 ..."
                  value={newClientData.telefono}
                  onChange={e => setNewClientData({ ...newClientData, telefono: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400  ml-1">Dirección / Zona</label>
                <input
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-sm"
                  placeholder="Calle, Nro, Zona..."
                  value={newClientData.direccion}
                  onChange={e => setNewClientData({ ...newClientData, direccion: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              className="flex-1 py-4 bg-bg-dark text-white rounded-2xl text-xs font-semibold uppercase tracking-wider hover:bg-primary transition-all shadow-lg active:scale-95 shadow-black/10" 
              onClick={handleCreateClient}
            >
              Registrar Cliente
            </button>
            <button 
              type="button" 
              className="flex-1 py-4 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl text-xs font-semibold uppercase tracking-wider hover:bg-slate-100 transition-all active:scale-95" 
              onClick={() => setIsAddingClient(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepClientInfo;





