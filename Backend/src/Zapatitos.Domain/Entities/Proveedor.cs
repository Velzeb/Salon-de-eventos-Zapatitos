using System;
using System.Collections.Generic;

namespace Zapatitos.Domain.Entities;

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
