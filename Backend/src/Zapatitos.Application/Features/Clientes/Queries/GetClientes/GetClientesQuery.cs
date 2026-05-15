using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;

namespace Zapatitos.Application.Features.Clientes.Queries.GetClientes;

public record GetClientesQuery : IRequest<Result<IEnumerable<ClienteDto>>>;

public record ClienteDto(long Id, string NombreCompleto, string? Telefono, string? Direccion);

public class GetClientesQueryHandler : IRequestHandler<GetClientesQuery, Result<IEnumerable<ClienteDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetClientesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<ClienteDto>>> Handle(GetClientesQuery request, CancellationToken cancellationToken)
    {
        var clientes = await _unitOfWork.Repository<Zapatitos.Domain.Entities.Cliente>()
            .Query()
            .Select(c => new ClienteDto(c.Id, c.NombreCompleto, c.Telefono, c.Direccion))
            .ToListAsync(cancellationToken);

        return Result<IEnumerable<ClienteDto>>.Success(clientes);
    }
}
