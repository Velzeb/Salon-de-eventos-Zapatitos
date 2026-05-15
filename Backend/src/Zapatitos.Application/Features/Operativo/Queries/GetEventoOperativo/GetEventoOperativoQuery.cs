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

namespace Zapatitos.Application.Features.Operativo.Queries.GetEventoOperativo;

public record GetEventoOperativoQuery(long EventoId) : IRequest<Result<EventoOperativoDto>>;

public class EventoOperativoDto
{
    public long EventoId { get; set; }
    public string PaqueteNombre { get; set; } = null!;
    public DateTime FechaEvento { get; set; }
    public string HoraInicio { get; set; } = null!;
    public string HoraFin { get; set; } = null!;
    public decimal SaldoPendiente { get; set; }
    public decimal PrecioTotal { get; set; }
    public string Estado { get; set; } = null!;
    public string? NotasAdmin { get; set; }
    public List<TareaOperativaDto> Tareas { get; set; } = new();
    public List<ConsumoExtraDto> Consumos { get; set; } = new();
    public List<StaffOperativoDto> Staff { get; set; } = new();
    public List<ItemOperativoDto> Items { get; set; } = new();
    public List<PagoOperativoDto> Pagos { get; set; } = new();
    public List<string> Clientes { get; set; } = new();
    public List<CumpleaneroOperativoDto> Protagonistas { get; set; } = new();
    public string? InvitacionToken { get; set; }

    // === FASE 5 ===
    public string? Tematica { get; set; }
    public string? ColorManteleria { get; set; }
    public string? SaborPastel { get; set; }
    public string? NotasDecoracion { get; set; }
    public string? Alergias { get; set; }
    public List<ActividadCronogramaDto> Cronograma { get; set; } = new();
    public List<InvitadoDto> Invitados { get; set; } = new();

    // === FASE 8 (Post-Fiesta) ===
    public string? LinkGaleriaFotos { get; set; }
    public bool ConsentimientoMarketing { get; set; }
    public DateTime? FechaEntregaFotos { get; set; }
    public DateTime? FechaProximoContacto { get; set; }
    public List<MultimediaEventoDto> GaleriaMultimedia { get; set; } = new();
}

public class MultimediaEventoDto
{
    public long Id { get; set; }
    public string Url { get; set; } = null!;
    public string NombreArchivo { get; set; } = null!;
    public string TipoArchivo { get; set; } = null!;
    public DateTime FechaSubida { get; set; }
}

public class InvitadoDto
{
    public long Id { get; set; }
    public string Nombre { get; set; } = null!;
    public Guid CodigoQr { get; set; }
    public bool Ingreso { get; set; }
    public DateTime? FechaIngreso { get; set; }
}

public class ActividadCronogramaDto
{
    public long Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public string HoraInicio { get; set; } = null!;
    public string HoraFin { get; set; } = null!;
    public int Orden { get; set; }
    public bool Completada { get; set; }
    public DateTime? HoraInicioReal { get; set; }
    public DateTime? HoraFinReal { get; set; }
}

public class CumpleaneroOperativoDto
{
    public string Nombre { get; set; } = null!;
    public int EdadCumplir { get; set; }
}

public class PagoOperativoDto
{
    public long Id { get; set; }
    public decimal Monto { get; set; }
    public string Estado { get; set; } = null!;
    public DateTime FechaPago { get; set; }
    public string? ComprobanteUrl { get; set; }
    public string? Referencia { get; set; }
}

public class TareaOperativaDto
{
    public long Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public string Estado { get; set; } = null!;
    public string? AsignadoA { get; set; }
    public long? ArticuloId { get; set; }
    public int CantidadRequerida { get; set; }
    public bool StockDescontado { get; set; }
}

public class ConsumoExtraDto
{
    public long Id { get; set; }
    public string Servicio { get; set; } = null!;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Total { get; set; }
    public DateTime Fecha { get; set; }
}

public class StaffOperativoDto
{
    public long Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Rol { get; set; } = null!;
    public bool EsPagado { get; set; }
}

public class ItemOperativoDto
{
    public long Id { get; set; }
    public string Nombre { get; set; } = null!;
    public int Cantidad { get; set; }
    public bool EsIncluidoEnPaquete { get; set; }
    public string? Tipo { get; set; } // Articulo o Servicio
}

