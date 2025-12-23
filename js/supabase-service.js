// ===================== SUPABASE SERVICE MEJORADO =====================
class SupabaseService {
  constructor(config) {
    this.config = config || window.CONFIG;
    this.cacheDuration = this.config.app.performance.cacheDuration * 1000; // convertir a ms
    this.cache = new Map();
  }
  
  async getVehiculos(forceRefresh = false) {
    const cacheKey = 'vehiculos';
    const cachedData = this.getFromCache(cacheKey);
    
    // Retornar cache si es válido y no se fuerza refresh
    if (cachedData && !forceRefresh && this.isCacheValid(cachedData.timestamp)) {
      console.log('📦 Retornando vehículos desde cache');
      return cachedData.data;
    }
    
    try {
      console.log('🌐 Obteniendo vehículos desde Supabase...');
      
      const url = `${this.config.supabase.url}${this.config.supabase.endpoints.vehiculos}?select=*&order=orden.asc,created_at.desc`;
      
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
      const totalCount = response.headers.get('content-range')?.split('/')[1] || vehiculos.length;
      
      console.log(`✅ ${vehiculos.length} vehículos obtenidos (total: ${totalCount})`);
      
      // Procesar vehículos con imágenes
      const vehiculosCompletos = await Promise.all(
        vehiculos.map(async vehiculo => {
          const imagenes = await this.getImagenesVehiculo(vehiculo.id);
          return this.procesarVehiculo(vehiculo, imagenes);
        })
      );
      
      // Guardar en cache
      this.saveToCache(cacheKey, vehiculosCompletos);
      
      // Guardar en localStorage como backup
      this.saveToLocalStorage('vehiculos', vehiculosCompletos);
      
      return vehiculosCompletos;
      
    } catch (error) {
      console.error('❌ Error obteniendo vehículos:', error);
      
      // Intentar obtener del localStorage como fallback
      const fallbackData = this.getFromLocalStorage('vehiculos');
      if (fallbackData) {
        console.log('🔄 Usando datos de localStorage como fallback');
        return fallbackData;
      }
      
      throw error;
    }
  }
  
  async getVehiculoById(id, forceRefresh = false) {
    const cacheKey = `vehiculo_${id}`;
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData && !forceRefresh && this.isCacheValid(cachedData.timestamp)) {
      return cachedData.data;
    }
    
    try {
      const url = `${this.config.supabase.url}${this.config.supabase.endpoints.vehiculos}?id=eq.${id}&select=*`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.supabase.anonKey,
          'Authorization': `Bearer ${this.config.supabase.anonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        return null;
      }
      
      const vehiculo = data[0];
      const imagenes = await this.getImagenesVehiculo(id);
      const vehiculoCompleto = this.procesarVehiculo(vehiculo, imagenes);
      
      this.saveToCache(cacheKey, vehiculoCompleto);
      
      return vehiculoCompleto;
      
    } catch (error) {
      console.error(`❌ Error obteniendo vehículo ${id}:`, error);
      
      // Buscar en el cache de vehículos
      const allVehicles = this.getFromCache('vehiculos')?.data || [];
      const cachedVehicle = allVehicles.find(v => v.id === id);
      
      if (cachedVehicle) {
        console.log(`🔄 Usando vehículo ${id} desde cache`);
        return cachedVehicle;
      }
      
      return null;
    }
  }
  
  async getImagenesVehiculo(vehiculoId) {
    const cacheKey = `imagenes_${vehiculoId}`;
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData && this.isCacheValid(cachedData.timestamp)) {
      return cachedData.data;
    }
    
    try {
      const url = `${this.config.supabase.url}${this.config.supabase.endpoints.imagenes}?vehiculo_id=eq.${vehiculoId}&select=url,orden&order=orden.asc`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.supabase.anonKey,
          'Authorization': `Bearer ${this.config.supabase.anonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      const imagenes = data.map(img => img.url);
      
      this.saveToCache(cacheKey, imagenes);
      
      return imagenes;
      
    } catch (error) {
      console.error(`❌ Error obteniendo imágenes para vehículo ${vehiculoId}:`, error);
      return [];
    }
  }
  
  async getKits(forceRefresh = false) {
    const cacheKey = 'kits';
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData && !forceRefresh && this.isCacheValid(cachedData.timestamp)) {
      return cachedData.data;
    }
    
    try {
      const url = `${this.config.supabase.url}${this.config.supabase.endpoints.kits}?select=*&order=orden.asc`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.supabase.anonKey,
          'Authorization': `Bearer ${this.config.supabase.anonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      let kits = await response.json();
      
      // Si no hay kits en la base de datos, usar los por defecto
      if (!kits || kits.length === 0) {
        kits = this.config.app.kitsDefault;
      }
      
      this.saveToCache(cacheKey, kits);
      this.saveToLocalStorage('kits', kits);
      
      return kits;
      
    } catch (error) {
      console.error('❌ Error obteniendo kits:', error);
      
      // Usar kits por defecto como fallback
      const fallbackKits = this.config.app.kitsDefault;
      console.log('🔄 Usando kits por defecto');
      return fallbackKits;
    }
  }
  
  async searchVehiculos(query, filters = {}) {
    try {
      let url = `${this.config.supabase.url}${this.config.supabase.endpoints.vehiculos}?select=*`;
      
      // Construir query parameters
      const params = new URLSearchParams();
      
      if (query) {
        params.append('nombre', `ilike.%${query}%`);
      }
      
      if (filters.estado) {
        params.append('estado', `eq.${filters.estado}`);
      }
      
      if (filters.marca) {
        params.append('marca', `eq.${filters.marca}`);
      }
      
      if (filters.minPrecio) {
        params.append('precio', `gte.${filters.minPrecio}`);
      }
      
      if (filters.maxPrecio) {
        params.append('precio', `lte.${filters.maxPrecio}`);
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `&${queryString}`;
      }
      
      url += `&order=${filters.sortBy || 'orden'}.${filters.sortOrder || 'asc'}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.supabase.anonKey,
          'Authorization': `Bearer ${this.config.supabase.anonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const vehiculos = await response.json();
      
      // Procesar vehículos
      const vehiculosCompletos = await Promise.all(
        vehiculos.map(async vehiculo => {
          const imagenes = await this.getImagenesVehiculo(vehiculo.id);
          return this.procesarVehiculo(vehiculo, imagenes);
        })
      );
      
      return vehiculosCompletos;
      
    } catch (error) {
      console.error('❌ Error buscando vehículos:', error);
      return [];
    }
  }
  
  // Métodos auxiliares
  procesarVehiculo(vehiculo, imagenes = []) {
    const estado = vehiculo.estado || 'stock';
    const estadoConfig = this.config.app.estados[estado] || this.config.app.estados.stock;
    
    return {
      id: vehiculo.id,
      nombre: vehiculo.nombre || 'Vehículo',
      descripcion: vehiculo.descripcion || 'Vehículo americano importado',
      precio: vehiculo.precio || 0,
      estado: estado,
      estadoTexto: estadoConfig.texto,
      estadoColor: estadoConfig.color,
      estadoIcono: estadoConfig.icono,
      imagenes: imagenes,
      imagen_principal: imagenes[0] || this.config.app.defaultImage,
      ano: vehiculo.ano || null,
      color: vehiculo.color || null,
      motor: vehiculo.motor || null,
      kilometraje: vehiculo.kilometraje || 0,
      modelo: vehiculo.modelo || null,
      marca: vehiculo.marca || null,
      transmision: vehiculo.transmision || null,
      combustible: vehiculo.combustible || null,
      caracteristicas: vehiculo.caracteristicas || [],
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
