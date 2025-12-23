// supabase-service.js - VERSIÓN SIMPLIFICADA Y CORREGIDA

// ===================== SUPABASE SERVICE =====================
class SupabaseService {
  constructor(config) {
    this.config = config || window.CONFIG;
    this.supabaseUrl = this.config.supabase.url;
    this.supabaseKey = this.config.supabase.anonKey;
    this.cacheDuration = 3600000; // 1 hora
    this.cache = new Map();
  }

  // Crear cliente Supabase
  async getClient() {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    return createClient(this.supabaseUrl, this.supabaseKey);
  }

  // Obtener vehículos
  async getVehiculos(forceRefresh = false) {
    const cacheKey = 'vehiculos';
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData && !forceRefresh && this.isCacheValid(cachedData.timestamp)) {
      console.log('📦 Vehículos desde cache');
      return cachedData.data;
    }
    
    try {
      console.log('🌐 Obteniendo vehículos...');
      
      const supabase = await this.getClient();
      
      const { data, error } = await supabase
        .from('vehiculos_arica')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw new Error(`Supabase: ${error.message}`);
      
      console.log(`✅ ${data.length} vehículos obtenidos`);
      
      const vehiculosCompletos = data.map(v => this.procesarVehiculo(v));
      
      this.saveToCache(cacheKey, vehiculosCompletos);
      this.saveToLocalStorage('vehiculos', vehiculosCompletos);
      
      return vehiculosCompletos;
      
    } catch (error) {
      console.error('❌ Error:', error);
      
      // Fallback a localStorage
      const fallback = this.getFromLocalStorage('vehiculos');
      if (fallback) {
        console.log('🔄 Usando datos locales');
        return fallback;
      }
      
      return [];
    }
  }

  // Procesar vehículo
  procesarVehiculo(vehiculo) {
    // Recoger imágenes
    let imagenes = [];
    if (vehiculo.foto_portada) imagenes.push(vehiculo.foto_portada);
    if (vehiculo.foto_lateral) imagenes.push(vehiculo.foto_lateral);
    if (vehiculo.foto_frontal) imagenes.push(vehiculo.foto_frontal);
    if (vehiculo.foto_trasera) imagenes.push(vehiculo.foto_trasera);
    if (vehiculo.foto_interior) imagenes.push(vehiculo.foto_interior);
    if (vehiculo.foto_motor) imagenes.push(vehiculo.foto_motor);
    
    if (imagenes.length === 0) {
      imagenes.push(this.config.app.defaultImage);
    }
    
    // Determinar estado
    let estado = 'stock';
    if (vehiculo.estado_inventario) {
      const estadoInventario = vehiculo.estado_inventario.toLowerCase();
      if (estadoInventario.includes('disponible') || estadoInventario.includes('stock')) estado = 'stock';
      else if (estadoInventario.includes('reservado')) estado = 'reserved';
      else if (estadoInventario.includes('transito')) estado = 'transit';
    }
    
    const estadoConfig = this.config.app.estados[estado] || this.config.app.estados.stock;
    
    // Convertir millas a km
    const kilometrajeKm = vehiculo.kilometraje_millas ? 
      Math.round(vehiculo.kilometraje_millas * 1.60934) : 0;
    
    return {
      id: vehiculo.id,
      codigo_interno: vehiculo.codigo_interno || '',
      nombre: vehiculo.nombre_publico || 'Vehículo',
      descripcion: vehiculo.descripcion_publica || '',
      precio: vehiculo.precio_publico || 0,
      estado: estado,
      estadoTexto: estadoConfig.texto,
      estadoColor: estadoConfig.color,
      estadoIcono: estadoConfig.icono,
      estado_inventario: vehiculo.estado_inventario,
      imagenes: imagenes,
      imagen_principal: imagenes[0],
      ano: vehiculo.ano || null,
      color: vehiculo.color_exterior || null,
      motor: vehiculo.motor || null,
      kilometraje: kilometrajeKm,
      kilometraje_millas: vehiculo.kilometraje_millas || 0,
      marca: vehiculo.marca || null,
      modelo: vehiculo.modelo || null,
      transmision: vehiculo.transmision || null,
      tipo_vehiculo: vehiculo.tipo_vehiculo || 'pickup',
      kit_standard_precio: vehiculo.kit_standard_precio || 0,
      kit_medium_precio: vehiculo.kit_medium_precio || 1200000,
      kit_full_precio: vehiculo.kit_full_precio || 2500000,
      tags: vehiculo.tags || [],
      created_at: vehiculo.created_at
    };
  }

  // Obtener kits
  async getKits(forceRefresh = false) {
    try {
      // Obtener vehículos para actualizar precios
      const vehiculos = await this.getVehiculos(forceRefresh);
      
      // Kits por defecto
      let kits = [...this.config.app.kitsDefault];
      
      if (vehiculos.length > 0) {
        const vehiculoRef = vehiculos[0];
        kits = kits.map(kit => {
          const kitActualizado = { ...kit };
          if (kit.id === 'medium' && vehiculoRef.kit_medium_precio) {
            kitActualizado.precio = vehiculoRef.kit_medium_precio;
          } else if (kit.id === 'full' && vehiculoRef.kit_full_precio) {
            kitActualizado.precio = vehiculoRef.kit_full_precio;
          }
          return kitActualizado;
        });
      }
      
      return kits;
      
    } catch (error) {
      console.error('❌ Error kits:', error);
      return this.config.app.kitsDefault;
    }
  }

  // Cache methods
  getFromCache(key) {
    return this.cache.get(key);
  }
  
  saveToCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  
  isCacheValid(timestamp) {
    return Date.now() - timestamp < this.cacheDuration;
  }
  
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(
        this.config.storageKeys[key] || key,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (error) {
      console.error('❌ Error localStorage:', error);
    }
  }
  
  getFromLocalStorage(key) {
    try {
      const item = localStorage.getItem(this.config.storageKeys[key] || key);
      if (item) {
        const parsed = JSON.parse(item);
        if (this.isCacheValid(parsed.timestamp)) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.error('❌ Error localStorage:', error);
    }
    return null;
  }
}

// Hacer disponible globalmente
window.SupabaseService = SupabaseService;
