using System.Globalization;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;
using Zapatitos.Infrastructure.Persistence;

namespace Zapatitos.API.Controllers;

public record ChatbotConfigDto(
    bool Habilitado,
    string NombreAsistente,
    string MensajeBienvenida,
    string Personalidad,
    string MisionEmpresa,
    string VisionEmpresa,
    string Tono,
    string Restricciones,
    string InstruccionesSistema,
    string ModeloProveedor,
    string ModeloNombre,
    decimal Temperatura,
    int MaxTokens,
    bool MostrarEnLanding,
    bool MostrarEnPortalCliente,
    bool PermitirConsultarEventosCliente,
    bool PermitirConsultarDisponibilidad,
    bool PermitirConsultarPaquetes,
    bool PermitirCrearLeadOReserva,
    string MensajeFallback,
    bool EscalarAWhatsApp,
    string? WhatsappEscalamiento,
    string ColorPrimario,
    string PosicionWidget
);

public record ChatbotPublicSettingsDto(
    bool Habilitado,
    string NombreAsistente,
    string MensajeBienvenida,
    bool MostrarEnLanding,
    bool MostrarEnPortalCliente,
    bool EscalarAWhatsApp,
    string? WhatsappEscalamiento,
    string ColorPrimario,
    string PosicionWidget
);

public record ChatbotMessageRequest(long? ConversationId, string Message, string? CurrentPath);
public record ChatbotSuggestedAction(string Label, string Path);
public record ChatbotMessageResponse(long ConversationId, string Reply, bool EscalateToWhatsApp, string? Whatsapp, List<ChatbotSuggestedAction> SuggestedActions);
public record ChatbotConversationDto(long Id, string Titulo, DateTime? UltimaInteraccionEn);
public record ChatbotToolPlan(
    bool ConsultarPaquetes,
    bool ConsultarDisponibilidad,
    string? FechaDisponibilidad,
    bool ConsultarEventosCliente,
    string? Motivo
);
public record ChatbotToolContext(string Context, List<ChatbotSuggestedAction> SuggestedActions);

[Authorize]
public class ChatbotController : ApiControllerBase
{
    private readonly ZapatitosDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ChatbotController> _logger;

    public ChatbotController(
        ZapatitosDbContext context,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<ChatbotController> logger)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet("config/admin")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<ChatbotConfigDto>> GetAdminConfig()
    {
        var config = await GetOrCreateConfigAsync();
        return Ok(ToDto(config));
    }

    [HttpPut("config")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> UpdateConfig([FromBody] ChatbotConfigDto dto)
    {
        var config = await GetOrCreateConfigAsync();
        ApplyDto(config, dto);
        _context.ChatbotConfigs.Update(config);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("public-settings")]
    [Authorize(Roles = "Cliente")]
    public async Task<ActionResult<ChatbotPublicSettingsDto>> GetPublicSettings()
    {
        var config = await GetOrCreateConfigAsync();
        return Ok(new ChatbotPublicSettingsDto(
            config.Habilitado,
            config.NombreAsistente,
            config.MensajeBienvenida,
            config.MostrarEnLanding,
            config.MostrarEnPortalCliente,
            config.EscalarAWhatsApp,
            config.WhatsappEscalamiento,
            config.ColorPrimario,
            config.PosicionWidget
        ));
    }

    [HttpGet("conversations")]
    [Authorize(Roles = "Cliente")]
    public async Task<ActionResult<IEnumerable<ChatbotConversationDto>>> GetConversations()
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == null) return Unauthorized();

        var conversations = await _context.ChatbotConversations
            .Where(c => c.UsuarioId == usuarioId && c.EliminadoEn == null)
            .OrderByDescending(c => c.UltimaInteraccionEn ?? c.CreadoEn)
            .Take(20)
            .Select(c => new ChatbotConversationDto(c.Id, c.Titulo, c.UltimaInteraccionEn))
            .ToListAsync();

