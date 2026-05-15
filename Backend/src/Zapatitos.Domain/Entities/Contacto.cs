using System;

namespace Zapatitos.Domain.Entities;

public class MensajeContacto : BaseEntity
{
    public string Nombre { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Asunto { get; set; } = null!;
    public string Mensaje { get; set; } = null!;
    public DateTime FechaEnvio { get; set; } = DateTime.UtcNow;
    public bool Leido { get; set; } = false;
}
