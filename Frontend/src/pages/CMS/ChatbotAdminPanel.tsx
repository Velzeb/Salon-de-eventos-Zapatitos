import { useEffect, useState } from 'react';
import { Bot, Loader2, MessageCircle, Save, Settings2, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { chatbotService, type ChatbotConfig } from '../../services/chatbotService';

const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white';
const labelClass = 'text-[10px] font-black uppercase tracking-widest text-slate-400';

const defaultConfig: ChatbotConfig = {
  habilitado: false,
  nombreAsistente: 'Asistente Zapatitos',
  mensajeBienvenida: 'Hola, soy tu asistente de Zapatitos. Puedo ayudarte con paquetes, servicios, disponibilidad y tus eventos.',
  personalidad: 'Amable, claro, paciente y orientado a familias que organizan eventos infantiles.',
  misionEmpresa: '',
  visionEmpresa: '',
  tono: 'Cercano y profesional',
  restricciones: 'No inventes precios, disponibilidad ni condiciones. Si no tienes datos suficientes, pide aclaración o deriva a un asesor humano.',
  instruccionesSistema: '',
  modeloProveedor: 'Gemini',
  modeloNombre: 'gemini-2.5-flash',
  temperatura: 0.4,
  maxTokens: 900,
  mostrarEnLanding: true,
  mostrarEnPortalCliente: true,
  permitirConsultarEventosCliente: true,
  permitirConsultarDisponibilidad: true,
  permitirConsultarPaquetes: true,
  permitirCrearLeadOReserva: false,
  mensajeFallback: 'No pude responder con seguridad. Te puedo conectar con un asesor para ayudarte mejor.',
  escalarAWhatsApp: true,
  whatsappEscalamiento: '',
  colorPrimario: '#ff5e7e',
  posicionWidget: 'bottom-right'
};

const ChatbotAdminPanel = () => {
  const [config, setConfig] = useState<ChatbotConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    chatbotService
      .getAdminConfig()
      .then((data) => {
        if (active) setConfig({ ...defaultConfig, ...data });
      })
      .catch(() => toast.error('No se pudo cargar la configuración del chatbot'))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = <K extends keyof ChatbotConfig>(key: K, value: ChatbotConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await chatbotService.updateConfig(config);
      toast.success('Configuración del chatbot guardada');
    } catch {
      toast.error('No se pudo guardar la configuración del chatbot');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[460px] items-center justify-center rounded-[2.5rem] border border-slate-200 bg-white">
        <Loader2 className="animate-spin text-indigo-600" size={34} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-100">
              <Bot size={26} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-850">Asistente virtual</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">Controla comportamiento, fuentes permitidas y visibilidad para clientes.</p>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-100 transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
            {saving ? 'Guardando...' : 'Guardar Chatbot'}
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <span className="text-sm font-black text-slate-700">Habilitado</span>
            <input type="checkbox" checked={config.habilitado} onChange={(e) => update('habilitado', e.target.checked)} className="h-5 w-5 accent-indigo-600" />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <span className="text-sm font-black text-slate-700">Landing</span>
            <input type="checkbox" checked={config.mostrarEnLanding} onChange={(e) => update('mostrarEnLanding', e.target.checked)} className="h-5 w-5 accent-indigo-600" />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <span className="text-sm font-black text-slate-700">Portal cliente</span>
            <input type="checkbox" checked={config.mostrarEnPortalCliente} onChange={(e) => update('mostrarEnPortalCliente', e.target.checked)} className="h-5 w-5 accent-indigo-600" />
          </label>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h4 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-slate-800">
            <MessageCircle size={18} className="text-indigo-600" />
            Identidad y empresa
          </h4>
          <div className="space-y-3">
            <label className={labelClass}>Nombre del asistente</label>
            <input className={fieldClass} value={config.nombreAsistente} onChange={(e) => update('nombreAsistente', e.target.value)} />
          </div>
          <div className="space-y-3">
            <label className={labelClass}>Mensaje de bienvenida</label>
            <textarea className={`${fieldClass} min-h-28`} value={config.mensajeBienvenida} onChange={(e) => update('mensajeBienvenida', e.target.value)} />
          </div>
          <div className="space-y-3">
            <label className={labelClass}>Misión de la empresa</label>
            <textarea className={`${fieldClass} min-h-28`} value={config.misionEmpresa} onChange={(e) => update('misionEmpresa', e.target.value)} />
          </div>
          <div className="space-y-3">
            <label className={labelClass}>Visión de la empresa</label>
            <textarea className={`${fieldClass} min-h-28`} value={config.visionEmpresa} onChange={(e) => update('visionEmpresa', e.target.value)} />
          </div>
        </section>

        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h4 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-slate-800">
            <Settings2 size={18} className="text-indigo-600" />
            Comportamiento
          </h4>
          <div className="space-y-3">
            <label className={labelClass}>Personalidad</label>
            <textarea className={`${fieldClass} min-h-28`} value={config.personalidad} onChange={(e) => update('personalidad', e.target.value)} />
          </div>
          <div className="space-y-3">
            <label className={labelClass}>Tono</label>
            <input className={fieldClass} value={config.tono} onChange={(e) => update('tono', e.target.value)} />
          </div>
          <div className="space-y-3">
            <label className={labelClass}>Restricciones</label>
            <textarea className={`${fieldClass} min-h-32`} value={config.restricciones} onChange={(e) => update('restricciones', e.target.value)} />
          </div>
          <div className="space-y-3">
            <label className={labelClass}>Instrucciones adicionales</label>
            <textarea className={`${fieldClass} min-h-32`} value={config.instruccionesSistema} onChange={(e) => update('instruccionesSistema', e.target.value)} />
          </div>
        </section>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h4 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-slate-800">
            <SlidersHorizontal size={18} className="text-indigo-600" />
            Modelo y capacidades
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label className={labelClass}>Proveedor</label>
              <input className={fieldClass} value={config.modeloProveedor} onChange={(e) => update('modeloProveedor', e.target.value)} />
            </div>
            <div className="space-y-3">
              <label className={labelClass}>Modelo</label>
              <input className={fieldClass} value={config.modeloNombre} onChange={(e) => update('modeloNombre', e.target.value)} />
            </div>
            <div className="space-y-3">
              <label className={labelClass}>Temperatura</label>
              <input type="number" min="0" max="1.5" step="0.1" className={fieldClass} value={config.temperatura} onChange={(e) => update('temperatura', Number(e.target.value))} />
            </div>
            <div className="space-y-3">
              <label className={labelClass}>Máx. tokens</label>
              <input type="number" min="200" max="2000" step="50" className={fieldClass} value={config.maxTokens} onChange={(e) => update('maxTokens', Number(e.target.value))} />
            </div>
          </div>
          {[
            ['permitirConsultarPaquetes', 'Consultar paquetes y servicios'],
            ['permitirConsultarDisponibilidad', 'Consultar disponibilidad'],
            ['permitirConsultarEventosCliente', 'Consultar eventos del cliente'],
            ['permitirCrearLeadOReserva', 'Crear reservas automáticamente']
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <span className="text-sm font-black text-slate-700">{label}</span>
              <input
                type="checkbox"
                checked={Boolean(config[key as keyof ChatbotConfig])}
                onChange={(e) => update(key as keyof ChatbotConfig, e.target.checked as never)}
                className="h-5 w-5 accent-indigo-600"
              />
            </label>
          ))}
          <p className="rounded-2xl bg-amber-50 px-5 py-4 text-xs font-bold leading-relaxed text-amber-700">
            La creación automática de reservas queda como bandera de control para una fase posterior; el backend actual no confirma reservas desde el chat.
          </p>
        </section>

        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h4 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-slate-800">
            <Bot size={18} className="text-indigo-600" />
            Apariencia y escalamiento
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label className={labelClass}>Color principal</label>
              <div className="flex gap-3">
                <input type="color" value={config.colorPrimario} onChange={(e) => update('colorPrimario', e.target.value)} className="h-14 w-16 rounded-2xl border border-slate-200 bg-white p-2" />
                <input className={fieldClass} value={config.colorPrimario} onChange={(e) => update('colorPrimario', e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <label className={labelClass}>Posición</label>
              <select className={fieldClass} value={config.posicionWidget} onChange={(e) => update('posicionWidget', e.target.value as ChatbotConfig['posicionWidget'])}>
                <option value="bottom-right">Abajo derecha</option>
                <option value="bottom-left">Abajo izquierda</option>
              </select>
            </div>
          </div>
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <span className="text-sm font-black text-slate-700">Escalar a WhatsApp</span>
            <input type="checkbox" checked={config.escalarAWhatsApp} onChange={(e) => update('escalarAWhatsApp', e.target.checked)} className="h-5 w-5 accent-indigo-600" />
          </label>
          <div className="space-y-3">
            <label className={labelClass}>Número de WhatsApp para escalamiento</label>
            <input className={fieldClass} placeholder="59170000000" value={config.whatsappEscalamiento || ''} onChange={(e) => update('whatsappEscalamiento', e.target.value)} />
          </div>
          <div className="space-y-3">
            <label className={labelClass}>Mensaje fallback</label>
            <textarea className={`${fieldClass} min-h-28`} value={config.mensajeFallback} onChange={(e) => update('mensajeFallback', e.target.value)} />
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: config.colorPrimario }}>
                <MessageCircle size={20} />
              </span>
              <div>
                <p className="text-sm font-black text-slate-800">{config.nombreAsistente || 'Asistente'}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vista previa</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-relaxed text-slate-600 shadow-sm">
              {config.mensajeBienvenida}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ChatbotAdminPanel;
