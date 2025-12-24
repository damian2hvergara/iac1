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

  async testConnection() {
    try {
      console.log('🔌 Probando conexión con Supabase...');
      const supabase = await this.getClient();
      
      // Prueba simple de conexión
      const { data, error } = await supabase
        .from('vehiculos_arica')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      
      if (error) {
        console.error('❌ Error de conexión a Supabase:', error);
        return false;
      }
      
      console.log('✅ Conexión exitosa con Supabase');
      return true;
      
    } catch (error) {
      console.error('❌ Error en testConnection:', error);
      return false;
    }
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

  async getKits(forceRefresh = false) {
    const cacheKey = 'kits';
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData && !forceRefresh && this.isCacheValid(cachedData.timestamp)) {
      console.log('📦 Retornando kits desde cache');
      return cachedData.data;
    }
    
    try {
      console.log('🌐 Obteniendo kits desde Supabase...');
      
      // En tu caso, los kits están en la misma tabla 'vehiculos_arica'
      // pero con un tipo diferente. Ajusta esto según tu estructura real
      const supabase = await this.getClient();
      
      // Si tienes una tabla separada para kits, cambia esto
      // Por ahora, devolver los kits por defecto del config
      const kits = this.config.app.kitsDefault;
      
      // Guardar en cache
      this.saveToCache(cacheKey, kits);
      this.saveToLocalStorage('kits', kits);
      
      return kits;
      
    } catch (error) {
      console.error('❌ Error obteniendo kits:', error);
      
      // Fallback a localStorage
      const fallbackData = this.getFromLocalStorage('kits');
      if (fallbackData) {
        console.log('🔄 Usando kits de localStorage como fallback');
        return fallbackData;
      }
      
      // Último fallback: kits por defecto del config
      return this.config.app.kitsDefault;
    }
  }

  async searchVehiculos(query = '', filters = {}) {
    try {
      console.log(`🔍 Buscando vehículos: "${query}"`, filters);
      
      const supabase = await this.getClient();
      let queryBuilder = supabase
        .from('vehiculos_arica')
        .select('*');
      
      // Aplicar búsqueda por texto si existe
      if (query) {
        queryBuilder = queryBuilder.or(`nombre.ilike.%${query}%,descripcion.ilike.%${query}%,marca.ilike.%${query}%,modelo.ilike.%${query}%`);
      }
      
      // Aplicar filtros
      if (filters.estado) {
        queryBuilder = queryBuilder.eq('estado', filters.estado);
      }
      
      if (filters.marca) {
        queryBuilder = queryBuilder.eq('marca', filters.marca);
      }
      
      if (filters.minPrecio) {
        queryBuilder = queryBuilder.gte('precio', filters.minPrecio);
      }
      
      if (filters.maxPrecio) {
        queryBuilder = queryBuilder.lte('precio', filters.maxPrecio);
      }
      
      // Ordenar
      if (filters.sortBy) {
        queryBuilder = queryBuilder.order(filters.sortBy, { 
          ascending: filters.sortOrder === 'asc' 
        });
      } else {
        queryBuilder = queryBuilder.order('orden', { ascending: true });
      }
      
      const { data, error } = await queryBuilder;
      
      if (error) {
        throw new Error(`Error Supabase: ${error.message}`);
      }
      
      // Procesar vehículos
      const resultados = data.map(vehiculo => 
        this.procesarVehiculo(vehiculo)
      );
      
      console.log(`✅ ${resultados.length} resultados encontrados`);
      return resultados;
      
    } catch (error) {
      console.error('❌ Error buscando vehículos:', error);
      return [];
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
    } else if (vehiculo.estado) {
      estado = vehiculo.estado;
    }
    
    const estadoConfig = this.config.app.estados[estado] || this.config.app.estados.stock;
    
    return {
      id: vehiculo.id || vehiculo.codigo || `vehiculo-${Date.now()}`,
      nombre: vehiculo.nombre || vehiculo.titulo || 'Vehículo',
      descripcion: vehiculo.descripcion || vehiculo.detalles || 'Vehículo americano importado',
      precio: vehiculo.precio || vehiculo.valor || 0,
      estado: estado,  // 'stock', 'transit', 'reserved'
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
  
  // Método para obtener estadísticas
  async getStats() {
    try {
      const supabase = await this.getClient();
      
      const { data, error } = await supabase
        .from('vehiculos_arica')
        .select('estado');
      
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
[file content end]
