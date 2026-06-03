using System;

namespace Zapatitos.Domain.Entities;

public class ActividadCronograma : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;

    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public int Orden { get; set; }
    public bool Completada { get; set; } = false;
    public DateTime? HoraInicioReal { get; set; }
    public DateTime? HoraFinReal { get; set; }
}
