using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Eventos.Queries.GetInvitacion;

public record GetInvitacionQuery(Guid Token) : IRequest<Result<InvitacionDto>>;

public class InvitacionDto
{
    public string NombreCumpleanero { get; set; } = null!;
    public int? Edad { get; set; }
    public DateTime Fecha { get; set; }
    public string HoraInicio { get; set; } = null!;
    public string HoraFin { get; set; } = null!;
    public string Paquete { get; set; } = null!;
    public string? ConfigJson { get; set; }
    public string Direccion { get; set; } = "";
    public string NombreNegocio { get; set; } = "Zapatitos";
}

public class GetInvitacionQueryHandler : IRequestHandler<GetInvitacionQuery, Result<InvitacionDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetInvitacionQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<InvitacionDto>> Handle(GetInvitacionQuery request, CancellationToken cancellationToken)
    {
        var invitacion = await _unitOfWork.Repository<InvitacionDigital>().Query()
            .Include(i => i.Evento)
                .ThenInclude(e => e.Paquete)
            .Include(i => i.Evento)
                .ThenInclude(e => e.Cumpleaneros)
                    .ThenInclude(c => c.Nino)
            .FirstOrDefaultAsync(i => i.TokenAcceso == request.Token, cancellationToken);

        if (invitacion == null)
            return Result<InvitacionDto>.Failure("Invitación no encontrada.");

        var cumpleanero = invitacion.Evento.Cumpleaneros.FirstOrDefault();

        var dto = new InvitacionDto
        {
            NombreCumpleanero = cumpleanero?.Nino.Nombre ?? "Evento Especial",
            Edad = cumpleanero?.EdadCumplir,
            Fecha = invitacion.Evento.FechaEvento,
            HoraInicio = invitacion.Evento.HoraInicio.ToString(@"hh\:mm"),
            HoraFin = invitacion.Evento.HoraFin.ToString(@"hh\:mm"),
            Paquete = invitacion.Evento.Paquete.Nombre,
            ConfigJson = invitacion.ConfigJson,
            Direccion = (await _unitOfWork.Repository<ConfiguracionWeb>().Query()
                .FirstOrDefaultAsync(c => c.Clave == "direccion", cancellationToken))?.Valor ?? "",
            NombreNegocio = (await _unitOfWork.Repository<ConfiguracionWeb>().Query()
                .FirstOrDefaultAsync(c => c.Clave == "nombre_negocio", cancellationToken))?.Valor ?? "Zapatitos"
        };

        return Result<InvitacionDto>.Success(dto);
    }
}
