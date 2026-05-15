using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;
using Zapatitos.Application.Common.Interfaces;

namespace Zapatitos.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(ZapatitosDbContext context, IPasswordHasher hasher)
    {
        // Asegurar que la base de datos existe y está migrada
        // await context.Database.MigrateAsync();

        // 1. Roles
        if (!await context.Roles.AnyAsync())
        {
            Console.WriteLine("--> Creando roles...");
            var roles = new List<Rol>
            {
                new() { Nombre = "Administrador", Descripcion = "Acceso total al sistema" },
                new() { Nombre = "Empleado", Descripcion = "Acceso a operaciones diarias" },
                new() { Nombre = "Cliente", Descripcion = "Acceso a portal de cliente" }
            };
            await context.Roles.AddRangeAsync(roles);
            await context.SaveChangesAsync();
        }

        // 2. Usuario Administrador Inicial
        if (!await context.Usuarios.AnyAsync(u => u.Email == "admin@zapatitos.com"))
        {
            Console.WriteLine("--> Creando usuario administrador...");
            var adminRole = await context.Roles.FirstAsync(r => r.Nombre == "Administrador");
            
            var admin = new Usuario
            {
                Username = "admin",
                Email = "admin@zapatitos.com",
                PasswordHash = hasher.Hash("Admin123!"),
                Roles = new List<Rol> { adminRole }
            };

            await context.Usuarios.AddAsync(admin);
            await context.SaveChangesAsync();
        }

        // 3. Configuración Web Base
        if (!await context.ConfiguracionesWeb.AnyAsync())
        {
            Console.WriteLine("--> Creando configuración web base...");
            var configs = new List<ConfiguracionWeb>
            {
                new() { Clave = "hero_title", Valor = "Zapatitos - Eventos Infantiles" },
                new() { Clave = "hero_subtitle", Valor = "Creamos momentos mágicos para tus pequeños" },
                new() { Clave = "hero_image", Valor = "https://images.unsplash.com/photo-1530103043960-ef38714abb15?q=80&w=2069&auto=format&fit=crop" },
                new() { Clave = "contact_email", Valor = "contacto@zapatitos.com" },
                new() { Clave = "promo_banner", Valor = "¡Reserva ahora y obtén un 10% de descuento en el paquete Premium!" }
            };
            await context.ConfiguracionesWeb.AddRangeAsync(configs);
            await context.SaveChangesAsync();
        }

        // 4. Métodos de Pago Base
        if (!await context.MetodosPago.AnyAsync())
        {
            Console.WriteLine("--> Creando métodos de pago base...");
            var metodos = new List<MetodoPago>
            {
                new() { Nombre = "Efectivo", Activo = true },
                new() { Nombre = "Transferencia", Activo = true },
                new() { Nombre = "Tarjeta", Activo = true }
            };
            await context.MetodosPago.AddRangeAsync(metodos);
            await context.SaveChangesAsync();
        }

        // 5. Categorías financieras base
        if (!await context.CategoriasFinancieras.AnyAsync())
        {
            Console.WriteLine("--> Creando categorías financieras base...");
            var categorias = new List<CategoriaFinanciera>
            {
                new() { Nombre = "Ventas", Tipo = TipoTransaccion.Ingreso },
                new() { Nombre = "Insumos", Tipo = TipoTransaccion.Egreso },
                new() { Nombre = "Servicios", Tipo = TipoTransaccion.Egreso },
                new() { Nombre = "Nomina", Tipo = TipoTransaccion.Egreso }
            };
            await context.CategoriasFinancieras.AddRangeAsync(categorias);
            await context.SaveChangesAsync();
        }

        // 6. Configuración de Disponibilidad (Bloques por defecto)
        if (!await context.DisponibilidadConfigs.AnyAsync())
        {
            Console.WriteLine("--> Creando bloques de disponibilidad por defecto...");
            var availability = new List<DisponibilidadConfig>();
            
            // Lunes a Viernes: Tarde
            for (int i = 1; i <= 5; i++)
            {
                availability.Add(new() { DiaSemana = i, HoraInicio = new TimeSpan(14, 0, 0), HoraFin = new TimeSpan(18, 0, 0), NombreBloque = "Tarde" });
            }
            // Sábado y Domingo: Mañana y Tarde
            for (int i = 0; i <= 6; i += 6)
            {
                availability.Add(new() { DiaSemana = i, HoraInicio = new TimeSpan(10, 0, 0), HoraFin = new TimeSpan(14, 0, 0), NombreBloque = "Mañana" });
                availability.Add(new() { DiaSemana = i, HoraInicio = new TimeSpan(15, 0, 0), HoraFin = new TimeSpan(19, 0, 0), NombreBloque = "Tarde" });
            }
            
            await context.DisponibilidadConfigs.AddRangeAsync(availability);
            await context.SaveChangesAsync();
        }

        Console.WriteLine("--> Base de datos inicializada correctamente.");
    }
}
