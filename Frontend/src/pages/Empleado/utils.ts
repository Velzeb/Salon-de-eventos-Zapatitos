import { getEstadoEventoBadgeClasses, getEstadoEventoLabel, normalizeEstadoEvento } from '../../utils/estadoEvento';

export const currency = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' });
export const dateLong = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
export const dateShort = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short' });

export const getEventTitle = (cumpleaneros: string[], fallback: string | number) =>
  cumpleaneros.filter(Boolean).length > 0 ? `Cumpleaños de ${cumpleaneros.join(' & ')}` : `Evento #${fallback}`;

export const getProgress = (done: number, total: number) => total > 0 ? Math.round((done / total) * 100) : 0;

export const getEventBadge = (estado: string) => {
  const key = normalizeEstadoEvento(estado);
  return {
    label: getEstadoEventoLabel(key),
    className: getEstadoEventoBadgeClasses(key)
  };
};

export const getModalidad = (paquete?: string) => {
  const value = paquete?.trim();
  if (!value || value.toLowerCase() === 'sin paquete') return 'Solo salón';
  return value;
};
