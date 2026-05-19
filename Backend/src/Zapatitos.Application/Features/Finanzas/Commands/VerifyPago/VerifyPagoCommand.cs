using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Finanzas.Commands.VerifyPago;

public record VerifyPagoCommand(long PagoId, bool IsAccepted) : IRequest<Result<long>>;

public class VerifyPagoCommandHandler : IRequestHandler<VerifyPagoCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly Common.Services.IEventoService _eventoService;
    private readonly IMediator _mediator;

    public VerifyPagoCommandHandler(IUnitOfWork unitOfWork, Common.Services.IEventoService eventoService, IMediator mediator)
    {
        _unitOfWork = unitOfWork;
        _eventoService = eventoService;
        _mediator = mediator;
    }

    public async Task<Result<long>> Handle(VerifyPagoCommand request, CancellationToken cancellationToken)
    {
        var pago = await _unitOfWork.Repository<Pago>().GetByIdAsync(request.PagoId);
        if (pago == null) return Result<long>.Failure("Pago no encontrado.");

        if (pago.Estado != EstadoPago.Pendiente)
            return Result<long>.Failure("El pago no está pendiente de verificación.");

        if (request.IsAccepted)
        {
            pago.Estado = EstadoPago.Verificado;
            
            var evento = await _unitOfWork.Repository<Evento>().GetByIdAsync(pago.EventoId);
            if (evento != null)
            {
                evento.SaldoPendiente -= pago.Monto;
                if (evento.SaldoPendiente < 0) evento.SaldoPendiente = 0;
                
                if (evento.Estado == EstadoEvento.Provisional)
                {
                    await _eventoService.ConfirmarEventoAsync(evento.Id, cancellationToken);
                    await _mediator.Send(new Zapatitos.Application.Features.Operativo.Commands.GenerarTareasLogistica.GenerarTareasLogisticaCommand(evento.Id), cancellationToken);
                }
                else
                {
                    _unitOfWork.Repository<Evento>().Update(evento);
                }

                // REGISTRAR MOVIMIENTO EN CAJA
                await _unitOfWork.Repository<MovimientoCaja>().AddAsync(new MovimientoCaja
                {
                    Tipo = TipoTransaccion.Ingreso,
                    Monto = pago.Monto,
                    Concepto = $"Pago Verificado - Evento #{evento.Id}",
                    ReferenciaId = pago.Id,
                    Fecha = DateTime.UtcNow
                });
            }
        }
        else
        {
            pago.Estado = EstadoPago.Rechazado;
        }

        _unitOfWork.Repository<Pago>().Update(pago);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(pago.Id);
    }
}
