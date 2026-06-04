import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { chatbotService, type ChatbotPublicSettings, type ChatbotSuggestedAction } from '../../services/chatbotService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: ChatbotSuggestedAction[];
}

const quickPrompts = [
  '¿Qué paquetes tienen?',
  'Quiero consultar disponibilidad',
  '¿Cuál es el saldo de mi evento?'
];

const ChatbotWidget = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ChatbotPublicSettings | null>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isClient = authService.isAuthenticated() && authService.hasRole(['Cliente']);
  const isClientPortal = window.location.pathname.startsWith('/cliente');
  const shouldShow = useMemo(() => {
    if (!isClient || !settings?.habilitado) return false;
    return isClientPortal ? settings.mostrarEnPortalCliente : settings.mostrarEnLanding;
  }, [isClient, isClientPortal, settings]);

  useEffect(() => {
    if (!isClient) return;
    let active = true;
    chatbotService
      .getPublicSettings()
      .then((data) => {
        if (!active) return;
        setSettings(data);
        setMessages([{ id: 'welcome', role: 'assistant', text: data.mensajeBienvenida }]);
      })
      .catch(() => setFailed(true));
    return () => {
      active = false;
    };
  }, [isClient]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  if (!shouldShow || failed || !settings) return null;

  const positionClass = settings.posicionWidget === 'bottom-left' ? 'left-5 sm:left-8' : 'right-5 sm:right-8';
  const primary = settings.colorPrimario || '#ff5e7e';

  const send = async (value = input) => {
    const text = value.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text }]);

    try {
      const response = await chatbotService.sendMessage(text, conversationId);
      setConversationId(response.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: response.reply,
          actions: response.suggestedActions || []
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'No pude responder en este momento. Intenta de nuevo o comunícate con un asesor.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = settings.whatsappEscalamiento
    ? `https://wa.me/${settings.whatsappEscalamiento.replace(/\D/g, '')}`
    : '';

  return (
    <div className={`fixed bottom-5 z-[90] ${positionClass}`}>
      {open && (
        <div className="mb-4 flex h-[min(620px,calc(100vh-110px))] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between px-5 py-4 text-white" style={{ backgroundColor: primary }}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                <Bot size={21} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{settings.nombreAsistente}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">En línea</p>
              </div>
            </div>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-5">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[84%] space-y-2">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      message.role === 'user'
                        ? 'text-white'
                        : 'border border-slate-100 bg-white text-slate-700'
                    }`}
                    style={message.role === 'user' ? { backgroundColor: primary } : undefined}
                  >
                    {message.text}
                  </div>
                  {message.role === 'assistant' && message.actions && message.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {message.actions.map((action) => (
                        <button
                          key={`${message.id}-${action.path}`}
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            navigate(action.path);
                          }}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-500 shadow-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Pensando...
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-slate-100 bg-white px-4 py-3">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className="shrink-0 rounded-full border border-slate-200 px-3 py-2 text-[11px] font-black text-slate-600 transition hover:border-pink-200 hover:bg-pink-50"
                  onClick={() => send(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {settings.escalarAWhatsApp && whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="border-t border-slate-100 bg-emerald-50 px-4 py-2 text-center text-[11px] font-black uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-100"
            >
              Hablar por WhatsApp
            </a>
          )}

          <form
            className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu consulta..."
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-pink-300 focus:bg-white"
              maxLength={1500}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: primary }}
              aria-label="Enviar mensaje"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-[0_18px_45px_rgba(15,23,42,0.25)] transition hover:scale-105 active:scale-95"
        style={{ backgroundColor: primary }}
        onClick={() => setOpen((value) => !value)}
        aria-label="Abrir asistente virtual"
      >
        {open ? <X size={26} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
};

export default ChatbotWidget;
