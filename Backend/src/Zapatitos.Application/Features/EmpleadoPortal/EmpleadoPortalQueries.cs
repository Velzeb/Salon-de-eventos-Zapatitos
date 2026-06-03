using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.EmpleadoPortal;

public record EmpleadoPerfilDto(long Id, string NombreCompleto, string? Puesto, string Email, string Estado, string? FotoPerfilUrl);

public class EmpleadoEventoDto
{
    public long Id { get; set; }
    public List<string> ClientesNombres { get; set; } = new();
    public string PaqueteNombre { get; set; } = null!;
    public List<string> Cumpleaneros { get; set; } = new();
    public DateTime FechaEvento { get; set; }
    public string Estado { get; set; } = null!;
    public decimal SaldoPendiente { get; set; }
    public string HoraInicio { get; set; } = null!;
    public string HoraFin { get; set; } = null!;
    public int TareasTotales { get; set; }
    public int TareasCompletadas { get; set; }
    public int InvitadosTotales { get; set; }
    public int InvitadosIngresados { get; set; }
    public bool AsignadoAMi { get; set; }
    public int MisTareasPendientes { get; set; }
}

public class EmpleadoJornadaDto
{
    public EmpleadoPerfilDto Perfil { get; set; } = null!;
    public List<EmpleadoEventoDto> Hoy { get; set; } = new();
    public List<EmpleadoEventoDto> Proximos { get; set; } = new();
    public int TareasPendientes { get; set; }
    public int EventosEnCurso { get; set; }
}

public record GetEmpleadoPerfilQuery(long UsuarioId) : IRequest<Result<EmpleadoPerfilDto>>;
public record GetEmpleadoJornadaQuery(long UsuarioId) : IRequest<Result<EmpleadoJornadaDto>>;
public record GetEmpleadoEventosQuery(long UsuarioId) : IRequest<Result<IEnumerable<EmpleadoEventoDto>>>;

public class GetEmpleadoPerfilQueryHandler : IRequestHandler<GetEmpleadoPerfilQuery, Result<EmpleadoPerfilDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    public GetEmpleadoPerfilQueryHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<EmpleadoPerfilDto>> Handle(GetEmpleadoPerfilQuery request, CancellationToken cancellationToken)
    {
        var empleado = await _unitOfWork.Repository<Empleado>().Query()
            .Include(e => e.Usuario)
            .FirstOrDefaultAsync(e => e.UsuarioId == request.UsuarioId, cancellationToken);

        if (empleado == null) return Result<EmpleadoPerfilDto>.Failure("Empleado no encontrado.");

        return Result<EmpleadoPerfilDto>.Success(new EmpleadoPerfilDto(
            empleado.Id,
            empleado.NombreCompleto,
            empleado.Puesto,
            empleado.Usuario.Email,
            empleado.Estado.ToString(),
            empleado.FotoPerfilUrl
        ));
    }
}

public class GetEmpleadoEventosQueryHandler : IRequestHandler<GetEmpleadoEventosQuery, Result<IEnumerable<EmpleadoEventoDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    public GetEmpleadoEventosQueryHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<IEnumerable<EmpleadoEventoDto>>> Handle(GetEmpleadoEventosQuery request, CancellationToken cancellationToken)
    {
        var empleado = await _unitOfWork.Repository<Empleado>().Query()
            .FirstOrDefaultAsync(e => e.UsuarioId == request.UsuarioId, cancellationToken);

        if (empleado == null) return Result<IEnumerable<EmpleadoEventoDto>>.Failure("Empleado no encontrado.");

        var desde = DateTime.Today.AddDays(-1);
        var eventos = await _unitOfWork.Repository<Evento>().Query()
            .Include(e => e.Paquete)
            .Include(e => e.ClientesResponsables)
            .Include(e => e.Cumpleaneros).ThenInclude(c => c.Nino)
            .Include(e => e.Tareas).ThenInclude(t => t.AsignadoA)
            .Include(e => e.Staff)
            .Include(e => e.Invitados)
            .Where(e => e.FechaEvento >= desde && e.Estado != EstadoEvento.Cancelado && e.Estado != EstadoEvento.Terminado)
            .OrderBy(e => e.FechaEvento)
            .ThenBy(e => e.HoraInicio)
            .ToListAsync(cancellationToken);

        return Result<IEnumerable<EmpleadoEventoDto>>.Success(eventos.Select(e => ToDto(e, empleado.Id)));
    }

    internal static EmpleadoEventoDto ToDto(Evento e, long empleadoId) => new()
    {
        Id = e.Id,
        ClientesNombres = e.ClientesResponsables.Select(c => c.NombreCompleto).ToList(),
        PaqueteNombre = e.Paquete?.Nombre ?? "Solo salón",
        Cumpleaneros = e.Cumpleaneros.Select(c => c.Nino?.Nombre ?? "Cumpleañero").ToList(),
        FechaEvento = e.FechaEvento,
        Estado = e.Estado.ToString(),
        SaldoPendiente = e.SaldoPendiente,
        HoraInicio = e.HoraInicio.ToString("hh\\:mm"),
        HoraFin = e.HoraFin.ToString("hh\\:mm"),
        TareasTotales = e.Tareas.Count,
        TareasCompletadas = e.Tareas.Count(t => t.Estado == EstadoTarea.Completada),
        InvitadosTotales = e.Invitados.Count,
        InvitadosIngresados = e.Invitados.Count(i => i.Ingreso),
        AsignadoAMi = e.Staff.Any(s => s.EmpleadoId == empleadoId) || e.Tareas.Any(t => t.AsignadoAId == empleadoId),
        MisTareasPendientes = e.Tareas.Count(t => t.AsignadoAId == empleadoId && t.Estado != EstadoTarea.Completada)
    };
}

