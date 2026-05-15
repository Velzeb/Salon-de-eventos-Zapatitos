using System.Threading.Tasks;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Common.Interfaces;

public interface IUsuarioRepository : IRepository<Usuario>
{
    Task<Usuario?> GetByEmailWithRolesAsync(string email);
}
