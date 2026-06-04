using System;
using System.Collections.Generic;

namespace Zapatitos.Domain.Entities;

public class ChatbotConfig : BaseEntity
{
    public bool Habilitado { get; set; } = false;
    public string NombreAsistente { get; set; } = "Asistente Zapatitos";
    public string MensajeBienvenida { get; set; } = "Hola, soy tu asistente de Zapatitos. Puedo ayudarte con paquetes, servicios, disponibilidad y tus eventos.";
    public string Personalidad { get; set; } = "Amable, claro, paciente y orientado a familias que organizan eventos infantiles.";
    public string MisionEmpresa { get; set; } = "";
    public string VisionEmpresa { get; set; } = "";
    public string Tono { get; set; } = "Cercano y profesional";
    public string Restricciones { get; set; } = "No inventes precios, disponibilidad ni condiciones. Si no tienes datos suficientes, pide aclaración o deriva a un asesor humano.";
    public string InstruccionesSistema { get; set; } = "";
    public string ModeloProveedor { get; set; } = "Gemini";
    public string ModeloNombre { get; set; } = "gemini-2.5-flash-lite";
    public decimal Temperatura { get; set; } = 0.4m;
    public int MaxTokens { get; set; } = 500;
    public bool MostrarEnLanding { get; set; } = true;
    public bool MostrarEnPortalCliente { get; set; } = true;
    public bool PermitirConsultarEventosCliente { get; set; } = true;
    public bool PermitirConsultarDisponibilidad { get; set; } = true;
    public bool PermitirConsultarPaquetes { get; set; } = true;
    public bool PermitirCrearLeadOReserva { get; set; } = false;
    public string MensajeFallback { get; set; } = "No pude responder con seguridad. Te puedo conectar con un asesor para ayudarte mejor.";
    public bool EscalarAWhatsApp { get; set; } = true;
    public string? WhatsappEscalamiento { get; set; }
    public string ColorPrimario { get; set; } = "#ff5e7e";
    public string PosicionWidget { get; set; } = "bottom-right";
}

public class ChatbotConversation : BaseEntity
{
    public long UsuarioId { get; set; }
    public string Titulo { get; set; } = "Nueva conversación";
    public string Canal { get; set; } = "web";
    public DateTime? UltimaInteraccionEn { get; set; }
    public virtual ICollection<ChatbotMessage> Mensajes { get; set; } = new List<ChatbotMessage>();
}

public class ChatbotMessage : BaseEntity
{
    public long ConversationId { get; set; }
    public virtual ChatbotConversation Conversation { get; set; } = null!;
    public long UsuarioId { get; set; }
    public string Rol { get; set; } = "user";
    public string Contenido { get; set; } = "";
    public string? Modelo { get; set; }
    public int TokensEntrada { get; set; }
    public int TokensSalida { get; set; }
    public string? MetadataJson { get; set; }
}
