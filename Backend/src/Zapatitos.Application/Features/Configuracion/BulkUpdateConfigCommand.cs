using MediatR;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Application.Features.Configuracion;

public record ConfigUpdateItem(string Clave, string Valor);

public record BulkUpdateConfigCommand(List<ConfigUpdateItem> Items) : IRequest<Result<bool>>;

public class BulkUpdateConfigCommandHandler : IRequestHandler<BulkUpdateConfigCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public BulkUpdateConfigCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(BulkUpdateConfigCommand request, CancellationToken cancellationToken)
    {
        foreach (var item in request.Items)
        {
            var config = await _unitOfWork.Repository<ConfiguracionWeb>().Query()
                .FirstOrDefaultAsync(c => c.Clave == item.Clave, cancellationToken);

            if (config != null)
            {
                config.Valor = item.Valor;
                _unitOfWork.Repository<ConfiguracionWeb>().Update(config);
            }
            else
            {
                await _unitOfWork.Repository<ConfiguracionWeb>().AddAsync(new ConfiguracionWeb
                {
                    Clave = item.Clave,
                    Valor = item.Valor
                });
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
