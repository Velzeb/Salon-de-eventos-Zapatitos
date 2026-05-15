using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Zapatitos.Domain.Entities;
using System.Linq;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Infrastructure.Persistence;

public class ZapatitosDbContext : DbContext
{
    public ZapatitosDbContext(DbContextOptions<ZapatitosDbContext> options) : base(options)
    {
    }

    // Seguridad
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Permiso> Permisos => Set<Permiso>();

    // Personas
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Nino> Ninos => Set<Nino>();
    public DbSet<Empleado> Empleados => Set<Empleado>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();

    // Catálogo e Inventario
    public DbSet<Servicio> Servicios => Set<Servicio>();
    public DbSet<Paquete> Paquetes => Set<Paquete>();
    public DbSet<ArticuloInventario> ArticulosInventario => Set<ArticuloInventario>();
    public DbSet<PaqueteArticulo> PaqueteArticulos => Set<PaqueteArticulo>();

    // Producción (Recetas)
    public DbSet<ProductoProduccion> ProductosProduccion => Set<ProductoProduccion>();
    public DbSet<RecetaIngrediente> RecetaIngredientes => Set<RecetaIngrediente>();

    // Eventos y Operaciones
    public DbSet<Evento> Eventos => Set<Evento>();
    public DbSet<Cumpleanero> Cumpleaneros => Set<Cumpleanero>();
    public DbSet<InvitacionDigital> InvitacionesDigitales => Set<InvitacionDigital>();
    public DbSet<Invitado> Invitados => Set<Invitado>();
    public DbSet<ActividadCronograma> Cronogramas => Set<ActividadCronograma>();
    public DbSet<AsignacionStaff> AsignacionesStaff => Set<AsignacionStaff>();
    public DbSet<TareaOperativa> TareasOperativas => Set<TareaOperativa>();
    public DbSet<ConsumoExtra> ConsumosExtras => Set<ConsumoExtra>();
    public DbSet<EventoItem> EventoItems => Set<EventoItem>();
    public DbSet<FotoEvento> FotosEvento => Set<FotoEvento>();
    public DbSet<MultimediaEvento> MultimediaEventos => Set<MultimediaEvento>();
    public DbSet<RetroalimentacionCliente> Retroalimentaciones => Set<RetroalimentacionCliente>();

    // Finanzas
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<MetodoPago> MetodosPago => Set<MetodoPago>();

    // Finanzas Avanzadas (Admin)
    public DbSet<Gasto> Gastos => Set<Gasto>();
    public DbSet<PagoNomina> Nominas => Set<PagoNomina>();
    public DbSet<MovimientoCaja> MovimientosCaja => Set<MovimientoCaja>();
    public DbSet<CategoriaFinanciera> CategoriasFinancieras => Set<CategoriaFinanciera>();
    public DbSet<ConfiguracionWeb> ConfiguracionesWeb => Set<ConfiguracionWeb>();
    public DbSet<DisponibilidadConfig> DisponibilidadConfigs => Set<DisponibilidadConfig>();
    public DbSet<MensajeContacto> MensajesContacto => Set<MensajeContacto>();

    public DbSet<PaqueteServicio> PaqueteServicios => Set<PaqueteServicio>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreadoEn = DateTime.UtcNow;
                    entry.Entity.ModificadoEn = DateTime.UtcNow;
                    entry.Entity.Version = 1;
                    break;
                case EntityState.Modified:
                    entry.Entity.ModificadoEn = DateTime.UtcNow;
                    entry.Entity.Version++;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Mapeos Many-to-Many: Usuario - Rol
        modelBuilder.Entity<Usuario>()
            .HasMany(u => u.Roles)
            .WithMany(r => r.Usuarios)
            .UsingEntity<Dictionary<string, object>>(
                "usuarios_roles",
                j => j.HasOne<Rol>().WithMany().HasForeignKey("rol_id"),
                j => j.HasOne<Usuario>().WithMany().HasForeignKey("usuario_id")
            );

        // Mapeos Many-to-Many: Rol - Permiso
        modelBuilder.Entity<Rol>()
            .HasMany(r => r.Permisos)
            .WithMany(p => p.Roles)
            .UsingEntity<Dictionary<string, object>>(
                "roles_permisos",
                j => j.HasOne<Permiso>().WithMany().HasForeignKey("permiso_id"),
                j => j.HasOne<Rol>().WithMany().HasForeignKey("rol_id")
            );

        // Ajustes de Naming para coincidir con SQL original
        modelBuilder.Entity<Pago>()
            .Property(p => p.VerificadoPorId)
            .HasColumnName("verificado_por");

