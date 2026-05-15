using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Clientes.Commands.CreateNino;

public record CreateNinoCommand : IRequest<Result<long>>
{
    public List<long> ClienteIds { get; init; } = new();
    public string Nombre { get; init; } = null!;
    public DateTime? FechaNacimiento { get; init; }
}

public class CreateNinoCommandHandler : IRequestHandler<CreateNinoCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateNinoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(CreateNinoCommand request, CancellationToken cancellationToken)
    {
        var responsables = new List<Cliente>();
        foreach (var id in request.ClienteIds)
        {
            var cliente = await _unitOfWork.Repository<Cliente>().GetByIdAsync(id);
            if (cliente != null) responsables.Add(cliente);
        }

        var nino = new Nino
        {
            Nombre = request.Nombre,
            FechaNacimiento = request.FechaNacimiento?.ToUniversalTime(),
            Responsables = responsables
        };

        await _unitOfWork.Repository<Nino>().AddAsync(nino);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(nino.Id);
    }
}
