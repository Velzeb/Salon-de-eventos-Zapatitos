using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Zapatitos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTareasPlantilla : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Nueva tabla: tareas_plantilla
            migrationBuilder.CreateTable(
                name: "tareas_plantilla",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "text", nullable: false),
                    descripcion = table.Column<string>(type: "text", nullable: true),
                    fase_aplicacion = table.Column<string>(type: "text", nullable: false, defaultValue: "Preparacion"),
                    orden = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    activa = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    modificado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    eliminado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tareas_plantilla", x => x.id);
                });

            // Nueva columna en tareas_operativas: plantilla_id (FK nullable)
            migrationBuilder.AddColumn<long>(
                name: "plantilla_id",
                table: "tareas_operativas",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_tareas_operativas_plantilla_id",
                table: "tareas_operativas",
                column: "plantilla_id");

            migrationBuilder.AddForeignKey(
                name: "fk_tareas_operativas_tareas_plantilla_plantilla_id",
                table: "tareas_operativas",
                column: "plantilla_id",
                principalTable: "tareas_plantilla",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            // Seed: Tareas generales por defecto de Preparación
            var now = DateTime.UtcNow.ToString("o");
            migrationBuilder.Sql($@"
                INSERT INTO tareas_plantilla (nombre, descripcion, fase_aplicacion, orden, activa, creado_en, modificado_en, version)
                VALUES
                    ('Limpieza profunda del salón', 'Asegurarse de que el salón esté completamente limpio antes del evento.', 'Preparacion', 10, true, '{now}', '{now}', 1),
                    ('Montaje de mesas y sillas', 'Configurar el mobiliario según el layout del evento.', 'Preparacion', 20, true, '{now}', '{now}', 1),
                    ('Decoración de mesa principal', 'Armar la mesa principal con decoración temática.', 'Preparacion', 30, true, '{now}', '{now}', 1),
                    ('Prueba de equipo de sonido', 'Verificar que el sistema de sonido funcione correctamente.', 'Preparacion', 40, true, '{now}', '{now}', 1),
                    ('Revisión general con el personal', 'Briefing de 5 minutos con el equipo antes de abrir puertas.', 'Preparacion', 50, true, '{now}', '{now}', 1),
                    ('Entrega del salón limpio al cliente', 'Verificar que el salón quede en perfectas condiciones al finalizar.', 'EnVivo', 10, true, '{now}', '{now}', 1),
                    ('Verificar objetos olvidados', 'Revisar que no queden objetos del cliente en el salón.', 'EnVivo', 20, true, '{now}', '{now}', 1);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_tareas_operativas_tareas_plantilla_plantilla_id",
                table: "tareas_operativas");

            migrationBuilder.DropIndex(
                name: "ix_tareas_operativas_plantilla_id",
                table: "tareas_operativas");

            migrationBuilder.DropColumn(
                name: "plantilla_id",
                table: "tareas_operativas");

            migrationBuilder.DropTable(name: "tareas_plantilla");
        }
    }
}
