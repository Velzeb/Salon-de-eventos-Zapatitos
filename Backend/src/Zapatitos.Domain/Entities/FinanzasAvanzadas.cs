using System;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Domain.Entities;

public enum TipoTransaccion
{
    Ingreso,
    Egreso
}

public class CategoriaFinanciera : BaseEntity
{
    public string Nombre { get; set; } = null!; // Ej: Alquiler, Sueldos, Insumos, Ventas
    public TipoTransaccion Tipo { get; set; }
}

public class Gasto : BaseEntity
{
    public long CategoriaId { get; set; }
    public virtual CategoriaFinanciera Categoria { get; set; } = null!;
    
    public decimal Monto { get; set; }
    public string Descripcion { get; set; } = null!;
    public DateTime Fecha { get; set; }
    public string? ComprobanteUrl { get; set; }
}

public class PagoNomina : BaseEntity
{
    public long EmpleadoId { get; set; }
    public virtual Empleado Empleado { get; set; } = null!;
    
    public decimal Monto { get; set; }
    public DateTime FechaPago { get; set; }
    public string? Periodo { get; set; } // Ej: "Abril 2026" o "Evento #123"
}

public class MovimientoCaja : BaseEntity
{
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public TipoTransaccion Tipo { get; set; }
    public decimal Monto { get; set; }
    public string Concepto { get; set; } = null!; // Ej: "Pago Reserva Evento #45" o "Compra de globos"
    public long? ReferenciaId { get; set; } // ID del Pago, Gasto o Nomina relacionado
}
