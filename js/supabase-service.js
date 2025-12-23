[file name]: supabase-service.js
[file content begin]
// ===================== SUPABASE SERVICE MEJORADO =====================
class SupabaseService {
  constructor(config) {
    this.config = config || window.CONFIG;
    this.supabaseUrl = this.config.supabase.url;
    this.supabaseKey = this.config.supabase.anonKey;
    this.cacheDuration = this.config.app.performance.cacheDuration * 1000;
    this.cache = new Map();
  }

  // Función para crear cliente Supabase
  async getClient() {
    // Cargar dinámicamente el cliente Supabase
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    return createClient(this.supabaseUrl, this.supabaseKey);
  }

  async getVehiculos(forceRefresh = false) {
    const cacheKey = 'vehiculos';
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData && !forceRefresh && this.isCacheValid(cachedData.timestamp)) {
      console.log('📦 Retornando vehículos desde cache');
      return cachedData.data;
    }
    
    try {
      console.log('🌐 Obteniendo vehículos desde Supabase...');
      
      const supabase = await this.getClient();
      
      // CONSULTA ACTUALIZADA CON TUS COLUMNAS REALES
      const { data, error } = await supabase
        .from('vehiculos_arica')
        .select('*')
        .order('created_at', { ascending: false })  // Cambiado a created_at
        .limit(100);
      
      if (error) {
        throw new Error(`Error Supabase: ${error.message}`);
      }
      
      console.log(`✅ ${data.length} vehículos obtenidos`);
      
      // Procesar vehículos con estructura correcta
      const vehiculosCompletos = data.map(vehiculo => 
        this.procesarVehiculo(vehiculo)
      );
      
      // Guardar en cache
      this.saveToCache(cacheKey, vehiculosCompletos);
      this.saveToLocalStorage('vehiculos', vehiculosCompletos);
      
      return vehiculosCompletos;
      
    } catch (error) {
      console.error('❌ Error obteniendo vehículos:', error);
      
      // Fallback a localStorage
      const fallbackData = this.getFromLocalStorage('vehiculos');
      if (fallbackData) {
        console.log('🔄 Usando datos de localStorage como fallback');
        return fallbackData;
      }
      
      return [];
    }
  }

  async getVehiculoById(id, forceRefresh = false) {
    const cacheKey = `vehiculo_${id}`;
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData && !forceRefresh && this.isCacheValid(cachedData.timestamp)) {
      return cachedData.data;
    }
    
    try {
      const supabase = await this.getClient();
      
      const { data, error } = await supabase
        .from('vehiculos_arica')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(`Error Supabase: ${error.message}`);
      }
      
      const vehiculoCompleto = this.procesarVehiculo(data);
      this.saveToCache(cacheKey, vehiculoCompleto);
      
      return vehiculoCompleto;
      
    } catch (error) {
      console.error(`❌ Error obteniendo vehículo ${id}:`, error);
      
      // Buscar en cache general
      const allVehicles = this.getFromCache('vehiculos')?.data || [];
      return allVehicles.find(v => v.id === id) || null;
    }
  }

  // Procesar vehículo - AJUSTADO A TU ESTRUCTURA REAL
  procesarVehiculo(vehiculo) {
    // Recoger todas las imágenes disponibles
    let imagenes = [];
    
    // Agregar todas las fotos disponibles
    if (vehiculo.foto_portada) imagenes.push(vehiculo.foto_portada);
    if (vehiculo.foto_lateral) imagenes.push(vehiculo.foto_lateral);
    if (vehiculo.foto_frontal) imagenes.push(vehiculo.foto_frontal);
    if (vehiculo.foto_trasera) imagenes.push(vehiculo.foto_trasera);
    if (vehiculo.foto_interior) imagenes.push(vehiculo.foto_interior);
    if (vehiculo.foto_motor) imagenes.push(vehiculo.foto_motor);
    
    // Si no hay imágenes, usar la default
    if (imagenes.length === 0) {
      imagenes.push(this.config.app.defaultImage);
    }
    
    // Determinar estado basado en estado_inventario
    let estado = 'stock'; // por defecto
    
    // Mapear tus estados a los del sistema
    if (vehiculo.estado_inventario) {
      const estadoInventario = vehiculo.estado_inventario.toLowerCase();
      
      if (estadoInventario.includes('disponible') || estadoInventario.includes('stock')) {
        estado = 'stock';
      } else if (estadoInventario.includes('reservado') || estadoInventario.includes('reserva')) {
        estado = 'reserved';
      } else if (estadoInventario.includes('transito') || estadoInventario.includes('tránsito')) {
        estado = 'transit';
      }
    }
    
    const estadoConfig = this.config.app.estados[estado] || this.config.app.estados.stock;
    
    // Convertir millas a kilómetros aproximadamente
    const kilometrajeKm = vehiculo.kilometraje_millas ? 
      Math.round(vehiculo.kilometraje_millas * 1.60934) : 0;
    
    // Obtener precio del kit
    const kitStandardPrecio = vehiculo.kit_standard_precio || 0;
    const kitMediumPrecio = vehiculo.kit_medium_precio || 1200000;
    const kitFullPrecio = vehiculo.kit_full_precio || 2500000;
    
    return {
      // DATOS PRINCIPALES
      id: vehiculo.id,
      codigo_interno: vehiculo.codigo_interno || '',
      nombre: vehiculo.nombre_publico || 'Vehículo', // COLUMNA CORRECTA
      descripcion: vehiculo.descripcion_publica || '',
      precio: vehiculo.precio_publico || 0, // COLUMNA CORRECTA
      
      // ESTADO
      estado: estado,
      estadoTexto: estadoConfig.texto,
      estadoColor: estadoConfig.color,
      estadoIcono: estadoConfig.icono,
      estado_inventario: vehiculo.estado_inventario,
      
      // IMÁGENES
      imagenes: imagenes,
      imagen_principal: imagenes[0] || this.config.app.defaultImage,
      comparacion_standard: vehiculo.comparacion_standard,
      comparacion_medium: vehiculo.comparacion_medium,
      comparacion_full: vehiculo.comparacion_full,
      
      // ESPECIFICACIONES
      ano: vehiculo.ano || null,
      color: vehiculo.color_exterior || null,
      motor: vehiculo.motor || null,
      kilometraje: kilometrajeKm, // Convertido a km
      kilometraje_millas: vehiculo.kilometraje_millas || 0,
      marca: vehiculo.marca || null,
      modelo: vehiculo.modelo || null,
      transmision: vehiculo.transmision || null,
      tipo_vehiculo: vehiculo.tipo_vehiculo || 'pickup',
      
      // KITS
      kit_standard_precio: kitStandardPrecio,
      kit_medium_precio: kitMediumPrecio,
      kit_full_precio: kitFullPrecio,
      
      // TAGS Y METADATA
      tags: vehiculo.tags || [],
      proveedor: vehiculo.proveedor || null,
      costo_real: vehiculo.costo_real || 0,
      
      // STATS
      contador_vistas: vehiculo.contador_vistas || 0,
      contador_whatsapp: vehiculo.contador_whatsapp || 0,
      fecha_ultima_vista: vehiculo.fecha_ultima_vista,
      
      // TIMESTAMPS
      created_at: vehiculo.created_at,
      updated_at: vehiculo.updated_at,
      orden: 1 // Valor por defecto
    };
  }
  
  // Cache management
  getFromCache(key) {
    return this.cache.get(key);
  }
  
  saveToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  isCacheValid(timestamp) {
    return Date.now() - timestamp < this.cacheDuration;
  }
  
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
  
  // LocalStorage management
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(
        this.config.storageKeys[key] || key,
        JSON.stringify({
          data,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error('❌ Error guardando en localStorage:', error);
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
      console.error('❌ Error obteniendo de localStorage:', error);
    }
    return null;
  }
  
  // Método para probar conexión
  async testConnection() {
    try {
      const url = `${this.config.supabase.url}${this.config.supabase.endpoints.vehiculos}?select=id&limit=1`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.supabase.anonKey,
          'Authorization': `Bearer ${this.config.supabase.anonKey}`
        }
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }
  
  // Método para obtener estadísticas
  async getStats() {
    try {
      const supabase = await this.getClient();
      
      const { data, error } = await supabase
        .from('vehiculos_arica')
        .select('estado_inventario');
      
      if (error) {
        throw new Error(`Error Supabase: ${error.message}`);
      }
      
      const stats = {
        total: data.length,
        stock: 0,
        transit: 0,
        reserved: 0
      };
      
      data.forEach(v => {
        const estado = v.estado_inventario?.toLowerCase() || '';
        
        if (estado.includes('disponible') || estado.includes('stock')) {
          stats.stock++;
        } else if (estado.includes('transito') || estado.includes('tránsito')) {
          stats.transit++;
        } else if (estado.includes('reservado') || estado.includes('reserva')) {
          stats.reserved++;
        }
      });
      
      return stats;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }
}

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SupabaseService;
} else {
  // Hacer disponible globalmente
  window.SupabaseService = SupabaseService;
}
[file content end]
