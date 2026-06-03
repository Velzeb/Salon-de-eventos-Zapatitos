using System;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Domain.Entities;

/// <summary>
/// Plantilla de tarea general que se aplica a TODAS las fiestas.
/// El admin las gestiona desde el panel de configuración.
/// </summary>
public class TareaPlantilla : BaseEntity
{
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }

    /// <summary>
    /// Preparacion → aparece en el checklist de preparación (tipo Manual).
    /// EnVivo → aparece en el panel de entrega en vivo (tipo Entrega).
    /// </summary>
    public FasePlantilla FaseAplicacion { get; set; } = FasePlantilla.Preparacion;

    /// <summary>Orden de aparición dentro de la fase.</summary>
    public int Orden { get; set; } = 0;

    /// <summary>Si está inactiva, no se agrega a nuevos eventos.</summary>
    public bool Activa { get; set; } = true;
}
