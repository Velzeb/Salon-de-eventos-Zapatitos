using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Clientes.Commands.AddPagoQR;

public record AddPagoQRCommand(long EventoId, string ComprobanteBase64, decimal MontoAbonado) : IRequest<Result<long>>;

public class AddPagoQRCommandHandler : IRequestHandler<AddPagoQRCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public AddPagoQRCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(AddPagoQRCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().GetByIdAsync(request.EventoId);
        if (evento == null) return Result<long>.Failure("Evento no encontrado");

        var pago = new Pago
        {
            EventoId = request.EventoId,
            Monto = request.MontoAbonado,
            Estado = EstadoPago.Pendiente,
            FechaPago = DateTime.UtcNow,
            Referencia = "Abono QR/Transferencia (Portal Cliente)",
            ComprobanteUrl = request.ComprobanteBase64
        };

        await _unitOfWork.Repository<Pago>().AddAsync(pago);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(pago.Id);
    }
}
