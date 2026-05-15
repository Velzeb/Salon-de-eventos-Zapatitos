import { useEffect, useState } from 'react';
import { 
  Package, 
  Plus, 
  RefreshCw, 
  X,
  Info,
  ShoppingBag,
  List,
  Trash2
} from 'lucide-react';
import { paquetesService } from '../../services/paquetesService';
import type { Paquete } from '../../services/paquetesService';
import PaqueteModal from './components/PaqueteModal';

const PaquetesPage = () => {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaquete, setSelectedPaquete] = useState<Paquete | null>(null);

  useEffect(() => {
    loadPaquetes();
  }, []);

  const loadPaquetes = async () => {
    setLoading(true);
    try {
      const data = await paquetesService.getPaquetes();
      setPaquetes(data);
    } catch (err) {
      console.error('Error al cargar paquetes', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <ShoppingBag size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Planes y Experiencias
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Paquetes comerciales para reservas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadPaquetes}
            className="w-12 h-12 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-200 shrink-0"
            title="Actualizar"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium" 
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={20} /> Nuevo Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Cargando paquetes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paquetes.map((p) => (
            <div 
              key={p.id} 
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Package size={24} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium text-slate-500 mb-0.5">Precio Base</span>
                  <div className="text-xl font-bold text-slate-800">
                    ${p.precioBase.toLocaleString()}
                  </div>
                  {p.descuento > 0 && (
                    <span className="text-xs font-semibold text-emerald-600 mt-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Desc. -${p.descuento.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{p.nombre}</h3>
                  <p className="text-slate-500 text-sm line-clamp-2">{p.descripcion || 'Sin descripción disponible.'}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Servicios Incluidos</label>
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{p.servicios.length} Items</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.servicios.length > 0 ? (
                      <>
                        {p.servicios.slice(0, 4).map((s, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 px-2.5 py-1.5 rounded-lg truncate max-w-[200px]">
                            <span className="text-indigo-600 font-bold mr-1">{s.cantidad}x</span> {s.nombre}
                          </div>
                        ))}
                        {p.servicios.length > 4 && (
                          <div className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200">
                            +{p.servicios.length - 4} Más
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-slate-400">Sin servicios vinculados</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setSelectedPaquete(p)}
                  className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Info size={16} /> Ver detalles
                </button>
                <div className="flex gap-2">
                  <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PaqueteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={loadPaquetes} 
      />

      {/* DETALLE LATERAL (DRAWER) */}
      {selectedPaquete && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedPaquete(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="space-y-1">
                <p className="text-indigo-600 font-semibold text-xs uppercase tracking-wider">Detalles del Plan</p>
                <h2 className="text-2xl font-bold text-slate-800">{selectedPaquete.nombre}</h2>
              </div>
              <button 
                onClick={() => setSelectedPaquete(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Precio Base</span>
                  <div className="text-2xl font-bold text-slate-800">${selectedPaquete.precioBase.toLocaleString()}</div>
                </div>
                <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                  <span className="text-xs font-medium text-emerald-600 block mb-1">Descuento</span>
                  <div className="text-2xl font-bold text-emerald-700">${selectedPaquete.descuento.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <List size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Servicios Incluidos</h3>
                    <p className="text-sm text-slate-500">Componentes de este paquete</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {selectedPaquete.servicios.length > 0 ? (
                    selectedPaquete.servicios.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center">
                            {s.cantidad}x
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{s.nombre}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-500">${(s.costoBase * s.cantidad).toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-sm text-slate-500">No hay servicios vinculados</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between gap-3">
              <button 
                onClick={() => setSelectedPaquete(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                Editar Paquete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaquetesPage;
