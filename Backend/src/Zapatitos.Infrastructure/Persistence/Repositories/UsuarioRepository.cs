using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Domain.Entities;
using Zapatitos.Infrastructure.Persistence;

namespace Zapatitos.Infrastructure.Persistence.Repositories;

public class UsuarioRepository : GenericRepository<Usuario>, IUsuarioRepository
{
    public UsuarioRepository(ZapatitosDbContext context) : base(context)
    {
    }

    public async Task<Usuario?> GetByEmailWithRolesAsync(string email)
    {
        return await _dbSet
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);
    }
}
