# Pruebas principales del sistema Zapatitos

Este documento resume las pruebas más importantes para validar el sistema de administración de salón/eventos infantiles. Las pruebas se enfocan en los flujos principales de los cuatro perfiles del sistema:

- Público: landing page, disponibilidad y reserva online.
- Cliente: portal de cliente, eventos, pagos, invitación y perfil.
- Empleado: jornada operativa, tareas, check-in, agenda y consumos.
- Administrador: reservas, operativo, catálogo, inventario, finanzas y cierre.

## 1. Pruebas funcionales

Las pruebas funcionales verifican que el sistema cumpla con los requisitos establecidos y realice correctamente las operaciones esperadas por cada tipo de usuario.

| ID | Módulo | Caso de prueba | Pasos principales | Resultado esperado |
|---|---|---|---|---|
| PF-01 | Landing pública | Visualizar información pública del salón | Ingresar a la página principal. Revisar secciones de servicios, paquetes, galería, disponibilidad y contacto. | La landing carga correctamente, muestra información del negocio y permite iniciar una reserva. |
| PF-02 | Reserva online | Crear una reserva desde el sitio público | Ir a reservar, seleccionar fecha, horario, paquete o solo salón, agregar extras, cargar datos y comprobante. | El sistema registra la reserva, calcula el total y deja el evento en estado correspondiente para revisión. |
| PF-03 | Login y redirección | Iniciar sesión según rol | Iniciar sesión como administrador, empleado y cliente. | Administrador entra al panel admin, empleado a `/empleado/jornada`, cliente a `/cliente/dashboard`. |
| PF-04 | Panel cliente | Consultar eventos del cliente | Iniciar sesión como cliente y abrir "Mis eventos". | Se muestran solo los eventos asociados al cliente autenticado, con fecha, estado, modalidad y saldo. |
| PF-05 | Pago cliente | Reportar pago desde portal cliente | Abrir detalle del evento, entrar a pagos, cargar monto y comprobante. | El pago queda registrado como pendiente de verificación y aparece en el historial del evento. |
| PF-06 | Invitación cliente | Abrir invitación digital | Desde detalle del evento, abrir o copiar enlace de invitación. | Se abre la invitación pública del evento mediante token válido. |
| PF-07 | Panel empleado | Consultar jornada operativa | Iniciar sesión como empleado y abrir `/empleado/jornada`. | El empleado visualiza eventos de hoy, próximos eventos, tareas pendientes y eventos en curso. |
| PF-08 | Tareas empleado | Completar tarea operativa | Abrir evento como empleado, ir a preparación y completar una tarea pendiente. | La tarea cambia a completada y, si corresponde, descuenta inventario. |
| PF-09 | Check-in empleado | Registrar ingreso de invitado | Abrir evento, ingresar código QR o marcar invitado como ingresado. | El invitado queda marcado como "En salón" y aumenta el contador de ingresos. |
| PF-10 | Agenda empleado | Marcar actividad de la fiesta | Abrir evento en panel empleado, ir a "Durante la fiesta" y marcar actividad como completada. | La actividad cambia de pendiente a completada sin permitir editar toda la agenda. |
| PF-11 | Consumo extra empleado | Registrar consumo durante evento | Abrir evento, ir a consumos, seleccionar servicio extra y cantidad. | Se registra el consumo, se actualiza el total del evento y queda asociado al empleado autenticado. |
| PF-12 | Panel admin operativo | Gestionar preparación de evento | Como administrador, abrir evento operativo, revisar resumen, preparación, agenda, pagos y cierre. | El administrador accede a todas las acciones operativas permitidas para gestionar el evento completo. |
| PF-13 | Catálogo admin | Administrar servicios y paquetes | Crear/editar servicios y paquetes desde el panel admin. | Los cambios quedan disponibles para reservas y paneles que consumen el catálogo. |
| PF-14 | Inventario admin | Controlar stock | Crear artículo, ajustar stock y completar tarea vinculada a inventario. | El stock se actualiza correctamente y no se descuenta dos veces por la misma tarea. |
| PF-15 | Finanzas admin | Verificar pago | Como administrador, abrir pagos pendientes y verificar comprobante. | El pago cambia a verificado y el saldo del evento se actualiza correctamente. |

## 2. Pruebas unitarias

Las pruebas unitarias garantizan que componentes o funciones individuales trabajen correctamente de forma aislada.

| ID | Componente | Caso de prueba | Resultado esperado |
|---|---|---|---|
| PU-01 | `normalizeEstadoEvento` | Normalizar estados como `Provisional`, `EnCurso`, `Cancelado`. | Devuelve claves internas correctas y `desconocido` para valores inválidos. |
| PU-02 | Cálculo de progreso operativo | Calcular porcentaje con tareas completadas y totales. | Retorna 0 si no hay tareas y porcentaje correcto cuando existen tareas. |
| PU-03 | Modalidad de evento | Evaluar evento sin paquete, con paquete, con extras. | Devuelve "Solo salón", "Solo salón + servicios extra", "Paquete: X" o "Paquete: X + servicios extra". |
| PU-04 | Validación de pago cliente | Validar monto y comprobante antes de enviar. | No permite monto cero/negativo ni comprobante vacío. |
| PU-05 | `CompleteTareaCommand` | Completar tarea con artículo de inventario asociado. | Marca tarea como completada, registra fecha y descuenta stock una sola vez. |
| PU-06 | `AddConsumoExtraCommand` | Registrar consumo con cantidad válida e inválida. | Rechaza cantidad menor a 1 y calcula total correctamente con cantidad válida. |
| PU-07 | Perfil empleado | Obtener empleado desde `UsuarioId`. | Devuelve datos del empleado autenticado o error si no existe. |

