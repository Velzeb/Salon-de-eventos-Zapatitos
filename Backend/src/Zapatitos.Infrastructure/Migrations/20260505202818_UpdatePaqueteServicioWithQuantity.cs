using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Zapatitos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePaqueteServicioWithQuantity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "pk_paquetes_servicios",
                table: "paquetes_servicios");

            migrationBuilder.AddColumn<long>(
                name: "id",
                table: "paquetes_servicios",
                type: "bigint",
                nullable: false,
                defaultValue: 0L)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddColumn<int>(
                name: "cantidad",
                table: "paquetes_servicios",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "creado_en",
                table: "paquetes_servicios",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "eliminado_en",
                table: "paquetes_servicios",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "modificado_en",
                table: "paquetes_servicios",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "paquetes_servicios",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "pk_paquetes_servicios",
                table: "paquetes_servicios",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "ix_paquetes_servicios_paquete_id",
                table: "paquetes_servicios",
                column: "paquete_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "pk_paquetes_servicios",
                table: "paquetes_servicios");

            migrationBuilder.DropIndex(
                name: "ix_paquetes_servicios_paquete_id",
                table: "paquetes_servicios");

            migrationBuilder.DropColumn(
                name: "id",
                table: "paquetes_servicios");

            migrationBuilder.DropColumn(
                name: "cantidad",
                table: "paquetes_servicios");

            migrationBuilder.DropColumn(
                name: "creado_en",
                table: "paquetes_servicios");

            migrationBuilder.DropColumn(
                name: "eliminado_en",
                table: "paquetes_servicios");

            migrationBuilder.DropColumn(
                name: "modificado_en",
                table: "paquetes_servicios");

            migrationBuilder.DropColumn(
                name: "version",
                table: "paquetes_servicios");

            migrationBuilder.AddPrimaryKey(
                name: "pk_paquetes_servicios",
                table: "paquetes_servicios",
                columns: new[] { "paquete_id", "servicio_id" });
        }
    }
}
