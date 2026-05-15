using MediatR;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Application.Features.Operativo.Commands.UpdateCronograma;

public record ActividadDto(
    long? Id,
    string Nombre,
    string? Descripcion,
    TimeSpan HoraInicio,
    TimeSpan HoraFin,
    int Orden,
    bool Completada
);

public record UpdateCronogramaCommand(long EventoId, List<ActividadDto> Actividades) : IRequest<Result<bool>>;

public class UpdateCronogramaCommandHandler : IRequestHandler<UpdateCronogramaCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCronogramaCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(UpdateCronogramaCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().Query()
            .Include(e => e.Cronograma)
            .FirstOrDefaultAsync(e => e.Id == request.EventoId, cancellationToken);

        if (evento == null)
            return Result<bool>.Failure("Evento no encontrado.");

        // Eliminar actividades que no están en el nuevo listado
        var idsEnviados = request.Actividades.Where(a => a.Id.HasValue).Select(a => a.Id!.Value).ToList();
        var actividadesAEliminar = evento.Cronograma.Where(a => !idsEnviados.Contains(a.Id)).ToList();
        
        foreach (var a in actividadesAEliminar)
        {
            _unitOfWork.Repository<ActividadCronograma>().Delete(a);
        }

        // Actualizar o crear
        foreach (var dto in request.Actividades)
        {
            if (dto.Id.HasValue)
            {
                var actividad = evento.Cronograma.FirstOrDefault(a => a.Id == dto.Id.Value);
                if (actividad != null)
                {
                    actividad.Nombre = dto.Nombre;
                    actividad.Descripcion = dto.Descripcion;
                    actividad.HoraInicio = dto.HoraInicio;
                    actividad.HoraFin = dto.HoraFin;
                    actividad.Orden = dto.Orden;
                    actividad.Completada = dto.Completada;
                    _unitOfWork.Repository<ActividadCronograma>().Update(actividad);
                }
            }
            else
            {
                var nuevaActividad = new ActividadCronograma
                {
                    EventoId = request.EventoId,
                    Nombre = dto.Nombre,
                    Descripcion = dto.Descripcion,
                    HoraInicio = dto.HoraInicio,
                    HoraFin = dto.HoraFin,
                    Orden = dto.Orden,
                    Completada = dto.Completada
                };
                await _unitOfWork.Repository<ActividadCronograma>().AddAsync(nuevaActividad);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
