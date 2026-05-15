using System;
using System.Collections.Generic;

namespace Zapatitos.Domain.Entities;

public class Usuario : BaseEntity
{
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public bool Activo { get; set; } = true;
    public DateTime? UltimaConexion { get; set; }
    
    public virtual ICollection<Rol> Roles { get; set; } = new List<Rol>();
}
