import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Gift,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  User,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { clientesService, type Cliente } from '../../services/clientesService';
import { ninosService, type Nino } from '../../services/ninosService';
import { eventosService, type Evento } from '../../services/eventosService';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

const ClientesPage = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingNinos, setLoadingNinos] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ nombreCompleto: '', telefono: '', direccion: '' });

  const selectedCliente = clientes.find(cliente => cliente.id === selectedClienteId) || clientes[0];

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientesData, eventosData] = await Promise.all([
        clientesService.getClientes(),
        eventosService.getEventos()
      ]);
      setClientes(clientesData);
      setEventos(eventosData);
      setSelectedClienteId(prev => prev ?? clientesData[0]?.id ?? null);
    } catch {
      toast.error('No se pudo cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, []);

  useEffect(() => {
    if (!selectedCliente?.id) {
      void Promise.resolve().then(() => setNinos([]));
      return;
    }

    const loadNinos = async () => {
      setLoadingNinos(true);
      try {
        const data = await ninosService.getNinosByCliente(selectedCliente.id);
        setNinos(data);
      } catch {
        setNinos([]);
      } finally {
        setLoadingNinos(false);
      }
    };

    void loadNinos();
  }, [selectedCliente?.id]);

  const filteredClientes = useMemo(() => {
    const text = query.trim().toLowerCase();
    return clientes.filter(cliente =>
      !text ||
      cliente.nombreCompleto.toLowerCase().includes(text) ||
      cliente.telefono?.includes(text) ||
      cliente.direccion?.toLowerCase().includes(text)
    );
  }, [clientes, query]);

  const eventosCliente = useMemo(() => {
    if (!selectedCliente) return [];
    return eventos
      .filter(evento => evento.clientesNombres.some(nombre => nombre.toLowerCase() === selectedCliente.nombreCompleto.toLowerCase()))
      .sort((a, b) => new Date(b.fechaEvento).getTime() - new Date(a.fechaEvento).getTime());
  }, [eventos, selectedCliente]);

  const totalVendido = eventosCliente.reduce((sum, evento) => sum + evento.precioTotal, 0);
  const saldoPendiente = eventosCliente.reduce((sum, evento) => sum + evento.saldoPendiente, 0);

  const createClient = async () => {
    if (!newClient.nombreCompleto.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      const id = await clientesService.createCliente(newClient);
      toast.success('Cliente creado');
      setNewClient({ nombreCompleto: '', telefono: '', direccion: '' });
      setShowNewClient(false);
      await loadData();
      setSelectedClienteId(id);
    } catch {
      toast.error('No se pudo crear el cliente');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Users size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Clientes</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Directorio, niños asociados e historial de eventos.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          >
            <RefreshCw size={19} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowNewClient(value => !value)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-black text-white transition hover:bg-blue-600"
          >
            <Plus size={16} />
            Nuevo cliente
          </button>
        </div>
      </div>

      {showNewClient && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Agregar cliente</p>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)_44px]">
            <input className={inputClass} placeholder="Nombre completo" value={newClient.nombreCompleto} onChange={event => setNewClient({ ...newClient, nombreCompleto: event.target.value })} />
            <input className={inputClass} placeholder="Telefono" value={newClient.telefono} onChange={event => setNewClient({ ...newClient, telefono: event.target.value })} />
            <input className={inputClass} placeholder="Direccion / zona" value={newClient.direccion} onChange={event => setNewClient({ ...newClient, direccion: event.target.value })} />
            <button type="button" onClick={createClient} className="flex h-12 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-slate-900">
              <Plus size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className={`${inputClass} pl-11`}
              placeholder="Buscar cliente"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </div>

          <div className="max-h-[680px] space-y-2 overflow-y-auto pr-1">
            {filteredClientes.map(cliente => (
              <button
                type="button"
                key={cliente.id}
                onClick={() => setSelectedClienteId(cliente.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selectedCliente?.id === cliente.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                }`}
              >
                <p className="font-black text-slate-900">{cliente.nombreCompleto}</p>
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Phone size={13} />
                  {cliente.telefono || 'Sin telefono'}
                </div>
              </button>
            ))}

            {!loading && filteredClientes.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400">
                No hay clientes con ese filtro.
              </div>
            )}
          </div>
        </aside>

        <main className="space-y-6">
          {selectedCliente ? (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-white">
                      {selectedCliente.nombreCompleto.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">{selectedCliente.nombreCompleto}</h2>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-2"><Phone size={15} /> {selectedCliente.telefono || 'Sin telefono'}</span>
                        <span className="inline-flex items-center gap-2"><MapPin size={15} /> {selectedCliente.direccion || 'Sin direccion'}</span>
                        <span className="inline-flex items-center gap-2"><Mail size={15} /> Portal cliente</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Metric label="Eventos" value={eventosCliente.length.toString()} />
                    <Metric label="Vendido" value={`$${totalVendido.toLocaleString()}`} />
                    <Metric label="Saldo" value={`$${saldoPendiente.toLocaleString()}`} danger={saldoPendiente > 0} />
                  </div>
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900">Niños asociados</h3>
                    {loadingNinos && <RefreshCw size={16} className="animate-spin text-blue-600" />}
                  </div>
                  <div className="space-y-3">
                    {ninos.map(nino => (
                      <div key={nino.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Gift size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{nino.nombre}</p>
                            <p className="text-xs font-semibold text-slate-400">
                              {nino.fechaNacimiento ? new Date(nino.fechaNacimiento).toLocaleDateString() : 'Sin fecha de nacimiento'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!loadingNinos && ninos.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400">
                        No hay niños asociados.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 p-5">
                    <h3 className="text-sm font-black text-slate-900">Historial de fiestas</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-400">Eventos donde este cliente figura como responsable.</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {eventosCliente.map(evento => (
                      <div key={evento.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_150px_130px] lg:items-center">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                            <span className="text-base font-black leading-none text-slate-900">{new Date(evento.fechaEvento).getDate()}</span>
                            <span className="text-[10px] font-black uppercase text-slate-400">
                              {new Date(evento.fechaEvento).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-900">{evento.cumpleaneros.join(' & ') || 'Evento especial'}</p>
                            <p className="truncate text-sm font-semibold text-slate-500">{evento.paqueteNombre}</p>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                          <CalendarDays size={15} />
                          {evento.horaInicio.substring(0, 5)} - {evento.horaFin.substring(0, 5)}
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-900">${evento.precioTotal.toLocaleString()}</p>
                          <p className={evento.saldoPendiente > 0 ? 'text-xs font-bold text-rose-600' : 'text-xs font-bold text-emerald-600'}>
                            {evento.saldoPendiente > 0 ? `Debe $${evento.saldoPendiente.toLocaleString()}` : 'Pagado'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {eventosCliente.length === 0 && (
                      <div className="p-12 text-center">
                        <User className="mx-auto text-slate-200" size={38} />
                        <p className="mt-3 text-sm font-semibold text-slate-400">Este cliente aún no tiene eventos registrados.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center text-slate-400">
              <Users className="mx-auto mb-4" size={42} />
              <p className="font-bold">Selecciona un cliente para ver su expediente.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const Metric = ({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) => (
  <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`mt-1 text-sm font-black ${danger ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p>
  </div>
);

export default ClientesPage;
