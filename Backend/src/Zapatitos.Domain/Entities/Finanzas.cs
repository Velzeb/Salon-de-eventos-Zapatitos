using System;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Domain.Entities;

public class MetodoPago : BaseEntity
{
    public string Nombre { get; set; } = null!;
    public bool Activo { get; set; } = true;
}

public class Pago : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;
    
    public long? MetodoPagoId { get; set; }
    public virtual MetodoPago? MetodoPago { get; set; }
    
    public long? ClienteId { get; set; }
    public virtual Cliente? Cliente { get; set; }
    
    public decimal Monto { get; set; }
    public string? Referencia { get; set; }
    public string? ComprobanteUrl { get; set; }
    public EstadoPago Estado { get; set; } = EstadoPago.Pendiente;
    public DateTime FechaPago { get; set; } = DateTime.UtcNow;
    
    public long? VerificadoPorId { get; set; }
    public virtual Empleado? VerificadoPor { get; set; }
}
