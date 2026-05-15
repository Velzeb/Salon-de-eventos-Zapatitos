-- ############################################################################
-- PROYECTO: ZAPATITOS - ESQUEMA POSTGRESQL (LEGACY)
-- ############################################################################
-- NOTE: Este archivo es informativo. La fuente de verdad es EF Core Migrations.
-- Para regenerar un script actualizado, usa:
--   dotnet ef migrations script --project Backend/src/Zapatitos.Infrastructure \
--     --startup-project Backend/src/Zapatitos.API
-- ############################################################################

-- 1. EXTENSIONES Y ENUMS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE estado_evento AS ENUM ('provisional', 'confirmado', 'en_curso', 'completado', 'cancelado');
CREATE TYPE estado_pago AS ENUM ('pendiente', 'verificado', 'rechazado', 'finalizado');
CREATE TYPE estado_general AS ENUM ('activo', 'inactivo', 'archivado');
CREATE TYPE estado_tarea AS ENUM ('pendiente', 'en_progreso', 'completada');

-- 2. SEGURIDAD Y ACCESO (RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    modificado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permisos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE, -- ej: 'eventos:crear', 'consumos:registrar'
    descripcion TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles_permisos (
    rol_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id BIGINT REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE usuarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultima_conexion TIMESTAMPTZ,
    version INT DEFAULT 1,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    modificado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usuarios_roles (
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, rol_id)
);

-- 3. ENTIDADES DE PERSONAS
-- ----------------------------------------------------------------------------
CREATE TABLE clientes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT UNIQUE REFERENCES usuarios(id), -- Null si es prospecto sin cuenta
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    modificado_en TIMESTAMPTZ DEFAULT NOW(),
    eliminado_en TIMESTAMPTZ
);

CREATE TABLE empleados (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT UNIQUE REFERENCES usuarios(id) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    puesto VARCHAR(100),
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    estado estado_general DEFAULT 'activo',
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    modificado_en TIMESTAMPTZ DEFAULT NOW(),
    eliminado_en TIMESTAMPTZ
);

-- 4. CATÁLOGO Y PAQUETES
-- ----------------------------------------------------------------------------
CREATE TABLE servicios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    costo_base NUMERIC(10,2) NOT NULL DEFAULT 0,
    es_extra BOOLEAN DEFAULT TRUE, -- TRUE si se vende durante la fiesta
    estado estado_general DEFAULT 'activo',
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    modificado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE paquetes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_base NUMERIC(10,2) NOT NULL,
    capacidad_ninos INT NOT NULL,
    duracion_horas INT NOT NULL,
    estado estado_general DEFAULT 'activo',
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    modificado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE paquetes_servicios (
    paquete_id BIGINT REFERENCES paquetes(id) ON DELETE CASCADE,
    servicio_id BIGINT REFERENCES servicios(id) ON DELETE CASCADE,
    cantidad INT DEFAULT 1,
    PRIMARY KEY (paquete_id, servicio_id)
);

-- 5. INVENTARIO
-- ----------------------------------------------------------------------------
CREATE TABLE proveedores (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contacto_nombre VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(255),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE articulos_inventario (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proveedor_id BIGINT REFERENCES proveedores(id),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    unidad_medida VARCHAR(20) DEFAULT 'unidades',
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    modificado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EVENTOS Y RESERVAS
-- ----------------------------------------------------------------------------
CREATE TABLE eventos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id),
    paquete_id BIGINT NOT NULL REFERENCES paquetes(id),
    nombre_cumpleanero VARCHAR(255) NOT NULL,
    edad_cumplir INT,
    fecha_evento DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    cantidad_ninos_estimada INT NOT NULL,
    estado estado_evento DEFAULT 'provisional',
    precio_total NUMERIC(10,2) NOT NULL,
    saldo_pendiente NUMERIC(10,2) NOT NULL,
    notas_admin TEXT,
    version INT DEFAULT 1,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    modificado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_horas CHECK (hora_fin > hora_inicio)
);

CREATE TABLE invitaciones_digitales (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    evento_id BIGINT REFERENCES eventos(id) ON DELETE CASCADE,
    token_acceso UUID DEFAULT uuid_generate_v4(),
    config_json JSONB, -- Colores, fuentes, imagen elegida
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FINANZAS Y PAGOS
-- ----------------------------------------------------------------------------
CREATE TABLE metodos_pago (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL, -- Efectivo, Transferencia, Tarjeta
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE pagos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    evento_id BIGINT NOT NULL REFERENCES eventos(id),
    metodo_pago_id BIGINT REFERENCES metodos_pago(id),
    monto NUMERIC(10,2) NOT NULL,
    referencia VARCHAR(255), -- Num de transaccion
    comprobante_url TEXT,
    estado estado_pago DEFAULT 'pendiente',
    fecha_pago TIMESTAMPTZ DEFAULT NOW(),
    verificado_por BIGINT REFERENCES empleados(id),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 8. OPERACIÓN "EN VIVO" (DASHBOARD EMPLEADOS)
-- ----------------------------------------------------------------------------
CREATE TABLE asignacion_staff (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    evento_id BIGINT NOT NULL REFERENCES eventos(id),
    empleado_id BIGINT NOT NULL REFERENCES empleados(id),
    rol_en_evento VARCHAR(50), -- Animador, Mesero, Coordinador
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tareas_operativas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    evento_id BIGINT NOT NULL REFERENCES eventos(id),
    nombre_tarea VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado estado_tarea DEFAULT 'pendiente',
    asignado_a BIGINT REFERENCES empleados(id),
    fecha_completada TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE consumos_extras (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    evento_id BIGINT NOT NULL REFERENCES eventos(id),
    servicio_id BIGINT NOT NULL REFERENCES servicios(id),
    empleado_id BIGINT NOT NULL REFERENCES empleados(id), -- Quien lo registró
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario_momento NUMERIC(10,2) NOT NULL,
    total_consumo NUMERIC(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario_momento) STORED,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 9. POST-EVENTO
-- ----------------------------------------------------------------------------
CREATE TABLE retroalimentacion_cliente (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    evento_id BIGINT UNIQUE REFERENCES eventos(id),
    calificacion_general INT CHECK (calificacion_general BETWEEN 1 AND 5),
    comentario TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fotos_evento (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    evento_id BIGINT REFERENCES eventos(id),
    url TEXT NOT NULL,
    visible_para_cliente BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ÍNDICES PARA RENDIMIENTO
-- ----------------------------------------------------------------------------
CREATE INDEX idx_eventos_fecha ON eventos(fecha_evento);
CREATE INDEX idx_eventos_cliente ON eventos(cliente_id);
CREATE INDEX idx_pagos_evento ON pagos(evento_id);
CREATE INDEX idx_consumos_evento ON consumos_extras(evento_id);
CREATE INDEX idx_tareas_evento ON tareas_operativas(evento_id);
CREATE INDEX idx_articulos_stock ON articulos_inventario(stock_actual);
