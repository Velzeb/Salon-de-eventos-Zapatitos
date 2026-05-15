using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Operativo.Commands.AddConsumo;

public record AddConsumoExtraCommand : IRequest<Result<long>>
{
    public long EventoId { get; init; }
    public long ServicioId { get; init; }
    public long EmpleadoId { get; init; }
    public int Cantidad { get; init; }
}

public class AddConsumoExtraCommandHandler : IRequestHandler<AddConsumoExtraCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public AddConsumoExtraCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(AddConsumoExtraCommand request, CancellationToken cancellationToken)
    {
        if (request.Cantidad <= 0)
            return Result<long>.Failure("La cantidad debe ser al menos 1.");

        // 1. Validar existencia de Evento y Servicio
        var evento = await _unitOfWork.Repository<Evento>().GetByIdAsync(request.EventoId);
        if (evento == null) return Result<long>.Failure("El evento no existe.");

        var servicio = await _unitOfWork.Repository<Servicio>().GetByIdAsync(request.ServicioId);
        if (servicio == null) return Result<long>.Failure("El servicio extra no existe.");

        // 2. Descontar Inventario (Si aplica)
        if (servicio.ArticuloInventarioId.HasValue)
        {
            var articulo = await _unitOfWork.Repository<ArticuloInventario>().GetByIdAsync(servicio.ArticuloInventarioId.Value);
            if (articulo != null)
            {
                if (articulo.StockActual < request.Cantidad)
                    return Result<long>.Failure($"Stock insuficiente de {articulo.Nombre}. Actual: {articulo.StockActual}");
                
                articulo.StockActual -= request.Cantidad;
                _unitOfWork.Repository<ArticuloInventario>().Update(articulo);
            }
        }

        // 3. Crear el registro de consumo
        var totalConsumo = servicio.CostoBase * request.Cantidad;
        
        var nuevoConsumo = new ConsumoExtra
        {
            EventoId = request.EventoId,
            ServicioId = request.ServicioId,
            EmpleadoId = request.EmpleadoId,
            Cantidad = request.Cantidad,
            PrecioUnitarioMomento = servicio.CostoBase,
            TotalConsumo = totalConsumo
        };

        // 4. Actualizar finanzas del evento
        evento.PrecioTotal += totalConsumo;
        evento.SaldoPendiente += totalConsumo;

        // 5. Guardar todo
        await _unitOfWork.Repository<ConsumoExtra>().AddAsync(nuevoConsumo);
        _unitOfWork.Repository<Evento>().Update(evento);
        
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(nuevoConsumo.Id);
    }
}
