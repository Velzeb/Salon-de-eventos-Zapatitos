using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Eventos.Commands.CreateEvento;

public record CreateEventoCommand : IRequest<Result<long>>
{
    public List<long> ClienteIds { get; init; } = new();
    public List<long> ServicioIds { get; init; } = new();
    public List<CumpleaneroDto> Cumpleaneros { get; init; } = new();
    public long? PaqueteId { get; init; }
    public DateTime FechaEvento { get; init; }
    public TimeSpan HoraInicio { get; init; }
    public TimeSpan HoraFin { get; init; }
    public int CantidadNinosEstimada { get; init; }
    public decimal PagoInicial { get; init; }
    public string? ComprobantePago { get; init; } // Base64 o URL del recibo QR
    public decimal PrecioTotal { get; init; }
    public string? Tematica { get; init; }
    public OrigenEvento Origen { get; set; } = OrigenEvento.Interno;
    public long? UsuarioId { get; set; }
    public List<EventoItemDto> Items { get; init; } = new();
}

public class CumpleaneroDto
{
    public long NinoId { get; set; }
    public string? Nombre { get; set; }
    public int Edad { get; set; }
}

public class EventoItemDto
{
    public long? ArticuloId { get; set; }
    public long? ServicioId { get; set; }
    public string Nombre { get; set; } = null!;
    public int Cantidad { get; set; }
    public string? Notas { get; set; }
    public bool EsIncluidoEnPaquete { get; set; }
    public decimal PrecioUnitario { get; set; }
}

public class CreateEventoCommandHandler : IRequestHandler<CreateEventoCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMediator _mediator;

    public CreateEventoCommandHandler(IUnitOfWork unitOfWork, IMediator mediator)
    {
        _unitOfWork = unitOfWork;
        _mediator = mediator;
    }

    public async Task<Result<long>> Handle(CreateEventoCommand request, CancellationToken cancellationToken)
    {
        // 1. Validar si se eligió paquete. El salón también puede reservarse sin paquete.
        if (request.PaqueteId.HasValue)
        {
            var paquete = await _unitOfWork.Repository<Paquete>().GetByIdAsync(request.PaqueteId.Value);
            if (paquete == null) return Result<long>.Failure("El paquete seleccionado no existe.");
        }

        var clientes = new List<Cliente>();

        // 2. Si viene de un cliente autenticado (UsuarioId), buscar su entidad Cliente
        if (request.UsuarioId.HasValue)
        {
            var cliente = await _unitOfWork.Repository<Cliente>().Query()
                .FirstOrDefaultAsync(c => c.UsuarioId == request.UsuarioId, cancellationToken);
            
            if (cliente == null)
            {
                // Si el usuario existe pero no tiene entidad cliente (ej. primer registro), la creamos
                var usuario = await _unitOfWork.Repository<Usuario>().GetByIdAsync(request.UsuarioId.Value);
                if (usuario != null)
                {
                    cliente = new Cliente
                    {
                        UsuarioId = usuario.Id,
                        NombreCompleto = usuario.Username // Placeholder
                    };
                    await _unitOfWork.Repository<Cliente>().AddAsync(cliente);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                }
            }
            if (cliente != null) clientes.Add(cliente);
        }

        foreach (var id in request.ClienteIds)
        {
            var cliente = await _unitOfWork.Repository<Cliente>().GetByIdAsync(id);
            if (cliente != null && !clientes.Any(c => c.Id == cliente.Id)) clientes.Add(cliente);
        }

        if (!clientes.Any()) return Result<long>.Failure("Debe seleccionar al menos un cliente responsable.");

        // 3. Procesar Items (Incluidos y Extras)
        var items = request.Items.Select(i => new EventoItem
        {
            ArticuloId = i.ArticuloId,
            ServicioId = i.ServicioId,
            Nombre = i.Nombre,
            Cantidad = i.Cantidad,
            Notas = i.Notas,
            EsIncluidoEnPaquete = i.EsIncluidoEnPaquete,
            PrecioUnitario = i.PrecioUnitario
        }).ToList();

        decimal precioTotal = request.PrecioTotal;

        // 4. Crear la entidad Evento
        var nuevoEvento = new Evento
        {
            PaqueteId = request.PaqueteId,
            FechaEvento = request.FechaEvento,
            HoraInicio = request.HoraInicio,
            HoraFin = request.HoraFin,
            CantidadNinosEstimada = request.CantidadNinosEstimada,
            Estado = request.Origen == OrigenEvento.Online ? EstadoEvento.Provisional : EstadoEvento.Confirmado,
            Tematica = request.Tematica,
            PrecioTotal = precioTotal,
            SaldoPendiente = precioTotal - request.PagoInicial,
            ClientesResponsables = clientes,
            Items = items,
            Origen = request.Origen,
            Cumpleaneros = new List<Cumpleanero>()
        };

        // 5. Procesar cumpleañeros (crear si no existen)
        foreach (var cDto in request.Cumpleaneros)
        {
            var ninoId = cDto.NinoId;
            if (ninoId <= 0)
            {
                var nuevoNino = new Nino
                {
                    Nombre = cDto.Nombre ?? "Festejado",
                    FechaNacimiento = DateTime.Today.AddYears(-cDto.Edad) // Estimación
                };
                nuevoNino.Responsables.Add(clientes.First());
                await _unitOfWork.Repository<Nino>().AddAsync(nuevoNino);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                ninoId = nuevoNino.Id;
            }

            nuevoEvento.Cumpleaneros.Add(new Cumpleanero
            {
                NinoId = ninoId,
                EdadCumplir = cDto.Edad
            });
        }

        // 5. Registrar pago inicial si existe
        if (request.PagoInicial > 0 || !string.IsNullOrEmpty(request.ComprobantePago))
        {
            nuevoEvento.Pagos.Add(new Pago
            {
                Monto = request.PagoInicial,
                Estado = request.Origen == OrigenEvento.Online && !string.IsNullOrEmpty(request.ComprobantePago) ? EstadoPago.Pendiente : EstadoPago.Verificado,
                FechaPago = DateTime.UtcNow,
                Referencia = "Pago inicial al crear reserva (QR/Transferencia)",
                ComprobanteUrl = request.ComprobantePago
            });
        }

        // 6. Persistir
        await _unitOfWork.Repository<Evento>().AddAsync(nuevoEvento);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (nuevoEvento.Estado == EstadoEvento.Confirmado)
        {
            await _mediator.Send(
                new Zapatitos.Application.Features.Operativo.Commands.GenerarTareasLogistica.GenerarTareasLogisticaCommand(nuevoEvento.Id),
                cancellationToken);
        }

        return Result<long>.Success(nuevoEvento.Id);
    }
}
