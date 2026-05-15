using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Common.Interfaces;

public interface IJwtProvider
{
    string Generate(Usuario usuario);
}
