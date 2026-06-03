using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Finanzas.Queries.GetCalculoNomina;

public record GetCalculoNominaQuery : IRequest<Result<List<NominaEmpleadoDto>>>;

public class NominaEmpleadoDto
{
    public long EmpleadoId { get; set; }
    public string NombreEmpleado { get; set; } = null!;
    public decimal PagoPorEvento { get; set; }
    public int EventosPendientes { get; set; }
    public decimal TotalAPagar { get; set; }
    public List<EventoPendientePagoDto> Detalles { get; set; } = new();
}

public class EventoPendientePagoDto
{
    public long EventoId { get; set; }
    public string Fecha { get; set; } = null!;
    public string Paquete { get; set; } = null!;
}

public class GetCalculoNominaQueryHandler : IRequestHandler<GetCalculoNominaQuery, Result<List<NominaEmpleadoDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetCalculoNominaQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<List<NominaEmpleadoDto>>> Handle(GetCalculoNominaQuery request, CancellationToken cancellationToken)
    {
        var asignaciones = await _unitOfWork.Repository<AsignacionStaff>().Query()
            .Include(a => a.Empleado)
            .Include(a => a.Evento)
                .ThenInclude(e => e.Paquete)
            .Where(a => !a.EsPagado && a.Evento.Estado != Zapatitos.Domain.Enums.EstadoEvento.Cancelado && !a.Evento.EliminadoEn.HasValue && !a.EliminadoEn.HasValue)
            .ToListAsync(cancellationToken);

        var result = asignaciones
            .GroupBy(a => a.Empleado)
            .Select(g => new NominaEmpleadoDto
            {
                EmpleadoId = g.Key.Id,
                NombreEmpleado = g.Key.NombreCompleto,
                PagoPorEvento = g.Key.PagoPorEvento,
                EventosPendientes = g.Count(),
                TotalAPagar = g.Count() * g.Key.PagoPorEvento,
                Detalles = g.Select(a => new EventoPendientePagoDto {
                    EventoId = a.EventoId,
                    Fecha = a.Evento.FechaEvento.ToString("dd/MM/yyyy"),
                    Paquete = a.Evento.Paquete != null ? a.Evento.Paquete.Nombre : "Solo salón"
                }).ToList()
            })
            .ToList();

        return Result<List<NominaEmpleadoDto>>.Success(result);
    }
}
