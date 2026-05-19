using Zapatitos.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Zapatitos.Infrastructure.Persistence;
using Zapatitos.Application;
using Zapatitos.API.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Compatibilidad con timestamps de PostgreSQL (Npgsql 6.0+)
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// Evitar que .NET mapee los claims estándar a URIs largas (ej: http://schemas...)
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// Configuración de capas
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddHttpContextAccessor();

// Configuración de Seguridad
builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Secret"]!)),
        NameClaimType = ClaimTypes.Name,
        RoleClaimType = ClaimTypes.Role
    };
});

builder.Services.AddAuthorization();

builder.Services.AddControllers();

// Permitir peticiones desde el Frontend (CORS)
builder.Services.AddCors(options => {
    options.AddPolicy("AllowVite", policy => {
        var origins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
        if (origins != null && origins.Length > 0)
        {
            policy.WithOrigins(origins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

builder.Services.AddEndpointsApiExplorer();

// Swagger con soporte JWT
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Zapatitos API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {
        {
            new OpenApiSecurityScheme {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

// Inicializar Base de Datos y Seed
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ZapatitosDbContext>();
        var hasher = services.GetRequiredService<Zapatitos.Application.Common.Interfaces.IPasswordHasher>();
        await DbInitializer.SeedAsync(context, hasher);
        Console.WriteLine("--> Base de datos inicializada correctamente.");
    }
    catch (Exception ex)
    {
        Console.WriteLine("!!!!!!!! FATAL ERROR EN ARRANQUE !!!!!!!!!");
        Console.WriteLine(ex.Message);
        Console.WriteLine(ex.StackTrace);
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogCritical(ex, "FATAL: Error al inicializar la base de datos.");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Solo redirigir a HTTPS en producción (en dev el backend solo escucha HTTP)
// app.UseHttpsRedirection();

app.UseCors("AllowVite");
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

// Middleware de depuración para ver qué roles está detectando .NET (solo dev)
if (app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            var roles = context.User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type == "role")
                .Select(c => c.Value);

            logger.LogInformation("--> Usuario Autenticado: {User} | Roles: {Roles}",
                context.User.Identity.Name,
                string.Join(", ", roles));
        }
        await next();
    });
}

app.MapControllers();

app.Run();
