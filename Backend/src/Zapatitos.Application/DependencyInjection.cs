using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using FluentValidation;

namespace Zapatitos.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        
        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
            cfg.AddOpenBehavior(typeof(Common.Behaviors.ValidationBehavior<,>));
        });

        services.AddScoped<Common.Services.IEventoService, Common.Services.EventoService>();

        return services;
    }
}
