using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Paquetes.Queries.GetServicios;

public record GetServiciosQuery : IRequest<Result<IEnumerable<ServicioDto>>>;

public record ServicioDto(
    long Id, 
    string Nombre, 
    string? Descripcion, 
    decimal CostoBase, 
    decimal PrecioProveedor,
    bool EsExtra,
    int Tipo,
    int CantidadMinima,
    long? ArticuloInventarioId,
    long? ProductoProduccionId,
    long? ProveedorId,
    string? ArticuloNombre,
    string? ProductoNombre,
    string? ProveedorNombre,
    bool RequiereTemporizador,
    int DuracionMinutos,
    string? ImagenUrl
);

public class GetServiciosQueryHandler : IRequestHandler<GetServiciosQuery, Result<IEnumerable<ServicioDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetServiciosQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<ServicioDto>>> Handle(GetServiciosQuery request, CancellationToken cancellationToken)
    {
        var servicios = await _unitOfWork.Repository<Servicio>()
            .Query()
            .Include(s => s.ArticuloInventario)
            .Include(s => s.ProductoProduccion)
            .Include(s => s.Proveedor)
            .Where(s => s.Estado == EstadoGeneral.Activo)
            .OrderBy(s => s.Nombre)
            .ToListAsync(cancellationToken);

        var dtos = servicios.Select(s => new ServicioDto(
            s.Id, 
            s.Nombre, 
            s.Descripcion, 
            s.CostoBase, 
            s.PrecioProveedor,
            s.EsExtra,
            (int)s.Tipo,
            s.CantidadMinima,
            s.ArticuloInventarioId,
            s.ProductoProduccionId,
            s.ProveedorId,
            s.ArticuloInventario?.Nombre,
            s.ProductoProduccion?.Nombre,
            s.Proveedor?.Nombre,
            s.RequiereTemporizador,
            s.DuracionMinutos,
            s.Tipo == TipoServicio.ArticuloInventario 
                ? (s.ArticuloInventario != null ? s.ArticuloInventario.ImagenUrl : s.ImagenUrl)
                : s.Tipo == TipoServicio.ProductoProduccion
                    ? (s.ProductoProduccion != null ? s.ProductoProduccion.ImagenUrl : s.ImagenUrl)
                    : s.ImagenUrl
        ));

        return Result<IEnumerable<ServicioDto>>.Success(dtos);
    }
}
