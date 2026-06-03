import { RefreshCw, Save, UploadCloud, Trash2, Folder, ExternalLink, Printer, Edit3, Image as ImageIcon, Send, MessageSquare } from 'lucide-react';
import type { EventoOperativo } from '../../../services/operativoService';
import { toast } from 'sonner';

interface Props {
  data: EventoOperativo;
  postFiesta: { linkGaleriaFotos: string; consentimientoMarketing: boolean; fechaProximoContacto: string };
  savingPostEvento: boolean;
  uploadingMultimedia: boolean;
  finalizingEvento: boolean;
  printMode?: 'hoja' | 'contrato';
  onPostFiestaChange: (v: { linkGaleriaFotos: string; consentimientoMarketing: boolean; fechaProximoContacto: string }) => void;
  onSavePostEvento: () => void;
  onUploadMultimedia: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteMultimedia: (id: number) => void;
  onFinalizar: () => void;
  onPrintHoja: () => void;
  onPrintContrato: () => void;
}

export default function CierreTab({
  data, postFiesta, savingPostEvento, uploadingMultimedia, finalizingEvento,
  onPostFiestaChange, onSavePostEvento, onUploadMultimedia, onDeleteMultimedia,
  onFinalizar, onPrintHoja, onPrintContrato
}: Props) {
  const isFinalizadoOrTerminado = ['finalizado', 'terminado'].includes(data.estado.toLowerCase());

  const handleSendWhatsApp = (tipo: 'fotos' | 'feedback') => {
    const telefono = '521' + '0000000000'; // FIXME: Necesitamos el teléfono real del cliente en el backend
    let mensaje = '';
    
    if (tipo === 'fotos') {
      if (!postFiesta.linkGaleriaFotos) {
        toast.error('Primero guarda el link de la galería de fotos');
        return;
      }
      mensaje = `¡Hola! Esperamos que hayan disfrutado mucho la fiesta. 🥳 Aquí tienes el enlace para ver y descargar las fotos del evento: ${postFiesta.linkGaleriaFotos}`;
    } else {
      mensaje = `¡Hola! Muchas gracias por celebrar con nosotros. Nos ayudaría muchísimo si pudieras dejarnos una breve reseña sobre tu experiencia: [LINK_RESEÑAS]`;
    }

    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 font-sans pb-10">
      {!isFinalizadoOrTerminado && (
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 px-5 py-4 rounded-xl flex items-start gap-3">
          <Folder className="shrink-0 mt-0.5 text-indigo-500" size={20} />
          <div>
            <p className="text-sm font-semibold">Esta pestaña es para el trabajo post-fiesta.</p>
            <p className="text-xs mt-1 opacity-80 leading-relaxed">Puedes ir subiendo fotos o documentos, pero el cierre definitivo solo debe hacerse cuando el evento haya terminado, los invitados se hayan retirado y el saldo esté liquidado.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documentos */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Printer size={16} className="text-slate-400" /> Documentos Físicos
            </h3>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center gap-4">
            <p className="text-xs text-slate-500 text-center mb-2">Imprime los documentos necesarios para la firma final o el archivo en físico.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={onPrintHoja} className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                  <Printer size={18} />
                </div>
                <span className="text-sm font-semibold text-slate-700">Hoja Operativa</span>
              </button>
              <button onClick={onPrintContrato} className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                  <Edit3 size={18} />
                </div>
                <span className="text-sm font-semibold text-slate-700">Contrato</span>
              </button>
            </div>
          </div>
        </section>

        {/* CRM Post-Fiesta */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Send size={16} className="text-slate-400" /> Seguimiento a Cliente
            </h3>
            <button onClick={onSavePostEvento} disabled={savingPostEvento} className="flex items-center gap-1.5 text-indigo-600 text-xs font-semibold bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors">
              {savingPostEvento ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />} Guardar
            </button>
          </div>
          <div className="p-6 flex-1 space-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Enlace a Galería de Fotos (Drive/Photos)</label>
              <input
                type="url"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all"
                placeholder="https://..."
                value={postFiesta.linkGaleriaFotos}
                onChange={e => onPostFiestaChange({ ...postFiesta, linkGaleriaFotos: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSendWhatsApp('fotos')}
                className="flex items-center justify-center gap-2 p-2.5 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 rounded-lg text-xs font-semibold hover:bg-[#25D366]/20 transition-colors"
              >
                <ImageIcon size={14} /> Enviar Fotos (WA)
              </button>
              <button
                onClick={() => handleSendWhatsApp('feedback')}
                className="flex items-center justify-center gap-2 p-2.5 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 rounded-lg text-xs font-semibold hover:bg-[#25D366]/20 transition-colors"
              >
                <MessageSquare size={14} /> Pedir Reseña (WA)
              </button>
            </div>

            <hr className="border-slate-100" />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="consentimiento"
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                checked={postFiesta.consentimientoMarketing}
                onChange={e => onPostFiestaChange({ ...postFiesta, consentimientoMarketing: e.target.checked })}
              />
              <label htmlFor="consentimiento" className="text-sm font-medium text-slate-700 select-none">
                El cliente aceptó el uso de fotos para marketing
              </label>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Fecha para próximo contacto (CRM)</label>
              <input
                type="date"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all"
                value={postFiesta.fechaProximoContacto}
                onChange={e => onPostFiestaChange({ ...postFiesta, fechaProximoContacto: e.target.value })}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Galería / Evidencias Físicas */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <ImageIcon size={16} className="text-slate-400" /> Evidencias del Evento
          </h3>
          <div>
            <input
              type="file"
              id="multimedia-upload"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={onUploadMultimedia}
              disabled={uploadingMultimedia}
            />
            <label
              htmlFor="multimedia-upload"
              className={`cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                uploadingMultimedia 
                  ? 'bg-slate-100 text-slate-400 pointer-events-none' 
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100'
              }`}
            >
              {uploadingMultimedia ? <RefreshCw className="animate-spin" size={14} /> : <UploadCloud size={14} />} Subir archivos
            </label>
          </div>
        </div>
        <div className="p-6">
          {data.galeriaMultimedia?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {data.galeriaMultimedia.map(media => (
                <div key={media.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  {media.tipoArchivo.startsWith('image/') ? (
                    <img src={media.url} alt={media.nombreArchivo} className="w-full h-full object-cover" />
                  ) : (
                    <video src={media.url} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <a href={media.url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center hover:scale-110 transition-transform">
                      <ExternalLink size={14} />
                    </a>
                    <button onClick={() => onDeleteMultimedia(media.id)} className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center hover:scale-110 transition-transform">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
              <ImageIcon size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No hay fotos ni evidencias</p>
              <p className="text-xs text-slate-400 mt-1">Sube fotos del montaje, del pastel o del evento en general para tu registro interno.</p>
            </div>
          )}
        </div>
      </section>

      {/* Zona Peligrosa - Cierre Definitivo */}
      {data.estado.toLowerCase() !== 'terminado' && (
        <section className="bg-white border border-rose-200 rounded-xl overflow-hidden mt-12">
          <div className="px-6 py-6 sm:flex sm:items-center sm:justify-between">
            <div className="sm:pr-8">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Cierre y Archivo del Evento
              </h3>
              <p className="text-sm text-slate-600 mt-1">Al archivar el evento, este pasará a estado "Terminado", se guardará en el historial y ya no podrá ser modificado. Asegúrate de que el pago esté liquidado al 100%.</p>
            </div>
            <div className="mt-4 sm:mt-0 sm:shrink-0">
              <button
                onClick={onFinalizar}
                disabled={finalizingEvento || data.saldoPendiente > 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-rose-200 text-rose-700 rounded-lg text-sm font-bold hover:bg-rose-50 hover:border-rose-300 transition-colors disabled:opacity-50 shadow-sm"
              >
                {finalizingEvento ? <RefreshCw className="animate-spin" size={16} /> : <><Folder size={16} /> Archivar Evento</>}
              </button>
            </div>
          </div>
          {data.saldoPendiente > 0 && (
            <div className="bg-rose-50 px-6 py-3 border-t border-rose-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <p className="text-xs font-semibold text-rose-700">
                Acción bloqueada: El evento aún tiene un saldo pendiente de ${data.saldoPendiente.toLocaleString()}.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
