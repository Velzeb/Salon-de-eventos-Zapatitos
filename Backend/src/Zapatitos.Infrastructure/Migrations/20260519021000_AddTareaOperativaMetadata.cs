using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zapatitos.Infrastructure.Migrations
{
    public partial class AddTareaOperativaMetadata : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "evento_item_id",
                table: "tareas_operativas",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tipo_tarea",
                table: "tareas_operativas",
                type: "text",
                nullable: false,
                defaultValue: "Manual");

            migrationBuilder.Sql("""
                UPDATE tareas_operativas
                SET tipo_tarea = CASE
                    WHEN articulo_inventario_id IS NOT NULL THEN 'Inventario'
                    ELSE 'Manual'
                END
                WHERE tipo_tarea IS NULL OR tipo_tarea = 'Manual';
                """);

            migrationBuilder.Sql("""
                INSERT INTO tareas_operativas (
                    evento_id,
                    nombre_tarea,
                    descripcion,
                    estado,
                    evento_item_id,
                    cantidad_requerida,
                    tipo_tarea,
                    stock_descontado,
                    creado_en,
                    modificado_en,
                    version
                )
                SELECT
                    ei.evento_id,
                    'Preparar servicio: ' || ei.nombre,
                    CASE
                        WHEN ei.es_incluido_en_paquete THEN 'Servicio incluido en el paquete. Marcar cuando esté listo para entrega.'
                        ELSE 'Servicio adicional contratado. Marcar cuando esté listo para entrega.'
                    END,
                    'Pendiente',
                    ei.id,
                    ei.cantidad,
                    'Servicio',
                    false,
                    NOW(),
                    NOW(),
                    1
                FROM evento_items ei
                WHERE ei.servicio_id IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1
                      FROM tareas_operativas t
                      WHERE t.evento_id = ei.evento_id
                        AND t.evento_item_id = ei.id
                        AND t.tipo_tarea = 'Servicio'
                  );
                """);

            migrationBuilder.CreateIndex(
                name: "ix_tareas_operativas_evento_item_id",
                table: "tareas_operativas",
                column: "evento_item_id");

            migrationBuilder.AddForeignKey(
                name: "fk_tareas_operativas_evento_items_evento_item_id",
                table: "tareas_operativas",
                column: "evento_item_id",
                principalTable: "evento_items",
                principalColumn: "id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_tareas_operativas_evento_items_evento_item_id",
                table: "tareas_operativas");

            migrationBuilder.DropIndex(
                name: "ix_tareas_operativas_evento_item_id",
                table: "tareas_operativas");

            migrationBuilder.DropColumn(
                name: "evento_item_id",
                table: "tareas_operativas");

            migrationBuilder.DropColumn(
                name: "tipo_tarea",
                table: "tareas_operativas");
        }
    }
}