public class GetEmpleadoJornadaQueryHandler : IRequestHandler<GetEmpleadoJornadaQuery, Result<EmpleadoJornadaDto>>
{
    private readonly IMediator _mediator;
    public GetEmpleadoJornadaQueryHandler(IMediator mediator) => _mediator = mediator;

    public async Task<Result<EmpleadoJornadaDto>> Handle(GetEmpleadoJornadaQuery request, CancellationToken cancellationToken)
    {
        var perfilResult = await _mediator.Send(new GetEmpleadoPerfilQuery(request.UsuarioId), cancellationToken);
        if (!perfilResult.Succeeded || perfilResult.Value == null) return Result<EmpleadoJornadaDto>.Failure(perfilResult.Errors);

        var eventosResult = await _mediator.Send(new GetEmpleadoEventosQuery(request.UsuarioId), cancellationToken);
        if (!eventosResult.Succeeded || eventosResult.Value == null) return Result<EmpleadoJornadaDto>.Failure(eventosResult.Errors);

        var eventos = eventosResult.Value.ToList();
        var hoy = DateTime.Today;
        var jornada = new EmpleadoJornadaDto
        {
            Perfil = perfilResult.Value,
            Hoy = eventos.Where(e => e.FechaEvento.Date == hoy).ToList(),
            Proximos = eventos.Where(e => e.FechaEvento.Date > hoy).Take(8).ToList(),
            TareasPendientes = eventos.Sum(e => e.MisTareasPendientes),
            EventosEnCurso = eventos.Count(e => string.Equals(e.Estado, "EnCurso", StringComparison.OrdinalIgnoreCase))
        };

        return Result<EmpleadoJornadaDto>.Success(jornada);
    }
}

public class EmpleadoHistorialDto
{
    public long EventoId { get; set; }
    public string PaqueteNombre { get; set; } = null!;
    public DateTime FechaEvento { get; set; }
    public string? RolEnEvento { get; set; }
    public string EstadoEvento { get; set; } = null!;
    public decimal MontoAPagar { get; set; }
    public bool EsPagado { get; set; }
    public long? PagoNominaId { get; set; }
    public DateTime? FechaPago { get; set; }
    public string? ComprobanteUrl { get; set; }
    public string? PeriodoPago { get; set; }
}

public record GetEmpleadoHistorialQuery(long UsuarioId) : IRequest<Result<IEnumerable<EmpleadoHistorialDto>>>;

public class GetEmpleadoHistorialQueryHandler : IRequestHandler<GetEmpleadoHistorialQuery, Result<IEnumerable<EmpleadoHistorialDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    public GetEmpleadoHistorialQueryHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<IEnumerable<EmpleadoHistorialDto>>> Handle(GetEmpleadoHistorialQuery request, CancellationToken cancellationToken)
    {
        var empleado = await _unitOfWork.Repository<Empleado>().Query()
            .FirstOrDefaultAsync(e => e.UsuarioId == request.UsuarioId, cancellationToken);

        if (empleado == null) return Result<IEnumerable<EmpleadoHistorialDto>>.Failure("Empleado no encontrado.");

        var asignaciones = await _unitOfWork.Repository<AsignacionStaff>().Query()
            .Include(a => a.Evento)
                .ThenInclude(e => e.Paquete)
            .Include(a => a.PagoNomina)
            .Where(a => a.EmpleadoId == empleado.Id && !a.EliminadoEn.HasValue && !a.Evento.EliminadoEn.HasValue)
            .OrderByDescending(a => a.Evento.FechaEvento)
            .ToListAsync(cancellationToken);

        var result = asignaciones.Select(a => new EmpleadoHistorialDto
        {
            EventoId = a.EventoId,
            PaqueteNombre = a.Evento.Paquete?.Nombre ?? "Solo salón",
            FechaEvento = a.Evento.FechaEvento,
            RolEnEvento = a.RolEnEvento,
            EstadoEvento = a.Evento.Estado.ToString(),
            MontoAPagar = empleado.PagoPorEvento,
            EsPagado = a.EsPagado,
            PagoNominaId = a.PagoNominaId,
            FechaPago = a.PagoNomina?.FechaPago,
            ComprobanteUrl = a.PagoNomina?.ComprobanteUrl,
            PeriodoPago = a.PagoNomina?.Periodo
        }).ToList();

        return Result<IEnumerable<EmpleadoHistorialDto>>.Success(result);
    }
}

