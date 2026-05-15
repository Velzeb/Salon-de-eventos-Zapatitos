using System;

namespace Zapatitos.Domain.Entities;

public abstract class BaseEntity
{
    public long Id { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ModificadoEn { get; set; } = DateTime.UtcNow;
    public DateTime? EliminadoEn { get; set; }
    public int Version { get; set; } = 1;
}
