using System.Collections.Generic;

namespace Zapatitos.Domain.Entities;

public class Permiso : BaseEntity
{
    public string Codigo { get; set; } = null!; // ej: 'eventos:crear'
    public string? Descripcion { get; set; }
    
    public virtual ICollection<Rol> Roles { get; set; } = new List<Rol>();
}
