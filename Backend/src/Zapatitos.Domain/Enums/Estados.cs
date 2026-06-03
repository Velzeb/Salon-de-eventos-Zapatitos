namespace Zapatitos.Domain.Enums;

public enum EstadoEvento
{
    Provisional,
    Confirmado,
    EnCurso,
    Finalizado,
    Terminado,
    Cancelado
}

public enum EstadoPago
{
    Pendiente,
    Verificado,
    Rechazado,
    Finalizado
}

public enum EstadoGeneral
{
    Activo,
    Inactivo,
    Archivado
}

public enum EstadoTarea
{
    Pendiente,
    EnProgreso,
    Completada
}

public enum TipoTareaOperativa
{
    Manual,
    Inventario,
    Servicio,
    Entrega
}

public enum TipoProveedor
{
    Insumos,
    Servicios,
    General
}

public enum FasePlantilla
{
    Preparacion,
    EnVivo
}

public enum TipoServicio
{
    ArticuloInventario,  // Respaldado por un artículo de inventario (ej: sillas)
    ProductoProduccion,  // Respaldado por una receta interna (ej: galletas de coco)
    ServicioTercero      // Servicio externo de un proveedor (ej: payaso, sonido)
}

public enum OrigenEvento
{
    Interno,
    Online
}
