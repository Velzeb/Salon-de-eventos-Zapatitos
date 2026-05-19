using System;
using System.Collections.Generic;
using System.Linq;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Domain.Entities;

public class Evento : BaseEntity
{
    public long? PaqueteId { get; set; }
    public virtual Paquete? Paquete { get; set; }
    
    public virtual ICollection<Cumpleanero> Cumpleaneros { get; set; } = new List<Cumpleanero>();
    public virtual ICollection<Cliente> ClientesResponsables { get; set; } = new List<Cliente>();
    
    public DateTime FechaEvento { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public int CantidadNinosEstimada { get; set; }
    public EstadoEvento Estado { get; set; } = EstadoEvento.Provisional;
    
    public decimal PrecioTotal { get; set; }
    public decimal SaldoPendiente { get; set; }
    public string? NotasAdmin { get; set; }
    public OrigenEvento Origen { get; set; } = OrigenEvento.Interno;

    // === BRIEFING DE TEMÁTICA (Fase 5) ===
    public string? Tematica { get; set; }
    public string? NotasDecoracion { get; set; }
    
    public virtual ICollection<Pago> Pagos { get; set; } = new List<Pago>();
    public virtual ICollection<AsignacionStaff> Staff { get; set; } = new List<AsignacionStaff>();
    public virtual ICollection<TareaOperativa> Tareas { get; set; } = new List<TareaOperativa>();
    public virtual ICollection<ConsumoExtra> ConsumosExtras { get; set; } = new List<ConsumoExtra>();
    public virtual ICollection<EventoItem> Items { get; set; } = new List<EventoItem>();
    public virtual ICollection<FotoEvento> Fotos { get; set; } = new List<FotoEvento>();
    public virtual ICollection<RetroalimentacionCliente> Retroalimentaciones { get; set; } = new List<RetroalimentacionCliente>();

    // === FASE 5 ===
    public virtual ICollection<Invitado> Invitados { get; set; } = new List<Invitado>();
    public virtual ICollection<ActividadCronograma> Cronograma { get; set; } = new List<ActividadCronograma>();

    // === FASE 8 (Post-Fiesta) ===
    public string? LinkGaleriaFotos { get; set; }
    public bool ConsentimientoMarketing { get; set; }
    public DateTime? FechaEntregaFotos { get; set; }
    public DateTime? FechaProximoContacto { get; set; }
    public virtual ICollection<MultimediaEvento> Multimedia { get; set; } = new List<MultimediaEvento>();

    // Alias conveniente para retroalimentación (la colección maneja la relación con EF)
    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public RetroalimentacionCliente? Retroalimentacion => Retroalimentaciones.FirstOrDefault();
}

public class InvitacionDigital : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;
    
    public Guid TokenAcceso { get; set; } = Guid.NewGuid();
    public string? ConfigJson { get; set; } // Almacenado como JSON en BD
}

// === NUEVAS ENTIDADES FASE 5 ===

public class Invitado : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;

    public string Nombre { get; set; } = null!;
    public Guid CodigoQr { get; set; } = Guid.NewGuid();
    public bool Ingreso { get; set; } = false;
    public DateTime? FechaIngreso { get; set; }
}

public class ActividadCronograma : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;

    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public int Orden { get; set; }
    public bool Completada { get; set; } = false;
    public DateTime? HoraInicioReal { get; set; }
    public DateTime? HoraFinReal { get; set; }
}

public class MultimediaEvento : BaseEntity
{
    public long EventoId { get; set; }
    public virtual Evento Evento { get; set; } = null!;

    public string Url { get; set; } = null!;
    public string NombreArchivo { get; set; } = null!;
    public string TipoArchivo { get; set; } = null!; // "Imagen" o "Video"
    public DateTime FechaSubida { get; set; } = DateTime.UtcNow;
}
