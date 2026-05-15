using System.Collections.Generic;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Domain.Entities;

// ─── SERVICIO ────────────────────────────────────────────────────────────────
// Lo que se ofrece al cliente en sus fiestas.
// Puede estar respaldado por: un artículo de inventario, una receta de producción
// o un servicio externo de un proveedor.
public class Servicio : BaseEntity
{
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public decimal CostoBase { get; set; }
    public decimal PrecioProveedor { get; set; }
    public bool EsExtra { get; set; } = true;
    public EstadoGeneral Estado { get; set; } = EstadoGeneral.Activo;

    // Tipo de servicio: qué lo respalda
    public TipoServicio Tipo { get; set; } = TipoServicio.ServicioTercero;

    // Cantidad mínima requerida (ej: mínimo 50 sillas, mínimo 20 galletas)
    public int CantidadMinima { get; set; } = 1;

    // Solo uno de estos será != null según el Tipo
    public long? ArticuloInventarioId { get; set; }
    public virtual ArticuloInventario? ArticuloInventario { get; set; }

    public long? ProductoProduccionId { get; set; }
    public virtual ProductoProduccion? ProductoProduccion { get; set; }

    public long? ProveedorId { get; set; }
    public virtual Proveedor? Proveedor { get; set; }

    public virtual ICollection<PaqueteServicio> Paquetes { get; set; } = new List<PaqueteServicio>();
}

// ─── PAQUETE ──────────────────────────────────────────────────────────────────
// Plan de fiesta que agrupa servicios
public class Paquete : BaseEntity
{
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public decimal PrecioBase { get; set; }
    public decimal Descuento { get; set; }
    public int CapacidadNinos { get; set; }
    public int DuracionHoras { get; set; }
    public EstadoGeneral Estado { get; set; } = EstadoGeneral.Activo;

    public virtual ICollection<PaqueteServicio> Servicios { get; set; } = new List<PaqueteServicio>();
    public virtual ICollection<PaqueteArticulo> Articulos { get; set; } = new List<PaqueteArticulo>();
}

// ─── PAQUETE SERVICIO ────────────────────────────────────────────────────────
public class PaqueteServicio : BaseEntity
{
    public long PaqueteId { get; set; }
    public virtual Paquete Paquete { get; set; } = null!;

    public long ServicioId { get; set; }
    public virtual Servicio Servicio { get; set; } = null!;

    public int Cantidad { get; set; } = 1;
}

// ─── ARTÍCULO DE INVENTARIO ───────────────────────────────────────────────────
// Activos y materia prima de la empresa (sillas, harina, manteles, etc.)
public class ArticuloInventario : BaseEntity
{
    public long? ProveedorId { get; set; }
    public virtual Proveedor? Proveedor { get; set; }

    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }

    // Control de stock
    public int StockActual { get; set; }
    public int StockMinimo { get; set; }
    public bool ControlarStock { get; set; } = true;

    public string? UnidadMedida { get; set; }
    public decimal PrecioCosto { get; set; }

    public virtual ICollection<PaqueteArticulo> PaquetesDondeSeUsa { get; set; } = new List<PaqueteArticulo>();
    public virtual ICollection<RecetaIngrediente> UsadoEnRecetas { get; set; } = new List<RecetaIngrediente>();
}

// ─── PAQUETE ARTÍCULO ─────────────────────────────────────────────────────────
public class PaqueteArticulo : BaseEntity
{
    public long PaqueteId { get; set; }
    public virtual Paquete Paquete { get; set; } = null!;

    public long ArticuloId { get; set; }
    public virtual ArticuloInventario Articulo { get; set; } = null!;

    public int Cantidad { get; set; }
}

// ─── PRODUCTO DE PRODUCCIÓN ───────────────────────────────────────────────────
// Recetas que la empresa produce internamente (ej: Galletas de Coco).
// Define cuántas unidades produce y qué ingredientes del inventario consume.
public class ProductoProduccion : BaseEntity
{
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }

    // Cuántas unidades produce un lote de esta receta
    public int CantidadProducida { get; set; } = 1;
    public string? UnidadMedida { get; set; } // "unidades", "porciones", "gramos"

    public EstadoGeneral Estado { get; set; } = EstadoGeneral.Activo;

    // Ingredientes que consume del inventario
    public virtual ICollection<RecetaIngrediente> Ingredientes { get; set; } = new List<RecetaIngrediente>();

    // Servicios que usan este producto
    public virtual ICollection<Servicio> Servicios { get; set; } = new List<Servicio>();
}

// ─── RECETA INGREDIENTE ───────────────────────────────────────────────────────
// Línea de ingrediente dentro de una receta de producción.
// Ejemplo: 500g de harina para producir 10 galletas.
public class RecetaIngrediente : BaseEntity
{
    public long ProductoProduccionId { get; set; }
    public virtual ProductoProduccion Producto { get; set; } = null!;

    public long ArticuloInventarioId { get; set; }
    public virtual ArticuloInventario Articulo { get; set; } = null!;

    // Cantidad necesaria POR LOTE de producción
    public decimal CantidadRequerida { get; set; }
    public string? UnidadMedida { get; set; }
}
