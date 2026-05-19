using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Clientes.Queries.GetPerfil;

public record GetPerfilClienteQuery(long UsuarioId) : IRequest<Result<PerfilClienteDto>>;

public class PerfilClienteDto
{
    public long Id { get; set; }
    public string NombreCompleto { get; set; } = null!;
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public string Email { get; set; } = null!;
    public string? FotoPerfilUrl { get; set; }
    public List<NinoPerfilDto> Ninos { get; set; } = new();
}

public class NinoPerfilDto
{
    public long Id { get; set; }
    public string Nombre { get; set; } = null!;
    public DateTime? FechaNacimiento { get; set; }
    public int Edad => FechaNacimiento.HasValue 
        ? (DateTime.Today - FechaNacimiento.Value.Date).Days / 365 
        : 0;
}

public class GetPerfilClienteQueryHandler : IRequestHandler<GetPerfilClienteQuery, Result<PerfilClienteDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    public GetPerfilClienteQueryHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<PerfilClienteDto>> Handle(GetPerfilClienteQuery request, CancellationToken cancellationToken)
    {
        var cliente = await _unitOfWork.Repository<Cliente>().Query()
            .Include(c => c.Usuario)
            .Include(c => c.Ninos)
            .FirstOrDefaultAsync(c => c.UsuarioId == request.UsuarioId, cancellationToken);

        if (cliente == null) return Result<PerfilClienteDto>.Failure("Perfil no encontrado.");

        return Result<PerfilClienteDto>.Success(new PerfilClienteDto
        {
            Id = cliente.Id,
            NombreCompleto = cliente.NombreCompleto,
            Telefono = cliente.Telefono,
            Direccion = cliente.Direccion,
            Email = cliente.Usuario?.Email ?? "",
            FotoPerfilUrl = cliente.FotoPerfilUrl,
            Ninos = cliente.Ninos.Select(n => new NinoPerfilDto
            {
                Id = n.Id,
                Nombre = n.Nombre,
                FechaNacimiento = n.FechaNacimiento
            }).ToList()
        });
    }
}
