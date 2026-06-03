using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Eventos.Commands.CancelarEvento;

public record CancelarEventoCommand(long EventoId, string Motivo) : IRequest<Result<bool>>;

public class CancelarEventoCommandHandler : IRequestHandler<CancelarEventoCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CancelarEventoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(CancelarEventoCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().Query()
            .Include(e => e.Pagos)
            .Include(e => e.Staff)
            .Include(e => e.Tareas)
            .FirstOrDefaultAsync(e => e.Id == request.EventoId, cancellationToken);

        if (evento == null) return Result<bool>.Failure("Evento no encontrado.");

        if (evento.Estado == EstadoEvento.Cancelado || evento.Estado == EstadoEvento.Terminado)
            return Result<bool>.Failure($"El evento ya se encuentra {evento.Estado}.");

        // 1. Calcular penalizaciones
        var diasRestantes = (evento.FechaEvento.Date - DateTime.UtcNow.Date).TotalDays;
        var pagosCompletados = evento.Pagos.Where(p => p.Estado == EstadoPago.Verificado).Sum(p => p.Monto);
        
        // Regla: Cancelación con menos de 7 días no hay reembolso del anticipo.
        decimal montoReembolso = 0;
        if (diasRestantes > 7)
        {
            montoReembolso = pagosCompletados; // Reembolso total
        }
        else
        {
            // Retención de un monto fijo o porcentaje (Ej. se retiene 1000 de penalización)
            var penalizacion = Math.Min(1000m, pagosCompletados);
            montoReembolso = pagosCompletados - penalizacion;
        }

        if (montoReembolso > 0)
        {
            var movimientoReembolso = new MovimientoCaja
            {
                Tipo = TipoTransaccion.Egreso,
                Monto = montoReembolso,
                Concepto = $"Reembolso por Cancelación - Evento #{evento.Id}. Motivo: {request.Motivo}",
                Fecha = DateTime.UtcNow
            };
            await _unitOfWork.Repository<MovimientoCaja>().AddAsync(movimientoReembolso);
        }

        // 2. Liberar Staff
        foreach (var staff in evento.Staff)
        {
            _unitOfWork.Repository<AsignacionStaff>().Delete(staff);
        }

        // 3. Liberar Tareas Logísticas (y reponer inventario si ya se había descontado por error)
        foreach (var tarea in evento.Tareas)
        {
            if (tarea.StockDescontado && tarea.ArticuloInventarioId.HasValue)
            {
                var articulo = await _unitOfWork.Repository<ArticuloInventario>().GetByIdAsync(tarea.ArticuloInventarioId.Value);
                if (articulo != null)
                {
                    articulo.StockActual += tarea.CantidadRequerida; // Reponer
                    _unitOfWork.Repository<ArticuloInventario>().Update(articulo);
                }
            }
            _unitOfWork.Repository<TareaOperativa>().Delete(tarea);
        }

        // 4. Actualizar estado
        evento.Estado = EstadoEvento.Cancelado;
        evento.NotasAdmin = (evento.NotasAdmin + $"\n[CANCELADO {DateTime.UtcNow:dd/MM/yyyy}] Motivo: {request.Motivo}. Reembolso: ${montoReembolso}").Trim();
        evento.SaldoPendiente = 0; // Se liquida la deuda al cancelar
        
        _unitOfWork.Repository<Evento>().Update(evento);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
