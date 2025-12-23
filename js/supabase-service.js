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
      
      // CONSULTA CON TUS COLUMNAS REALES
      const { data, error } = await supabase
        .from('vehiculos_arica')
        .select(`
          *,
          kit_standard_precio,
          kit_medium_precio,
          kit_full_precio,
          comparacion_standard,
          comparacion_medium,
          comparacion_full
        `)
        .order('created_at', { ascending: false })
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
        .select(`
          *,
          kit_standard_precio,
          kit_medium_precio,
          kit_full_precio,
          comparacion_standard,
          comparacion_medium,
          comparacion_full
        `)
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
    
    return {
      // DATOS PRINCIPALES
      id: vehiculo.id,
      codigo_interno: vehiculo.codigo_interno || '',
      nombre: vehiculo.nombre_publico || 'Vehículo', // COLUMNA CORRECTA: nombre_publico
      descripcion: vehiculo.descripcion_publica || '',
      precio: vehiculo.precio_publico || 0, // COLUMNA CORRECTA: precio_publico
      
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
      
      // KITS - PRECIOS ESPECÍFICOS DE CADA VEHÍCULO
      kit_standard_precio: vehiculo.kit_standard_precio || 0,
      kit_medium_precio: vehiculo.kit_medium_precio || 1200000,
      kit_full_precio: vehiculo.kit_full_precio || 2500000,
      
      // TAGS Y METADATA
      tags: vehiculo.tags || [],
      proveedor: vehiculo.proveedor || null,
      costo_real: vehiculo.costo_real || 0,
      video_tour: vehiculo.video_tour,
      
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

  async getKits(forceRefresh = false) {
    const cacheKey = 'kits';
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData && !forceRefresh && this.isCacheValid(cachedData.timestamp)) {
      return cachedData.data;
    }
    
    try {
      // Obtener kits de la tabla de vehículos para actualizar precios
      const vehiculos = await this.getVehiculos(forceRefresh);
      
      // Usar los kits por defecto del config pero con precios actualizados
      let kits = [...this.config.app.kitsDefault];
      
      // Si hay vehículos, actualizar precios de kits con valores de la BD
      if (vehiculos.length > 0) {
        // Tomar el primer vehículo como referencia para precios (o podrías promediar)
        const vehiculoRef = vehiculos[0];
        
        kits = kits.map(kit => {
          const kitActualizado = { ...kit };
          
          // Actualizar precios según la base de datos
          if (kit.id === 'medium' && vehiculoRef.kit_medium_precio) {
            kitActualizado.precio = vehiculoRef.kit_medium_precio;
          } else if (kit.id === 'full' && vehiculoRef.kit_full_precio) {
            kitActualizado.precio = vehiculoRef.kit_full_precio;
          } else if (kit.id === 'standard' && vehiculoRef.kit_standard_precio !== undefined) {
            kitActualizado.precio = vehiculoRef.kit_standard_precio;
          }
          
          return kitActualizado;
        });
      }
      
      this.saveToCache(cacheKey, kits);
      this.saveToLocalStorage('kits', kits);
      
      return kits;
      
    } catch (error) {
      console.error('❌ Error obteniendo kits:', error);
      
      // Fallback a localStorage
      const fallbackData = this.getFromLocalStorage('kits');
      if (fallbackData) {
        return fallbackData;
      }
      
      return this.config.app.kitsDefault;
    }
  }

  async searchVehiculos(query, filters = {}) {
    try {
      const supabase = await this.getClient();
      
      let consulta = supabase
        .from('vehiculos_arica')
        .select('*');
      
      // Aplicar búsqueda de texto
      if (query) {
        consulta = consulta.or(`nombre_publico.ilike.%${query}%,descripcion_publica.ilike.%${query}%,marca.ilike.%${query}%,modelo.ilike.%${query}%`);
      }
      
      // Aplicar filtros
      if (filters.estado_inventario) {
        consulta = consulta.eq('estado_inventario', filters.estado_inventario);
      }
      
      if (filters.marca) {
        consulta = consulta.eq('marca', filters.marca);
      }
      
      if (filters.tipo_vehiculo) {
        consulta = consulta.eq('tipo_vehiculo', filters.tipo_vehiculo);
      }
      
      // Ordenar
      if (filters.sortBy) {
        consulta = consulta.order(filters.sortBy, { 
          ascending: filters.sortOrder === 'asc' 
        });
      } else {
        consulta = consulta.order('created_at', { ascending: false });
      }
      
      const { data, error } = await consulta;
      
      if (error) {
        throw new Error(`Error Supabase: ${error.message}`);
      }
      
      return data.map(v => this.procesarVehiculo(v));
      
    } catch (error) {
      console.error('❌ Error buscando vehículos:', error);
      return [];
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