## 3. Pruebas de integración

Las pruebas de integración verifican que los módulos del sistema interactúen correctamente entre sí.

| ID | Integración | Caso de prueba | Resultado esperado |
|---|---|---|---|
| PI-01 | Reserva online + Operativo | Crear reserva desde público y verla en operativo admin. | El evento creado aparece en el listado operativo con datos de cliente, cumpleañero, horario, paquete/modalidad y pagos. |
| PI-02 | Cliente + Finanzas | Cliente reporta pago y administrador lo verifica. | El pago aparece pendiente para admin; al verificarlo, se actualiza el saldo visible para cliente. |
| PI-03 | Operativo + Inventario | Completar tarea de inventario. | La tarea se completa y el stock del artículo disminuye según la cantidad requerida. |
| PI-04 | Empleado + Operativo | Empleado completa tarea y admin revisa evento. | La tarea completada por empleado se refleja en el avance del evento para admin. |
| PI-05 | Empleado + Invitados | Empleado registra ingreso de invitado. | El invitado aparece como ingresado en el detalle operativo y en el contador del panel empleado. |
| PI-06 | Catálogo + Reserva | Crear servicio extra y usarlo en reserva. | El servicio aparece disponible en el flujo de reserva y se agrega al total del evento. |
| PI-07 | Configuración + Portal cliente | Configurar QR de pago y visualizarlo en portal. | El QR configurado por admin aparece en la pantalla de reporte de pago del cliente. |

## 4. Pruebas de regresión

Las pruebas de regresión aseguran que cambios recientes no dañen funcionalidades ya verificadas.

| ID | Área | Caso de prueba | Resultado esperado |
|---|---|---|---|
| PR-01 | Login y roles | Probar acceso de admin, empleado y cliente. | Cada rol ingresa solo a su panel correspondiente. |
| PR-02 | Reserva sin paquete | Crear evento solo salón. | El sistema permite reservar sin paquete y muestra "Solo salón" en admin, cliente y empleado. |
| PR-03 | Reserva con extras | Crear evento con servicios sueltos. | Los extras aparecen en el detalle operativo y se consideran en el total. |
| PR-04 | Operativo admin | Abrir detalle operativo existente. | No aparecen errores 500/400 y las pestañas principales cargan correctamente. |
| PR-05 | Agenda operativa | Editar agenda desde admin y verla desde empleado. | La agenda se guarda con horas válidas y el empleado puede marcar actividades sin editar estructura. |
| PR-06 | Portal cliente | Abrir detalle de evento con y sin galería. | La página carga aunque no existan fotos o configuraciones opcionales. |
| PR-07 | Build del sistema | Ejecutar build frontend y backend. | Ambos builds finalizan sin errores de compilación. |

## 5. Pruebas de usabilidad

Las pruebas de usabilidad verifican que los usuarios puedan interactuar con el sistema de forma clara, rápida y eficiente.

| ID | Perfil | Caso de prueba | Criterio de aceptación |
|---|---|---|---|
| PUx-01 | Público | Reservar desde la landing sin ayuda externa. | El usuario entiende fecha, horario, paquete/extras, pago y confirmación. |
| PUx-02 | Cliente | Encontrar saldo e informar pago. | El cliente encuentra el evento, ve saldo pendiente y reporta pago en menos de 3 pasos. |
| PUx-03 | Cliente | Copiar invitación digital. | El cliente identifica claramente el botón para abrir/copiar invitación. |
| PUx-04 | Empleado | Completar tareas durante preparación. | El empleado identifica tareas pendientes y puede completarlas desde móvil/tablet sin confusión. |
| PUx-05 | Empleado | Registrar ingreso de invitados. | El empleado puede registrar ingreso por QR o botón manual rápidamente. |
| PUx-06 | Administrador | Revisar estado completo del evento. | El admin entiende avance, pagos, agenda, preparación y cierre desde una sola vista. |
| PUx-07 | Administrador | Gestionar catálogo. | Crear o editar servicios/paquetes resulta claro y los datos aparecen donde corresponde. |

## Pruebas críticas recomendadas para entrega

Para una validación inicial del proyecto, se recomienda ejecutar primero estas pruebas:

1. Login y redirección por rol: administrador, empleado y cliente.
2. Reserva online completa desde landing.
3. Reserva sin paquete y con servicios extra.
4. Cliente reporta pago con comprobante.
5. Administrador verifica pago.
6. Empleado completa tarea operativa.
7. Empleado registra ingreso de invitado.
8. Administrador cierra preparación y revisa agenda.
9. Inventario descuenta stock al completar tarea vinculada.
10. Build frontend y backend sin errores.
