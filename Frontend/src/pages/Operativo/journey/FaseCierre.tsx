import { RefreshCw, UploadCloud, Trash2, FolderLock, ExternalLink, Printer, Edit3, Image as ImageIcon, MessageSquare, HeartHandshake, ArrowLeft } from 'lucide-react';
import type { EventoOperativo } from '../../../services/operativoService';
import { toast } from 'sonner';

interface Props {
  evento: EventoOperativo;
  postFiesta: { linkGaleriaFotos: string; consentimientoMarketing: boolean; fechaProximoContacto: string };
  isUploading: boolean;
  isSaving: boolean;
  isArchiving: boolean;
  onPostFiestaChange: (v: any) => void;
  onSavePostFiesta: () => Promise<void>;
  onUploadMedia: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDeleteMedia: (id: number) => Promise<void>;
  onFinalizar: () => Promise<void>;
  onPrintHoja: () => void;
  onPrintContrato: () => void;
  onGoBack: () => void;
}

export default function FaseCierre({
  evento, postFiesta, isUploading, isSaving, isArchiving,
  onPostFiestaChange, onSavePostFiesta, onUploadMedia, onDeleteMedia,
  onFinalizar, onPrintHoja, onPrintContrato, onGoBack
}: Props) {
  const reviewUrl = import.meta.env.VITE_REVIEW_URL as string | undefined;
  const clienteTelefono = (evento.telefonoCliente || '').replace(/\D/g, '');
  const puedeEnviarWhatsApp = clienteTelefono.length >= 8;
  const puedePedirResena = puedeEnviarWhatsApp && !!reviewUrl;

  const handleSendWA = (type: 'fotos' | 'feedback') => {
    if (!puedeEnviarWhatsApp) {
      toast.error('No hay un teléfono válido del cliente para abrir WhatsApp');
      return;
    }

    if (type === 'fotos' && !postFiesta.linkGaleriaFotos) {
      toast.error('Primero guarda el link de la galería de fotos');
      return;
    }

    if (type === 'feedback' && !reviewUrl) {
      toast.error('Configura VITE_REVIEW_URL para pedir reseñas por WhatsApp');
      return;
    }

    const msg = type === 'fotos'
      ? `¡Hola! Aquí tienes las fotos de tu evento: ${postFiesta.linkGaleriaFotos}`
      : `¡Hola! Nos ayudaría muchísimo si pudieras dejarnos una reseña: ${reviewUrl}`;
    window.open(`https://wa.me/${clienteTelefono}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 font-sans space-y-12">
      <div className="mb-10 border-b border-slate-200 pb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cierre y Post-Fiesta</h1>
          <p className="text-slate-500 mt-2">Sube evidencias, agradece a tus clientes y prepara el evento para archivo final.</p>
        </div>
        <button onClick={onGoBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft size={16} /> Volver a En Vivo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gestor CRM y Mensajes */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
            <HeartHandshake size={18} className="text-rose-500" /> Relación con el Cliente (CRM)
          </h2>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Link a Galería de Fotos Externa</label>
              <input
                type="url"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                placeholder="https://drive.google.com/..."
                value={postFiesta.linkGaleriaFotos}
                onChange={e => onPostFiestaChange({ ...postFiesta, linkGaleriaFotos: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleSendWA('fotos')} disabled={!puedeEnviarWhatsApp} className="flex items-center justify-center gap-2 p-4 bg-[#25D366]/10 text-[#128C7E] rounded-xl font-bold text-sm hover:bg-[#25D366]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <ImageIcon size={16} /> Enviar Fotos
              </button>
              <button onClick={() => handleSendWA('feedback')} disabled={!puedePedirResena} className="flex items-center justify-center gap-2 p-4 bg-[#25D366]/10 text-[#128C7E] rounded-xl font-bold text-sm hover:bg-[#25D366]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <MessageSquare size={16} /> Pedir Reseña
              </button>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <input
                type="checkbox"
                id="consent"
                className="w-5 h-5 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                checked={postFiesta.consentimientoMarketing}
                onChange={e => onPostFiestaChange({ ...postFiesta, consentimientoMarketing: e.target.checked })}
              />
              <label htmlFor="consent" className="text-sm font-bold text-slate-700 select-none">
                Cliente aprobó el uso de fotos para Redes Sociales
              </label>
            </div>

            <button onClick={onSavePostFiesta} disabled={isSaving} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4">
              {isSaving ? <RefreshCw className="animate-spin" size={16} /> : 'Guardar Información CRM'}
            </button>
          </div>
        </section>

        {/* Documentos Físicos */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Printer size={18} className="text-indigo-500" /> Documentos Físicos
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={onPrintHoja} className="group flex flex-col items-center justify-center p-8 border-2 border-slate-100 rounded-2xl hover:border-indigo-500 transition-colors">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors mb-4">
                <Printer size={24} />
              </div>
              <span className="font-bold text-slate-700">Hoja Operativa</span>
            </button>
            <button onClick={onPrintContrato} className="group flex flex-col items-center justify-center p-8 border-2 border-slate-100 rounded-2xl hover:border-indigo-500 transition-colors">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors mb-4">
                <Edit3 size={24} />
              </div>
              <span className="font-bold text-slate-700">Contrato Final</span>
            </button>
          </div>
        </section>
      </div>

      {/* Evidencias (Fotos internas) */}
      <section className="bg-slate-50 rounded-3xl border border-slate-200 shadow-inner p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={18} className="text-indigo-500" /> Galería de Evidencias Internas
            </h2>
            <p className="text-xs text-slate-500 mt-1">Sube fotos del montaje o daños para el archivo interno.</p>
          </div>
          <div>
            <input type="file" id="media-upload" multiple accept="image/*,video/*" className="hidden" onChange={onUploadMedia} disabled={isUploading} />
            <label htmlFor="media-upload" className={`cursor-pointer px-6 py-3 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 transition-all ${isUploading ? 'bg-slate-200 text-slate-500' : 'bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'}`}>
              {isUploading ? <RefreshCw className="animate-spin" size={16} /> : <><UploadCloud size={16} /> Subir Evidencia</>}
            </label>
          </div>
        </div>

        {evento.galeriaMultimedia.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {evento.galeriaMultimedia.map(media => (
              <div key={media.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                {media.tipoArchivo.startsWith('image/') ? (
                  <img src={media.url} alt={media.nombreArchivo} className="w-full h-full object-cover" />
                ) : (
                  <video src={media.url} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                  <a href={media.url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-110 transition-transform">
                    <ExternalLink size={16} />
                  </a>
                  <button onClick={() => onDeleteMedia(media.id)} className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-rose-500/50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
            <ImageIcon size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-base font-bold text-slate-500">No hay fotos subidas</p>
          </div>
        )}
      </section>

      {/* Archivo Definitivo */}
      <section className="bg-white border border-rose-200 rounded-3xl overflow-hidden shadow-xl shadow-rose-500/5">
        <div className="p-8 sm:flex sm:items-center sm:justify-between bg-gradient-to-br from-white to-rose-50">
          <div className="sm:pr-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-2">
              <FolderLock className="text-rose-500" size={24} /> Archivo Definitivo del Evento
            </h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">
              Al archivar el evento, pasará a estado "Terminado", se guardará en el historial y ya no podrá ser modificado. **Verifica que no haya pagos pendientes**.
            </p>
          </div>
          <div className="mt-6 sm:mt-0 sm:shrink-0">
            <button
              onClick={onFinalizar}
              disabled={isArchiving || evento.saldoPendiente > 0}
              className="w-full sm:w-auto px-8 py-4 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl font-bold tracking-wide transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
            >
              {isArchiving ? <RefreshCw className="animate-spin" size={20} /> : 'Archivar Definitivamente'}
            </button>
          </div>
        </div>
        {evento.saldoPendiente > 0 && (
          <div className="bg-rose-500 p-4 flex items-center justify-center gap-2 text-white">
            <span className="text-sm font-bold uppercase tracking-widest">⚠️ Acción bloqueada: Saldo pendiente de ${evento.saldoPendiente.toLocaleString()}</span>
          </div>
        )}
      </section>
    </div>
  );
}
