using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Clientes.Commands.CreateCliente;

public record CreateClienteCommand : IRequest<Result<long>>
{
    public string NombreCompleto { get; init; } = null!;
    public string Telefono { get; init; } = null!;
    public string Direccion { get; init; } = null!;
}

public class CreateClienteCommandHandler : IRequestHandler<CreateClienteCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateClienteCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(CreateClienteCommand request, CancellationToken cancellationToken)
    {
        var cliente = new Cliente
        {
            NombreCompleto = request.NombreCompleto,
            Telefono = request.Telefono,
            Direccion = request.Direccion
        };

        await _unitOfWork.Repository<Cliente>().AddAsync(cliente);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(cliente.Id);
    }
}
