using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Finanzas.Commands.RegisterPago;

public record RegisterPagoCommand : IRequest<Result<long>>
{
    public long EventoId { get; init; }
    public long? MetodoPagoId { get; init; }
    public decimal Monto { get; init; }
    public string? Referencia { get; init; }
}

public class RegisterPagoCommandHandler : IRequestHandler<RegisterPagoCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public RegisterPagoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(RegisterPagoCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().Query()
            .Include(e => e.Cumpleaneros)
                .ThenInclude(c => c.Nino)
            .FirstOrDefaultAsync(e => e.Id == request.EventoId, cancellationToken);

        if (evento == null) return Result<long>.Failure("El evento no existe.");

        // Validaciones de Negocio
        if (request.Monto <= 0) 
            return Result<long>.Failure("El monto del pago debe ser mayor a cero.");

        if (request.Monto > evento.SaldoPendiente)
            return Result<long>.Failure($"El monto (${request.Monto}) excede el saldo pendiente (${evento.SaldoPendiente}).");

        // 1. Crear el Pago
        var nuevoPago = new Pago
        {
            EventoId = request.EventoId,
            MetodoPagoId = request.MetodoPagoId,
            Monto = request.Monto,
            Referencia = request.Referencia,
            Estado = Domain.Enums.EstadoPago.Verificado,
            FechaPago = DateTime.UtcNow
        };

        // 2. Crear el Movimiento de Caja (Vínculo financiero)
        var nombres = string.Join(", ", evento.Cumpleaneros.Select(c => c.Nino.Nombre));
        var movimiento = new MovimientoCaja
        {
            Tipo = TipoTransaccion.Ingreso,
            Monto = request.Monto,
            Concepto = $"Pago de Reserva - Evento #{evento.Id} - {nombres}",
            Fecha = DateTime.UtcNow
        };

        // 3. Actualizar Evento
        evento.SaldoPendiente -= request.Monto;

        // 4. Guardar todo
        await _unitOfWork.Repository<Pago>().AddAsync(nuevoPago);
        await _unitOfWork.Repository<MovimientoCaja>().AddAsync(movimiento);
        _unitOfWork.Repository<Evento>().Update(evento);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(nuevoPago.Id);
    }
}
