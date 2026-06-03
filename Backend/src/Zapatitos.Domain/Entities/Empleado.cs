using System;

namespace Zapatitos.Domain.Entities;

public class Empleado : BaseEntity
{
    public long UsuarioId { get; set; }
    public virtual Usuario Usuario { get; set; } = null!;
    
    public string NombreCompleto { get; set; } = null!;
    public string? Telefono { get; set; }
    public string? Puesto { get; set; }
    public decimal PagoPorEvento { get; set; }
    public DateTime FechaIngreso { get; set; }
    public Enums.EstadoGeneral Estado { get; set; } = Enums.EstadoGeneral.Activo;
    public string? FotoPerfilUrl { get; set; }
}
