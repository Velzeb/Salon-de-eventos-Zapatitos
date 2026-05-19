export type EstadoEventoKey =
  | 'provisional'
  | 'confirmado'
  | 'encurso'
  | 'finalizado'
  | 'terminado'
  | 'cancelado'
  | 'desconocido';

export function normalizeEstadoEvento(estado?: string | null): EstadoEventoKey {
  if (!estado) return 'desconocido';
  const key = estado.toString().trim().toLowerCase();

  switch (key) {
    case 'provisional':
    case 'confirmado':
    case 'encurso':
    case 'finalizado':
    case 'terminado':
    case 'cancelado':
      return key as EstadoEventoKey;
    default:
      return 'desconocido';
  }
}

export function getEstadoEventoLabel(key: EstadoEventoKey): string {
  switch (key) {
    case 'provisional':
      return 'Provisional';
    case 'confirmado':
      return 'Confirmado';
    case 'encurso':
      return 'En curso';
    case 'finalizado':
      return 'Finalizado';
    case 'terminado':
      return 'Terminado';
    case 'cancelado':
      return 'Cancelado';
    default:
      return 'Desconocido';
  }
}

export function getEstadoEventoBadgeClasses(key: EstadoEventoKey): string {
  switch (key) {
    case 'provisional':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'confirmado':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'encurso':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'finalizado':
      return 'bg-purple-50 text-purple-700 border-purple-100';
    case 'terminado':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'cancelado':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function toEstadoEventoValueForApi(key: EstadoEventoKey): string {
  switch (key) {
    case 'provisional':
      return 'Provisional';
    case 'confirmado':
      return 'Confirmado';
    case 'encurso':
      return 'EnCurso';
    case 'finalizado':
      return 'Finalizado';
    case 'terminado':
      return 'Terminado';
    case 'cancelado':
      return 'Cancelado';
    default:
      return 'Provisional';
  }
}

export const ESTADO_EVENTO_FILTERS: Array<{ id: 'todos' | EstadoEventoKey; label: string }> = [
  { id: 'todos', label: 'Todos los estados' },
  { id: 'provisional', label: 'Provisional' },
  { id: 'confirmado', label: 'Confirmado' },
  { id: 'encurso', label: 'En curso' },
  { id: 'finalizado', label: 'Finalizado' },
  { id: 'terminado', label: 'Terminado' },
  { id: 'cancelado', label: 'Cancelado' }
];

export const ESTADO_EVENTO_SELECT_OPTIONS: Array<{ value: string; key: EstadoEventoKey; label: string }> = [
  { value: 'Provisional', key: 'provisional', label: 'Provisional' },
  { value: 'Confirmado', key: 'confirmado', label: 'Confirmado' },
  { value: 'EnCurso', key: 'encurso', label: 'En curso' },
  { value: 'Finalizado', key: 'finalizado', label: 'Finalizado' },
  { value: 'Terminado', key: 'terminado', label: 'Terminado' },
  { value: 'Cancelado', key: 'cancelado', label: 'Cancelado' }
];
