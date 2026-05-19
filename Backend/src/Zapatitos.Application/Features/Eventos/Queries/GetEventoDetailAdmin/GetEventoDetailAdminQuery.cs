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

namespace Zapatitos.Application.Features.Eventos.Queries.GetEventoDetailAdmin;

public record GetEventoDetailAdminQuery(long EventoId) : IRequest<Result<EventoDetailAdminDto>>;

public class EventoDetailAdminDto
{
    public long Id { get; set; }
    public string Estado { get; set; } = null!;
    public DateTime FechaEvento { get; set; }
    public string HoraInicio { get; set; } = null!;
    public string HoraFin { get; set; } = null!;
    public string Paquete { get; set; } = null!;
    public long? PaqueteId { get; set; }
    public decimal PrecioTotal { get; set; }
    public decimal SaldoPendiente { get; set; }
    public int CantidadNinosEstimada { get; set; }
    public string Origen { get; set; } = null!;
    public List<string> Clientes { get; set; } = new();
    public List<CumpleaneroAdminDto> Cumpleaneros { get; set; } = new();
    public List<ItemAdminDto> Items { get; set; } = new();
    public List<PagoAdminDto> Pagos { get; set; } = new();
    public Guid? InvitacionToken { get; set; }
}

public class CumpleaneroAdminDto
{
    public long NinoId { get; set; }
    public string Nombre { get; set; } = null!;
    public int EdadCumplir { get; set; }
}

public class ItemAdminDto
{
    public string Nombre { get; set; } = null!;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public bool EsIncluidoEnPaquete { get; set; }
}

public class PagoAdminDto
{
    public long Id { get; set; }
    public decimal Monto { get; set; }
    public string Estado { get; set; } = null!;
    public DateTime FechaPago { get; set; }
    public string? ComprobanteUrl { get; set; }
    public string? Referencia { get; set; }
}

public class GetEventoDetailAdminQueryHandler : IRequestHandler<GetEventoDetailAdminQuery, Result<EventoDetailAdminDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    public GetEventoDetailAdminQueryHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<EventoDetailAdminDto>> Handle(GetEventoDetailAdminQuery request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().Query()
            .Include(e => e.Paquete)
            .Include(e => e.ClientesResponsables)
            .Include(e => e.Cumpleaneros).ThenInclude(c => c.Nino)
            .Include(e => e.Items)
            .Include(e => e.Pagos)
            .FirstOrDefaultAsync(e => e.Id == request.EventoId, cancellationToken);

        if (evento == null) return Result<EventoDetailAdminDto>.Failure("Evento no encontrado.");

        var invitacion = await _unitOfWork.Repository<InvitacionDigital>().Query()
            .FirstOrDefaultAsync(i => i.EventoId == request.EventoId, cancellationToken);

        return Result<EventoDetailAdminDto>.Success(new EventoDetailAdminDto
        {
            Id = evento.Id,
            Estado = evento.Estado.ToString(),
            FechaEvento = evento.FechaEvento,
            HoraInicio = evento.HoraInicio.ToString(@"hh\:mm"),
            HoraFin = evento.HoraFin.ToString(@"hh\:mm"),
            Paquete = evento.Paquete?.Nombre ?? "—",
            PaqueteId = evento.PaqueteId,
            PrecioTotal = evento.PrecioTotal,
            SaldoPendiente = evento.SaldoPendiente,
            CantidadNinosEstimada = evento.CantidadNinosEstimada,
            Origen = evento.Origen.ToString(),
            InvitacionToken = invitacion?.TokenAcceso,
            Clientes = evento.ClientesResponsables.Select(c => c.NombreCompleto).ToList(),
            Cumpleaneros = evento.Cumpleaneros.Select(c => new CumpleaneroAdminDto
            {
                NinoId = c.NinoId,
                Nombre = c.Nino?.Nombre ?? "—",
                EdadCumplir = c.EdadCumplir
            }).ToList(),
            Items = evento.Items?.Select(i => new ItemAdminDto
            {
                Nombre = i.Nombre,
                Cantidad = i.Cantidad,
                PrecioUnitario = i.PrecioUnitario,
                EsIncluidoEnPaquete = i.EsIncluidoEnPaquete
            }).ToList() ?? new(),
            Pagos = evento.Pagos?.OrderByDescending(p => p.FechaPago).Select(p => new PagoAdminDto
            {
                Id = p.Id,
                Monto = p.Monto,
                Estado = p.Estado.ToString(),
                FechaPago = p.FechaPago,
                ComprobanteUrl = p.ComprobanteUrl,
                Referencia = p.Referencia
            }).ToList() ?? new()
        });
    }
}
