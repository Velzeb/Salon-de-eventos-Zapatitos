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

    // Rastrea en memoria qué combinaciones ya generamos para evitar duplicados en el mismo batch
    private readonly HashSet<string> _tareasCreadas = new();
    private List<TareaOperativa> _tareasExistentes = new();

    public GenerarTareasLogisticaHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(GenerarTareasLogisticaCommand request, CancellationToken cancellationToken)
    {
        _tareasCreadas.Clear();

        var evento = await _unitOfWork.Repository<Evento>()
            .Query()
            .Include(e => e.Items)
            .FirstOrDefaultAsync(e => e.Id == request.EventoId, cancellationToken);

        if (evento == null) return false;

        // ── PASO 1: Borrar tareas auto-generadas (Inventario, Servicio, Entrega) que NO estén
        //    completadas ni con stock descontado. Las completadas se PRESERVAN.
        //    También borrar tareas de Plantilla que no estén completadas.
        var tareasBorrar = await _unitOfWork.Repository<TareaOperativa>()
            .Query()
            .Where(t => t.EventoId == request.EventoId
                && t.Estado != EstadoTarea.Completada
                && !t.StockDescontado
                && (t.TipoTarea == TipoTareaOperativa.Inventario
                    || t.TipoTarea == TipoTareaOperativa.Servicio
                    || t.TipoTarea == TipoTareaOperativa.Entrega
                    || t.PlantillaId != null))   // ← tareas de plantilla no completadas
            .ToListAsync(cancellationToken);

        foreach (var t in tareasBorrar)
            _unitOfWork.Repository<TareaOperativa>().Delete(t);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Cargar las tareas restantes en la BD para evitar duplicados
        _tareasExistentes = await _unitOfWork.Repository<TareaOperativa>()
            .Query()
            .Where(t => t.EventoId == request.EventoId)
            .ToListAsync(cancellationToken);

        // Recordar qué plantillas ya están COMPLETADAS para no volver a agregarlas
        var plantillasYaCompletadas = _tareasExistentes
            .Where(t => t.PlantillaId != null && t.Estado == EstadoTarea.Completada)
            .Select(t => t.PlantillaId!.Value)
            .ToList();

        // ── PASO 2: Artículos y servicios del paquete (solo si no hay items cargados en el evento)
        bool tieneItemsCargados = evento.Items.Any();
        if (evento.PaqueteId.HasValue && !tieneItemsCargados)
        {
            var paquete = await _unitOfWork.Repository<Paquete>()
                .Query()
                .Include(p => p.Articulos).ThenInclude(pa => pa.Articulo)
                .Include(p => p.Servicios).ThenInclude(ps => ps.Servicio)
                .FirstOrDefaultAsync(p => p.Id == evento.PaqueteId.Value, cancellationToken);

            if (paquete != null)
            {
                // 2a. Artículos directos del paquete
                foreach (var pa in paquete.Articulos)
                {
                    if (pa.Articulo == null) continue;
                    if (evento.Items.Any(i => i.ArticuloId == pa.ArticuloId)) continue;
                    await GenerarParArticulo(evento.Id, pa.Articulo, pa.Cantidad, eventoItemId: null);
                }

                // 2b. Servicios del paquete
                foreach (var ps in paquete.Servicios)
                {
                    if (ps.Servicio == null) continue;
                    if (evento.Items.Any(i => i.ServicioId == ps.ServicioId)) continue;
                    await GenerarParServicio(evento.Id, ps.Servicio, ps.Cantidad,
                        eventoItemId: null, esPaquete: true, cancellationToken);
                }
            }
        }

        // ── PASO 3: Artículos extra del evento (eventos_items con ArticuloId)
        foreach (var item in evento.Items.Where(i => i.ArticuloId != null))
        {
            var articulo = await _unitOfWork.Repository<ArticuloInventario>()
                .GetByIdAsync(item.ArticuloId!.Value);
            if (articulo != null)
                await GenerarParArticulo(evento.Id, articulo, item.Cantidad, item.Id);
        }

        // ── PASO 4: Servicios extra del evento (eventos_items con ServicioId)
        foreach (var item in evento.Items.Where(i => i.ServicioId != null))
        {
            var servicio = await _unitOfWork.Repository<Servicio>()
                .Query()
                .FirstOrDefaultAsync(s => s.Id == item.ServicioId!.Value, cancellationToken);

            if (servicio == null) continue;

            await GenerarParServicio(evento.Id, servicio, item.Cantidad,
                eventoItemId: item.Id, esPaquete: item.EsIncluidoEnPaquete, cancellationToken);
        }

        // ── PASO 5: Tareas Generales (Plantillas activas)
        var plantillas = await _unitOfWork.Repository<TareaPlantilla>()
            .Query()
            .Where(p => p.Activa)
            .OrderBy(p => p.Orden)
            .ToListAsync(cancellationToken);

        foreach (var plantilla in plantillas)
        {
            // Saltar si ya está completada en este evento
            if (plantillasYaCompletadas.Contains(plantilla.Id)) continue;

            var tipo = plantilla.FaseAplicacion == FasePlantilla.EnVivo
                ? TipoTareaOperativa.Entrega
                : TipoTareaOperativa.Manual;

            await _unitOfWork.Repository<TareaOperativa>().AddAsync(new TareaOperativa
            {
                EventoId = evento.Id,
                NombreTarea = plantilla.Nombre,
                Descripcion = plantilla.Descripcion,
                TipoTarea = tipo,
                PlantillaId = plantilla.Id,
                Estado = EstadoTarea.Pendiente
            });
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    // ── Genera tarea de Preparación + Entrega para un artículo de inventario
    private async Task GenerarParArticulo(long eventoId, ArticuloInventario articulo, int cantidad, long? eventoItemId)
    {
        var clavePrep = $"Inventario|{articulo.Id}";
        var claveEntrega = $"Entrega|{articulo.Id}";

        if (_tareasCreadas.Add(clavePrep))
        {
            var existeEnDb = _tareasExistentes.Any(t =>
                t.ArticuloInventarioId == articulo.Id
                && t.TipoTarea == TipoTareaOperativa.Inventario);

            if (!existeEnDb)
            {
                await _unitOfWork.Repository<TareaOperativa>().AddAsync(new TareaOperativa
                {
                    EventoId = eventoId,
                    NombreTarea = $"Preparar insumo: {articulo.Nombre}",
                    Descripcion = $"Se requieren {cantidad} {articulo.UnidadMedida ?? "unidades"} para el evento.",
                    ArticuloInventarioId = articulo.Id,
                    EventoItemId = eventoItemId,
                    CantidadRequerida = cantidad,
                    TipoTarea = TipoTareaOperativa.Inventario,
                    Estado = EstadoTarea.Pendiente
                });
            }
        }

        if (_tareasCreadas.Add(claveEntrega))
        {
            var existeEnDb = _tareasExistentes.Any(t =>
                t.ArticuloInventarioId == articulo.Id
                && t.TipoTarea == TipoTareaOperativa.Entrega);

            if (!existeEnDb)
            {
                await _unitOfWork.Repository<TareaOperativa>().AddAsync(new TareaOperativa
                {
                    EventoId = eventoId,
                    NombreTarea = $"Entregar insumo: {articulo.Nombre}",
                    Descripcion = $"Entregar {cantidad} {articulo.UnidadMedida ?? "unidades"} al cliente durante el evento.",
                    ArticuloInventarioId = articulo.Id,
                    EventoItemId = eventoItemId,
                    CantidadRequerida = cantidad,
                    TipoTarea = TipoTareaOperativa.Entrega,
                    Estado = EstadoTarea.Pendiente
                });
            }
        }
    }

    // ── Genera tarea de Preparación + Entrega para un servicio.
    private async Task GenerarParServicio(long eventoId, Servicio servicio, int cantidad,
        long? eventoItemId, bool esPaquete, CancellationToken cancellationToken)
    {
        // ¿El servicio consume inventario?
        if (servicio.ArticuloInventarioId.HasValue)
        {
            var articulo = await _unitOfWork.Repository<ArticuloInventario>()
                .GetByIdAsync(servicio.ArticuloInventarioId.Value);

            if (articulo != null)
            {
                await GenerarParArticulo(eventoId, articulo, cantidad, eventoItemId);
                return;
            }
        }

        // Servicio puro (sin inventario asociado)
        var clavePrep = $"Servicio|{servicio.Id}";
        var claveEntrega = $"EntregaServ|{servicio.Id}";

        if (_tareasCreadas.Add(clavePrep))
        {
            var nombreTareaPrep = $"Preparar servicio: {servicio.Nombre}";
            var existeEnDb = _tareasExistentes.Any(t =>
                t.TipoTarea == TipoTareaOperativa.Servicio
                && t.NombreTarea == nombreTareaPrep);

            if (!existeEnDb)
            {
                await _unitOfWork.Repository<TareaOperativa>().AddAsync(new TareaOperativa
                {
                    EventoId = eventoId,
                    NombreTarea = nombreTareaPrep,
                    Descripcion = esPaquete
                        ? "Servicio incluido en el paquete. Marcar cuando esté listo."
                        : "Servicio adicional contratado. Marcar cuando esté listo.",
                    EventoItemId = eventoItemId,
                    CantidadRequerida = cantidad,
                    TipoTarea = TipoTareaOperativa.Servicio,
                    Estado = EstadoTarea.Pendiente
                });
            }
        }

        if (_tareasCreadas.Add(claveEntrega))
        {
            var nombreTareaEntrega = $"Entregar servicio: {servicio.Nombre}";
            var existeEnDb = _tareasExistentes.Any(t =>
                t.TipoTarea == TipoTareaOperativa.Entrega
                && t.NombreTarea == nombreTareaEntrega);

            if (!existeEnDb)
            {
                await _unitOfWork.Repository<TareaOperativa>().AddAsync(new TareaOperativa
                {
                    EventoId = eventoId,
                    NombreTarea = nombreTareaEntrega,
                    Descripcion = $"Confirmar entrega del servicio \"{servicio.Nombre}\" durante el evento.",
                    EventoItemId = eventoItemId,
                    CantidadRequerida = cantidad,
                    TipoTarea = TipoTareaOperativa.Entrega,
                    Estado = EstadoTarea.Pendiente
                });
            }
        }
    }
}
