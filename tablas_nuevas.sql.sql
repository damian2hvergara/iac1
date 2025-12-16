-- ============================================
-- TABLAS NUEVAS PARA SHOWROOM PREMIUM
-- ============================================

-- 1. TABLA: vehiculos_vendidos (Testimonios)
CREATE TABLE vehiculos_vendidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehiculo_id UUID REFERENCES iac(id) ON DELETE CASCADE,
    fecha_venta DATE NOT NULL DEFAULT CURRENT_DATE,
    cliente_nombre TEXT NOT NULL,
    cliente_ciudad TEXT,
    testimonio TEXT NOT NULL,
    calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
    kit_instalado TEXT,
    fotos_post_venta TEXT[] DEFAULT '{}',
    video_url TEXT,
    aprobado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Índices para mejor performance
CREATE INDEX idx_vehiculos_vendidos_aprobado ON vehiculos_vendidos(aprobado);
CREATE INDEX idx_vehiculos_vendidos_fecha ON vehiculos_vendidos(fecha_venta DESC);

-- 2. TABLA: vehiculo_kit_imagenes (Imágenes específicas por kit)
CREATE TABLE vehiculo_kit_imagenes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehiculo_id UUID REFERENCES iac(id) ON DELETE CASCADE,
    kit_id TEXT REFERENCES kits_upgrade(id) ON DELETE CASCADE,
    imagen_url TEXT NOT NULL,
    tipo_visualizacion TEXT DEFAULT 'standard', -- standard, before_after, overlay
    orden INTEGER DEFAULT 0,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Índice compuesto para búsquedas rápidas
CREATE INDEX idx_vehiculo_kit ON vehiculo_kit_imagenes(vehiculo_id, kit_id);

-- 3. TABLA: precios_especificos (Override de precios)
CREATE TABLE precios_especificos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehiculo_id UUID REFERENCES iac(id) ON DELETE CASCADE,
    kit_id TEXT REFERENCES kits_upgrade(id) ON DELETE CASCADE,
    precio INTEGER NOT NULL CHECK (precio >= 0),
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(vehiculo_id, kit_id)
);

-- 4. TABLA: testimonios (Sistema de moderación)
CREATE TABLE testimonios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_nombre TEXT NOT NULL,
    cliente_email TEXT,
    cliente_telefono TEXT,
    mensaje TEXT NOT NULL,
    calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
    aprobado BOOLEAN DEFAULT FALSE,
    moderador_notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. TABLA: interacciones_usuario (Analytics)
CREATE TABLE interacciones_usuario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    tipo_evento TEXT NOT NULL, -- view_vehicle, compare_kit, whatsapp_click, etc.
    vehiculo_id UUID REFERENCES iac(id),
    kit_id TEXT REFERENCES kits_upgrade(id),
    datos JSONB DEFAULT '{}',
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vehiculos_vendidos_updated_at 
    BEFORE UPDATE ON vehiculos_vendidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (Row Level Security)
ALTER TABLE vehiculos_vendidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculo_kit_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE precios_especificos ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonios ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas de solo lectura públicas
CREATE POLICY "Public can view approved sold vehicles" 
    ON vehiculos_vendidos FOR SELECT 
    USING (aprobado = true);

CREATE POLICY "Public can view active kit images" 
    ON vehiculo_kit_imagenes FOR SELECT 
    USING (activo = true);

CREATE POLICY "Public can view active specific prices" 
    ON precios_especificos FOR SELECT 
    USING (activo = true);

CREATE POLICY "Public can view approved testimonials" 
    ON testimonios FOR SELECT 
    USING (aprobado = true);

-- Políticas de inserción pública (para formularios)
CREATE POLICY "Public can submit testimonials" 
    ON testimonios FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Public can submit interactions" 
    ON interacciones_usuario FOR INSERT 
    WITH CHECK (true);