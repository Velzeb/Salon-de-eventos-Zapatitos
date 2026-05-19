using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Empleados.Queries.GetEmpleados;

public record EmpleadoDto(long Id, string NombreCompleto, string? Puesto, string Email, string Estado, string? FotoPerfilUrl);

public record GetEmpleadosQuery : IRequest<Result<IEnumerable<EmpleadoDto>>>;

public class GetEmpleadosQueryHandler : IRequestHandler<GetEmpleadosQuery, Result<IEnumerable<EmpleadoDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetEmpleadosQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<EmpleadoDto>>> Handle(GetEmpleadosQuery request, CancellationToken cancellationToken)
    {
        var empleados = await _unitOfWork.Repository<Empleado>().Query()
            .Include(e => e.Usuario)
            .OrderBy(e => e.NombreCompleto)
            .Select(e => new EmpleadoDto(
                e.Id,
                e.NombreCompleto,
                e.Puesto,
                e.Usuario.Email,
                e.Estado.ToString(),
                e.FotoPerfilUrl
            ))
            .ToListAsync(cancellationToken);

        return Result<IEnumerable<EmpleadoDto>>.Success(empleados);
    }
}
