using System;
using System.Collections.Generic;

namespace Zapatitos.Domain.Entities;

public class Cliente : BaseEntity
{
    public long? UsuarioId { get; set; }
    public virtual Usuario? Usuario { get; set; }
    
    public string NombreCompleto { get; set; } = null!;
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public DateTime? FechaNacimiento { get; set; }
    public string? FotoPerfilUrl { get; set; }
    
    public virtual ICollection<Evento> Eventos { get; set; } = new List<Evento>();
    public virtual ICollection<Nino> Ninos { get; set; } = new List<Nino>();
}
