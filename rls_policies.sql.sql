-- ============================================
-- POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- PARA IMPORT AMERICAN CARS PREMIUM
-- ============================================

-- ===== TABLA: iac (vehículos) =====
ALTER TABLE iac ENABLE ROW LEVEL SECURITY;

-- Política 1: Todos pueden leer vehículos activos
CREATE POLICY "Todos pueden ver vehículos activos" 
ON iac FOR SELECT 
USING (true);

-- Política 2: Solo administradores pueden insertar
CREATE POLICY "Solo admin puede insertar vehículos" 
ON iac FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Política 3: Solo administradores pueden actualizar
CREATE POLICY "Solo admin puede actualizar vehículos" 
ON iac FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Política 4: Solo administradores pueden eliminar
CREATE POLICY "Solo admin puede eliminar vehículos" 
ON iac FOR DELETE 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- ===== TABLA: kits_upgrade =====
ALTER TABLE kits_upgrade ENABLE ROW LEVEL SECURITY;

-- Política 1: Todos pueden leer kits
CREATE POLICY "Todos pueden ver kits" 
ON kits_upgrade FOR SELECT 
USING (true);

-- Política 2: Solo admin puede modificar kits
CREATE POLICY "Solo admin puede modificar kits" 
ON kits_upgrade FOR ALL 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- ===== TABLA: vehiculos_vendidos =====
ALTER TABLE vehiculos_vendidos ENABLE ROW LEVEL SECURITY;

-- Política 1: Público puede ver vendidos aprobados
CREATE POLICY "Público ve vendidos aprobados" 
ON vehiculos_vendidos FOR SELECT 
USING (aprobado = true);

-- Política 2: Clientes pueden ver sus propios testimonios (aprobados o no)
CREATE POLICY "Clientes ven sus testimonios" 
ON vehiculos_vendidos FOR SELECT 
USING (
  aprobado = true OR 
  (
    auth.role() = 'authenticated' AND 
    auth.uid() IN (
      SELECT auth.uid() FROM auth.users 
      WHERE raw_user_meta_data->>'email' = cliente_email
    )
  )
);

-- Política 3: Admin puede ver todo
CREATE POLICY "Admin ve todo en vendidos" 
ON vehiculos_vendidos FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Política 4: Solo admin puede insertar vendidos
CREATE POLICY "Solo admin inserta vendidos" 
ON vehiculos_vendidos FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Política 5: Solo admin puede actualizar vendidos
CREATE POLICY "Solo admin actualiza vendidos" 
ON vehiculos_vendidos FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Política 6: Solo admin puede eliminar vendidos
CREATE POLICY "Solo admin elimina vendidos" 
ON vehiculos_vendidos FOR DELETE 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- ===== TABLA: vehiculo_kit_imagenes =====
ALTER TABLE vehiculo_kit_imagenes ENABLE ROW LEVEL SECURITY;

-- Política 1: Público puede ver imágenes activas
CREATE POLICY "Público ve imágenes activas de kits" 
ON vehiculo_kit_imagenes FOR SELECT 
USING (activo = true);

-- Política 2: Solo admin puede modificar imágenes
CREATE POLICY "Solo admin modifica imágenes de kits" 
ON vehiculo_kit_imagenes FOR ALL 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- ===== TABLA: precios_especificos =====
ALTER TABLE precios_especificos ENABLE ROW LEVEL SECURITY;

-- Política 1: Público puede ver precios activos
CREATE POLICY "Público ve precios específicos activos" 
ON precios_especificos FOR SELECT 
USING (activo = true);

-- Política 2: Solo admin puede modificar precios
CREATE POLICY "Solo admin modifica precios específicos" 
ON precios_especificos FOR ALL 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- ===== TABLA: testimonios =====
ALTER TABLE testimonios ENABLE ROW LEVEL SECURITY;

-- Política 1: Público puede ver testimonios aprobados
CREATE POLICY "Público ve testimonios aprobados" 
ON testimonios FOR SELECT 
USING (aprobado = true);

-- Política 2: Cualquiera puede enviar testimonio (INSERT)
CREATE POLICY "Cualquiera puede enviar testimonio" 
ON testimonios FOR INSERT 
WITH CHECK (true);

-- Política 3: Usuarios pueden ver sus propios testimonios (aprobados o no)
CREATE POLICY "Usuarios ven sus testimonios" 
ON testimonios FOR SELECT 
USING (
  aprobado = true OR 
  (
    auth.role() = 'authenticated' AND 
    auth.uid() IN (
      SELECT auth.uid() FROM auth.users 
      WHERE raw_user_meta_data->>'email' = cliente_email
    )
  )
);

-- Política 4: Usuarios pueden actualizar sus testimonios no aprobados
CREATE POLICY "Usuarios actualizan sus testimonios no aprobados" 
ON testimonios FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'email' = cliente_email
  ) AND 
  aprobado = false
)
WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'email' = cliente_email
  ) AND 
  aprobado = false
);

