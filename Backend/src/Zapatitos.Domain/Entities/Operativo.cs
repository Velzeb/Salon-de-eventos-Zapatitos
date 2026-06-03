using System;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Domain.Entities;

public class AsignacionStaff : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;
    
    public long EmpleadoId { get; set; }
    public virtual Empleado Empleado { get; set; } = null!;
    
    public string? RolEnEvento { get; set; }
    public bool EsPagado { get; set; } = false;
    public long? PagoNominaId { get; set; }
    public virtual PagoNomina? PagoNomina { get; set; }
}

public class TareaOperativa : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;
    
    public string NombreTarea { get; set; } = null!;
    public string? Descripcion { get; set; }
    public EstadoTarea Estado { get; set; } = EstadoTarea.Pendiente;
    public TipoTareaOperativa TipoTarea { get; set; } = TipoTareaOperativa.Manual;
    
    public long? AsignadoAId { get; set; }
    public virtual Empleado? AsignadoA { get; set; }

    public long? EventoItemId { get; set; }
    public virtual EventoItem? EventoItem { get; set; }
    
    // === LOGÍSTICA DE INVENTARIO (Fase 6) ===
    public long? ArticuloInventarioId { get; set; }
    public virtual ArticuloInventario? ArticuloInventario { get; set; }
    public int CantidadRequerida { get; set; }
    public bool StockDescontado { get; set; } = false;

    /// <summary>Si viene de una TareaPlantilla, guarda el ID de origen.</summary>
    public long? PlantillaId { get; set; }
    public virtual TareaPlantilla? Plantilla { get; set; }
    
    public DateTime? FechaCompletada { get; set; }
}

public class ConsumoExtra : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;
    
    public long ServicioId { get; set; }
    public virtual Servicio Servicio { get; set; } = null!;
    
    public long EmpleadoId { get; set; }
    public virtual Empleado Empleado { get; set; } = null!;
    
    public int Cantidad { get; set; }
    public decimal PrecioUnitarioMomento { get; set; }
    public decimal TotalConsumo { get; set; } // Calculado en BD o C#
}

public class EventoItem : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;
    
    public long? ArticuloId { get; set; }
    public virtual ArticuloInventario? Articulo { get; set; }
    
    public long? ServicioId { get; set; }
    public virtual Servicio? Servicio { get; set; }
    
    public string Nombre { get; set; } = null!;
    public int Cantidad { get; set; }
    public string? Notas { get; set; }
    public bool EsIncluidoEnPaquete { get; set; }
    public decimal PrecioUnitario { get; set; }
}
