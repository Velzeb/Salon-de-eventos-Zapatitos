using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using System.Linq;

namespace Zapatitos.Application.Features.Identity.Commands.Login;

public record LoginCommand(string Email, string Password) : IRequest<Result<string>>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<string>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtProvider _jwtProvider;
    private readonly IPasswordHasher _passwordHasher;

    public LoginCommandHandler(IUnitOfWork unitOfWork, IJwtProvider jwtProvider, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _jwtProvider = jwtProvider;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<string>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        try 
        {
            // 1. Buscar usuario por email con sus roles
            var user = await _unitOfWork.Usuarios.GetByEmailWithRolesAsync(request.Email);

            if (user == null)
            {
                return Result<string>.Failure("El correo electrónico no está registrado.");
            }

            // 2. Verificar contraseña
            bool isPasswordValid = _passwordHasher.Verify(request.Password, user.PasswordHash);
            
            if (!isPasswordValid)
            {
                return Result<string>.Failure("La contraseña es incorrecta.");
            }

            if (!user.Activo)
            {
                return Result<string>.Failure("Esta cuenta ha sido desactivada.");
            }

            // 3. Generar Token
            var token = _jwtProvider.Generate(user);
            return Result<string>.Success(token);
        }
        catch (System.Exception ex)
        {
            System.Console.WriteLine($"[ERROR CRÍTICO LOGIN]: {ex.Message}");
            System.Console.WriteLine(ex.StackTrace);
            return Result<string>.Failure("Ocurrió un error interno al procesar el inicio de sesión.");
        }
    }
}
