using System;

namespace Zapatitos.Domain.Entities;

public class DisponibilidadConfig : BaseEntity
{
    public int DiaSemana { get; set; } // 0=Domingo, 6=Sábado
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public string NombreBloque { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}
