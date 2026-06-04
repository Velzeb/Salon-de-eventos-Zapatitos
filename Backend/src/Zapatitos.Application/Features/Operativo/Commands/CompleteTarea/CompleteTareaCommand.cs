using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Operativo.Commands.CompleteTarea;

public record CompleteTareaCommand(long TareaId) : IRequest<Result<bool>>;

public class CompleteTareaCommandHandler : IRequestHandler<CompleteTareaCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CompleteTareaCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(CompleteTareaCommand request, CancellationToken cancellationToken)
    {
        var tarea = await _unitOfWork.Repository<TareaOperativa>().GetByIdAsync(request.TareaId);
        
        if (tarea == null) return Result<bool>.Failure("La tarea no existe.");
        
        if (tarea.Estado == EstadoTarea.Completada)
        {
            tarea.Estado = EstadoTarea.Pendiente;
            tarea.FechaCompletada = null;

            // Restablecer stock si fue descontado
            if (tarea.ArticuloInventarioId.HasValue && tarea.StockDescontado)
            {
                var articulo = await _unitOfWork.Repository<ArticuloInventario>().GetByIdAsync(tarea.ArticuloInventarioId.Value);
                if (articulo != null)
                {
                    articulo.StockActual += tarea.CantidadRequerida;
                    tarea.StockDescontado = false;
                    _unitOfWork.Repository<ArticuloInventario>().Update(articulo);
                }
            }
        }
        else
        {
            ArticuloInventario? articulo = null;
            if (tarea.ArticuloInventarioId.HasValue && !tarea.StockDescontado)
            {
                articulo = await _unitOfWork.Repository<ArticuloInventario>().GetByIdAsync(tarea.ArticuloInventarioId.Value);
                if (articulo != null && articulo.StockActual < tarea.CantidadRequerida)
                {
                    return Result<bool>.Failure($"Stock insuficiente para '{articulo.Nombre}'. Requerido: {tarea.CantidadRequerida}, disponible: {articulo.StockActual}.");
                }
            }

            tarea.Estado = EstadoTarea.Completada;
            tarea.FechaCompletada = DateTime.UtcNow;

            if (articulo != null)
            {
                articulo.StockActual -= tarea.CantidadRequerida;
                tarea.StockDescontado = true;
                _unitOfWork.Repository<ArticuloInventario>().Update(articulo);
            }
        }

        _unitOfWork.Repository<TareaOperativa>().Update(tarea);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
