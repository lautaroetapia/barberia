# .github/copilot-instructions.md

## Proyecto: Navaja Dorada (Aplicación Móvil de Barbería)

### 1. Identidad y Stack Tecnológico

- **App Móvil:** React Native con **Expo SDK ~54**.
- **Lenguaje:** **TypeScript** estricto.
- **Enrutamiento:** **Expo Router** (basado en archivos, sistema de tabs).
- **Backend:** **Supabase** (Autenticación, PostgreSQL, Storage, Realtime).
- **Almacenamiento Local:** `AsyncStorage`.
- **UI:** Componentes reutilizables, Skeletons, Toasts.

### 2. Arquitectura y Reglas de Negocio Clave

- **Roles de Usuario:** `'cliente' | 'barbero' | 'dueno'`.
- **Flujo de Autenticación:**
  - Verificar sesión en `Splash` -> Recuperar `active_role` de `AsyncStorage` -> Redirigir al Home del rol correspondiente.
  - Los usuarios **deben verificar su email** antes de iniciar sesión (manejado por Supabase).
  - Al registrarse/login, si no tiene `full_name` en `profiles`, mostrar modal "¿Cómo te llamas?".
- **Persistencia de Rol:**
  - Guardar siempre `active_role` en `AsyncStorage` al cambiar de rol (desde Perfil o cambio rápido).
  - Al cerrar sesión, limpiar `active_role`.
  - Si el rol guardado ya no es válido, redirigir a **Cliente** por defecto.
- **Estructura de Datos Local (Scope por usuario):**
  - Las claves en `AsyncStorage` deben seguir el formato `base_key:uid:<user_id>` para evitar cruce de datos entre cuentas.
  - Ejemplo: `owner-barbershop:uid:abc-123`.

### 3. Patrones de Código y Convenciones

- **Navegación:**
  - Usar `expo-router` para la navegación.
  - `useRouter()` para redirecciones programáticas.
  - `useLocalSearchParams()` para recibir parámetros (ej. `barberId`, `shopId`).
- **Supabase Client:**
  - Instancia centralizada en `lib/supabase.ts`.
  - Manejar sesiones con `supabase.auth.getSession()` y `onAuthStateChange`.
- **Manejo de Estado:**
  - Para estado local de UI: `useState`, `useEffect`.
  - Para datos globales (usuario, rol): Context API o combinación con `AsyncStorage`.
- **Formularios:**
  - Validar emails, contraseñas (fortaleza), y campos obligatorios.
  - Checkbox "Acepto términos" obligatorio para registro.
- **Feedback al Usuario:**
  - Usar Toasts para acciones exitosas o errores (ej. "Turno cancelado", "Error al guardar").
  - Usar Skeletons mientras se cargan datos asíncronos (ej. pantalla de inicio, dashboard).

### 4. Reglas Específicas por Rol/Flujo

#### Cliente
- **Bottom Navigation:** Inicio, Barberías, Mis Turnos, Perfil.
- **Reserva por Pasos:** Barbería -> Servicio -> Barbero -> Horario -> Confirmar.
  - En el paso 4 (Horario), implementar **bloqueo temporal de 10 minutos** al seleccionar un slot.
  - Mostrar política de cancelación (`free_cancellation_hours` de la barbería) en el paso 5.
- **Favoritos:**
  - Guardar localmente en `AsyncStorage` por ahora (UX inmediata).
  - Icono de corazón en: Home (barberos destacados), lista de Barberías, Mapa, y pantalla "Mis Favoritos".
- **Cancelación:**
  - Consultar `free_cancellation_hours` de la barbería.
  - Si faltan menos horas que el umbral -> Informar "puede aplicar cargo".
  - Si está fuera de la ventana -> Informar "cancelación sin cargo".

#### Dueño (Barbería)
- **Bottom Navigation:** Dashboard, Agenda, Barberos, Servicios, Más.
- **Agenda:** Vista diaria, crear/manejar turnos manualmente.
- **Barberos:**
  - Generar código de invitación (6 caracteres, expira 7 días).
  - Agregar barbero manual por correo (validar duplicados).
  - Aprobar/Rechazar solicitudes pendientes.
- **Servicios:** CRUD (nombre, precio, duración, destacado). Activar/desactivar.
- **Reportes:** Exportar a PDF con `expo-print` y compartir con `expo-sharing`.