public class GetEventoOperativoQueryHandler : IRequestHandler<GetEventoOperativoQuery, Result<EventoOperativoDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetEventoOperativoQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<EventoOperativoDto>> Handle(GetEventoOperativoQuery request, CancellationToken cancellationToken)
    {
        try 
        {
            Console.WriteLine($"--> Buscando evento con ID: {request.EventoId}");
            var allIds = await _unitOfWork.Repository<Evento>().Query()
                .Select(e => e.Id)
                .ToListAsync(cancellationToken);
            
            Console.WriteLine($"--> IDs encontrados en la DB: {string.Join(", ", allIds)}");

            var evento = await _unitOfWork.Repository<Evento>().Query()
                .Include(e => e.Paquete)
                .Include(e => e.Tareas).ThenInclude(t => t.AsignadoA)
                .Include(e => e.ConsumosExtras).ThenInclude(c => c.Servicio)
                .Include(e => e.Staff).ThenInclude(s => s.Empleado)
                .Include(e => e.Items)
                .Include(e => e.Pagos)
                .Include(e => e.ClientesResponsables)
                .Include(e => e.Cumpleaneros).ThenInclude(c => c.Nino)
                .Include(e => e.Cronograma)
                .Include(e => e.Invitados)
                .Include(e => e.Multimedia)
                .FirstOrDefaultAsync(e => e.Id == request.EventoId, cancellationToken);

            if (evento == null)
            {
                string msg = $"El evento {request.EventoId} no existe.";
                return Result<EventoOperativoDto>.Failure(msg);
            }

            var dto = new EventoOperativoDto
            {
                EventoId = evento.Id,
                PaqueteNombre = evento.Paquete?.Nombre ?? "Sin Paquete",
                FechaEvento = evento.FechaEvento,
                HoraInicio = evento.HoraInicio.ToString("hh\\:mm"),
                HoraFin = evento.HoraFin.ToString("hh\\:mm"),
                SaldoPendiente = evento.SaldoPendiente,
                PrecioTotal = evento.PrecioTotal,
                Estado = evento.Estado.ToString(),
                NotasAdmin = evento.NotasAdmin ?? "",
                Tematica = evento.Tematica,
                ColorManteleria = evento.ColorManteleria,
                SaborPastel = evento.SaborPastel,
                NotasDecoracion = evento.NotasDecoracion,
                Alergias = evento.Alergias,
                LinkGaleriaFotos = evento.LinkGaleriaFotos,
                ConsentimientoMarketing = evento.ConsentimientoMarketing,
                FechaEntregaFotos = evento.FechaEntregaFotos,
                FechaProximoContacto = evento.FechaProximoContacto,
                Tareas = evento.Tareas.Select(t => new TareaOperativaDto
                {
                    Id = t.Id,
                    Nombre = t.NombreTarea,
                    Descripcion = t.Descripcion,
                    Estado = t.Estado.ToString(),
                    AsignadoA = t.AsignadoA?.NombreCompleto,
                    ArticuloId = t.ArticuloInventarioId,
                    CantidadRequerida = t.CantidadRequerida,
                    StockDescontado = t.StockDescontado
                }).ToList(),
                Consumos = evento.ConsumosExtras.Select(c => new ConsumoExtraDto
                {
                    Id = c.Id,
                    Servicio = c.Servicio?.Nombre ?? ("Servicio #" + c.ServicioId),
                    Cantidad = c.Cantidad,
                    PrecioUnitario = c.PrecioUnitarioMomento,
                    Total = c.TotalConsumo,
                    Fecha = c.CreadoEn
                }).ToList(),
                Staff = evento.Staff.Select(s => s.Empleado != null ? new StaffOperativoDto
                {
                    Id = s.Id,
                    Nombre = s.Empleado.NombreCompleto,
                    Rol = s.RolEnEvento ?? "Apoyo",
                    EsPagado = s.EsPagado
                } : new StaffOperativoDto
                {
                    Id = s.Id,
                    Nombre = "Sin Asignar",
                    Rol = s.RolEnEvento ?? "Apoyo",
                    EsPagado = s.EsPagado
                }).ToList(),
                Items = evento.Items.Select(i => new ItemOperativoDto
                {
                    Id = i.Id,
                    Nombre = i.Nombre,
                    Cantidad = i.Cantidad,
                    EsIncluidoEnPaquete = i.EsIncluidoEnPaquete,
                    Tipo = i.ArticuloId.HasValue ? "Articulo" : "Servicio"
                }).ToList(),
                Pagos = evento.Pagos.Select(p => new PagoOperativoDto
                {
                    Id = p.Id,
                    Monto = p.Monto,
                    Estado = p.Estado.ToString(),
                    FechaPago = p.FechaPago,
                    ComprobanteUrl = p.ComprobanteUrl,
                    Referencia = p.Referencia
                }).OrderByDescending(p => p.FechaPago).ToList(),
                Clientes = evento.ClientesResponsables.Select(c => c.NombreCompleto).ToList(),
                Protagonistas = evento.Cumpleaneros.Select(c => new CumpleaneroOperativoDto
                {
                    Nombre = c.Nino?.Nombre ?? "Sin Nombre",
                    EdadCumplir = c.EdadCumplir
                }).ToList(),
                Cronograma = evento.Cronograma.OrderBy(a => a.Orden).Select(a => new ActividadCronogramaDto
                {
                    Id = a.Id,
                    Nombre = a.Nombre,
                    Descripcion = a.Descripcion,
                    HoraInicio = a.HoraInicio.ToString("hh\\:mm"),
                    HoraFin = a.HoraFin.ToString("hh\\:mm"),
                    Orden = a.Orden,
                    Completada = a.Completada,
                    HoraInicioReal = a.HoraInicioReal,
                    HoraFinReal = a.HoraFinReal
                }).ToList(),
                Invitados = evento.Invitados.OrderBy(i => i.Nombre).Select(i => new InvitadoDto
                {
                    Id = i.Id,
                    Nombre = i.Nombre,
                    CodigoQr = i.CodigoQr,
                    Ingreso = i.Ingreso,
                    FechaIngreso = i.FechaIngreso
                }).ToList(),
                InvitacionToken = (await _unitOfWork.Repository<InvitacionDigital>().Query()
                    .FirstOrDefaultAsync(i => i.EventoId == evento.Id, cancellationToken))?.TokenAcceso.ToString(),
                GaleriaMultimedia = evento.Multimedia.Select(m => new MultimediaEventoDto
                {
                    Id = m.Id,
                    Url = m.Url,
                    NombreArchivo = m.NombreArchivo,
                    TipoArchivo = m.TipoArchivo,
                    FechaSubida = m.FechaSubida
                }).OrderByDescending(m => m.FechaSubida).ToList()
            };

            return Result<EventoOperativoDto>.Success(dto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"!!! ERROR EN GetEventoOperativoQueryHandler: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
            return Result<EventoOperativoDto>.Failure($"Error interno en el servidor: {ex.Message} - {ex.InnerException?.Message}");
        }
    }
}
