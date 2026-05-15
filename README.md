# 👠 Zapatitos - Sistema Integral de Gestión de Eventos Infantiles

Zapatitos es una plataforma empresarial robusta diseñada para automatizar y optimizar la operación de salones de fiestas infantiles. El sistema integra la gestión de reservas, operaciones en vivo durante los eventos y un módulo financiero avanzado (ERP-lite).

## 🚀 Stack Tecnológico
- **Backend:** .NET 8 (C#)
- **Base de Datos:** PostgreSQL 16
- **Arquitectura:** Clean Architecture (Domain-Centric)
- **Patrones:** CQRS con MediatR, Repository Pattern, Unit of Work.
- **Seguridad:** JWT (JSON Web Tokens) con RBAC (Role-Based Access Control) y BCrypt para hashing.
- **Validación:** FluentValidation automática en el pipeline de peticiones.

---

## 🏗️ Arquitectura del Sistema
El proyecto sigue los principios de **Clean Architecture**, dividiéndose en 4 capas:

1.  **Domain:** Entidades puras, Enums e interfaces base. No tiene dependencias externas.
2.  **Application:** Lógica de negocio, comandos (Commands), consultas (Queries) y validaciones.
3.  **Infrastructure:** Implementación de EF Core, seguridad JWT, acceso a datos y servicios externos.
4.  **API:** Controladores Thin, Middleware de errores y configuración del pipeline de ASP.NET.

---

## 📦 Módulos Detallados

### 1. Identidad y Seguridad (RBAC)
- **Multitenancy de Roles:** Diferencia flujos entre `Administrador`, `Empleado` (Staff) y `Cliente`.
- **Registro Seguro:** Registro público para clientes y registro protegido (solo Admin) para personal interno.
- **Tokens de Acceso:** Sesiones seguras con expiración configurable.

### 2. Gestión de Reservas y Catálogo
- **Motor de Reservas:** Validación de disponibilidad, horarios y paquetes.
- **Catálogo Dinámico:** Gestión de servicios básicos y extras con precios configurables.

### 3. Operaciones en Vivo (Live Ops)
- **Dashboard de Staff:** Aplicación para que el personal marque tareas (`inflar globos`, `limpieza`) en tiempo real.
- **Consumos en Caliente:** Permite añadir extras (gaseosas, horas adicionales) durante la fiesta, actualizando el saldo del cliente al instante.
- **Sincronización de Inventario:** Descuento automático de stock al registrar consumos adicionales.

### 4. Finanzas Avanzadas (Admin)
- **Flujo de Caja:** Registro automático de entradas (pagos de clientes) y salidas (gastos).
- **Gastos Operativos:** Control de pagos a proveedores, servicios y alquileres.
- **Nómina:** Gestión de pagos a empleados por evento o periodo.

### 5. Configuración Web Dinámica
- **CMS Headless:** El administrador puede modificar títulos, imágenes y promociones de la Landing Page desde el sistema, sin tocar código.

---

## 🔄 Flujo Operativo del Sistema

### Paso 1: Atracción y Reserva
- El **Cliente** ve la Landing Page (datos dinámicos).
- Se registra y crea una **Reserva Provisional**.
- Realiza un pago inicial. El **Admin** lo verifica y el evento pasa a **Confirmado**.

### Paso 2: Preparación (Staff)
- El **Admin** asigna empleados al evento.
- El sistema genera una lista de **Tareas Operativas**.
- El **Staff** marca tareas como completadas antes de que empiece la fiesta.

### Paso 3: Ejecución (En Vivo)
- Durante la fiesta, el **Staff** registra consumos extras.
- El **Backend** actualiza el `SaldoPendiente` del evento y descuenta del **Inventario**.

### Paso 4: Cierre y Liquidación
- El **Admin** cobra el saldo restante (incluyendo los extras).
- Se cierra el evento y se registra el ingreso final en el **Movimiento de Caja**.

---

## 🛠️ Cómo Ejecutar el Proyecto

1.  **Requisitos:** .NET 8 SDK y PostgreSQL.
2.  **Configuración:** Ajustar el `ConnectionString` en `src/Zapatitos.API/appsettings.json`.
3.  **Ejecución:**
    ```powershell
    dotnet run --project backend/src/Zapatitos.API
    ```
4.  **Documentación API:** Acceder a `http://localhost:5131/swagger` para probar los endpoints.

**Credenciales de prueba (Seeding):**
- **Admin:** `admin@zapatitos.com` / `Admin123!`
- **Cliente:** (Vía endpoint /register)
