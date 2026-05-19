using MediatR;
using Microsoft.EntityFrameworkCore;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Operativo.Commands.GenerarTareasLogistica;

public record GenerarTareasLogisticaCommand(long EventoId) : IRequest<bool>;

public class GenerarTareasLogisticaHandler : IRequestHandler<GenerarTareasLogisticaCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public GenerarTareasLogisticaHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(GenerarTareasLogisticaCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>()
            .Query()
            .Include(e => e.Items)
            .FirstOrDefaultAsync(e => e.Id == request.EventoId, cancellationToken);

        if (evento == null) return false;

        // 1. Limpiar tareas logísticas antiguas sin origen de item para evitar duplicados
        var tareasPrevias = await _unitOfWork.Repository<TareaOperativa>()
            .Query()
            .Where(t => t.EventoId == request.EventoId 
                && t.ArticuloInventarioId != null
                && t.EventoItemId == null
                && !t.StockDescontado 
                && t.Estado != EstadoTarea.Completada)
            .ToListAsync(cancellationToken);
        
        foreach(var t in tareasPrevias) _unitOfWork.Repository<TareaOperativa>().Delete(t);

        // 2. Analizar el paquete si existe. Una reserva puede ser solo salón.
        if (evento.PaqueteId.HasValue)
        {
            var paquete = await _unitOfWork.Repository<Paquete>()
                .Query()
                .Include(p => p.Articulos).ThenInclude(pa => pa.Articulo)
                .Include(p => p.Servicios).ThenInclude(ps => ps.Servicio).ThenInclude(s => s.ArticuloInventario)
                .FirstOrDefaultAsync(p => p.Id == evento.PaqueteId.Value, cancellationToken);

            if (paquete != null)
            {
                foreach (var pa in paquete.Articulos)
                {
                    await CrearTareaLogistica(evento.Id, pa.Articulo, pa.Cantidad);
                }

                foreach (var ps in paquete.Servicios.Where(s => s.Servicio.ArticuloInventarioId != null))
                {
                    await CrearTareaLogistica(evento.Id, ps.Servicio.ArticuloInventario!, ps.Cantidad);
                }
            }
        }

        // 3. Analizar Items extra/adicionales
        foreach (var item in evento.Items.Where(i => i.ArticuloId != null))
        {
             var articulo = await _unitOfWork.Repository<ArticuloInventario>().GetByIdAsync(item.ArticuloId!.Value);
             if (articulo != null)
             {
                 await CrearTareaLogistica(evento.Id, articulo, item.Cantidad, item.Id);
             }
        }

        // 4. Cada servicio contratado debe poder marcarse como listo para entrega
        foreach (var item in evento.Items.Where(i => i.ServicioId != null))
        {
            await CrearTareaServicio(evento.Id, item);
        }

        // 5. Items extra por ServicioId (si el servicio consume inventario)
        foreach (var item in evento.Items.Where(i => i.ServicioId != null))
        {
            var servicio = await _unitOfWork.Repository<Servicio>()
                .Query()
                .Include(s => s.ArticuloInventario)
                .FirstOrDefaultAsync(s => s.Id == item.ServicioId!.Value, cancellationToken);

            if (servicio?.ArticuloInventarioId != null && servicio.ArticuloInventario != null)
            {
                await CrearTareaLogistica(evento.Id, servicio.ArticuloInventario, item.Cantidad, item.Id);
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private async Task CrearTareaLogistica(long eventoId, ArticuloInventario articulo, int cantidad, long? eventoItemId = null)
    {
        if (eventoItemId.HasValue)
        {
            var existe = await _unitOfWork.Repository<TareaOperativa>()
                .Query()
                .AnyAsync(t => t.EventoId == eventoId
                    && t.EventoItemId == eventoItemId
                    && t.ArticuloInventarioId == articulo.Id
                    && t.TipoTarea == TipoTareaOperativa.Inventario);

            if (existe) return;
        }

        var tarea = new TareaOperativa
        {
            EventoId = eventoId,
            NombreTarea = $"Preparar insumo: {articulo.Nombre}",
            Descripcion = $"Se requieren {cantidad} {articulo.UnidadMedida} para el evento.",
            ArticuloInventarioId = articulo.Id,
            EventoItemId = eventoItemId,
            CantidadRequerida = cantidad,
            TipoTarea = TipoTareaOperativa.Inventario,
            Estado = EstadoTarea.Pendiente
        };

        await _unitOfWork.Repository<TareaOperativa>().AddAsync(tarea);
    }

    private async Task CrearTareaServicio(long eventoId, EventoItem item)
    {
        var existe = await _unitOfWork.Repository<TareaOperativa>()
            .Query()
            .AnyAsync(t => t.EventoId == eventoId
                && t.EventoItemId == item.Id
                && t.TipoTarea == TipoTareaOperativa.Servicio);

        if (existe) return;

        var tarea = new TareaOperativa
        {
            EventoId = eventoId,
            NombreTarea = $"Preparar servicio: {item.Nombre}",
            Descripcion = item.EsIncluidoEnPaquete
                ? "Servicio incluido en el paquete. Marcar cuando esté listo para entrega."
                : "Servicio adicional contratado. Marcar cuando esté listo para entrega.",
            EventoItemId = item.Id,
            CantidadRequerida = item.Cantidad,
            TipoTarea = TipoTareaOperativa.Servicio,
            Estado = EstadoTarea.Pendiente
        };

        await _unitOfWork.Repository<TareaOperativa>().AddAsync(tarea);
    }
}
