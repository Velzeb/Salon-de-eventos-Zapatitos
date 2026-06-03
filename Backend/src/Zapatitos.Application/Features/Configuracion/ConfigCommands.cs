using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Configuracion;

// Query para obtener configuración
public record GetConfigQuery(string Clave) : IRequest<Result<string>>;

public class GetConfigQueryHandler : IRequestHandler<GetConfigQuery, Result<string>>
{
    private readonly IUnitOfWork _unitOfWork;
    public GetConfigQueryHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<string>> Handle(GetConfigQuery request, CancellationToken cancellationToken)
    {
        var config = (await _unitOfWork.Repository<ConfiguracionWeb>().FindAsync(c => c.Clave == request.Clave)).FirstOrDefault();
        return config != null ? Result<string>.Success(config.Valor) : Result<string>.Failure("Configuración no encontrada.");
    }
}

// Command para actualizar configuración
public record UpdateConfigCommand(string Clave, string Valor) : IRequest<Result<bool>>;

public class UpdateConfigCommandHandler : IRequestHandler<UpdateConfigCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    public UpdateConfigCommandHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<bool>> Handle(UpdateConfigCommand request, CancellationToken cancellationToken)
    {
        var config = (await _unitOfWork.Repository<ConfiguracionWeb>().FindAsync(c => c.Clave == request.Clave)).FirstOrDefault();
        
        if (config == null)
        {
            await _unitOfWork.Repository<ConfiguracionWeb>().AddAsync(new ConfiguracionWeb { Clave = request.Clave, Valor = request.Valor });
        }
        else
        {
            config.Valor = request.Valor;
            _unitOfWork.Repository<ConfiguracionWeb>().Update(config);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}

public class ConfigDto
{
    public string Clave { get; set; } = null!;
    public string Valor { get; set; } = null!;
}

public record GetLandingConfigQuery : IRequest<Result<List<ConfigDto>>>;

public class GetLandingConfigQueryHandler : IRequestHandler<GetLandingConfigQuery, Result<List<ConfigDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    public GetLandingConfigQueryHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<List<ConfigDto>>> Handle(GetLandingConfigQuery request, CancellationToken cancellationToken)
    {
        // Return ALL configuration entries so the CMS and landing page always have
        // access to every key, including dynamically created ones (JSON blobs, banners, etc.)
        var configs = await _unitOfWork.Repository<ConfiguracionWeb>().Query()
            .Where(c => c.EliminadoEn == null)
            .Select(c => new ConfigDto { Clave = c.Clave, Valor = c.Valor })
            .ToListAsync(cancellationToken);

        return Result<List<ConfigDto>>.Success(configs);
    }
}

