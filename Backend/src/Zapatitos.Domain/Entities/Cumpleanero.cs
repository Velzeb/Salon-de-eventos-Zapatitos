namespace Zapatitos.Domain.Entities;

public class Cumpleanero : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;

    public long NinoId { get; set; }
    public virtual Nino Nino { get; set; } = null!;

    public int EdadCumplir { get; set; }
}
