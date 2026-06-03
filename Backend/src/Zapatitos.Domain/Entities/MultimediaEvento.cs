using System;

namespace Zapatitos.Domain.Entities;

public class MultimediaEvento : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;

    public string Url { get; set; } = null!;
    public string NombreArchivo { get; set; } = null!;
    public string TipoArchivo { get; set; } = null!; // "Imagen" o "Video"
    public DateTime FechaSubida { get; set; } = DateTime.UtcNow;
}
