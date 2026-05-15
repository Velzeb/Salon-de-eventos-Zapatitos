using System.Collections.Generic;

namespace Zapatitos.Domain.Entities;

public class Rol : BaseEntity
{
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    
    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    public virtual ICollection<Permiso> Permisos { get; set; } = new List<Permiso>();
}
