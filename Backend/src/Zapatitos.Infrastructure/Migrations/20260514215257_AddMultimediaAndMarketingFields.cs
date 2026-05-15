using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Zapatitos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMultimediaAndMarketingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "articulo_inventario_id",
                table: "tareas_operativas",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "cantidad_requerida",
                table: "tareas_operativas",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "stock_descontado",
                table: "tareas_operativas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "consentimiento_marketing",
                table: "eventos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_entrega_fotos",
                table: "eventos",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_proximo_contacto",
                table: "eventos",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "link_galeria_fotos",
                table: "eventos",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "multimedia_eventos",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    evento_id = table.Column<long>(type: "bigint", nullable: false),
                    url = table.Column<string>(type: "text", nullable: false),
                    nombre_archivo = table.Column<string>(type: "text", nullable: false),
                    tipo_archivo = table.Column<string>(type: "text", nullable: false),
                    fecha_subida = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    creado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    modificado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    eliminado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    version = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_multimedia_eventos", x => x.id);
                    table.ForeignKey(
                        name: "fk_multimedia_eventos_eventos_evento_id",
                        column: x => x.evento_id,
                        principalTable: "eventos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_tareas_operativas_articulo_inventario_id",
                table: "tareas_operativas",
                column: "articulo_inventario_id");

            migrationBuilder.CreateIndex(
                name: "ix_multimedia_eventos_evento_id",
                table: "multimedia_eventos",
                column: "evento_id");

            migrationBuilder.AddForeignKey(
                name: "fk_tareas_operativas_articulos_inventario_articulo_inventario_",
                table: "tareas_operativas",
                column: "articulo_inventario_id",
                principalTable: "articulos_inventario",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_tareas_operativas_articulos_inventario_articulo_inventario_",
                table: "tareas_operativas");

            migrationBuilder.DropTable(
                name: "multimedia_eventos");

            migrationBuilder.DropIndex(
                name: "ix_tareas_operativas_articulo_inventario_id",
                table: "tareas_operativas");

            migrationBuilder.DropColumn(
                name: "articulo_inventario_id",
                table: "tareas_operativas");

            migrationBuilder.DropColumn(
                name: "cantidad_requerida",
                table: "tareas_operativas");

            migrationBuilder.DropColumn(
                name: "stock_descontado",
                table: "tareas_operativas");

            migrationBuilder.DropColumn(
                name: "consentimiento_marketing",
                table: "eventos");

            migrationBuilder.DropColumn(
                name: "fecha_entrega_fotos",
                table: "eventos");

            migrationBuilder.DropColumn(
                name: "fecha_proximo_contacto",
                table: "eventos");

            migrationBuilder.DropColumn(
                name: "link_galeria_fotos",
                table: "eventos");
        }
    }
}
