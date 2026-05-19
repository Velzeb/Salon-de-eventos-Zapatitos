using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Paquetes.Queries.GetPaquetes;

public record GetPaquetesQuery : IRequest<Result<IEnumerable<PaqueteDto>>>;

public class GetPaquetesQueryHandler : IRequestHandler<GetPaquetesQuery, Result<IEnumerable<PaqueteDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPaquetesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<PaqueteDto>>> Handle(GetPaquetesQuery request, CancellationToken cancellationToken)
    {
        var paquetes = await _unitOfWork.Repository<Paquete>()
            .Query()
            .Include(p => p.Articulos)
                .ThenInclude(pa => pa.Articulo)
            .Include(p => p.Servicios)
                .ThenInclude(ps => ps.Servicio)
            .ToListAsync(cancellationToken);
        
        var dtos = paquetes.Select(p => new PaqueteDto
        {
            Id = p.Id,
            Nombre = p.Nombre,
            Descripcion = p.Descripcion,
            PrecioBase = p.PrecioBase,
            CapacidadNinos = p.CapacidadNinos,
            DuracionHoras = p.DuracionHoras,
            ImagenUrl = p.ImagenUrl,
            Articulos = p.Articulos.Select(pa => new PaqueteArticuloDto
            {
                ArticuloId = pa.ArticuloId,
                NombreArticulo = pa.Articulo.Nombre,
                Cantidad = pa.Cantidad,
                UnidadMedida = pa.Articulo.UnidadMedida
            }).ToList(),
            Servicios = p.Servicios.Select(ps => new PaqueteServicioDto
            {
                Id = ps.ServicioId,
                Nombre = ps.Servicio.Nombre,
                CostoBase = ps.Servicio.CostoBase,
                EsExtra = ps.Servicio.EsExtra,
                Cantidad = ps.Cantidad
            }).ToList()
        });

        return Result<IEnumerable<PaqueteDto>>.Success(dtos);
    }
}
