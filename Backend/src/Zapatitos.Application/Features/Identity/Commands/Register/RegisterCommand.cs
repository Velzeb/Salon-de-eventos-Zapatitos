using MediatR;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Identity.Commands.Register;

public record RegisterCommand : IRequest<Result<long>>
{
    public string Username { get; init; } = null!;
    public string Email { get; init; } = null!;
    public string Password { get; init; } = null!;
    public string NombreCompleto { get; init; } = null!;
    public string? Telefono { get; init; }
}

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public RegisterCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<long>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // 1. Verificar si el email ya existe
        var existente = await _unitOfWork.Repository<Usuario>().FindAsync(u => u.Email == request.Email);
        if (existente.Any()) return Result<long>.Failure("El correo electrónico ya está registrado.");

        // 2. Obtener el rol de Cliente
        var rolCliente = (await _unitOfWork.Repository<Rol>().FindAsync(r => r.Nombre == "Cliente")).FirstOrDefault();
        if (rolCliente == null) return Result<long>.Failure("Error interno: Rol 'Cliente' no encontrado.");

        // 3. Crear Usuario
        var usuario = new Usuario
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Activo = true
        };
        usuario.Roles.Add(rolCliente);

        // 4. Crear Cliente vinculado
        var cliente = new Cliente
        {
            Usuario = usuario,
            NombreCompleto = request.NombreCompleto,
            Telefono = request.Telefono
        };

        // 5. Guardar
        await _unitOfWork.Repository<Cliente>().AddAsync(cliente);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(usuario.Id);
    }
}
