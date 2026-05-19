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

public class Proveedor : BaseEntity
{
    public string Nombre { get; set; } = null!;
    public string? ContactoNombre { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Direccion { get; set; }
    public Enums.TipoProveedor Tipo { get; set; } = Enums.TipoProveedor.General;
    
    public virtual ICollection<ArticuloInventario> Articulos { get; set; } = new List<ArticuloInventario>();
}
