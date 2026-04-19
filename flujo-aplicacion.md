# Flujo Completo de la Aplicación "Navaja Dorada"

**Versión:** 1.3.0  
**Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime, Edge Functions)  
**Roles:** Cliente, Barbero, Dueño (Barbería)

---

## Índice

1. [Arranque y Decisión de Ruta](#arranque-y-decisión-de-ruta)
2. [Autenticación (Supabase Auth)](#autenticación-supabase-auth)
3. [Rol Cliente](#rol-cliente)
4. [Flujo de Reserva (Cliente)](#flujo-de-reserva-cliente)
5. [Rol Dueño (Barbería)](#rol-dueño-barbería)
6. [Rol Barbero](#rol-barbero)
7. [Vinculación Interna Barbero-Barbería](#vinculación-interna-barbero-barbería)
8. [Persistencia del Rol Activo](#persistencia-del-rol-activo)
9. [Consideraciones Técnicas](#consideraciones-técnicas)

---

## Arranque y Decisión de Ruta

1. **Splash Screen**
   - Verifica sesión con Supabase (`supabase.auth.getSession()`).
   - **Si hay sesión**:
     - Recupera último rol activo guardado en `AsyncStorage` (`active_role`).
     - Redirige al **Home** correspondiente (Cliente, Barbero o Dueño).
   - **Si no hay sesión**:
     - Verifica flag de primera instalación en almacenamiento local.
     - **Primera vez** → **Onboarding Slide 1**.
     - **Ya vio onboarding** → Directo a **Login** (pestaña "Iniciar sesión").

2. **Onboarding** (solo en primera instalación)
   - **Slide 1** (valor principal): Botón "Siguiente". Enlace "¿Ya tenés cuenta? Iniciar sesión".
   - **Slide 2** (personalización): Botón "Siguiente". Mismo enlace de login.
   - **Slide 3** (recordatorios): Botón "Comenzar" → **Login** (pestaña "Iniciar sesión").
   - Desde cualquier slide, si el usuario toca "Iniciar sesión" → **Login**.

---

## Autenticación (Supabase Auth)

### Pantalla Login / Registro (Pestañas)

**Pestaña Iniciar sesión**

- Campos: Email, Contraseña.
- Botón "Entrar".
- Botón "Continuar con Google".
- Enlace "¿Olvidaste tu contraseña?" (solo visible aquí).

**Pestaña Registrarse**

- Campos: Email, Contraseña (con indicador de fortaleza).
- Checkbox "Acepto términos y condiciones".
- Botón "Crear cuenta".
- Botón "Continuar con Google".

### Flujos de Autenticación

**Registro Email/Password**

1. `supabase.auth.signUp({ email, password })`.
2. Supabase envía correo de verificación automáticamente.
3. Redirige a pantalla **"Revisa tu correo"**.
   - Botón "Abrir aplicación de correo".
   - Botón "Reenviar correo" (límite: 1 reintento, temporizador 60s).
   - Enlace "Volver a Iniciar sesión".
4. El usuario **no puede iniciar sesión** hasta confirmar el email (Supabase bloquea).

**Login Email/Password**

- `supabase.auth.signInWithPassword()`.
- Éxito → resolución de visibilidad de roles + `active_role` guardado.
- Si el rol guardado es válido para la cuenta actual, redirige al Home de ese rol.
- Si no es válido, redirige a Cliente.

**Login/Registro con Google**

- `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- Si es nuevo, crea cuenta con email verificado automáticamente.
- Accede directamente al **Home del último rol**.

### Recuperación de Contraseña

1. Pantalla "Solicitar recuperación" (ingresar email).
2. Pantalla "Correo enviado" (con opción de reenviar).
3. Deep Link a "Restablecer contraseña" (nueva y confirmación).
4. Éxito → Login.

### Primer Inicio Post‑Login

- Modal **"¿Cómo te llamas?"** (campo único para nombre/apodo).
- Se guarda en `profiles.full_name`.

---

## Rol Cliente

**Bottom Navigation:** Inicio | Barberías | Mis Turnos | Perfil

### Pantalla Inicio

- Saludo personalizado (`Hola, [Nombre]`).
- Acciones en header: **Notificaciones (campana)** y **Favoritos (corazon)**.
- El icono de corazon abre la pantalla dedicada **Mis Favoritos**.
- Tarjeta "Próximo turno" (si existe).
- Botón grande **"Reservar turno"**.
- Sección "Barberos destacados" (scroll horizontal, de cualquier barbería).
- Cada card de barbero destacado permite **agregar/quitar favorito** con icono corazon.
- Sección "Barberías cercanas" (opcional).

### Pantalla Mis Favoritos

- Acceso principal: desde **Home (icono corazon)**.
- Top bar con regreso y titulo "Mis Favoritos".
- Pestañas: **Barberias** / **Barberos**.
- En **Barberias**:
  - Cards visuales con imagen, rating y direccion.
  - Boton "Ver servicios" para continuar reserva.
  - Corazon para quitar de favoritos.
- En **Barberos**:
  - Lista de barberos guardados.
  - Acceso a perfil del barbero / reserva.
  - Corazon para quitar de favoritos.
- Empty states por pestaña cuando no hay elementos.

### Pantalla Barberías

- Toggle **Mapa / Lista**.
- Mapa con pines de barberías activas.
- Lista con búsqueda y orden (distancia, calificación).
- En **Lista**: cada barbería tiene corazon para **agregar/quitar favorito**.
- En **Mapa**: la card de barbería seleccionada tiene corazon para **agregar/quitar favorito**.
- Al seleccionar una barbería → **Flujo de reserva (Paso 2)**.

### Pantalla Mis Turnos

- Pestañas: **Activos** / **Historial**.
- **Turno activo:** detalles completos, código QR, botones "Reprogramar" (solo fecha/hora) y "Cancelar" (con política de penalización).
- **Historial:** lista de turnos pasados con opción de calificar.

### Pantalla Perfil

- Datos personales (avatar, nombre, email, teléfono).
- Boton lapiz abre pantalla dedicada **Editar Perfil** (no modal).
- **Selector de roles:** muestra los roles del usuario. Al cambiar, el rol activo se persiste en `AsyncStorage`.
- Botón **"Registrar mi Barbería"** (si no tiene ninguna).
- Opción **"Vincular invitación"** (ingresar código manual).
- Opción **"Diagnóstico de cuenta"** (pantalla técnica de soporte).
- Configuración (notificaciones, sincronizar calendario) y cerrar sesión.

### Pantalla Diagnóstico de Cuenta

- Vista técnica interna para soporte, sin cambiar datos de negocio.
- Muestra:
  - `userId`, `email` y `scope` de almacenamiento detectado.
  - `active_role` actual.
  - `hasOwnerRole` y `hasBarberRole` calculados.
  - Estado de claves scopeadas y legacy en `AsyncStorage`.
- Botón "Actualizar" para revalidar estado en tiempo real.

### Pantalla Editar Perfil

- Acceso desde boton lapiz en Perfil.
- Permite editar nombre y telefono.
- Muestra email en solo lectura.
- Boton "Guardar cambios" persiste via `supabase.auth.updateUser(...)`.

---

## Flujo de Reserva (Cliente)

**Puntos de entrada:**

- Botón "Reservar turno" (Home) → **Paso 1**.
- Seleccionar barbería (desde Barberías) → **Paso 2**.
- Tocar barbero destacado → **Paso 2** (barbero preseleccionado).
- Tocar barbero favorito (desde Mis Favoritos) → **Paso 2** (barbero preseleccionado).

**Indicador de progreso:** 5 pasos (Barbería → Servicio → Barbero → Horario → Confirmar).

1. **Seleccionar Barbería** (si no viene preseleccionada).
2. **Seleccionar Servicio** – lista de servicios activos de la barbería.
3. **Seleccionar Barbero** – opción "Cualquier barbero disponible" + lista de barberos activos.
4. **Seleccionar Fecha y Hora**
   - Calendario con días disponibles.
   - Chips de horarios según duración del servicio y disponibilidad.
   - **Bloqueo temporal por 10 minutos** al seleccionar slot. Contador visible.
5. **Confirmación**
   - Resumen (barbería, servicio, barbero, fecha/hora, precio).
   - Campo "Notas" opcional.
   - Checkbox "Recordarme este turno".
   - Texto de política de cancelación.
6. **Éxito**
   - Check animado, detalles completos, código QR.
   - Botón "Agregar a Calendario".
   - Modal para activar notificaciones push.
   - Navegación a Home o Mis Turnos.

**Reprogramar turno** (desde Mis Turnos):

- Solo cambia fecha/hora (misma barbería, servicio y barbero).
- Abre directamente el **Paso 4**.

---

## Rol Dueño (Barbería)

**Acceso:** desde selector de roles en Perfil.  
**Bottom Navigation:** Dashboard | Agenda | Barberos | Servicios | Más

### Dashboard

- KPIs del día calculados en cliente (ventas estimadas, turnos y ocupación).
- Próximos turnos (lista interactiva).
- Cada card de próximo turno abre modal de detalle con acciones:
  - Ir a Agenda.
  - Marcar en progreso.
  - Marcar no asistió.
- Card de barbería principal editable (acceso a perfil de barbería).

### Agenda

- Vista diaria con navegación por fecha (día anterior/siguiente).
- Gestión manual de turnos del día:
  - Crear turno (cliente, servicio, hora).
  - Marcar estado: en progreso o no asistió.
- Feedback visual con toast y bloqueo temporal de acciones mientras guarda.

### Barberos

- Banner **"¿Querés atender vos mismo?"** (si el dueño no tiene perfil de barbero activo en esa barbería).
- Botón **"Generar código de invitación"** → código local de 6 caracteres (expira en 7 días).
- Lista de barberos activos/inactivos con toggle.
- **Solicitudes pendientes** con acción Aprobar/Rechazar.
- **Agregar barbero manual por cuenta**:
  - Requiere correo + especialidad (nombre opcional).
  - Evita duplicados por correo.
  - Si Supabase está configurado, valida cuenta existente por correo antes de vincular.
  - Guarda vínculo local con `accountEmail` y `accountUserId` (si está disponible).

### Servicios

- CRUD local de servicios (nombre, categoría, descripción, precio, duración, destacado).
- Activar/desactivar servicio.
- Crear/editar/eliminar desde pantalla única.
- Validaciones básicas y feedback visual con toast.

### Más

- Datos de la barbería (incluye imagen/logo local).
- Horario semanal (acceso a agenda de dueño).
- Franjas de turnos (pantalla separada de agenda).
- Políticas (cancelación, no-show, auto-confirmación, turnos nocturnos).
- Reportes por rango (hoy/semana/mes) con exportación PDF y compartir.
- Soporte (email, WhatsApp, copiar contacto).
- Cambio rápido a vista Barbero.
- Cerrar sesión.

---

## Rol Barbero

**Acceso:** desde selector de roles en Perfil (o cambio rápido desde Dueño).  
**Bottom Navigation:** Mi Agenda | Historial | Clientes | Perfil

### Mi Agenda

- Timeline del día (turnos con hora, cliente, servicio y estado).
- Acciones según estado:
  - Pendiente → "Iniciar", "No asistió".
  - En progreso → "Completar", "No asistió".
  - Completado / No asistió / Libre → solo lectura.
- Botón **"Sincronizar a calendario"**:
  - Solicita permisos de calendario.
  - Crea/usa calendario "Navaja Dorada".
  - Sincroniza turnos del día sin duplicar eventos (actualiza los existentes y limpia obsoletos).
- Recordatorios automáticos de turnos:
  - Si notificaciones están activadas, se programan avisos locales 1 hora antes.
  - Se regeneran al cargar agenda para mantener consistencia.
- Resumen inferior: cantidad de turnos completados hoy.

### Historial

- Lista de turnos del historial con filtros por rango:
  - Hoy
  - Semana
  - Mes
  - Todo
- Tarjeta resumen de ingresos del rango seleccionado:
  - Total facturado
  - Promedio diario

### Clientes

- Lista de clientes frecuentes (búsqueda por nombre/email).
- Detalle por cliente en modal:
  - Última visita
  - Total de visitas
  - Cantidad de no asistió
  - **Notas internas** con guardado local por cliente
- Badge de advertencia cuando el cliente tiene historial de no asistió.

### Perfil

- Edición de perfil personal:
  - Nombre
  - Teléfono
  - Avatar (galería)
- Email en solo lectura.
- Configuración de notificaciones (permiso real y estado visible).
- Configuración de sincronización de calendario (permiso real y estado visible).
- Sección "Mi barbería": nombre, botón **"Dejar de trabajar aquí"** (con diálogo de confirmación y gestión de turnos futuros).
- Cambio a otros roles (Cliente/Dueño).
- Opción **Cerrar sesión** con confirmación y `supabase.auth.signOut()`.

---

## Vinculación Interna Barbero‑Barbería

_La vinculación actual combina flujos internos y validación por cuenta de app._

### Método 1: Código de Invitación (inicia el Dueño)

1. Dueño (en panel "Barberos") presiona **"Generar código de invitación"**.
2. Se genera y guarda un código local en almacenamiento del dispositivo (6 caracteres, 7 días).
3. Dueño comparte el código con el barbero (WhatsApp, verbalmente, etc.).
4. Flujo de canje por parte del barbero: pendiente de integración completa contra backend.

### Método 2: Solicitud de Unión (inicia el Barbero)

1. El listado de solicitudes pendientes se gestiona localmente en el panel de Dueño.
2. Dueño **Aprueba** o **Rechaza** con motivo.
3. Si aprueba, el barbero se agrega al listado local de barberos de la barbería.

### Método 3: Alta Manual por Correo (inicia el Dueño)

1. Dueño abre **Barberos → Agregar barbero manual**.
2. Ingresa correo de cuenta (obligatorio), especialidad (obligatoria) y nombre (opcional).
3. El sistema valida formato y evita duplicados por correo.
4. Si Supabase está configurado, intenta validar que el correo pertenezca a una cuenta existente.
5. Se crea el vínculo local del barbero en la barbería y aparece en la lista activa.

---

## Persistencia del Rol Activo

- Cada cambio de rol (desde el selector en Perfil o cambio rápido en Dueño) actualiza `AsyncStorage`:
  - `active_role`: `'cliente'`, `'barbero'` o `'dueno'`.
- Al iniciar la app (post‑splash), se lee ese valor y se carga la vista correspondiente.
- Si el rol guardado ya no es válido (por ejemplo, el barbero fue eliminado), se redirige a Cliente por defecto.
- En cierre de sesión se limpia `active_role` para evitar herencia de rol entre cuentas.

---

## Consideraciones Técnicas (Supabase)

- **Auth:** manejo nativo de sesiones, verificación de email y recuperación de contraseña.
- **RLS (Row Level Security):** todas las tablas protegidas con políticas según el rol del usuario.
- **Realtime:** suscripciones a cambios en `appointments` para actualizar agendas en vivo.
- **Edge Functions:** para notificaciones push (FCM) y lógica compleja (reasignación automática, penalizaciones).
- **Storage:** buckets `avatars` y `barbershop-logos` con políticas de acceso público/privado.
- **Base de datos:** esquema completo disponible en script SQL aparte.

### Estado actual implementado (frontend cliente)

- Favoritos (barberias/barberos) actualmente se guardan en `AsyncStorage` para UX local inmediata.
- Pantallas conectadas a favoritos locales:
  - Home (barberos destacados)
  - Barberias lista
  - Barberias mapa
  - Perfil de barbero
  - Mis Favoritos
- En la siguiente etapa se puede migrar esta capa a tablas de Supabase manteniendo el mismo flujo UI.

### Estado actual implementado (frontend dueño)

- Gestión principal del rol Dueño funcional en frontend con persistencia local (`AsyncStorage`) **scopeada por usuario**.
- Módulos locales implementados:
  - Perfil de barbería propia (`owned-barbershop`).
  - Barberos e invitaciones (`owner-barbers`).
  - Agenda diaria (`owner-agenda`).
  - Servicios (`owner-services`).
  - Políticas (`owner-policies`).
  - Franjas/turnos por bloque horario (`owner-shifts`).
- Reportes con exportación PDF y compartir (`expo-print`, `expo-sharing`).
- Soporte con acciones nativas (email, WhatsApp, copiar contacto).
- Flujo de feedback visual con toasts y estados de procesamiento en pantallas clave.

### Estado actual implementado (frontend barbero)

- Agenda de barbero conectada a almacenamiento local de turnos (`owner-agenda`).
- Cambio de estados operativo: pendiente, en progreso, completado, no asistió.
- Sincronización a calendario del dispositivo con deduplicación de eventos.
- Recordatorios locales automáticos 1 hora antes según preferencia de notificaciones.
- Historial con filtros por período y métricas dinámicas del rango.
- Gestión de clientes con detalle y notas internas persistidas localmente.
- Perfil con edición de datos, avatar, preferencias y cierre de sesión real.

### Estado actual implementado (flujo y robustez)

- Capa local de datos internos (barbería propia, barberos, solicitudes e invitaciones) migrada a almacenamiento **scopeado por usuario**:
  - formato de clave: `base_key:uid:<user_id>` (con fallback por email y migración desde claves legacy).
- Resolución de roles (`hasOwnerRole` / `hasBarberRole`) alineada al mismo scope por usuario.
- Corrección de cargas asíncronas en perfiles para evitar render de datos parciales (menos flicker).
- Carga inicial y pantallas principales con skeletons para mejorar percepción de rendimiento.

---
