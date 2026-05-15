using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Zapatitos.Infrastructure.Persistence;
using Zapatitos.Infrastructure.Persistence.Repositories;
using Zapatitos.Infrastructure.Security;
using Zapatitos.Infrastructure.Services;
using Zapatitos.Application.Common.Interfaces;

namespace Zapatitos.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<ZapatitosDbContext>(options =>
            options.UseNpgsql(connectionString,
                b => b.MigrationsAssembly(typeof(ZapatitosDbContext).Assembly.FullName)));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IJwtProvider, JwtProvider>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IStorageService, CloudflareR2StorageService>();

        return services;
    }
}
