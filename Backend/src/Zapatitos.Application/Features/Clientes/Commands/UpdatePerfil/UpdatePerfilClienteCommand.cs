using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Clientes.Commands.UpdatePerfil;

public record UpdatePerfilClienteCommand : IRequest<Result<bool>>
{
    public long UsuarioId { get; init; }
    public string NombreCompleto { get; init; } = null!;
    public string? Telefono { get; init; }
    public string? Direccion { get; init; }
}

public class UpdatePerfilClienteCommandHandler : IRequestHandler<UpdatePerfilClienteCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    public UpdatePerfilClienteCommandHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<bool>> Handle(UpdatePerfilClienteCommand request, CancellationToken cancellationToken)
    {
        var cliente = await _unitOfWork.Repository<Cliente>().Query()
            .FirstOrDefaultAsync(c => c.UsuarioId == request.UsuarioId, cancellationToken);

        if (cliente == null) return Result<bool>.Failure("Perfil no encontrado.");

        cliente.NombreCompleto = request.NombreCompleto;
        cliente.Telefono = request.Telefono;
        cliente.Direccion = request.Direccion;

        _unitOfWork.Repository<Cliente>().Update(cliente);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
