using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Finanzas.Commands.AddGasto;

public record AddGastoCommand : IRequest<Result<long>>
{
    public long CategoriaId { get; init; }
    public decimal Monto { get; init; }
    public string Descripcion { get; init; } = null!;
}

public class AddGastoCommandHandler : IRequestHandler<AddGastoCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public AddGastoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(AddGastoCommand request, CancellationToken cancellationToken)
    {
        // 1. Crear el Gasto
        var nuevoGasto = new Gasto
        {
            CategoriaId = request.CategoriaId,
            Monto = request.Monto,
            Descripcion = request.Descripcion,
            Fecha = DateTime.UtcNow
        };

        // 2. Crear Movimiento de Caja (Egreso)
        var movimiento = new MovimientoCaja
        {
            Tipo = TipoTransaccion.Egreso,
            Monto = request.Monto,
            Concepto = $"Gasto: {request.Descripcion}",
            Fecha = DateTime.UtcNow
        };

        // 3. Guardar
        await _unitOfWork.Repository<Gasto>().AddAsync(nuevoGasto);
        await _unitOfWork.Repository<MovimientoCaja>().AddAsync(movimiento);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(nuevoGasto.Id);
    }
}