        return Ok(conversations);
    }

    [HttpPost("message")]
    [Authorize(Roles = "Cliente")]
    public async Task<ActionResult<ChatbotMessageResponse>> SendMessage([FromBody] ChatbotMessageRequest request, CancellationToken cancellationToken)
    {
        var usuarioId = GetUsuarioId();
        if (usuarioId == null) return Unauthorized();

        var config = await GetOrCreateConfigAsync();
        if (!config.Habilitado)
        {
            return Ok(new ChatbotMessageResponse(0, "El asistente virtual no está disponible por el momento.", config.EscalarAWhatsApp, config.WhatsappEscalamiento, new()));
        }

        var message = (request.Message ?? string.Empty).Trim();
        if (message.Length < 1) return BadRequest("El mensaje no puede estar vacío.");
        if (message.Length > 1500) return BadRequest("El mensaje es demasiado largo.");

        var conversation = await GetOrCreateConversationAsync(usuarioId.Value, request.ConversationId, message);
        var userMessage = new ChatbotMessage
        {
            ConversationId = conversation.Id,
            UsuarioId = usuarioId.Value,
            Rol = "user",
            Contenido = message
        };
        _context.ChatbotMessages.Add(userMessage);

        var reply = config.MensajeFallback;
        var suggestedActions = new List<ChatbotSuggestedAction>();
        try
        {
            var toolContext = await BuildBusinessContextAsync(config, usuarioId.Value, message, cancellationToken);
            suggestedActions = toolContext.SuggestedActions;
            var context = toolContext.Context;
            reply = await GenerateGeminiReplyAsync(config, context, message, cancellationToken);
            if (reply == config.MensajeFallback)
            {
                reply = BuildDeterministicReply(context, suggestedActions);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generando respuesta del chatbot.");
            reply = suggestedActions.Count > 0
                ? BuildDeterministicReply("", suggestedActions)
                : config.MensajeFallback;
        }

        conversation.UltimaInteraccionEn = DateTime.UtcNow;
        _context.ChatbotConversations.Update(conversation);
        _context.ChatbotMessages.Add(new ChatbotMessage
        {
            ConversationId = conversation.Id,
            UsuarioId = usuarioId.Value,
            Rol = "assistant",
            Contenido = reply,
            Modelo = config.ModeloNombre
        });

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new ChatbotMessageResponse(
            conversation.Id,
            reply,
            config.EscalarAWhatsApp && LooksLikeEscalationNeeded(reply),
            config.WhatsappEscalamiento,
            suggestedActions
        ));
    }

    private long? GetUsuarioId()
    {
        var sub = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(sub, out var usuarioId) ? usuarioId : null;
    }

    private async Task<ChatbotConfig> GetOrCreateConfigAsync()
    {
        var config = await _context.ChatbotConfigs
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.EliminadoEn == null);

        if (config != null) return config;

        config = new ChatbotConfig();
        _context.ChatbotConfigs.Add(config);
        await _context.SaveChangesAsync();
        return config;
    }

    private async Task<ChatbotConversation> GetOrCreateConversationAsync(long usuarioId, long? conversationId, string firstMessage)
    {
        if (conversationId.HasValue)
        {
            var existing = await _context.ChatbotConversations
                .FirstOrDefaultAsync(c => c.Id == conversationId.Value && c.UsuarioId == usuarioId && c.EliminadoEn == null);
            if (existing != null) return existing;
        }

        var title = firstMessage.Length > 48 ? firstMessage[..48] + "..." : firstMessage;
        var conversation = new ChatbotConversation
        {
            UsuarioId = usuarioId,
            Titulo = string.IsNullOrWhiteSpace(title) ? "Nueva conversación" : title,
            UltimaInteraccionEn = DateTime.UtcNow
        };
        _context.ChatbotConversations.Add(conversation);
        await _context.SaveChangesAsync();
        return conversation;
    }

    private async Task<ChatbotToolContext> BuildBusinessContextAsync(ChatbotConfig config, long usuarioId, string message, CancellationToken ct)
    {
        var plan = await BuildToolPlanAsync(config, message, ct);
        var actions = new List<ChatbotSuggestedAction>();
        var sb = new StringBuilder();
        sb.AppendLine("DATOS CONTROLADOS DEL SISTEMA:");
        sb.AppendLine("- Plan de herramientas decidido por el modelo:");
        sb.AppendLine($"  paquetes: {plan.ConsultarPaquetes}");
        sb.AppendLine($"  disponibilidad: {plan.ConsultarDisponibilidad}");
        sb.AppendLine($"  fecha_disponibilidad: {plan.FechaDisponibilidad ?? "sin fecha"}");
        sb.AppendLine($"  eventos_cliente: {plan.ConsultarEventosCliente}");
        if (!string.IsNullOrWhiteSpace(plan.Motivo)) sb.AppendLine($"  motivo: {plan.Motivo}");

        var webKeys = new[]
        {
            "hero_title", "hero_subtitle", "contact_phone", "contact_email", "contact_address",
            "contact_whatsapp", "business_hours_weekdays", "business_hours_weekend",
            "faqs_json", "salon_title", "salon_description"
        };

        var webConfig = await _context.ConfiguracionesWeb
            .Where(c => webKeys.Contains(c.Clave) && c.EliminadoEn == null)
            .ToDictionaryAsync(c => c.Clave, c => c.Valor, ct);

        if (webConfig.Count > 0)
        {
            sb.AppendLine("- Información web/contacto:");
            foreach (var item in webConfig)
            {
                sb.AppendLine($"  {item.Key}: {Limit(item.Value, 700)}");
            }
        }

        if (config.PermitirConsultarPaquetes && plan.ConsultarPaquetes)
        {
            actions.Add(new ChatbotSuggestedAction("Ver paquetes y servicios", "/servicios-y-paquetes"));
            var paquetes = await _context.Paquetes
                .Include(p => p.Servicios)
                    .ThenInclude(ps => ps.Servicio)
                .Where(p => p.EliminadoEn == null && p.Estado == EstadoGeneral.Activo)
                .OrderBy(p => p.PrecioBase)
                .Take(12)
                .ToListAsync(ct);

            sb.AppendLine("- Paquetes activos:");
            sb.AppendLine("  Responde de forma breve. No listes todos los paquetes salvo que el usuario lo pida. Sugiere usar el botón 'Ver paquetes y servicios' para revisar el catálogo completo.");
            foreach (var p in paquetes)
            {
                var servicios = string.Join(", ", p.Servicios
                    .Where(ps => ps.Servicio.EliminadoEn == null && ps.Servicio.Estado == EstadoGeneral.Activo)
                    .Select(ps => $"{ps.Servicio.Nombre} x{ps.Cantidad}"));
                sb.AppendLine($"  {p.Nombre}: {p.Descripcion}. Precio base: {p.PrecioBase:0.##}. Duración: {p.DuracionHoras}h. Capacidad: {p.CapacidadNinos} niños. Incluye: {servicios}");
            }
        }

        if (config.PermitirConsultarDisponibilidad && plan.ConsultarDisponibilidad)
        {
            var date = TryParseIsoDate(plan.FechaDisponibilidad) ?? TryExtractDate(message);
            if (date.HasValue)
            {
                actions.Add(new ChatbotSuggestedAction("Reservar", "/reservar"));
                var localDate = DateTime.SpecifyKind(date.Value.Date, DateTimeKind.Utc);
                var dayOfWeek = (int)localDate.DayOfWeek;
                var configs = await _context.DisponibilidadConfigs
                    .Where(c => c.DiaSemana == dayOfWeek && c.Activo && c.EliminadoEn == null)
                    .ToListAsync(ct);
                var events = await _context.Eventos
                    .Where(e => e.FechaEvento.Date == localDate && e.Estado != EstadoEvento.Cancelado && e.EliminadoEn == null)
                    .ToListAsync(ct);

                sb.AppendLine($"- Disponibilidad para {localDate:yyyy-MM-dd}:");
                if (configs.Count == 0)
                {
                    sb.AppendLine("  No hay turnos configurados para ese día.");
                }
                else
                {
                    foreach (var slot in configs.OrderBy(c => c.HoraInicio))
                    {
                        var available = !events.Any(e => e.HoraInicio < slot.HoraFin && e.HoraFin > slot.HoraInicio);
                        sb.AppendLine($"  {slot.NombreBloque}: {slot.HoraInicio:hh\\:mm}-{slot.HoraFin:hh\\:mm} => {(available ? "disponible" : "ocupado")}");
                    }
                }
            }
            else
            {
                sb.AppendLine("- Disponibilidad: el usuario pregunta por agenda, pero no indicó una fecha clara. Pide la fecha en formato día/mes/año o yyyy-mm-dd.");
            }
        }

        if (config.PermitirConsultarEventosCliente && plan.ConsultarEventosCliente)
        {
            actions.Add(new ChatbotSuggestedAction("Ver mis eventos", "/cliente/dashboard"));
            var eventos = await _context.Eventos
                .Include(e => e.Paquete)
                .Include(e => e.ClientesResponsables)
                .Include(e => e.Cumpleaneros)
                    .ThenInclude(c => c.Nino)
                .Where(e => e.ClientesResponsables.Any(c => c.UsuarioId == usuarioId) && e.EliminadoEn == null)
                .OrderByDescending(e => e.FechaEvento)
                .Take(5)
                .ToListAsync(ct);

            sb.AppendLine("- Eventos del cliente autenticado:");
            if (eventos.Count == 0)
            {
                sb.AppendLine("  No se encontraron eventos asociados al cliente.");
            }
            foreach (var e in eventos)
            {
                actions.Add(new ChatbotSuggestedAction($"Ver evento #{e.Id}", $"/cliente/eventos/{e.Id}"));
                var cumpleaneros = string.Join(", ", e.Cumpleaneros.Select(c => c.Nino?.Nombre ?? "Cumpleañero"));
                sb.AppendLine($"  Evento #{e.Id}: {e.FechaEvento:yyyy-MM-dd} {e.HoraInicio:hh\\:mm}-{e.HoraFin:hh\\:mm}, estado {e.Estado}, paquete {e.Paquete?.Nombre ?? "Solo salón"}, cumpleañero(s): {cumpleaneros}, total {e.PrecioTotal:0.##}, saldo pendiente {e.SaldoPendiente:0.##}. Link detalle: /cliente/eventos/{e.Id}");
            }
        }

        return new ChatbotToolContext(sb.ToString(), DeduplicateActions(actions));
    }

    private async Task<ChatbotToolPlan> BuildToolPlanAsync(ChatbotConfig config, string userMessage, CancellationToken ct)
    {
        var fallback = BuildFallbackToolPlan(userMessage);
        var apiKey = _configuration["Chatbot:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Contains("YOUR_", StringComparison.OrdinalIgnoreCase))
        {
            return fallback;
        }

        try
        {
            var prompt = $$"""
            Eres el planificador de herramientas de un asistente para una empresa de eventos infantiles.
            Tu trabajo NO es responder al usuario. Tu trabajo es decidir qué herramientas internas debe consultar el backend.

            Fecha actual del sistema: {{DateTime.Today:yyyy-MM-dd}}

            Herramientas disponibles:
            - paquetes: lista paquetes, servicios, precios base, duración y capacidad.
            - disponibilidad: revisa turnos disponibles para una fecha concreta.
            - eventos_cliente: revisa eventos, pagos, saldos, horarios e invitaciones del cliente autenticado.

            Interpreta español natural, abreviaciones y errores ortográficos. Ejemplos:
            - "jullio", "jul", "julioo" => julio
            - "ai lugar", "ay lugar", "hay disponibilidad" => disponibilidad
            - "cuanto debo", "mi saldo", "mi reserva" => eventos_cliente

            Devuelve SOLO JSON válido, sin markdown, con esta forma exacta:
            {
              "consultarPaquetes": false,
              "consultarDisponibilidad": false,
              "fechaDisponibilidad": null,
              "consultarEventosCliente": false,
              "motivo": "breve explicación interna"
            }

            Reglas:
            - Si el usuario pregunta por disponibilidad o reservar una fecha, consultarDisponibilidad=true.
            - Si hay una fecha explícita o inferible, fechaDisponibilidad debe ser ISO yyyy-MM-dd.
            - Si falta fecha para disponibilidad, fechaDisponibilidad=null.
            - Si pregunta por paquetes, servicios, precios o qué incluye, consultarPaquetes=true.
            - Si pregunta por su evento, saldo, pagos, invitación u horario de una reserva propia, consultarEventosCliente=true.

            Mensaje del usuario:
            {{userMessage}}
            """;

            var raw = await GenerateGeminiTextAsync(config, prompt, 0.1m, 250, ct);
            var json = ExtractJsonObject(raw);
            var plan = JsonSerializer.Deserialize<ChatbotToolPlan>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (plan == null) return fallback;

            return plan with
            {
                ConsultarPaquetes = plan.ConsultarPaquetes || fallback.ConsultarPaquetes,
                ConsultarDisponibilidad = plan.ConsultarDisponibilidad || fallback.ConsultarDisponibilidad,
                FechaDisponibilidad = NormalizePlannerDate(plan.FechaDisponibilidad) ?? fallback.FechaDisponibilidad,
                ConsultarEventosCliente = (plan.ConsultarEventosCliente || fallback.ConsultarEventosCliente) && LooksLikeClientEventQuestion(userMessage)
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo generar plan de herramientas con Gemini. Usando fallback local.");
            return fallback;
        }
    }

    private static ChatbotToolPlan BuildFallbackToolPlan(string message)
    {
        var consultarPaquetes = MentionsAny(message, "paquete", "paqete", "plan", "precio", "costo", "incluye", "servicio", "serbicio");
        var consultarDisponibilidad = MentionsAny(message, "disponible", "disponibilidad", "dispinible", "fecha", "horario", "turno", "agenda", "reservar", "reserbar", "lugar", "hay", "ai ", "ay ");
        var consultarEventosCliente = LooksLikeClientEventQuestion(message);
        var date = TryExtractDate(message);

        return new ChatbotToolPlan(
            consultarPaquetes,
            consultarDisponibilidad,
            date?.ToString("yyyy-MM-dd"),
            consultarEventosCliente,
            "fallback local"
        );
    }

    private async Task<string> GenerateGeminiTextAsync(ChatbotConfig config, string prompt, decimal temperature, int maxTokens, CancellationToken ct)
    {
        var apiKey = _configuration["Chatbot:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Contains("YOUR_", StringComparison.OrdinalIgnoreCase))
        {
            return "";
        }

        var model = string.IsNullOrWhiteSpace(config.ModeloNombre) ? "gemini-2.5-flash" : config.ModeloNombre.Trim();
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(model)}:generateContent?key={Uri.EscapeDataString(apiKey)}";
        var payload = new
        {
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[] { new { text = prompt } }
                }
            },
            generationConfig = new
            {
                temperature = (double)temperature,
                maxOutputTokens = Math.Clamp(maxTokens, 100, 2000)
            }
        };

        var client = _httpClientFactory.CreateClient();
        using var response = await client.PostAsJsonAsync(url, payload, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Gemini respondió {Status}: {Body}", response.StatusCode, json);
            return "";
        }

        var root = JsonNode.Parse(json);
        return root?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.GetValue<string>()?.Trim() ?? "";
    }

    private async Task<string> GenerateGeminiReplyAsync(ChatbotConfig config, string businessContext, string userMessage, CancellationToken ct)
    {
        var apiKey = _configuration["Chatbot:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Contains("YOUR_", StringComparison.OrdinalIgnoreCase))
        {
            return "El asistente ya está instalado, pero falta configurar la API key de Gemini en el backend para generar respuestas.";
        }

        var text = await GenerateGeminiTextAsync(config, BuildPrompt(config, businessContext, userMessage), config.Temperatura, config.MaxTokens, ct);
        return string.IsNullOrWhiteSpace(text) ? config.MensajeFallback : text.Trim();
    }

    private static string BuildPrompt(ChatbotConfig config, string businessContext, string userMessage)
    {
        return $"""
        Eres {config.NombreAsistente}, asistente virtual de una empresa de eventos infantiles.

        Misión de la empresa:
        {config.MisionEmpresa}

        Visión de la empresa:
        {config.VisionEmpresa}

        Personalidad:
        {config.Personalidad}

        Tono:
        {config.Tono}

        Reglas obligatorias:
        - Responde siempre en español.
        - Sé breve, útil y conversacional.
        - No inventes precios, paquetes, horarios, saldos ni disponibilidad.
        - Usa únicamente los datos controlados incluidos abajo.
        - Si faltan datos, pide una aclaración concreta.
        - No menciones datos internos, costos de proveedor, inventario interno ni notas administrativas.
        - No prometas una reserva confirmada; indica que la confirmación la realiza el equipo.
        - Si el contexto incluye una sección "Disponibilidad para", responde con el estado de los turnos encontrados y no digas que el equipo debe revisarlo.
        - Si todos los turnos aparecen ocupados, indica que esa fecha no tiene disponibilidad.
        - Si al menos un turno aparece disponible, indica cuáles turnos están disponibles.
        - Responde corto y natural. Si hay botones de acción disponibles, no copies URLs largas; invita a usar el botón correspondiente.
        - Para catálogos extensos, no listes todo: resume y deriva al botón de paquetes/servicios.
        - Para eventos del cliente, menciona el dato principal y deriva al botón de detalle.
        - Si la pregunta requiere atención humana y no hay datos suficientes en el contexto, deriva amablemente.

        Restricciones configuradas por administración:
        {config.Restricciones}

        Instrucciones adicionales:
        {config.InstruccionesSistema}

        {businessContext}

        Mensaje del usuario:
        {userMessage}
        """;
    }

    private static bool MentionsAny(string message, params string[] terms)
    {
        var normalized = message.ToLowerInvariant();
        return terms.Any(t => normalized.Contains(t.ToLowerInvariant()));
    }

    private static bool LooksLikeClientEventQuestion(string message)
    {
        var normalized = RemoveDiacritics(message.ToLowerInvariant());
        return normalized.Contains("mi evento")
            || normalized.Contains("mis eventos")
            || normalized.Contains("mi reserva")
            || normalized.Contains("mis reservas")
            || normalized.Contains("mi fiesta")
            || normalized.Contains("mi cumple")
            || normalized.Contains("mi saldo")
            || normalized.Contains("cuanto debo")
            || normalized.Contains("que debo")
            || normalized.Contains("mis pagos")
            || normalized.Contains("mi pago")
            || normalized.Contains("mi invitacion")
            || normalized.Contains("hora de mi")
            || normalized.Contains("cuando es mi");
    }

    private static string ExtractJsonObject(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "{}";

        var cleaned = value.Trim();
        if (cleaned.StartsWith("```", StringComparison.Ordinal))
        {
            cleaned = Regex.Replace(cleaned, @"^```(?:json)?", "", RegexOptions.IgnoreCase).Trim();
            cleaned = Regex.Replace(cleaned, @"```$", "", RegexOptions.IgnoreCase).Trim();
        }

        var start = cleaned.IndexOf('{');
        var end = cleaned.LastIndexOf('}');
        return start >= 0 && end > start ? cleaned[start..(end + 1)] : cleaned;
    }

    private static string? NormalizePlannerDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return TryParseIsoDate(value)?.ToString("yyyy-MM-dd") ?? TryExtractDate(value)?.ToString("yyyy-MM-dd");
    }

    private static DateTime? TryParseIsoDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return DateTime.TryParseExact(value.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)
            ? date
            : null;
    }

    private static DateTime? TryExtractDate(string message)
    {
        var normalized = message.ToLowerInvariant();
        if (normalized.Contains("mañana") || normalized.Contains("manana")) return DateTime.Today.AddDays(1);
        if (normalized.Contains("hoy")) return DateTime.Today;

        var iso = Regex.Match(message, @"\b(20\d{2})-(\d{1,2})-(\d{1,2})\b");
        if (iso.Success && DateTime.TryParseExact(iso.Value, "yyyy-M-d", CultureInfo.InvariantCulture, DateTimeStyles.None, out var isoDate))
        {
            return isoDate;
        }

        var slash = Regex.Match(message, @"\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b");
        if (slash.Success && DateTime.TryParseExact(slash.Value.Replace('-', '/'), "d/M/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var slashDate))
        {
            return slashDate;
        }

        var monthDates = Regex.Matches(
            normalized,
            @"\b(\d{1,2})\s*(?:de\s*)?([a-záéíóúñ]{3,14})\s*(?:de\s*)?(20\d{2})?\b",
            RegexOptions.IgnoreCase);

        foreach (Match monthDate in monthDates)
        {
            var day = int.Parse(monthDate.Groups[1].Value, CultureInfo.InvariantCulture);
            var month = GetSpanishMonthNumber(monthDate.Groups[2].Value);
            var year = monthDate.Groups[3].Success
                ? int.Parse(monthDate.Groups[3].Value, CultureInfo.InvariantCulture)
                : DateTime.Today.Year;

            if (month > 0 && DateTime.TryParseExact($"{year}-{month}-{day}", "yyyy-M-d", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            {
                return parsed.Date < DateTime.Today && !monthDate.Groups[3].Success
                    ? parsed.AddYears(1)
                    : parsed;
            }
        }

        var wordMonthDates = Regex.Matches(
            normalized,
            @"\b([a-záéíóúñ]{3,24})\s*(?:de\s*)?([a-záéíóúñ]{3,14})\s*(?:de\s*)?(20\d{2})?\b",
            RegexOptions.IgnoreCase);

        foreach (Match wordMonthDate in wordMonthDates)
        {
            var day = GetSpanishDayNumber(wordMonthDate.Groups[1].Value);
            var month = GetSpanishMonthNumber(wordMonthDate.Groups[2].Value);
            var year = wordMonthDate.Groups[3].Success
                ? int.Parse(wordMonthDate.Groups[3].Value, CultureInfo.InvariantCulture)
                : DateTime.Today.Year;

            if (day > 0 && month > 0 && DateTime.TryParseExact($"{year}-{month}-{day}", "yyyy-M-d", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            {
                return parsed.Date < DateTime.Today && !wordMonthDate.Groups[3].Success
                    ? parsed.AddYears(1)
                    : parsed;
            }
        }

        return null;
    }

    private static int GetSpanishDayNumber(string day)
    {
        var normalized = RemoveDiacritics(day.ToLowerInvariant());
        var days = new Dictionary<string, int>
        {
            ["uno"] = 1,
            ["un"] = 1,
            ["dos"] = 2,
            ["tres"] = 3,
            ["cuatro"] = 4,
            ["cinco"] = 5,
            ["seis"] = 6,
            ["siete"] = 7,
            ["ocho"] = 8,
            ["nueve"] = 9,
            ["diez"] = 10,
            ["once"] = 11,
            ["doce"] = 12,
            ["trece"] = 13,
            ["catorce"] = 14,
            ["quince"] = 15,
            ["dieciseis"] = 16,
            ["diecisiete"] = 17,
            ["dieciocho"] = 18,
            ["diecinueve"] = 19,
            ["veinte"] = 20,
            ["veintiuno"] = 21,
            ["veintiun"] = 21,
            ["veintidos"] = 22,
            ["veintitres"] = 23,
            ["veinticuatro"] = 24,
            ["veinticinco"] = 25,
            ["veintiseis"] = 26,
            ["veintisiete"] = 27,
            ["veintiocho"] = 28,
            ["veintinueve"] = 29,
            ["treinta"] = 30,
            ["treintaiuno"] = 31,
            ["treintauno"] = 31,
            ["treinta y uno"] = 31
        };

        if (days.TryGetValue(normalized, out var exact)) return exact;

        var best = days
            .Where(item => item.Key.Length >= 3)
            .Select(item => new { item.Value, Distance = LevenshteinDistance(normalized, item.Key) })
            .OrderBy(item => item.Distance)
            .FirstOrDefault();

        return best != null && best.Distance <= 2 ? best.Value : 0;
    }

    private static int GetSpanishMonthNumber(string month)
    {
        var normalized = RemoveDiacritics(month.ToLowerInvariant());
        var exact = normalized switch
        {
            "enero" => 1,
            "febrero" => 2,
            "marzo" => 3,
            "abril" => 4,
            "mayo" => 5,
            "junio" => 6,
            "julio" => 7,
            "agosto" => 8,
            "septiembre" => 9,
            "setiembre" => 9,
            "octubre" => 10,
            "noviembre" => 11,
            "diciembre" => 12,
            _ => 0
        };

        if (exact > 0) return exact;

        var months = new Dictionary<string, int>
        {
            ["enero"] = 1,
            ["febrero"] = 2,
            ["marzo"] = 3,
            ["abril"] = 4,
            ["mayo"] = 5,
            ["junio"] = 6,
            ["julio"] = 7,
            ["agosto"] = 8,
            ["septiembre"] = 9,
            ["setiembre"] = 9,
            ["octubre"] = 10,
            ["noviembre"] = 11,
            ["diciembre"] = 12
        };

        var best = months
            .Select(item => new { item.Value, Distance = LevenshteinDistance(normalized, item.Key) })
            .OrderBy(item => item.Distance)
            .FirstOrDefault();

        return best != null && best.Distance <= 2 ? best.Value : 0;
    }

    private static string RemoveDiacritics(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();
        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }
        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private static int LevenshteinDistance(string left, string right)
    {
        if (left == right) return 0;
        if (left.Length == 0) return right.Length;
        if (right.Length == 0) return left.Length;

        var distances = new int[left.Length + 1, right.Length + 1];
        for (var i = 0; i <= left.Length; i++) distances[i, 0] = i;
        for (var j = 0; j <= right.Length; j++) distances[0, j] = j;

        for (var i = 1; i <= left.Length; i++)
        {
            for (var j = 1; j <= right.Length; j++)
            {
                var cost = left[i - 1] == right[j - 1] ? 0 : 1;
                distances[i, j] = Math.Min(
                    Math.Min(distances[i - 1, j] + 1, distances[i, j - 1] + 1),
                    distances[i - 1, j - 1] + cost);
            }
        }

        return distances[left.Length, right.Length];
    }

    private static bool LooksLikeEscalationNeeded(string reply)
    {
        var normalized = reply.ToLowerInvariant();
        return normalized.Contains("asesor") || normalized.Contains("whatsapp") || normalized.Contains("equipo");
    }

    private static string BuildDeterministicReply(string context, List<ChatbotSuggestedAction> actions)
    {
        if (context.Contains("- Disponibilidad para", StringComparison.OrdinalIgnoreCase))
        {
            var availableSlots = Regex.Matches(context, @"^\s+(.+?):\s+(\d{2}:\d{2})-(\d{2}:\d{2})\s+=>\s+disponible", RegexOptions.Multiline)
                .Select(m => $"{m.Groups[1].Value.Trim()} ({m.Groups[2].Value}-{m.Groups[3].Value})")
                .ToList();

            if (availableSlots.Count > 0)
            {
                return $"Sí, encontré disponibilidad en: {string.Join(", ", availableSlots)}. Puedes continuar con el botón de reserva.";
            }

            if (context.Contains("=> ocupado", StringComparison.OrdinalIgnoreCase))
            {
                return "Para esa fecha no encontré turnos disponibles. Puedes probar otra fecha desde el botón de reserva.";
            }

            if (context.Contains("No hay turnos configurados", StringComparison.OrdinalIgnoreCase))
            {
                return "No hay turnos configurados para esa fecha. Puedes probar otra fecha o contactar a un asesor.";
            }
        }

        if (context.Contains("- Disponibilidad: el usuario pregunta por agenda, pero no indicó una fecha clara", StringComparison.OrdinalIgnoreCase))
        {
            return "Puedo revisar disponibilidad, pero necesito una fecha concreta. Por ejemplo: 22 de julio 2026.";
        }

        if (actions.Any(a => a.Path == "/servicios-y-paquetes"))
        {
            return "Tenemos paquetes y servicios disponibles para eventos infantiles. Para ver fotos, precios e inclusiones completas, usa el botón de paquetes y servicios.";
        }

        var eventAction = actions.FirstOrDefault(a => a.Path.StartsWith("/cliente/eventos/", StringComparison.OrdinalIgnoreCase));
        if (eventAction != null)
        {
            return "Encontré información de tu evento. Puedes revisar el detalle completo con el botón correspondiente.";
        }

        if (actions.Any(a => a.Path == "/cliente/dashboard"))
        {
            return "Puedes revisar tus eventos desde el portal de cliente con el botón de mis eventos.";
        }

        if (actions.Any(a => a.Path == "/reservar"))
        {
            return "Puedes continuar desde el botón de reserva.";
        }

        return "Tengo algunas opciones para ayudarte. Usa uno de los botones disponibles para continuar.";
    }

    private static List<ChatbotSuggestedAction> DeduplicateActions(IEnumerable<ChatbotSuggestedAction> actions)
    {
        return actions
            .Where(a => !string.IsNullOrWhiteSpace(a.Label) && !string.IsNullOrWhiteSpace(a.Path))
            .GroupBy(a => a.Path)
            .Select(g => g.First())
            .Take(4)
            .ToList();
    }

    private static string Limit(string value, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return "";
        return value.Length <= max ? value : value[..max] + "...";
    }

    private static ChatbotConfigDto ToDto(ChatbotConfig config) => new(
        config.Habilitado,
        config.NombreAsistente,
        config.MensajeBienvenida,
        config.Personalidad,
        config.MisionEmpresa,
        config.VisionEmpresa,
        config.Tono,
        config.Restricciones,
        config.InstruccionesSistema,
        config.ModeloProveedor,
        config.ModeloNombre,
        config.Temperatura,
        config.MaxTokens,
        config.MostrarEnLanding,
        config.MostrarEnPortalCliente,
        config.PermitirConsultarEventosCliente,
        config.PermitirConsultarDisponibilidad,
        config.PermitirConsultarPaquetes,
        config.PermitirCrearLeadOReserva,
        config.MensajeFallback,
        config.EscalarAWhatsApp,
        config.WhatsappEscalamiento,
        config.ColorPrimario,
        config.PosicionWidget
    );

    private static void ApplyDto(ChatbotConfig config, ChatbotConfigDto dto)
    {
        config.Habilitado = dto.Habilitado;
        config.NombreAsistente = Limit(dto.NombreAsistente, 120);
        config.MensajeBienvenida = Limit(dto.MensajeBienvenida, 500);
        config.Personalidad = Limit(dto.Personalidad, 2000);
        config.MisionEmpresa = Limit(dto.MisionEmpresa, 2000);
        config.VisionEmpresa = Limit(dto.VisionEmpresa, 2000);
        config.Tono = Limit(dto.Tono, 250);
        config.Restricciones = Limit(dto.Restricciones, 2500);
        config.InstruccionesSistema = Limit(dto.InstruccionesSistema, 4000);
        config.ModeloProveedor = string.IsNullOrWhiteSpace(dto.ModeloProveedor) ? "Gemini" : Limit(dto.ModeloProveedor, 80);
        config.ModeloNombre = string.IsNullOrWhiteSpace(dto.ModeloNombre) ? "gemini-2.5-flash" : Limit(dto.ModeloNombre, 120);
        config.Temperatura = Math.Clamp(dto.Temperatura, 0m, 1.5m);
        config.MaxTokens = Math.Clamp(dto.MaxTokens, 200, 2000);
        config.MostrarEnLanding = dto.MostrarEnLanding;
        config.MostrarEnPortalCliente = dto.MostrarEnPortalCliente;
        config.PermitirConsultarEventosCliente = dto.PermitirConsultarEventosCliente;
        config.PermitirConsultarDisponibilidad = dto.PermitirConsultarDisponibilidad;
        config.PermitirConsultarPaquetes = dto.PermitirConsultarPaquetes;
        config.PermitirCrearLeadOReserva = dto.PermitirCrearLeadOReserva;
        config.MensajeFallback = Limit(dto.MensajeFallback, 500);
        config.EscalarAWhatsApp = dto.EscalarAWhatsApp;
        config.WhatsappEscalamiento = Limit(dto.WhatsappEscalamiento ?? "", 60);
        config.ColorPrimario = string.IsNullOrWhiteSpace(dto.ColorPrimario) ? "#ff5e7e" : Limit(dto.ColorPrimario, 40);
        config.PosicionWidget = dto.PosicionWidget == "bottom-left" ? "bottom-left" : "bottom-right";
    }
}
