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
      
      const { data, error } = await supabase
        .from('vehiculos_arica')
        .select('*')
        .order('orden', { ascending: true })
        .limit(100);
      
      if (error) {
        throw new Error(`Error Supabase: ${error.message}`);
      }
      
      console.log(`✅ ${data.length} vehículos obtenidos`);
      
      // Procesar vehículos
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

  // Procesar vehículo - ajustado para tu estructura
  procesarVehiculo(vehiculo) {
    // Extraer imágenes del campo images si existe
    let imagenes = [];
    if (vehiculo.images) {
      try {
        imagenes = JSON.parse(vehiculo.images);
      } catch (e) {
        imagenes = [vehiculo.images];
      }
    }
    
    // Determinar estado basado en tus campos
    let estado = 'stock';
    if (vehiculo.disponibilidad) {
      const disp = vehiculo.disponibilidad.toLowerCase();
      if (disp.includes('transito') || disp.includes('tránsito')) estado = 'transit';
      if (disp.includes('reserva')) estado = 'reserved';
    }
    
    const estadoConfig = this.config.app.estados[estado] || this.config.app.estados.stock;
    
    return {
      id: vehiculo.id || vehiculo.codigo,
      nombre: vehiculo.nombre || vehiculo.titulo || 'Vehículo',
      descripcion: vehiculo.descripcion || vehiculo.detalles || 'Vehículo americano importado',
      precio: vehiculo.precio || vehiculo.valor || 0,
      estado: estado,
      estadoTexto: estadoConfig.texto,
      estadoColor: estadoConfig.color,
      estadoIcono: estadoConfig.icono,
      imagenes: imagenes,
      imagen_principal: imagenes[0] || vehiculo.imagen_principal || this.config.app.defaultImage,
      ano: vehiculo.ano || vehiculo.año || null,
      color: vehiculo.color || null,
      motor: vehiculo.motor || null,
      kilometraje: vehiculo.kilometraje || vehiculo.kilometros || 0,
      modelo: vehiculo.modelo || null,
      marca: vehiculo.marca || null,
      transmision: vehiculo.transmision || vehiculo.caja || null,
      combustible: vehiculo.combustible || null,
      created_at: vehiculo.created_at,
      updated_at: vehiculo.updated_at,
      orden: vehiculo.orden || 999
    };
  }
  
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
      const url = `${this.config.supabase.url}${this.config.supabase.endpoints.vehiculos}?select=estado`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.supabase.anonKey,
          'Authorization': `Bearer ${this.config.supabase.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const vehiculos = await response.json();
      const total = response.headers.get('content-range')?.split('/')[1] || vehiculos.length;
      
      const stats = {
        total: parseInt(total),
        stock: 0,
        transit: 0,
        reserved: 0
      };
      
      vehiculos.forEach(v => {
        if (stats[v.estado] !== undefined) {
          stats[v.estado]++;
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
