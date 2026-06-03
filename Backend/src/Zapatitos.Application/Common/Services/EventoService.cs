using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Common.Services;

public interface IEventoService
{
    Task ConfirmarEventoAsync(long eventoId, CancellationToken cancellationToken);
}

public class EventoService : IEventoService
{
    private readonly IUnitOfWork _unitOfWork;

    public EventoService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Confirma un evento: cambia su estado a Confirmado y crea la invitación digital
    /// si aún no existe. Las tareas generales (plantillas) se generan por separado
    /// en GenerarTareasLogisticaCommand.
    /// </summary>
    public async Task ConfirmarEventoAsync(long eventoId, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().GetByIdAsync(eventoId);
        if (evento == null) return;

        evento.Estado = EstadoEvento.Confirmado;
        _unitOfWork.Repository<Evento>().Update(evento);

        // Crear invitación digital si no existe
        var invitacionExistente = await _unitOfWork.Repository<InvitacionDigital>().Query()
            .AnyAsync(i => i.EventoId == evento.Id, cancellationToken);

        if (!invitacionExistente)
        {
            var configJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                titulo = "¡Estás invitado!",
                mensaje = "Únete a nosotros para celebrar este día tan especial.",
                fechaEvento = evento.FechaEvento.ToString("o"),
                fechaExpiracion = evento.FechaEvento.AddDays(30).ToString("o")
            });

            await _unitOfWork.Repository<InvitacionDigital>().AddAsync(new InvitacionDigital
            {
                EventoId = evento.Id,
                TokenAcceso = Guid.NewGuid(),
                ConfigJson = configJson
            });
        }

        // ⚠️ NO hace SaveChangesAsync aquí — el handler que llamó es responsable del commit.
    }
}