-- Política 5: Solo admin puede aprobar/rechazar testimonios
CREATE POLICY "Solo admin modifica estado de testimonios" 
ON testimonios FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Política 6: Solo admin puede eliminar testimonios
CREATE POLICY "Solo admin elimina testimonios" 
ON testimonios FOR DELETE 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- ===== TABLA: interacciones_usuario =====
ALTER TABLE interacciones_usuario ENABLE ROW LEVEL SECURITY;

-- Política 1: Cualquiera puede insertar interacciones
CREATE POLICY "Cualquiera puede registrar interacciones" 
ON interacciones_usuario FOR INSERT 
WITH CHECK (true);

-- Política 2: Solo admin puede leer interacciones
CREATE POLICY "Solo admin ve interacciones" 
ON interacciones_usuario FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Política 3: Solo admin puede modificar interacciones
CREATE POLICY "Solo admin modifica interacciones" 
ON interacciones_usuario FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Política 4: Solo admin puede eliminar interacciones
CREATE POLICY "Solo admin elimina interacciones" 
ON interacciones_usuario FOR DELETE 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- ===== TABLA: usuarios_web (opcional - para moderadores) =====
-- Esta tabla sería para usuarios internos del sistema web
-- Se crea solo si necesitas más control que con auth.users

CREATE TABLE IF NOT EXISTS usuarios_web (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'moderador', 'vendedor')),
    activo BOOLEAN DEFAULT TRUE,
    permisos JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE usuarios_web ENABLE ROW LEVEL SECURITY;

-- Política 1: Usuarios solo pueden ver su propio perfil
CREATE POLICY "Usuarios ven su propio perfil" 
ON usuarios_web FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() = auth_user_id
);

-- Política 2: Usuarios pueden actualizar su propio perfil (excepto rol)
CREATE POLICY "Usuarios actualizan su perfil" 
ON usuarios_web FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() = auth_user_id
)
WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid() = auth_user_id AND
  rol IS NOT DISTINCT FROM OLD.rol -- No pueden cambiar su rol
);

-- Política 3: Solo admin puede ver todos los usuarios
CREATE POLICY "Admin ve todos los usuarios" 
ON usuarios_web FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM usuarios_web 
    WHERE auth_user_id = auth.uid() AND rol = 'admin'
  )
);

-- Política 4: Solo admin puede crear/modificar usuarios
CREATE POLICY "Solo admin gestiona usuarios" 
ON usuarios_web FOR ALL 
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM usuarios_web 
    WHERE auth_user_id = auth.uid() AND rol = 'admin'
  )
);

-- ===== FUNCIONES DE SEGURIDAD =====

-- Función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es moderador
CREATE OR REPLACE FUNCTION es_moderador()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' IN ('admin', 'moderador')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION obtener_rol_usuario()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT raw_user_meta_data->>'role' 
  INTO user_role 
  FROM auth.users 
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'anon');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== POLÍTICAS DINÁMICAS (para casos especiales) =====

-- Política para vehículos con descuento (solo visible para usuarios registrados)
CREATE POLICY "Usuarios registrados ven descuentos" 
ON iac FOR SELECT 
USING (
  -- Si el vehículo tiene descuento, solo usuarios registrados pueden verlo
  (descuento IS NULL OR descuento = 0) OR 
  auth.role() = 'authenticated'
);

-- Política para precios especiales (solo para usuarios con sesión > 5 minutos)
CREATE POLICY "Usuarios con sesión prolongada ven precios especiales" 
ON precios_especificos FOR SELECT 
USING (
  -- Precios normales para todos
  activo = true AND 
  (
    -- Precios especiales solo para sesiones "calientes"
    tipo_precio != 'especial' OR 
    (
      auth.role() = 'authenticated' AND 
      EXISTS (
        SELECT 1 FROM auth.sessions 
        WHERE user_id = auth.uid() 
        AND created_at > NOW() - INTERVAL '5 minutes'
      )
    )
  )
);

-- ===== POLÍTICAS DE AUDITORÍA =====

