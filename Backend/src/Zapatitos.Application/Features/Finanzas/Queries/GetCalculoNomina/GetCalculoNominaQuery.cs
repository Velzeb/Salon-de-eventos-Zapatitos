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
        var empleados = await _unitOfWork.Repository<Empleado>().Query().ToListAsync(cancellationToken);
        var asignaciones = await _unitOfWork.Repository<AsignacionStaff>().Query()
            .Include(a => a.Evento)
                .ThenInclude(e => e.Paquete)
            .Where(a => !a.EsPagado && a.Evento.Estado == Zapatitos.Domain.Enums.EstadoEvento.Completado)
            .ToListAsync(cancellationToken);

        var result = new List<NominaEmpleadoDto>();

        foreach (var emp in empleados)
        {
            var misAsignaciones = asignaciones.Where(a => a.EmpleadoId == emp.Id).ToList();
            if (!misAsignaciones.Any()) continue;

            result.Add(new NominaEmpleadoDto
            {
                EmpleadoId = emp.Id,
                NombreEmpleado = emp.NombreCompleto,
                PagoPorEvento = emp.PagoPorEvento,
                EventosPendientes = misAsignaciones.Count,
                TotalAPagar = misAsignaciones.Count * emp.PagoPorEvento,
                Detalles = misAsignaciones.Select(a => new EventoPendientePagoDto {
                    EventoId = a.EventoId,
                    Fecha = a.Evento.FechaEvento.ToShortDateString(),
                    Paquete = a.Evento.Paquete.Nombre
                }).ToList()
            });
        }

        return Result<List<NominaEmpleadoDto>>.Success(result);
    }
}
