using System;

namespace Zapatitos.Domain.Entities;

public class Invitado : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;

    public string Nombre { get; set; } = null!;
    public Guid CodigoQr { get; set; } = Guid.NewGuid();
    public bool Ingreso { get; set; } = false;
    public DateTime? FechaIngreso { get; set; }
}
