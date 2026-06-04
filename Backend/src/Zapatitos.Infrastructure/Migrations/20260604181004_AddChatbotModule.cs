using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Zapatitos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChatbotModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "chatbot_config",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    habilitado = table.Column<bool>(type: "boolean", nullable: false),
                    nombre_asistente = table.Column<string>(type: "text", nullable: false),
                    mensaje_bienvenida = table.Column<string>(type: "text", nullable: false),
                    personalidad = table.Column<string>(type: "text", nullable: false),
                    mision_empresa = table.Column<string>(type: "text", nullable: false),
                    vision_empresa = table.Column<string>(type: "text", nullable: false),
                    tono = table.Column<string>(type: "text", nullable: false),
                    restricciones = table.Column<string>(type: "text", nullable: false),
                    instrucciones_sistema = table.Column<string>(type: "text", nullable: false),
                    modelo_proveedor = table.Column<string>(type: "text", nullable: false),
                    modelo_nombre = table.Column<string>(type: "text", nullable: false),
                    temperatura = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    max_tokens = table.Column<int>(type: "integer", nullable: false),
                    mostrar_en_landing = table.Column<bool>(type: "boolean", nullable: false),
                    mostrar_en_portal_cliente = table.Column<bool>(type: "boolean", nullable: false),
                    permitir_consultar_eventos_cliente = table.Column<bool>(type: "boolean", nullable: false),
                    permitir_consultar_disponibilidad = table.Column<bool>(type: "boolean", nullable: false),
                    permitir_consultar_paquetes = table.Column<bool>(type: "boolean", nullable: false),
                    permitir_crear_lead_o_reserva = table.Column<bool>(type: "boolean", nullable: false),
                    mensaje_fallback = table.Column<string>(type: "text", nullable: false),
                    escalar_a_whats_app = table.Column<bool>(type: "boolean", nullable: false),
                    whatsapp_escalamiento = table.Column<string>(type: "text", nullable: true),
                    color_primario = table.Column<string>(type: "text", nullable: false),
                    posicion_widget = table.Column<string>(type: "text", nullable: false),
                    creado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    modificado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    eliminado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    version = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_chatbot_config", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "chatbot_conversations",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    usuario_id = table.Column<long>(type: "bigint", nullable: false),
                    titulo = table.Column<string>(type: "text", nullable: false),
                    canal = table.Column<string>(type: "text", nullable: false),
                    ultima_interaccion_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    modificado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    eliminado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    version = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_chatbot_conversations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "chatbot_messages",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    conversation_id = table.Column<long>(type: "bigint", nullable: false),
                    usuario_id = table.Column<long>(type: "bigint", nullable: false),
                    rol = table.Column<string>(type: "text", nullable: false),
                    contenido = table.Column<string>(type: "text", nullable: false),
                    modelo = table.Column<string>(type: "text", nullable: true),
                    tokens_entrada = table.Column<int>(type: "integer", nullable: false),
                    tokens_salida = table.Column<int>(type: "integer", nullable: false),
                    metadata_json = table.Column<string>(type: "text", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    modificado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    eliminado_en = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    version = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_chatbot_messages", x => x.id);
                    table.ForeignKey(
                        name: "fk_chatbot_messages_chatbot_conversations_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "chatbot_conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_chatbot_messages_conversation_id",
                table: "chatbot_messages",
                column: "conversation_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chatbot_config");

            migrationBuilder.DropTable(
                name: "chatbot_messages");

            migrationBuilder.DropTable(
                name: "chatbot_conversations");
        }
    }
}