        modelBuilder.Entity<AsignacionStaff>()
            .ToTable("asignaciones_staff");

        modelBuilder.Entity<TareaOperativa>()
            .ToTable("tareas_operativas")
            .Property(t => t.AsignadoAId)
            .HasColumnName("asignado_a");
            
        modelBuilder.Entity<ConsumoExtra>()
            .ToTable("consumos_extras");

        modelBuilder.Entity<ArticuloInventario>()
            .ToTable("articulos_inventario");
            
        modelBuilder.Entity<CategoriaFinanciera>()
            .ToTable("categorias_financieras");

        modelBuilder.Entity<PagoNomina>()
            .ToTable("nominas");

        modelBuilder.Entity<InvitacionDigital>()
            .ToTable("invitaciones_digitales");

        modelBuilder.Entity<Invitado>()
            .ToTable("invitados");

        modelBuilder.Entity<ActividadCronograma>()
            .ToTable("cronograma_actividades");

        modelBuilder.Entity<MetodoPago>()
            .ToTable("metodos_pago");

        modelBuilder.Entity<PaqueteArticulo>()
            .ToTable("paquetes_articulos");

        modelBuilder.Entity<Proveedor>()
            .ToTable("proveedores");

        modelBuilder.Entity<ProductoProduccion>()
            .ToTable("produccion_productos");

        modelBuilder.Entity<RecetaIngrediente>()
            .ToTable("receta_ingredientes");

        modelBuilder.Entity<DisponibilidadConfig>()
            .ToTable("disponibilidad_config");

        modelBuilder.Entity<EventoItem>()
            .ToTable("evento_items");

        modelBuilder.Entity<FotoEvento>()
            .ToTable("foto_evento");

        modelBuilder.Entity<MultimediaEvento>()
            .ToTable("multimedia_eventos");

        modelBuilder.Entity<RetroalimentacionCliente>()
            .ToTable("retroalimentacion_cliente");

        modelBuilder.Entity<MensajeContacto>()
            .ToTable("contactos");

        // Mapeo Paquete - Servicio (Con Cantidad)
        modelBuilder.Entity<PaqueteServicio>(entity => {
            entity.ToTable("paquetes_servicios");
            entity.HasOne(ps => ps.Paquete)
                  .WithMany(p => p.Servicios)
                  .HasForeignKey(ps => ps.PaqueteId);
            entity.HasOne(ps => ps.Servicio)
                  .WithMany(s => s.Paquetes)
                  .HasForeignKey(ps => ps.ServicioId);
        });

        // Mapeos Many-to-Many: Evento - Cliente (Responsables)
        modelBuilder.Entity<Evento>()
            .HasMany(e => e.ClientesResponsables)
            .WithMany(c => c.Eventos)
            .UsingEntity<Dictionary<string, object>>(
                "eventos_clientes",
                j => j.HasOne<Cliente>().WithMany().HasForeignKey("cliente_id"),
                j => j.HasOne<Evento>().WithMany().HasForeignKey("evento_id")
            );

        // Mapeo Cumpleañeros
        modelBuilder.Entity<Cumpleanero>()
            .ToTable("evento_cumpleaneros");

        modelBuilder.Entity<Nino>(entity => {
            entity.ToTable("ninos");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Nombre).HasColumnName("nombre");
            entity.Property(e => e.FechaNacimiento).HasColumnName("fecha_nacimiento");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            entity.Property(e => e.ModificadoEn).HasColumnName("modificado_en");
            entity.Property(e => e.EliminadoEn).HasColumnName("eliminado_en");
            entity.Property(e => e.Version).HasColumnName("version");
            
            entity.HasMany(n => n.Responsables)
                .WithMany(c => c.Ninos)
                .UsingEntity<Dictionary<string, object>>(
                    "ninos_clientes",
                    j => j.HasOne<Cliente>().WithMany().HasForeignKey("cliente_id"),
                    j => j.HasOne<Nino>().WithMany().HasForeignKey("nino_id")
                );
        });

        // Configuraciones de precisión decimal
        foreach (var property in modelBuilder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetPrecision(10);
            property.SetScale(2);
        }

        // Configuración de Enums como Strings para Postgres
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                var type = property.ClrType;
                if (type.IsEnum || (Nullable.GetUnderlyingType(type)?.IsEnum ?? false))
                {
                    var converterType = typeof(EnumToStringConverter<>).MakeGenericType(Nullable.GetUnderlyingType(type) ?? type);
                    var converter = (ValueConverter)Activator.CreateInstance(converterType)!;
                    property.SetValueConverter(converter);
                }
            }
        }
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSnakeCaseNamingConvention();
        base.OnConfiguring(optionsBuilder);
    }
}
