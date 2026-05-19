using MediatR;
using Zapatitos.Application.Common.Models;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Application.Features.Paquetes.Commands.UpdateServicio;

public record UpdateServicioCommand : IRequest<Result<Unit>>
{
    public long Id { get; init; }
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

public class UpdateServicioCommandHandler : IRequestHandler<UpdateServicioCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateServicioCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(UpdateServicioCommand request, CancellationToken cancellationToken)
    {
        var repository = _unitOfWork.Repository<Servicio>();
        var entity = await repository.Query()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
            return Result<Unit>.Failure(new[] { "El servicio no existe." });

        entity.Nombre = request.Nombre;
        entity.Descripcion = request.Descripcion;
        entity.CostoBase = request.CostoBase;
        entity.PrecioProveedor = request.PrecioProveedor;
        entity.EsExtra = request.EsExtra;
        entity.Tipo = (Zapatitos.Domain.Enums.TipoServicio)request.Tipo;
        entity.CantidadMinima = request.CantidadMinima;
        entity.ArticuloInventarioId = request.ArticuloInventarioId;
        entity.ProductoProduccionId = request.ProductoProduccionId;
        entity.ProveedorId = request.ProveedorId;
        entity.RequiereTemporizador = request.RequiereTemporizador;
        entity.DuracionMinutos = request.DuracionMinutos;
        entity.ImagenUrl = request.ImagenUrl;

        repository.Update(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
