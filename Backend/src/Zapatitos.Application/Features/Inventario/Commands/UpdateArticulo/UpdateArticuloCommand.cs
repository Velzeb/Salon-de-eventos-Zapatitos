using MediatR;
using Zapatitos.Application.Common.Models;
using Zapatitos.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Zapatitos.Application.Features.Inventario.Commands.UpdateArticulo;

public record UpdateArticuloCommand : IRequest<Result<Unit>>
{
    public long Id { get; init; }
    public string Nombre { get; init; } = null!;
    public string? Descripcion { get; init; }
    public int StockActual { get; init; }
    public int StockMinimo { get; init; }
    public bool ControlarStock { get; init; }
    public string? UnidadMedida { get; init; }
    public decimal PrecioCosto { get; init; }
    public long? ProveedorId { get; init; }
    public string? ImagenUrl { get; init; }
}

public class UpdateArticuloCommandHandler : IRequestHandler<UpdateArticuloCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateArticuloCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(UpdateArticuloCommand request, CancellationToken cancellationToken)
    {
        var repository = _unitOfWork.Repository<Zapatitos.Domain.Entities.ArticuloInventario>();
        var entity = await repository.Query()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
            return Result<Unit>.Failure(new[] { "El artículo no existe." });

        entity.Nombre = request.Nombre;
        entity.Descripcion = request.Descripcion;
        entity.StockActual = request.StockActual;
        entity.StockMinimo = request.StockMinimo;
        entity.ControlarStock = request.ControlarStock;
        entity.UnidadMedida = request.UnidadMedida;
        entity.PrecioCosto = request.PrecioCosto;
        entity.ProveedorId = request.ProveedorId;
        entity.ImagenUrl = request.ImagenUrl;

        repository.Update(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
