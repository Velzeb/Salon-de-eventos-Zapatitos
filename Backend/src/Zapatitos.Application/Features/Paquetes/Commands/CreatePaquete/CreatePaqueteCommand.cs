using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Paquetes.Commands.CreatePaquete;

public record CreatePaqueteCommand : IRequest<Result<long>>
{
    public string Nombre { get; init; } = null!;
    public string? Descripcion { get; init; }
    public decimal PrecioBase { get; init; }
    public decimal Descuento { get; init; }
    public List<PaqueteServicioInput> Servicios { get; init; } = new();
    public List<PaqueteArticuloInput> Articulos { get; init; } = new();
    public string? ImagenUrl { get; init; }
}

public record PaqueteServicioInput(long ServicioId, int Cantidad);
public record PaqueteArticuloInput(long ArticuloId, int Cantidad);

public class CreatePaqueteCommandHandler : IRequestHandler<CreatePaqueteCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreatePaqueteCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(CreatePaqueteCommand request, CancellationToken cancellationToken)
    {
        var paquete = new Paquete
        {
            Nombre = request.Nombre,
            Descripcion = request.Descripcion,
            PrecioBase = request.PrecioBase,
            Descuento = request.Descuento,
            CapacidadNinos = 0, // Inhabilitado por diseño de catálogo
            DuracionHoras = 0,  // Inhabilitado por diseño de catálogo
            ImagenUrl = request.ImagenUrl
        };

        // Vincular servicios con cantidad
        if (request.Servicios != null && request.Servicios.Count > 0)
        {
            foreach (var srvInput in request.Servicios)
            {
                paquete.Servicios.Add(new PaqueteServicio
                {
                    ServicioId = srvInput.ServicioId,
                    Cantidad = srvInput.Cantidad
                });
            }
        }

        foreach (var art in request.Articulos)
        {
            paquete.Articulos.Add(new PaqueteArticulo
            {
                ArticuloId = art.ArticuloId,
                Cantidad = art.Cantidad
            });
        }

        await _unitOfWork.Repository<Paquete>().AddAsync(paquete);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(paquete.Id);
    }
}
