import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  CreditCard,
  FileText,
  Gift,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { clientesService } from '../../services/clientesService';
import { ninosService } from '../../services/ninosService';
import type { EventoItemDto } from '../../services/eventosService';
import type { Paquete } from '../../services/paquetesService';
import { useReservaForm } from './hooks/useReservaForm';
import MediaViewerR2 from '../../components/common/MediaViewerR2';

const money = (value: number) => `$${(value || 0).toLocaleString()}`;

const fieldBase =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

const ReservaNuevaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [clientQuery, setClientQuery] = useState('');
  const [kidQuery, setKidQuery] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewKidFor, setShowNewKidFor] = useState<number | null>(null);
  const [catalogTab, setCatalogTab] = useState<'paquetes' | 'servicios'>('paquetes');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [newClient, setNewClient] = useState({ nombreCompleto: '', telefono: '', direccion: '' });
  const [newKid, setNewKid] = useState({ nombre: '', fechaNacimiento: '' });

  const rawDate = location.state?.selectedDate;
  const initialDate = rawDate ? new Date(rawDate) : null;
  const finalInitialDate = initialDate && !Number.isNaN(initialDate.getTime()) ? initialDate : null;

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
    loading,
    errors,
    setErrors,
    availableSlots,
    loadingSlots,
    recommendedPrice,
    handleSubmit,
    calculateAge
  } = useReservaForm(true, finalInitialDate, () => navigate('/admin/reservas'), () => navigate('/admin/reservas'));

  const selectedPaquete = paquetes.find(p => p.id.toString() === formData.paqueteId);
  const selectedClientes = clientes.filter(c => formData.clienteIds.includes(c.id));
  const selectedCumpleaneros = formData.cumpleaneros
    .map((entry, index) => ({
      ...entry,
      index,
      nino: availableNinos.find(n => n.id.toString() === entry.ninoId)
    }))
    .filter(entry => entry.ninoId);

  const filteredClientes = useMemo(() => {
    const query = clientQuery.trim().toLowerCase();
    return clientes
      .filter(cliente => !formData.clienteIds.includes(cliente.id))
      .filter(cliente => !query || cliente.nombreCompleto.toLowerCase().includes(query) || cliente.telefono?.includes(query))
      .slice(0, 6);
  }, [clientes, clientQuery, formData.clienteIds]);

  const filteredPaquetes = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    return paquetes.filter(paquete =>
      !query ||
      paquete.nombre.toLowerCase().includes(query) ||
      paquete.descripcion?.toLowerCase().includes(query)
    );
  }, [paquetes, catalogQuery]);

  const filteredNinos = useMemo(() => {
    const query = kidQuery.trim().toLowerCase();
    const selectedIds = new Set(formData.cumpleaneros.map(cumpleanero => cumpleanero.ninoId).filter(Boolean));
    return availableNinos
      .filter(nino => !selectedIds.has(nino.id.toString()))
      .filter(nino => !query || nino.nombre.toLowerCase().includes(query))
      .slice(0, 6);
  }, [availableNinos, kidQuery, formData.cumpleaneros]);

  const filteredServicios = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    return servicios.filter(service =>
      !query ||
      service.nombre.toLowerCase().includes(query) ||
      service.descripcion?.toLowerCase().includes(query)
    );
  }, [servicios, catalogQuery]);

  const saldo = Math.max((formData.precioFinal || 0) - (formData.pagoInicial || 0), 0);
  const extrasTotal = formData.items
    .filter(item => !item.esIncluidoEnPaquete)
    .reduce((total, item) => total + item.precioUnitario * item.cantidad, 0);

  const updateForm = (data: Partial<typeof formData>) => {
    setErrors({});
    setFormData(prev => ({ ...prev, ...data }));
  };

  const addClient = (id: number) => {
    updateForm({ clienteIds: [...formData.clienteIds, id] });
    setClientQuery('');
  };

  const removeClient = (id: number) => {
    updateForm({
      clienteIds: formData.clienteIds.filter(cid => cid !== id),
      cumpleaneros: [{ ninoId: '', edad: '' }]
    });
  };

  const createClient = async () => {
    if (!newClient.nombreCompleto.trim()) {
      toast.error('El nombre del responsable es obligatorio');
      return;
    }

    try {
      const newId = await clientesService.createCliente(newClient);
      const updated = await clientesService.getClientes();
      setClientes(updated);
      updateForm({ clienteIds: [...formData.clienteIds, newId] });
      setNewClient({ nombreCompleto: '', telefono: '', direccion: '' });
      setShowNewClient(false);
      toast.success('Responsable agregado a la reserva');
    } catch {
      toast.error('No se pudo crear el responsable');
    }
  };

  const updateCumpleanero = (index: number, data: { ninoId?: string; edad?: string }) => {
    const next = [...formData.cumpleaneros];
    next[index] = { ...next[index], ...data };
    updateForm({ cumpleaneros: next });
  };

  const addCumpleanero = (ninoId: number) => {
    const nino = availableNinos.find(item => item.id === ninoId);
    const entry = {
      ninoId: ninoId.toString(),
      edad: nino?.fechaNacimiento ? calculateAge(nino.fechaNacimiento, formData.fechaEvento) : ''
    };
    const emptyIndex = formData.cumpleaneros.findIndex(cumpleanero => !cumpleanero.ninoId);
    const next = [...formData.cumpleaneros];

    if (emptyIndex >= 0) next[emptyIndex] = entry;
    else next.push(entry);

    updateForm({ cumpleaneros: next });
    setKidQuery('');
  };

  const removeCumpleanero = (index: number) => {
    const next = formData.cumpleaneros.filter((_, itemIndex) => itemIndex !== index);
    updateForm({ cumpleaneros: next.length ? next : [{ ninoId: '', edad: '' }] });
  };

  const createKid = async (index: number) => {
    if (!newKid.nombre.trim() || !newKid.fechaNacimiento) {
      toast.error('Completa nombre y fecha de nacimiento del cumpleañero');
      return;
    }
    if (formData.clienteIds.length === 0) {
      toast.error('Primero selecciona al menos un responsable');
      return;
    }

    try {
      const newId = await ninosService.createNino({
        nombre: newKid.nombre,
        fechaNacimiento: newKid.fechaNacimiento,
        clienteIds: formData.clienteIds
      });
      await loadNinos();
      updateCumpleanero(index, {
        ninoId: newId.toString(),
        edad: calculateAge(newKid.fechaNacimiento, formData.fechaEvento)
      });
      setNewKid({ nombre: '', fechaNacimiento: '' });
      setShowNewKidFor(null);
      toast.success('Cumpleañero agregado');
    } catch {
      toast.error('No se pudo crear el cumpleañero');
    }
  };

  const openNewKidForm = () => {
    if (formData.clienteIds.length === 0) {
      toast.error('Primero selecciona al menos un responsable');
      return;
    }

    const emptyIndex = formData.cumpleaneros.findIndex(cumpleanero => !cumpleanero.ninoId);
    if (emptyIndex >= 0) {
      setShowNewKidFor(emptyIndex);
      return;
    }

    updateForm({ cumpleaneros: [...formData.cumpleaneros, { ninoId: '', edad: '' }] });
    setShowNewKidFor(formData.cumpleaneros.length);
  };

  const addExtraService = (serviceId: number) => {
    const service = servicios.find(s => s.id === serviceId);
    if (!service) return;
    const item: EventoItemDto = {
      servicioId: service.id,
      nombre: service.nombre,
      cantidad: 1,
      notas: '',
      esIncluidoEnPaquete: false,
      precioUnitario: service.costoBase
    };
    updateForm({ items: [...formData.items, item] });
  };

  const updateItem = (index: number, data: Partial<EventoItemDto>) => {
    const next = [...formData.items];
    next[index] = { ...next[index], ...data };
    updateForm({ items: next });
  };

  const removeItem = (index: number) => {
    updateForm({ items: formData.items.filter((_, itemIndex) => itemIndex !== index) });
  };

  const getItemImage = (item: EventoItemDto) => {
    if (item.servicioId) return servicios.find(service => service.id === item.servicioId)?.imagenUrl;
    if (item.articuloId) return articulos.find(article => article.id === item.articuloId)?.imagenUrl;
    return undefined;
  };

  const selectSlot = (horaInicio: string, horaFin: string) => {
    updateForm({
      horaInicio: (horaInicio || '').substring(0, 5),
      horaFin: (horaFin || '').substring(0, 5)
    });
  };

  const submit = () => {
    if (formData.pagoInicial > formData.precioFinal) {
      toast.error('El abono no puede ser mayor al precio final');
      return;
    }
    handleSubmit();
  };

  return (
    <div className="mx-auto max-w-7xl pb-16">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('/admin/reservas')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 transition hover:border-primary/40 hover:text-primary"
          >
            <ArrowLeft size={16} />
            Volver a reservas
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Nueva reserva</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Agenda el evento desde un solo lugar: fecha, responsables, cumpleañeros, extras y cobro.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <StatusPill label="Fecha" done={Boolean(formData.fechaEvento && formData.horaInicio && formData.horaFin)} />
          <StatusPill label="Clientes" done={formData.clienteIds.length > 0} />
          <StatusPill label="Pago" done={formData.precioFinal > 0} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle icon={Calendar} title="Agenda" subtitle="Primero bloquea día, turno, invitados y temática." />

            <div className="mt-6 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Field label="Fecha del evento" error={errors.fechaEvento}>
                  <input
                    type="date"
                    className={fieldBase}
                    value={formData.fechaEvento}
                    onChange={event => updateForm({ fechaEvento: event.target.value, horaInicio: '', horaFin: '' })}
                  />
                </Field>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Field label="Invitados">
                <input
                  type="number"
                  min="0"
                  className={fieldBase}
                  value={formData.cantidadNinosEstimada}
                  onChange={event => updateForm({ cantidadNinosEstimada: event.target.value })}
                />
                  </Field>
                  <Field label="Tematica">
                <input
                  className={fieldBase}
                  list="tematicas-reserva"
                  placeholder="Princesas"
                  value={formData.tematica}
                  onChange={event => updateForm({ tematica: event.target.value })}
                />
                <datalist id="tematicas-reserva">
                  <option value="Superheroes" />
                  <option value="Princesas" />
                  <option value="Dinosaurios" />
                  <option value="Unicornios" />
                  <option value="Roblox / Minecraft" />
                  <option value="Frozen" />
                </datalist>
                  </Field>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Turno disponible</p>
                    {errors.horario && <p className="mt-1 text-xs font-bold text-rose-500">{errors.horario}</p>}
                  </div>
                  {loadingSlots && <RefreshCw className="animate-spin text-primary" size={18} />}
                </div>

                {!formData.fechaEvento && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-400">
                    Selecciona una fecha para ver turnos.
                  </div>
                )}

                {formData.fechaEvento && !loadingSlots && availableSlots.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-400">
                    No hay turnos configurados para este día.
                  </div>
                )}

                {formData.fechaEvento && (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {availableSlots.map((slot, index) => (
                      <SlotTile
                        key={`${slot.horaInicio}-${slot.horaFin}-${index}`}
                        name={slot.nombreBloque}
                        start={(slot.horaInicio || '').substring(0, 5)}
                        end={(slot.horaFin || '').substring(0, 5)}
                        available={slot.isAvailable}
                        selected={
                          formData.horaInicio === (slot.horaInicio || '').substring(0, 5) &&
                          formData.horaFin === (slot.horaFin || '').substring(0, 5)
                        }
                        onClick={() => selectSlot(slot.horaInicio, slot.horaFin)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle icon={Users} title="Responsables" subtitle="Busca un cliente existente o crea uno sin salir del formulario." />

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className={`${fieldBase} pl-11`}
                    placeholder="Buscar por nombre o telefono"
                    value={clientQuery}
                    onChange={event => setClientQuery(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  {filteredClientes.map(cliente => (
                    <button
                      type="button"
                      key={cliente.id}
                      onClick={() => addClient(cliente.id)}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div>
                        <p className="text-sm font-black text-slate-900">{cliente.nombreCompleto}</p>
                        <p className="text-xs font-semibold text-slate-400">{cliente.telefono || 'Sin telefono registrado'}</p>
                      </div>
                      <Plus size={18} className="text-primary" />
                    </button>
                  ))}
                  {filteredClientes.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm font-semibold text-slate-400">
                      No hay coincidencias disponibles.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Responsables</p>
                  <button
                    type="button"
                    onClick={() => setShowNewClient(value => !value)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-primary"
                  >
                    <UserPlus size={14} />
                    Nuevo responsable
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedClientes.map(cliente => (
                    <div key={cliente.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{cliente.nombreCompleto}</p>
                        <p className="text-xs font-medium text-slate-400">{cliente.telefono}</p>
                      </div>
                      <button type="button" onClick={() => removeClient(cliente.id)} className="text-slate-300 hover:text-rose-500">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  {selectedClientes.length === 0 && (
                    <p className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-400">Todavia no hay responsables.</p>
                  )}
                </div>
                {errors.clienteIds && <p className="mt-3 text-xs font-bold text-rose-500">{errors.clienteIds}</p>}
              </div>
            </div>

            {showNewClient && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Agregar responsable</p>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)_44px]">
                  <input className={fieldBase} placeholder="Nombre completo" value={newClient.nombreCompleto} onChange={event => setNewClient({ ...newClient, nombreCompleto: event.target.value })} />
                  <input className={fieldBase} placeholder="Telefono" value={newClient.telefono} onChange={event => setNewClient({ ...newClient, telefono: event.target.value })} />
                  <input className={fieldBase} placeholder="Direccion / zona" value={newClient.direccion} onChange={event => setNewClient({ ...newClient, direccion: event.target.value })} />
                  <button type="button" onClick={createClient} className="flex h-12 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-slate-900">
                    <Check size={18} />
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <SectionTitle icon={Gift} title="Cumpleañeros" subtitle="Selecciona perfiles existentes o crea uno con el mismo patrón de responsables." />
              <button
                type="button"
                onClick={openNewKidForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={formData.clienteIds.length === 0}
              >
                <UserPlus size={15} />
                Nuevo cumpleañero
              </button>
            </div>
            {errors.cumpleaneros && <p className="mt-4 text-xs font-bold text-rose-500">{errors.cumpleaneros}</p>}

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className={`${fieldBase} pl-11`}
                    placeholder={formData.clienteIds.length ? 'Buscar cumpleañero' : 'Selecciona responsables primero'}
                    value={kidQuery}
                    disabled={formData.clienteIds.length === 0}
                    onChange={event => setKidQuery(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  {filteredNinos.map(nino => (
                    <button
                      type="button"
                      key={nino.id}
                      onClick={() => addCumpleanero(nino.id)}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div>
                        <p className="text-sm font-black text-slate-900">{nino.nombre}</p>
                        <p className="text-xs font-semibold text-slate-400">
                          {nino.fechaNacimiento ? `Edad estimada: ${calculateAge(nino.fechaNacimiento, formData.fechaEvento) || '-'} años` : 'Sin fecha registrada'}
                        </p>
                      </div>
                      <Plus size={18} className="text-primary" />
                    </button>
                  ))}
                  {formData.clienteIds.length > 0 && filteredNinos.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm font-semibold text-slate-400">
                      No hay cumpleañeros disponibles.
                    </div>
                  )}
                  {formData.clienteIds.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm font-semibold text-slate-400">
                      Primero selecciona al menos un responsable.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Cumpleañeros</p>
                  <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-400">
                    {selectedCumpleaneros.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedCumpleaneros.map(entry => (
                    <div key={`${entry.ninoId}-${entry.index}`} className="rounded-xl bg-white px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{entry.nino?.nombre || 'Cumpleañero seleccionado'}</p>
                          <p className="text-xs font-medium text-slate-400">Edad para el evento</p>
                        </div>
                        <button type="button" onClick={() => removeCumpleanero(entry.index)} className="text-slate-300 hover:text-rose-500">
                          <X size={18} />
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        className={`${fieldBase} mt-3`}
                        placeholder="Edad"
                        value={entry.edad}
                        onChange={event => updateCumpleanero(entry.index, { edad: event.target.value })}
                      />
                    </div>
                  ))}
                  {selectedCumpleaneros.length === 0 && (
                    <p className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-400">Todavia no hay cumpleañeros.</p>
                  )}
                </div>
              </div>
            </div>

            {showNewKidFor !== null && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Agregar cumpleañero</p>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_44px]">
                  <input className={fieldBase} placeholder="Nombre completo" value={newKid.nombre} onChange={event => setNewKid({ ...newKid, nombre: event.target.value })} />
                  <input className={fieldBase} type="date" value={newKid.fechaNacimiento} onChange={event => setNewKid({ ...newKid, fechaNacimiento: event.target.value })} />
                  <button type="button" onClick={() => createKid(showNewKidFor)} className="flex h-12 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-slate-900">
                    <Check size={18} />
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle icon={Package} title="Extras y checklist" subtitle="Reserva solo el salon o arma una combinacion con paquete y servicios sueltos." />

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="inline-grid grid-cols-2 rounded-xl bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCatalogTab('paquetes')}
                    className={`rounded-lg px-4 py-2 text-xs font-black transition ${catalogTab === 'paquetes' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-primary'}`}
                  >
                    Paquetes
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogTab('servicios')}
                    className={`rounded-lg px-4 py-2 text-xs font-black transition ${catalogTab === 'servicios' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-primary'}`}
                  >
                    Servicios
                  </button>
                </div>

                <div className="relative lg:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    className={`${fieldBase} pl-11`}
                    placeholder={catalogTab === 'paquetes' ? 'Buscar paquete' : 'Buscar velas, decoracion, show...'}
                    value={catalogQuery}
                    onChange={event => setCatalogQuery(event.target.value)}
                  />
                </div>
              </div>
              {errors.paqueteId && <p className="mt-3 text-xs font-bold text-rose-500">{errors.paqueteId}</p>}

              <div className={catalogTab === 'paquetes' ? 'mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3' : 'mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4'}>
                {catalogTab === 'paquetes' && (
                  <>
                    <NoPackageTile
                      selected={!formData.paqueteId}
                      onClick={() => updateForm({ paqueteId: '' })}
                    />
                    {filteredPaquetes.map(paquete => (
                      <PackageTile
                        key={paquete.id}
                        paquete={paquete}
                        selected={formData.paqueteId === paquete.id.toString()}
                        onClick={() => updateForm({ paqueteId: paquete.id.toString() })}
                      />
                    ))}
                  </>
                )}

                {catalogTab === 'servicios' && filteredServicios.map(service => {
                  const selectedCount = formData.items
                    .filter(item => item.servicioId === service.id && !item.esIncluidoEnPaquete)
                    .reduce((total, item) => total + item.cantidad, 0);

                  return (
                    <CatalogTile
                      key={service.id}
                      title={service.nombre}
                      subtitle={service.descripcion || 'Servicio extra'}
                      imageUrl={service.imagenUrl}
                      badge={money(service.costoBase)}
                      selectedCount={selectedCount}
                      onClick={() => addExtraService(service.id)}
                    />
                  );
                })}
              </div>

              {((catalogTab === 'paquetes' && filteredPaquetes.length === 0) || (catalogTab === 'servicios' && filteredServicios.length === 0)) && (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-400">
                  No hay resultados para esa busqueda.
                </div>
              )}
            </div>

            {selectedPaquete && (
              <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-white px-3 py-2 text-primary">{selectedPaquete.nombre}</span>
                  <span className="rounded-full bg-white px-3 py-2 text-slate-500">{selectedPaquete.servicios.length} servicios incluidos</span>
                  <span className="rounded-full bg-white px-3 py-2 text-slate-500">{selectedPaquete.articulos.length} items incluidos</span>
                  <span className="rounded-full bg-white px-3 py-2 text-emerald-600">{money(selectedPaquete.precioBase)}</span>
                  {selectedPaquete.capacidadNinos > 0 && (
                    <span className="rounded-full bg-white px-3 py-2 text-slate-500">Hasta {selectedPaquete.capacidadNinos} niños</span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {formData.items.length === 0 ? (
                <div className="p-8 text-center text-sm font-semibold text-slate-400">Reserva solo salon o agrega servicios para armar el checklist.</div>
              ) : (
                <div className="grid gap-3 p-3 lg:grid-cols-2">
                  {formData.items.map((item, index) => (
                    <div key={`${item.nombre}-${index}`} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex gap-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          <MediaViewerR2
                            url={getItemImage(item) || ''}
                            alt={item.nombre}
                            className="h-full w-full"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-900">{item.nombre}</p>
                              <p className={`mt-1 text-xs font-bold ${item.esIncluidoEnPaquete ? 'text-primary' : 'text-emerald-600'}`}>
                                {item.esIncluidoEnPaquete ? 'Incluido en paquete' : 'Extra'}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={item.esIncluidoEnPaquete}
                              onClick={() => removeItem(index)}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-20"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="mt-3 grid grid-cols-[112px_minmax(0,1fr)] gap-2">
                            <div className="flex h-11 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                              <button
                                type="button"
                                onClick={() => updateItem(index, { cantidad: Math.max(0, item.cantidad - 1) })}
                                className="flex w-9 items-center justify-center text-slate-500 transition hover:bg-white hover:text-primary"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                className="w-10 bg-transparent text-center text-sm font-black text-slate-900 outline-none"
                                value={item.cantidad}
                                onChange={event => updateItem(index, { cantidad: Number(event.target.value) || 0 })}
                              />
                              <button
                                type="button"
                                onClick={() => updateItem(index, { cantidad: item.cantidad + 1 })}
                                className="flex w-9 items-center justify-center text-slate-500 transition hover:bg-white hover:text-primary"
                              >
                                +
                              </button>
                            </div>
                            <div className="flex items-center justify-end rounded-xl bg-slate-50 px-3 text-sm font-black text-slate-800">
                              {item.precioUnitario ? money(item.precioUnitario * item.cantidad) : 'Incluido'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <input
                        className={`${fieldBase} mt-3`}
                        placeholder="Nota para staff, color, sabor, ubicacion..."
                        value={item.notas || ''}
                        onChange={event => updateItem(index, { notas: event.target.value })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle icon={FileText} title="Notas operativas" subtitle="Indicaciones internas para el equipo del evento." />
            <textarea
              className="mt-6 min-h-28 w-full rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="Ej. colocar mesa dulce cerca del ingreso, confirmar torta, preferencia de musica..."
              value={formData.notasAdmin}
              onChange={event => updateForm({ notasAdmin: event.target.value })}
            />
          </section>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Save size={19} />
              </div>
              <div>
                <h2 className="font-black text-slate-950">Confirmacion</h2>
                <p className="text-xs font-semibold text-slate-400">Resumen antes de agendar</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <SummaryRow icon={Calendar} label="Fecha" value={formData.fechaEvento || 'Pendiente'} />
              <SummaryRow icon={Clock} label="Horario" value={formData.horaInicio && formData.horaFin ? `${formData.horaInicio} - ${formData.horaFin}` : 'Pendiente'} />
              <SummaryRow icon={Package} label="Modalidad" value={selectedPaquete?.nombre || 'Solo salon'} />
              <SummaryRow icon={Users} label="Responsables" value={selectedClientes.length ? selectedClientes.map(c => c.nombreCompleto).join(', ') : 'Pendiente'} />
              <SummaryRow icon={Gift} label="Cumpleañeros" value={selectedCumpleaneros.length ? selectedCumpleaneros.map(c => c.nino?.nombre || 'Seleccionado').join(', ') : 'Pendiente'} />
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <MoneyRow label="Paquete/base" value={selectedPaquete?.precioBase || 0} />
              <MoneyRow label="Extras" value={extrasTotal} />
              <MoneyRow label="Precio sugerido" value={recommendedPrice} muted />
              <div className="my-3 h-px bg-slate-200" />
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Precio final</label>
              <input
                type="number"
                min="0"
                className={fieldBase}
                value={formData.precioFinal}
                onChange={event => updateForm({ precioFinal: Number(event.target.value) || 0, isManualPrice: true })}
              />
              {formData.isManualPrice && (
                <button
                  type="button"
                  onClick={() => updateForm({ precioFinal: recommendedPrice, isManualPrice: false })}
                  className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-primary"
                >
                  <RefreshCw size={13} />
                  Volver al sugerido
                </button>
              )}
              <label className="mb-2 mt-4 block text-xs font-black uppercase tracking-wide text-slate-500">Abono inicial</label>
              <input
                type="number"
                min="0"
                className={fieldBase}
                value={formData.pagoInicial}
                onChange={event => updateForm({ pagoInicial: Number(event.target.value) || 0 })}
              />
            </div>

            <div className="mt-4 rounded-xl bg-slate-900 p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/50">Saldo por cobrar</span>
                <CreditCard size={18} className="text-primary" />
              </div>
              <p className="mt-2 text-3xl font-black tracking-tight">{money(saldo)}</p>
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-5 py-4 text-sm font-black text-white shadow-lg shadow-primary/20 transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <Check size={18} />}
              Confirmar y agendar
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon size={18} />
    </div>
    <div>
      <h2 className="font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
    </div>
  </div>
);

const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
    {children}
    {error && <span className="mt-2 block text-xs font-bold text-rose-500">{error}</span>}
  </label>
);

const StatusPill = ({ label, done }: { label: string; done: boolean }) => (
  <div className={`rounded-xl px-4 py-3 text-center text-xs font-black ${done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
    {label}
  </div>
);

const PackageTile = ({ paquete, selected, onClick }: { paquete: Paquete; selected: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] ${
      selected ? 'border-primary ring-4 ring-primary/10' : 'border-slate-200 hover:border-primary/40'
    }`}
  >
    <div className="relative aspect-[16/10] bg-slate-100">
      <MediaViewerR2 url={paquete.imagenUrl || ''} alt={paquete.nombre} className="h-full w-full" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-600 shadow-sm">
          {money(paquete.precioBase)}
        </span>
        {selected && (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg">
            <Check size={18} />
          </span>
        )}
      </div>
    </div>
    <div className="p-4">
      <p className="min-h-6 overflow-hidden text-base font-black leading-6 text-slate-950">{paquete.nombre}</p>
      <p className="mt-1 min-h-10 overflow-hidden text-xs font-semibold leading-5 text-slate-500">
        {paquete.descripcion || 'Paquete listo para seleccionar.'}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Duracion</p>
          <p className="mt-1 text-xs font-black text-slate-800">{paquete.duracionHoras || 0}h</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Niños</p>
          <p className="mt-1 text-xs font-black text-slate-800">{paquete.capacidadNinos || '-'}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Incluye</p>
          <p className="mt-1 text-xs font-black text-slate-800">{paquete.servicios.length + paquete.articulos.length}</p>
        </div>
      </div>
    </div>
  </button>
);

const NoPackageTile = ({ selected, onClick }: { selected: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] ${
      selected ? 'border-primary ring-4 ring-primary/10' : 'border-slate-200 hover:border-primary/40'
    }`}
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
      <Package size={20} />
    </div>
    <p className="mt-4 text-base font-black text-slate-950">Solo salon</p>
    <p className="mt-1 min-h-10 text-xs font-semibold leading-5 text-slate-500">
      Reserva el espacio y agrega solamente los servicios o items que el cliente necesite.
    </p>
    <div className="mt-4 grid grid-cols-3 gap-2">
      <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Base</p>
        <p className="mt-1 text-xs font-black text-slate-800">$0</p>
      </div>
      <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Modo</p>
        <p className="mt-1 text-xs font-black text-slate-800">Libre</p>
      </div>
      <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Extras</p>
        <p className="mt-1 text-xs font-black text-slate-800">Opc.</p>
      </div>
    </div>
  </button>
);

const SlotTile = ({
  name,
  start,
  end,
  available,
  selected,
  onClick
}: {
  name: string;
  start: string;
  end: string;
  available: boolean;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    disabled={!available}
    onClick={onClick}
    className={`rounded-2xl border p-4 text-left transition active:scale-[0.98] ${
      selected
        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
        : available
          ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'
          : 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-50'
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${selected ? 'bg-white/20' : 'bg-slate-100 text-primary'}`}>
        <Clock size={19} />
      </div>
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${selected ? 'bg-white/20 text-white' : available ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
        {available ? 'Libre' : 'Ocupado'}
      </span>
    </div>
    <p className={`mt-4 text-sm font-black ${selected ? 'text-white' : 'text-slate-900'}`}>{name || 'Turno'}</p>
    <p className={`mt-1 text-2xl font-black tracking-tight ${selected ? 'text-white' : 'text-slate-950'}`}>
      {start} - {end}
    </p>
  </button>
);

const CatalogTile = ({
  title,
  subtitle,
  imageUrl,
  badge,
  selectedCount,
  onClick
}: {
  title: string;
  subtitle: string;
  imageUrl?: string;
  badge: string;
  selectedCount: number;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg active:scale-[0.98]"
  >
    <div className="relative aspect-[4/3] bg-slate-100">
      <MediaViewerR2 url={imageUrl || ''} alt={title} className="h-full w-full" />
      <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-black text-slate-800 shadow-sm">
        {badge}
      </span>
      {selectedCount > 0 && (
        <span className="absolute right-2 top-2 flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2 text-xs font-black text-white shadow-lg">
          x{selectedCount}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-lg">
          <Plus size={18} />
        </span>
      </div>
    </div>
    <div className="space-y-1 p-3">
      <p className="min-h-10 overflow-hidden text-sm font-black leading-5 text-slate-900">{title}</p>
      <p className="min-h-8 overflow-hidden text-xs font-semibold leading-4 text-slate-400">{subtitle}</p>
    </div>
  </button>
);

const SummaryRow = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
    <Icon size={16} className="mt-0.5 shrink-0 text-slate-400" />
    <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const MoneyRow = ({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) => (
  <div className={`flex items-center justify-between py-1 text-sm font-bold ${muted ? 'text-slate-400' : 'text-slate-700'}`}>
    <span>{label}</span>
    <span>{money(value)}</span>
  </div>
);

export default ReservaNuevaPage;
