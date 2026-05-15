using System;
using System.Collections.Generic;
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

    public async Task ConfirmarEventoAsync(long eventoId, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().GetByIdAsync(eventoId);
        if (evento == null) return;

        evento.Estado = EstadoEvento.Confirmado;
        _unitOfWork.Repository<Evento>().Update(evento);

        // 1. Invitación Digital
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

            var invitacion = new InvitacionDigital
            {
                EventoId = evento.Id,
                TokenAcceso = Guid.NewGuid(),
                ConfigJson = configJson
            };
            await _unitOfWork.Repository<InvitacionDigital>().AddAsync(invitacion);
        }

        // 2. Auto-generación de Checklist Operativo
        var tieneTareas = await _unitOfWork.Repository<TareaOperativa>().Query()
            .AnyAsync(t => t.EventoId == evento.Id, cancellationToken);

        if (!tieneTareas)
        {
            var tareasBase = new List<string> { 
                "Limpieza Profunda de Salón", 
                "Montaje de Mesas y Sillas", 
                "Decoración de Mesa Principal", 
                "Recepción y Verificación de Pastel",
                "Prueba de Equipo de Sonido",
                "Briefing con el Staff del Evento"
            };

            foreach (var nombre in tareasBase)
            {
                await _unitOfWork.Repository<TareaOperativa>().AddAsync(new TareaOperativa
                {
                    EventoId = evento.Id,
                    NombreTarea = nombre,
                    Estado = EstadoTarea.Pendiente
                });
            }
        }
    }
}
