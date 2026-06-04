using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Zapatitos.Application.Features.Eventos.Queries.GetEventos;

public record GetEventosQuery : IRequest<Result<IEnumerable<EventoDto>>>;

public class EventoDto
{
    public long Id { get; set; }
    public List<string> ClientesNombres { get; set; } = new();
    public string PaqueteNombre { get; set; } = null!;
    public List<string> Cumpleaneros { get; set; } = new();
    public System.DateTime FechaEvento { get; set; }
    public string Estado { get; set; } = null!;
    public decimal PrecioTotal { get; set; }
    public decimal SaldoPendiente { get; set; }
    public string HoraInicio { get; set; } = null!;
    public string HoraFin { get; set; } = null!;
    public int TareasTotales { get; set; }
    public int TareasCompletadas { get; set; }
    public int StaffAsignadoCount { get; set; }
    public string Origen { get; set; } = null!;
}

public class GetEventosQueryHandler : IRequestHandler<GetEventosQuery, Result<IEnumerable<EventoDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetEventosQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<EventoDto>>> Handle(GetEventosQuery request, CancellationToken cancellationToken)
    {
        var resultados = await _unitOfWork.Repository<Evento>().Query()
            .Include(e => e.Paquete)
            .Include(e => e.ClientesResponsables)
            .Include(e => e.Cumpleaneros)
                .ThenInclude(c => c.Nino)
            .Include(e => e.Tareas)
            .Include(e => e.Staff)
            .OrderByDescending(e => e.FechaEvento)
            .Select(e => new EventoDto
            {
                Id = e.Id,
                ClientesNombres = e.ClientesResponsables.Select(c => c.NombreCompleto).ToList(),
                PaqueteNombre = e.Paquete != null ? e.Paquete.Nombre : "Sin Paquete",
                Cumpleaneros = e.Cumpleaneros.Select(c => c.Nino.Nombre).ToList(),
                FechaEvento = e.FechaEvento,
                Estado = e.Estado.ToString(),
                PrecioTotal = e.PrecioTotal,
                SaldoPendiente = e.SaldoPendiente,
                HoraInicio = e.HoraInicio.ToString("hh\\:mm"),
                HoraFin = e.HoraFin.ToString("hh\\:mm"),
                TareasTotales = e.Tareas.Count(t => t.TipoTarea != TipoTareaOperativa.Entrega && !t.EliminadoEn.HasValue),
                TareasCompletadas = e.Tareas.Count(t => t.TipoTarea != TipoTareaOperativa.Entrega && !t.EliminadoEn.HasValue && t.Estado == EstadoTarea.Completada),
                StaffAsignadoCount = e.Staff.Count,
                Origen = e.Origen.ToString()
            })
            .ToListAsync(cancellationToken);

        return Result<IEnumerable<EventoDto>>.Success(resultados);
    }
}