#### Barbero
- **Bottom Navigation:** Mi Agenda, Historial, Clientes, Perfil.
- **Mi Agenda:**
  - Timeline del día.
  - Acciones: Iniciar, Completar, No asistió.
  - Botón flotante `+` para agendado rápido (seleccionar servicio -> horario libre).
  - Botón "Sincronizar a calendario" (permisos, crear calendario "Navaja Dorada", deduplicar eventos).
  - Recordatorios locales automáticos 1 hora antes (si notificaciones activadas).
- **Historial:** Filtros por rango (Hoy/Semana/Mes/Todo), resumen de ingresos.
- **Clientes:** Lista de clientes frecuentes, modal con detalle (última visita, total visitas, no-show, notas internas).

### 5. Consideraciones Técnicas de Supabase (RLS y SQL)

- **Políticas RLS:** Todas las tablas protegidas por RLS. Asegurarse de que las consultas respeten el rol del usuario.
  - `profiles`: Lectura pública, escritura solo para el propio usuario.
  - `appointments`: Cliente o Dueño pueden leer/escribir según su ID/owner_id.
  - `services`: Lectura pública, escritura solo para el dueño de la barbería.
- **Funciones SQL importantes:**
  - `guard_appointments()`: Previene doble reserva, valida horarios (bloques de 30 min), y restringe un turno activo por cliente.
  - `handle_new_user()`: Crea automáticamente un registro en `profiles` al registrarse.
- **Buckets Storage:**
  - `avatars`: Público para lectura, usuarios autenticados pueden subir/actualizar/eliminar su propio avatar.
  - Ruta de archivo debe incluir el `userId` como carpeta.

### 6. Patrones de UI/UX a Seguir

- **Pantallas principales:** Usar `ScrollView` para contenido largo, `FlatList` para listas.
- **Headers:** Incluir título y botones de acción (Notificaciones, Favoritos) cuando aplique.
- **Estados Vacíos:** Mostrar mensajes amigables y sugerencias (ej. "No tienes turnos activos. ¿Quieres reservar uno?").
- **Modales:** Usar para confirmaciones (ej. cancelar turno, cerrar sesión) o acciones rápidas (agregar nota a cliente).
- **Navegación entre roles:** Desde "Perfil" -> Selector de roles, o botón "Cambiar a vista Barbero" desde el panel de Dueño.

### 7. Ejemplos de Consultas Comunes a Copilot

- "Genérame el componente de la tarjeta de `Barberia` para la lista, que incluya nombre, dirección, rating y un icono de favorito."
- "Crea la pantalla `MisTurnos` con pestañas (Activos/Historial) y una FlatList que muestre los turnos desde Supabase."
- "Implementa la lógica de cancelación de turno que verifique `free_cancellation_hours` y muestre el mensaje adecuado."
- "Escribe la función para sincronizar los turnos del barbero con el calendario del dispositivo usando `expo-calendar`."
- "Dame el código SQL para crear una política RLS que permita a un barbero ver solo sus propios turnos en la tabla `appointments`."
- "Crea un hook personalizado `useActiveRole` que gestione la lectura/escritura del rol activo en `AsyncStorage`."

### 8. Archivos Clave para Contexto

- `app/`: Contiene todas las rutas y pantallas de la aplicación.
- `lib/supabase.ts`: Cliente de Supabase.
- `constants/`: Constantes del flujo de reserva (pasos, tiempos, etc.).
- `components/`: Componentes reutilizables (Toast, Skeletons, Cards, etc.).
- `supabase/manual-sql.sql`: Esquema completo de la base de datos (para referencia).

### 9. Reglas Negativas (Qué NO hacer)

- No asumas que el backend ya tiene implementada la lógica de notificaciones push (está planeada para Edge Functions).
- No uses `any` en TypeScript. Define interfaces o types explícitos (ej. `Profile`, `Appointment`, `Barbershop`).
- No guardes información sensible (como tokens de Supabase) en `AsyncStorage` sin cifrar.
- No omitas el manejo de errores en llamadas a Supabase (siempre usar `try/catch` o `.catch()`).
- No mezcles la lógica de UI con la lógica de negocio; extrae la lógica a hooks o archivos en `lib/`.