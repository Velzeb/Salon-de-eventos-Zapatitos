using MediatR;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Application.Features.Contactos.Commands.CreateMensaje;

public record CreateMensajeCommand : IRequest<Result<long>>
{
    public string Nombre { get; init; } = null!;
    public string Email { get; init; } = null!;
    public string Asunto { get; init; } = null!;
    public string Mensaje { get; init; } = null!;
}

public class CreateMensajeCommandHandler : IRequestHandler<CreateMensajeCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateMensajeCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(CreateMensajeCommand request, CancellationToken cancellationToken)
    {
        var nuevoMensaje = new MensajeContacto
        {
            Nombre = request.Nombre,
            Email = request.Email,
            Asunto = request.Asunto,
            Mensaje = request.Mensaje
        };

        await _unitOfWork.Repository<MensajeContacto>().AddAsync(nuevoMensaje);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(nuevoMensaje.Id);
    }
}
