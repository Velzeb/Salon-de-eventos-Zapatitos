namespace Zapatitos.Domain.Entities;

public class RetroalimentacionCliente : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;
    
    public int CalificacionGeneral { get; set; } // 1 a 5
    public string? Comentario { get; set; }
}

public class FotoEvento : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;
    
    public string Url { get; set; } = null!;
    public bool VisibleParaCliente { get; set; } = false;
}