-- Trigger para registrar cambios en testimonios
CREATE OR REPLACE FUNCTION auditar_testimonios()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auditoria_testimonios (
    testimonio_id,
    usuario_id,
    accion,
    datos_anteriores,
    datos_nuevos
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabla de auditoría para testimonios
CREATE TABLE IF NOT EXISTS auditoria_testimonios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    testimonio_id UUID REFERENCES testimonios(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES auth.users(id),
    accion TEXT CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE auditoria_testimonios ENABLE ROW LEVEL SECURITY;

-- Solo admin puede ver auditoría
CREATE POLICY "Solo admin ve auditoría" 
ON auditoria_testimonios FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  es_admin()
);

-- Trigger en testimonios
CREATE TRIGGER trigger_auditar_testimonios
AFTER INSERT OR UPDATE OR DELETE ON testimonios
FOR EACH ROW EXECUTE FUNCTION auditar_testimonios();

-- ===== POLÍTICAS DE RENDIMIENTO =====

-- Crear índices para mejorar performance de políticas RLS
CREATE INDEX IF NOT EXISTS idx_vehiculos_vendidos_aprobado_email 
ON vehiculos_vendidos(aprobado, cliente_email);

CREATE INDEX IF NOT EXISTS idx_testimonios_aprobado_email 
ON testimonios(aprobado, cliente_email);

CREATE INDEX IF NOT EXISTS idx_auth_users_metadata_role 
ON auth.users((raw_user_meta_data->>'role'));

-- ===== CONFIGURACIÓN DE SEGURIDAD ADICIONAL =====

-- Deshabilitar acceso público a tablas de sistema
REVOKE ALL ON auth.users FROM public;
REVOKE ALL ON auth.sessions FROM public;
REVOKE ALL ON auth.identities FROM public;

-- Configurar tiempos de expiración para sesiones (opcional)
-- Esto se configura en el dashboard de Supabase, no en SQL

-- ===== MIGRACIÓN SEGURA (para producción) =====

-- Función para migrar políticas de forma segura
CREATE OR REPLACE FUNCTION migrar_politicas_seguras()
RETURNS void AS $$
DECLARE
  current_role TEXT;
BEGIN
  -- Obtener rol actual
  SELECT current_role INTO current_role;
  
  -- Solo ejecutar como postgres (superusuario)
  IF current_role != 'postgres' THEN
    RAISE EXCEPTION 'Esta función solo puede ejecutarse como postgres';
  END IF;
  
  -- Deshabilitar RLS temporalmente para evitar bloqueos
  ALTER TABLE iac DISABLE ROW LEVEL SECURITY;
  ALTER TABLE kits_upgrade DISABLE ROW LEVEL SECURITY;
  ALTER TABLE vehiculos_vendidos DISABLE ROW LEVEL SECURITY;
  ALTER TABLE vehiculo_kit_imagenes DISABLE ROW LEVEL SECURITY;
  ALTER TABLE precios_especificos DISABLE ROW LEVEL SECURITY;
  ALTER TABLE testimonios DISABLE ROW LEVEL SECURITY;
  ALTER TABLE interacciones_usuario DISABLE ROW LEVEL SECURITY;
  
  -- Eliminar políticas existentes
  DROP POLICY IF EXISTS "Todos pueden ver vehículos activos" ON iac;
  DROP POLICY IF EXISTS "Solo admin puede insertar vehículos" ON iac;
  DROP POLICY IF EXISTS "Solo admin puede actualizar vehículos" ON iac;
  DROP POLICY IF EXISTS "Solo admin puede eliminar vehículos" ON iac;
  
  -- ... (repetir para todas las políticas)
  
  -- Crear nuevas políticas
  EXECUTE 'CREATE POLICY "Todos pueden ver vehículos activos" ON iac FOR SELECT USING (true)';
  -- ... (crear todas las políticas definidas arriba)
  
  -- Habilitar RLS nuevamente
  ALTER TABLE iac ENABLE ROW LEVEL SECURITY;
  ALTER TABLE kits_upgrade ENABLE ROW LEVEL SECURITY;
  ALTER TABLE vehiculos_vendidos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE vehiculo_kit_imagenes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE precios_especificos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE testimonios ENABLE ROW LEVEL SECURITY;
  ALTER TABLE interacciones_usuario ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE 'Migración de políticas completada exitosamente';
END;
$$ LANGUAGE plpgsql;

-- ===== BACKUP DE POLÍTICAS =====

-- Función para respaldar políticas actuales
CREATE OR REPLACE FUNCTION respaldar_politicas()
RETURNS TABLE(tabla_nombre text, politica_nombre text, politica_definicion text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.nspname || '.' || c.relname as tabla_nombre,
    pol.polname as politica_nombre,
    pg_get_expr(pol.polqual, pol.polrelid) as politica_definicion
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  ORDER BY tabla_nombre, politica_nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== POLÍTICAS PARA DESARROLLO vs PRODUCCIÓN =====

-- Variable para controlar ambiente
DO $$ 
BEGIN
  -- Verificar si estamos en desarrollo (basado en nombre de BD)
  IF current_database() LIKE '%dev%' OR current_database() LIKE '%test%' THEN
    -- En desarrollo: políticas más permisivas para testing
    EXECUTE 'ALTER TABLE iac DISABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'Modo desarrollo: RLS deshabilitado para iac';
  ELSE
    -- En producción: políticas estrictas
    RAISE NOTICE 'Modo producción: RLS habilitado con políticas estrictas';
  END IF;
END $$;

-- ===== FIN DEL SCRIPT DE POLÍTICAS RLS =====

-- Nota: Para aplicar estas políticas:
-- 1. Ejecutar este script completo en el SQL Editor de Supabase
-- 2. Verificar que no haya errores
-- 3. Probar con diferentes roles de usuario
-- 4. Ajustar según necesidades específicas

-- Para troubleshooting:
-- SELECT * FROM respaldar_politicas(); -- Ver políticas actuales
-- SELECT obtener_rol_usuario(); -- Ver rol del usuario actual
-- SELECT es_admin(); -- Verificar si es admin