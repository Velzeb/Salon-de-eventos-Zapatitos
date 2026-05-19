using MediatR;
using Microsoft.EntityFrameworkCore;
using Zapatitos.Application.Common.Models;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Domain.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Application.Features.Produccion.Commands.UpdateProducto;

public record IngredienteUpdateCommand
{
    public long ArticuloInventarioId { get; init; }
    public decimal CantidadRequerida { get; init; }
    public string? UnidadMedida { get; init; }
}

public record UpdateProductoProduccionCommand : IRequest<Result<Unit>>
{
    public long Id { get; init; }
    public string Nombre { get; init; } = null!;
    public string? Descripcion { get; init; }
    public int CantidadProducida { get; init; } = 1;
    public string? UnidadMedida { get; init; }
    public string? ImagenUrl { get; init; }
    public List<IngredienteUpdateCommand> Ingredientes { get; init; } = new();
}

public class UpdateProductoProduccionCommandHandler : IRequestHandler<UpdateProductoProduccionCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateProductoProduccionCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(UpdateProductoProduccionCommand request, CancellationToken cancellationToken)
    {
        var producto = await _unitOfWork.Repository<ProductoProduccion>()
            .Query()
            .Include(p => p.Ingredientes)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (producto == null)
            return Result<Unit>.Failure(new[] { "El producto de producción no existe." });

        producto.Nombre = request.Nombre;
        producto.Descripcion = request.Descripcion;
        producto.CantidadProducida = request.CantidadProducida;
        producto.UnidadMedida = request.UnidadMedida;
        producto.ImagenUrl = request.ImagenUrl;

        // Replace all ingredients
        var ingredientesRepo = _unitOfWork.Repository<RecetaIngrediente>();
        foreach (var ing in producto.Ingredientes.ToList())
        {
            ingredientesRepo.Delete(ing);
        }

        foreach (var ing in request.Ingredientes)
        {
            var nuevoIng = new RecetaIngrediente
            {
                ProductoProduccionId = producto.Id,
                ArticuloInventarioId = ing.ArticuloInventarioId,
                CantidadRequerida = ing.CantidadRequerida,
                UnidadMedida = ing.UnidadMedida
            };
            await ingredientesRepo.AddAsync(nuevoIng);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }
}
