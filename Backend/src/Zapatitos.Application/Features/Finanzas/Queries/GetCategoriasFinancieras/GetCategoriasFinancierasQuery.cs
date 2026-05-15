using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Finanzas.Queries.GetCategoriasFinancieras;

public record CategoriaFinancieraDto(long Id, string Nombre, string Tipo);

public record GetCategoriasFinancierasQuery : IRequest<Result<IEnumerable<CategoriaFinancieraDto>>>;

public class GetCategoriasFinancierasQueryHandler : IRequestHandler<GetCategoriasFinancierasQuery, Result<IEnumerable<CategoriaFinancieraDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetCategoriasFinancierasQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<CategoriaFinancieraDto>>> Handle(GetCategoriasFinancierasQuery request, CancellationToken cancellationToken)
    {
        var categorias = await _unitOfWork.Repository<CategoriaFinanciera>().Query()
            .OrderBy(c => c.Nombre)
            .Select(c => new CategoriaFinancieraDto(c.Id, c.Nombre, c.Tipo.ToString()))
            .ToListAsync(cancellationToken);

        return Result<IEnumerable<CategoriaFinancieraDto>>.Success(categorias);
    }
}
