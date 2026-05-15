using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Zapatitos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Fase5_InvitadosCronograma : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "alergias",
                table: "eventos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "color_manteleria",
                table: "eventos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "notas_decoracion",
                table: "eventos",
                type: "text",
                nullable: true);


            migrationBuilder.AddColumn<string>(
                name: "sabor_pastel",
                table: "eventos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tematica",
                table: "eventos",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "cronograma_actividades",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    evento_id = table.Column<long>(type: "bigint", nullable: false),
                    nombre = table.Column<string>(type: "text", nullable: false),
                    descripcion = table.Column<string>(type: "text", nullable: true),
                    hora_inicio = table.Column<TimeSpan>(type: "interval", nullable: false),
                    hora_fin = table.Column<TimeSpan>(type: "interval", nullable: false),
                    orden = table.Column<int>(type: "integer", nullable: false),
                    completada = table.Column<bool>(type: "boolean", nullable: false),
                    hora_inicio_real = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    hora_fin_real = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    modificado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    eliminado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    version = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cronograma_actividades", x => x.id);
                    table.ForeignKey(
                        name: "fk_cronograma_actividades_eventos_evento_id",
                        column: x => x.evento_id,
                        principalTable: "eventos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "invitados",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    evento_id = table.Column<long>(type: "bigint", nullable: false),
                    nombre = table.Column<string>(type: "text", nullable: false),
                    codigo_qr = table.Column<Guid>(type: "uuid", nullable: false),
                    ingreso = table.Column<bool>(type: "boolean", nullable: false),
                    fecha_ingreso = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    modificado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    eliminado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    version = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_invitados", x => x.id);
                    table.ForeignKey(
                        name: "fk_invitados_eventos_evento_id",
                        column: x => x.evento_id,
                        principalTable: "eventos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_cronograma_actividades_evento_id",
                table: "cronograma_actividades",
                column: "evento_id");

            migrationBuilder.CreateIndex(
                name: "ix_invitados_evento_id",
                table: "invitados",
                column: "evento_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cronograma_actividades");

            migrationBuilder.DropTable(
                name: "invitados");


            migrationBuilder.DropColumn(
                name: "alergias",
                table: "eventos");

            migrationBuilder.DropColumn(
                name: "color_manteleria",
                table: "eventos");

            migrationBuilder.DropColumn(
                name: "notas_decoracion",
                table: "eventos");

            migrationBuilder.DropColumn(
                name: "sabor_pastel",
                table: "eventos");

            migrationBuilder.DropColumn(
                name: "tematica",
                table: "eventos");
        }
    }
}
