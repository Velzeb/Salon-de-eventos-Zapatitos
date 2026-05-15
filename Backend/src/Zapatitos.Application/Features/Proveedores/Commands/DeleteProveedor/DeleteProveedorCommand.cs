using MediatR;
using Zapatitos.Application.Common.Models;
using Zapatitos.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Zapatitos.Application.Features.Proveedores.Commands.DeleteProveedor;

public record DeleteProveedorCommand(long Id) : IRequest<Result<Unit>>;

public class DeleteProveedorCommandHandler : IRequestHandler<DeleteProveedorCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteProveedorCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeleteProveedorCommand request, CancellationToken cancellationToken)
    {
        var proveedorRepo = _unitOfWork.Repository<Zapatitos.Domain.Entities.Proveedor>();
        var entity = await proveedorRepo.Query()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
            return Result<Unit>.Failure(new[] { "El proveedor no existe." });

        // Identificar IDs de servicios y artículos asociados para limpieza profunda
        var serviciosIds = await _unitOfWork.Repository<Zapatitos.Domain.Entities.Servicio>().Query()
            .Where(x => x.ProveedorId == request.Id)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        var articulosIds = await _unitOfWork.Repository<Zapatitos.Domain.Entities.ArticuloInventario>().Query()
            .Where(x => x.ProveedorId == request.Id)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        // 1. Limpiar dependencias en Eventos (Consumos Extras e Items)
        var consumoExtraRepo = _unitOfWork.Repository<Zapatitos.Domain.Entities.ConsumoExtra>();
        var consumosExtras = await consumoExtraRepo.Query()
            .Where(x => serviciosIds.Contains(x.ServicioId))
            .ToListAsync(cancellationToken);
        foreach (var ce in consumosExtras) consumoExtraRepo.Delete(ce);

        var eventoItemRepo = _unitOfWork.Repository<Zapatitos.Domain.Entities.EventoItem>();
        var eventoItems = await eventoItemRepo.Query()
            .Where(x => (x.ServicioId.HasValue && serviciosIds.Contains(x.ServicioId.Value)) || 
                        (x.ArticuloId.HasValue && articulosIds.Contains(x.ArticuloId.Value)))
            .ToListAsync(cancellationToken);
        foreach (var ei in eventoItems) eventoItemRepo.Delete(ei);

        // 2. Limpiar dependencias en Catálogo (Recetas y Paquetes)
        var recetaIngredienteRepo = _unitOfWork.Repository<Zapatitos.Domain.Entities.RecetaIngrediente>();
        var ingredientes = await recetaIngredienteRepo.Query()
            .Where(x => articulosIds.Contains(x.ArticuloInventarioId))
            .ToListAsync(cancellationToken);
        foreach (var ing in ingredientes) recetaIngredienteRepo.Delete(ing);

        var paqueteArticuloRepo = _unitOfWork.Repository<Zapatitos.Domain.Entities.PaqueteArticulo>();
        var paqueteArticulos = await paqueteArticuloRepo.Query()
            .Where(x => articulosIds.Contains(x.ArticuloId))
            .ToListAsync(cancellationToken);
        foreach (var pa in paqueteArticulos) paqueteArticuloRepo.Delete(pa);

        // 3. Eliminar Servicios asociados
        var servicioRepo = _unitOfWork.Repository<Zapatitos.Domain.Entities.Servicio>();
        var servicios = await servicioRepo.Query()
            .Where(x => x.ProveedorId == request.Id)
            .Include(x => x.Paquetes) // Importante para que EF limpie la relación many-to-many
            .ToListAsync(cancellationToken);
        
        foreach (var svc in servicios)
        {
            svc.Paquetes.Clear(); // Limpiar la relación con paquetes
            servicioRepo.Delete(svc);
        }

        // 4. Eliminar Artículos de Inventario asociados
        var articuloRepo = _unitOfWork.Repository<Zapatitos.Domain.Entities.ArticuloInventario>();
        var articulos = await articuloRepo.Query()
            .Where(x => x.ProveedorId == request.Id)
            .ToListAsync(cancellationToken);

        foreach (var art in articulos)
        {
            articuloRepo.Delete(art);
        }

        // 5. Eliminar el Proveedor
        proveedorRepo.Delete(entity);
        
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
