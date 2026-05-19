using MediatR;
using Zapatitos.Application.Common.Models;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Application.Features.Paquetes.Commands.CreateServicio;

public record CreateServicioCommand : IRequest<Result<long>>
{
    public string Nombre { get; init; } = null!;
    public string? Descripcion { get; init; }
    public decimal CostoBase { get; init; }
    public decimal PrecioProveedor { get; init; }
    public bool EsExtra { get; init; }
    public int Tipo { get; init; }
    public int CantidadMinima { get; init; } = 1;
    public long? ArticuloInventarioId { get; init; }
    public long? ProductoProduccionId { get; init; }
    public long? ProveedorId { get; init; }
    public bool RequiereTemporizador { get; init; }
    public int DuracionMinutos { get; init; }
    public string? ImagenUrl { get; init; }
}

public class CreateServicioCommandHandler : IRequestHandler<CreateServicioCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateServicioCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(CreateServicioCommand request, CancellationToken cancellationToken)
    {
        var entity = new Servicio
        {
            Nombre = request.Nombre,
            Descripcion = request.Descripcion,
            CostoBase = request.CostoBase,
            PrecioProveedor = request.PrecioProveedor,
            EsExtra = request.EsExtra,
            Tipo = (Zapatitos.Domain.Enums.TipoServicio)request.Tipo,
            CantidadMinima = request.CantidadMinima,
            ArticuloInventarioId = request.ArticuloInventarioId,
            ProductoProduccionId = request.ProductoProduccionId,
            ProveedorId = request.ProveedorId,
            RequiereTemporizador = request.RequiereTemporizador,
            DuracionMinutos = request.DuracionMinutos,
            ImagenUrl = request.ImagenUrl
        };

        var repository = _unitOfWork.Repository<Servicio>();
        await repository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(entity.Id);
    }
}
