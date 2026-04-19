# Ejecución por bloques para Supabase

No uses **EXPLAIN** sobre el archivo completo. Ese comando solo acepta una sentencia SQL a la vez.

## Orden recomendado

1. Extensiones y funciones base
   - `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
   - `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`
   - `CREATE OR REPLACE FUNCTION public.handle_updated_at() ...`

2. Tablas
   - Ejecuta el bloque completo de creación de tablas de `profiles` hasta `owner_shift_preferences`.

3. Políticas RLS
   - Primero los `DROP POLICY IF EXISTS ...`
   - Después los `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
   - Luego cada `CREATE POLICY ...`

4. Triggers
   - Ejecuta los `DROP TRIGGER IF EXISTS ...`
   - Luego los `CREATE TRIGGER ...`

5. Funciones auxiliares
   - `handle_new_user`
   - `accept_invitation_by_code`
   - `clean_expired_locks`

6. Vista e índices
   - `CREATE OR REPLACE VIEW public.user_roles AS ...`
   - `CREATE INDEX IF NOT EXISTS ...`

## Cómo correrlo sin errores

- Selecciona una sola sentencia cuando uses **Explain**.
- Si vas a ejecutar el archivo, hazlo por bloques, no todo junto en Explain.
- Si una sentencia ya existe, deja que el script idempotente la reutilice.

## Bloques seguros para pegar

### Bloque 1

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Bloque 2

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Bloque 3

- Tabla por tabla, en el orden del archivo.

### Bloque 4

- Políticas RLS.

### Bloque 5

- Triggers.

### Bloque 6

- Vista, funciones y permisos.

### Bloque 7

- Índices.

Si quieres, en el siguiente paso te lo separo en 5 archivos `.sql` reales para ejecutar uno por uno desde Supabase sin seleccionar nada manualmente.
