using MediatR;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Identity.Commands.RegisterStaff;

public record RegisterStaffCommand : IRequest<Result<long>>
{
    public string Username { get; init; } = null!;
    public string Email { get; init; } = null!;
    public string Password { get; init; } = null!;
    public string NombreCompleto { get; init; } = null!;
    public string Rol { get; init; } = null!; // "Administrador" o "Empleado"
    public string? Puesto { get; init; }
    public string? FotoPerfilUrl { get; init; }
}

public class RegisterStaffCommandHandler : IRequestHandler<RegisterStaffCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public RegisterStaffCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<long>> Handle(RegisterStaffCommand request, CancellationToken cancellationToken)
    {
        // 1. Validar si el email ya existe
        var existente = await _unitOfWork.Repository<Usuario>().FindAsync(u => u.Email == request.Email);
        if (existente.Any()) return Result<long>.Failure("El correo electrónico ya está registrado.");

        // 2. Obtener el rol solicitado
        var rol = (await _unitOfWork.Repository<Rol>().FindAsync(r => r.Nombre == request.Rol)).FirstOrDefault();
        if (rol == null) return Result<long>.Failure($"El rol '{request.Rol}' no es válido.");

        // 3. Crear Usuario
        var usuario = new Usuario
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Activo = true
        };
        usuario.Roles.Add(rol);

        // 4. Crear Empleado vinculado
        var empleado = new Empleado
        {
            Usuario = usuario,
            NombreCompleto = request.NombreCompleto,
            Puesto = request.Puesto,
            FotoPerfilUrl = request.FotoPerfilUrl,
            FechaIngreso = System.DateTime.UtcNow
        };

        // 5. Guardar
        await _unitOfWork.Repository<Empleado>().AddAsync(empleado);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(usuario.Id);
    }
}
