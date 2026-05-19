using MediatR;
using Microsoft.EntityFrameworkCore;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Eventos.Queries.GetCalendarEvents;

public record GetCalendarEventsQuery : IRequest<List<CalendarEventDto>>;

public class CalendarEventDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public decimal SaldoPendiente { get; set; }
}

public class GetCalendarEventsHandler : IRequestHandler<GetCalendarEventsQuery, List<CalendarEventDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetCalendarEventsHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<CalendarEventDto>> Handle(GetCalendarEventsQuery request, CancellationToken cancellationToken)
    {
        var eventos = await _unitOfWork.Repository<Evento>()
            .Query()
            .Include(e => e.Paquete)
            .Include(e => e.ClientesResponsables)
            .Where(e => e.Estado != EstadoEvento.Cancelado && !e.EliminadoEn.HasValue)
            .ToListAsync(cancellationToken);

        return eventos.Select(e => new CalendarEventDto
        {
            Id = e.Id,
            Title = $"{e.Paquete?.Nombre ?? "Fiesta"} - {e.ClientesResponsables.FirstOrDefault()?.NombreCompleto ?? "Cliente"}",
            Start = e.FechaEvento.Date.Add(e.HoraInicio),
            End = e.FechaEvento.Date.Add(e.HoraFin),
            Status = e.Estado.ToString(),
            Color = GetEventColor(e.Estado.ToString(), e.SaldoPendiente),
            SaldoPendiente = e.SaldoPendiente
        }).ToList();
    }

    private string GetEventColor(string estado, decimal saldo)
    {
        // Estados reales: Provisional, Reservado, EnPlanificacion, Planificado, EnCurso,
        // Finalizada, PostFiesta, Terminada, Cancelado
        if (estado == "Cancelado") return "#ef4444"; // Red
        if (estado == "Terminada") return "#64748b"; // Slate (cerrada)
        if (estado == "Finalizada" || estado == "PostFiesta") return "#8b5cf6"; // Violet
        if (estado == "EnCurso") return "#10b981"; // Emerald

        // Heurística financiera: si ya está liquidado, mostrar verde
        if (saldo == 0) return "#10b981"; // Emerald
        if (estado == "Provisional") return "#f59e0b"; // Amber

        return "#3b82f6"; // Blue (reservado/planificación/planificado)
    }
}
