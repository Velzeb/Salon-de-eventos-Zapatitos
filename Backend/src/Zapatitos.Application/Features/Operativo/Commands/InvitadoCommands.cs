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

namespace Zapatitos.Application.Features.Operativo.Commands.Invitados;

public record AddInvitadosCommand(long EventoId, List<string> Nombres) : IRequest<Result<bool>>;

public class AddInvitadosCommandHandler : IRequestHandler<AddInvitadosCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public AddInvitadosCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(AddInvitadosCommand request, CancellationToken cancellationToken)
    {
        var eventoExist = await _unitOfWork.Repository<Evento>().Query().AnyAsync(e => e.Id == request.EventoId, cancellationToken);
        if (!eventoExist) return Result<bool>.Failure("Evento no encontrado.");

        foreach (var nombre in request.Nombres)
        {
            if (string.IsNullOrWhiteSpace(nombre)) continue;
            
            var invitado = new Invitado
            {
                EventoId = request.EventoId,
                Nombre = nombre,
                CodigoQr = Guid.NewGuid(),
                Ingreso = false
            };
            await _unitOfWork.Repository<Invitado>().AddAsync(invitado);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}

public record RegistrarIngresoInvitadoCommand(Guid CodigoQr) : IRequest<Result<string>>;

public class RegistrarIngresoInvitadoCommandHandler : IRequestHandler<RegistrarIngresoInvitadoCommand, Result<string>>
{
    private readonly IUnitOfWork _unitOfWork;

    public RegistrarIngresoInvitadoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<string>> Handle(RegistrarIngresoInvitadoCommand request, CancellationToken cancellationToken)
    {
        var invitado = await _unitOfWork.Repository<Invitado>().Query()
            .Include(i => i.Evento)
            .FirstOrDefaultAsync(i => i.CodigoQr == request.CodigoQr, cancellationToken);

        if (invitado == null)
            return Result<string>.Failure("Código QR no válido o invitado no encontrado.");

        if (invitado.Ingreso)
            return Result<string>.Failure($"El invitado {invitado.Nombre} ya registró su ingreso a las {invitado.FechaIngreso:HH:mm}.");

        invitado.Ingreso = true;
        invitado.FechaIngreso = DateTime.Now;

        _unitOfWork.Repository<Invitado>().Update(invitado);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<string>.Success($"Ingreso exitoso: {invitado.Nombre}. ¡Bienvenido!");
    }
}
