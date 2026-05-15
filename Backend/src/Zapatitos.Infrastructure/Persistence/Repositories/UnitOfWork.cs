using System;
using System.Collections;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;

namespace Zapatitos.Infrastructure.Persistence.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ZapatitosDbContext _context;
    private Hashtable? _repositories;
    private IUsuarioRepository? _usuarioRepository;

    public UnitOfWork(ZapatitosDbContext context)
    {
        _context = context;
    }

    public IUsuarioRepository Usuarios => _usuarioRepository ??= new UsuarioRepository(_context);

    public IRepository<T> Repository<T>() where T : class
    {
        _repositories ??= new Hashtable();

        var type = typeof(T).Name;

        if (!_repositories.ContainsKey(type))
        {
            var repositoryType = typeof(GenericRepository<>);
            var repositoryInstance = Activator.CreateInstance(repositoryType.MakeGenericType(typeof(T)), _context);
            _repositories.Add(type, repositoryInstance);
        }

        return (IRepository<T>)_repositories[type]!;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
