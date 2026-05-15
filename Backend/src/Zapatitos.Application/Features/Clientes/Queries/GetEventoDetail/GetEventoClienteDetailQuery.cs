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

namespace Zapatitos.Application.Features.Clientes.Queries.GetEventoDetail;

public record GetEventoClienteDetailQuery(long EventoId, long UsuarioId) : IRequest<Result<EventoClienteDetailDto>>;

public class EventoClienteDetailDto
{
    public long Id { get; set; }
    public string NombreCumpleaneros { get; set; } = null!;
    public string Paquete { get; set; } = null!;
    public DateTime FechaEvento { get; set; }
    public string HoraInicio { get; set; } = null!;
    public string HoraFin { get; set; } = null!;
    public string NombreNegocio { get; set; } = "Zapatitos";
    public string Direccion { get; set; } = "";
    public string Estado { get; set; } = null!;
    public decimal PrecioTotal { get; set; }
    public decimal SaldoPendiente { get; set; }
    public Guid? InvitacionToken { get; set; }
    public bool YaCalificado { get; set; }
    public bool ConsentimientoMarketing { get; set; }
    public string? Tematica { get; set; }
    public string? ColorManteleria { get; set; }
    public string? SaborPastel { get; set; }
    public string? NotasDecoracion { get; set; }
    public string? Alergias { get; set; }
    public List<EventoItemClienteDto> Items { get; set; } = new();
    public List<string> FotosUrls { get; set; } = new();
    public List<MultimediaEventoDto> GaleriaMultimedia { get; set; } = new();
    public List<PagoClienteDto> Pagos { get; set; } = new();
}

public class MultimediaEventoDto
{
    public long Id { get; set; }
    public string Url { get; set; } = null!;
    public string NombreArchivo { get; set; } = null!;
    public string TipoArchivo { get; set; } = null!;
    public DateTime FechaSubida { get; set; }
}

public class PagoClienteDto
{
    public long Id { get; set; }
    public decimal Monto { get; set; }
    public string Estado { get; set; } = null!;
    public DateTime FechaPago { get; set; }
    public string? Referencia { get; set; }
    public string? ComprobanteUrl { get; set; }
}

public class EventoItemClienteDto
{
    public string Nombre { get; set; } = null!;
    public int Cantidad { get; set; }
    public bool EsExtra { get; set; }
    public decimal Precio { get; set; }
}

public class GetEventoClienteDetailQueryHandler : IRequestHandler<GetEventoClienteDetailQuery, Result<EventoClienteDetailDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetEventoClienteDetailQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<EventoClienteDetailDto>> Handle(GetEventoClienteDetailQuery request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().Query()
            .Include(e => e.Paquete)
            .Include(e => e.Cumpleaneros)
                .ThenInclude(c => c.Nino)
            .Include(e => e.Items)
            .Include(e => e.ConsumosExtras)
                .ThenInclude(c => c.Servicio)
            .Include(e => e.Fotos)
            .Include(e => e.Multimedia)
            .Include(e => e.Retroalimentaciones)
            .Include(e => e.ClientesResponsables)
            .Include(e => e.Pagos)
            .FirstOrDefaultAsync(e => e.Id == request.EventoId, cancellationToken);

        if (evento == null) return Result<EventoClienteDetailDto>.Failure("Evento no encontrado.");
        
        // Verificar que el evento pertenezca al usuario/cliente
        var esPropietario = evento.ClientesResponsables.Any(c => c.UsuarioId == request.UsuarioId);
        if (!esPropietario) return Result<EventoClienteDetailDto>.Failure("No tienes permiso para ver este evento.");

        var invitacion = await _unitOfWork.Repository<InvitacionDigital>().Query()
            .FirstOrDefaultAsync(i => i.EventoId == evento.Id, cancellationToken);

        // Leer configuraciones del negocio
        var configNombre = await _unitOfWork.Repository<ConfiguracionWeb>().Query()
            .FirstOrDefaultAsync(c => c.Clave == "nombre_negocio", cancellationToken);
        var configDireccion = await _unitOfWork.Repository<ConfiguracionWeb>().Query()
            .FirstOrDefaultAsync(c => c.Clave == "direccion", cancellationToken);

        var pagosDto = evento.Pagos?.OrderByDescending(p => p.FechaPago)
            .Select(p => new PagoClienteDto
            {
                Id = p.Id,
                Monto = p.Monto,
                Estado = p.Estado.ToString(),
                FechaPago = p.FechaPago,
                Referencia = p.Referencia,
                ComprobanteUrl = p.ComprobanteUrl
            }).ToList() ?? new List<PagoClienteDto>();

        var dto = new EventoClienteDetailDto
        {
            Id = evento.Id,
            NombreCumpleaneros = string.Join(", ", evento.Cumpleaneros.Select(c => c.Nino?.Nombre ?? "Cumpleañero")),
            Paquete = evento.Paquete?.Nombre ?? "Paquete no especificado",
            FechaEvento = evento.FechaEvento,
            HoraInicio = evento.HoraInicio.ToString(@"hh\:mm"),
            HoraFin = evento.HoraFin.ToString(@"hh\:mm"),
            NombreNegocio = configNombre?.Valor ?? "Zapatitos Centro de Eventos",
            Direccion = configDireccion?.Valor ?? "",
            Estado = evento.Estado.ToString(),
            PrecioTotal = evento.PrecioTotal,
            SaldoPendiente = evento.SaldoPendiente,
            InvitacionToken = invitacion?.TokenAcceso,
            YaCalificado = evento.Retroalimentacion != null,
            ConsentimientoMarketing = evento.ConsentimientoMarketing,
            Tematica = evento.Tematica,
            ColorManteleria = evento.ColorManteleria,
            SaborPastel = evento.SaborPastel,
            NotasDecoracion = evento.NotasDecoracion,
            Alergias = evento.Alergias,
            FotosUrls = evento.Fotos?.Where(f => f.VisibleParaCliente).Select(f => f.Url).ToList() ?? new List<string>(),
            GaleriaMultimedia = evento.Multimedia?.OrderByDescending(m => m.FechaSubida)
                .Select(m => new MultimediaEventoDto {
                    Id = m.Id,
                    Url = m.Url,
                    NombreArchivo = m.NombreArchivo,
                    TipoArchivo = m.TipoArchivo.ToString(),
                    FechaSubida = m.FechaSubida
                }).ToList() ?? new List<MultimediaEventoDto>(),
            Pagos = pagosDto,
            Items = (evento.Items?.Select(i => new EventoItemClienteDto {
                Nombre = i.Nombre ?? "Item sin nombre",
                Cantidad = i.Cantidad,
                EsExtra = !i.EsIncluidoEnPaquete,
                Precio = i.PrecioUnitario
            }) ?? Enumerable.Empty<EventoItemClienteDto>())
            .Concat(evento.ConsumosExtras?.Select(c => new EventoItemClienteDto {
                Nombre = c.Servicio?.Nombre ?? "Consumo Extra",
                Cantidad = c.Cantidad,
                EsExtra = true,
                Precio = c.PrecioUnitarioMomento
            }) ?? Enumerable.Empty<EventoItemClienteDto>()).ToList()
        };

        return Result<EventoClienteDetailDto>.Success(dto);
    }
}
