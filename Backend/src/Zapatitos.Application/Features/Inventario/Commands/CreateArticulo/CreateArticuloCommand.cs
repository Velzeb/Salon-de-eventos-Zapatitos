using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Inventario.Commands.CreateArticulo;

public record CreateArticuloCommand : IRequest<Result<long>>
{
    public string Nombre { get; init; } = null!;
    public string? Descripcion { get; init; }
    public int StockActual { get; init; }
    public int StockMinimo { get; init; }
    public bool ControlarStock { get; init; } = true;
    public string? UnidadMedida { get; init; }
    public decimal PrecioCosto { get; init; }
    public long? ProveedorId { get; init; }
    public string? ImagenUrl { get; init; }
}

public class CreateArticuloCommandHandler : IRequestHandler<CreateArticuloCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateArticuloCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(CreateArticuloCommand request, CancellationToken cancellationToken)
    {
        var articulo = new ArticuloInventario
        {
            Nombre = request.Nombre,
            Descripcion = request.Descripcion,
            StockActual = request.StockActual,
            StockMinimo = request.StockMinimo,
            ControlarStock = request.ControlarStock,
            UnidadMedida = request.UnidadMedida,
            PrecioCosto = request.PrecioCosto,
            ProveedorId = request.ProveedorId,
            ImagenUrl = request.ImagenUrl
        };

        await _unitOfWork.Repository<ArticuloInventario>().AddAsync(articulo);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(articulo.Id);
    }
}
