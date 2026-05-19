using System.Collections.Generic;

namespace Zapatitos.Application.Features.Paquetes.Queries.GetPaquetes;

public class PaqueteDto
{
    public long Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public decimal PrecioBase { get; set; }
    public int CapacidadNinos { get; set; }
    public int DuracionHoras { get; set; }
    public string? ImagenUrl { get; set; }
    
    public List<PaqueteArticuloDto> Articulos { get; set; } = new();
    public List<PaqueteServicioDto> Servicios { get; set; } = new();
}

public class PaqueteServicioDto
{
    public long Id { get; set; }
    public string Nombre { get; set; } = null!;
    public decimal CostoBase { get; set; }
    public bool EsExtra { get; set; }
    public int Cantidad { get; set; }
}

public class PaqueteArticuloDto
{
    public long ArticuloId { get; set; }
    public string NombreArticulo { get; set; } = null!;
    public int Cantidad { get; set; }
    public string? UnidadMedida { get; set; }
}
