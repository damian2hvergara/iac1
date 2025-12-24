// supabase-service.js - VERSIÓN COMPLETA Y CORREGIDA
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export class SupabaseService {
  static client = null;
  static initialized = false;
  
  // Inicializar Supabase una sola vez
  static async init(config) {
    if (this.initialized && this.client) {
      console.log('✅ Supabase ya está inicializado, reutilizando cliente');
      return true;
    }
    
    try {
      console.log('🔌 Inicializando SupabaseService...');
      console.log('📊 URL:', config.supabase.url);
      console.log('🗃️ Tabla:', config.supabase.table);
      console.log('🔑 Clave:', config.supabase.anonKey.substring(0, 20) + '...');
      
      if (!config.supabase.url || !config.supabase.anonKey) {
        throw new Error('Faltan credenciales de Supabase en la configuración');
      }
      
      // Crear cliente Supabase
      this.client = createClient(config.supabase.url, config.supabase.anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            'apikey': config.supabase.anonKey
          }
        }
      });
      
      // Test de conexión
      const connected = await this.testConnection();
      
      if (connected) {
        this.initialized = true;
        console.log('✅ SupabaseService inicializado correctamente');
        return true;
      } else {
        throw new Error('No se pudo establecer conexión con Supabase');
      }
      
    } catch (error) {
      console.error('❌ Error inicializando SupabaseService:', error);
      this.client = null;
      this.initialized = false;
      return false;
    }
  }
  
  // Test de conexión
  static async testConnection() {
    try {
      if (!this.client) {
        console.error('❌ Cliente Supabase no creado');
        return false;
      }
      
      console.log('🔍 Probando conexión con Supabase...');
      
      // Consulta simple para verificar conexión
      const { data, error } = await this.client
        .from('vehiculos_publicos')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Error en test de conexión:', error);
        return false;
      }
      
      console.log('✅ Conexión establecida con Supabase');
      console.log('📊 Respuesta:', data ? `${data.length} registros` : 'sin datos');
      return true;
      
    } catch (error) {
      console.error('❌ Error en testConnection:', error);
      return false;
    }
  }
  
  // Obtener todos los vehículos
  static async getVehiculos(forceRefresh = false) {
    const cacheKey = 'vehiculos_cache';
    
    // Usar cache si no es forceRefresh
    if (!forceRefresh) {
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        console.log('📦 Retornando vehículos desde cache');
        return cachedData;
      }
    }
    
    try {
      if (!this.client) {
        throw new Error('Cliente Supabase no inicializado');
      }
      
      console.log('📡 Consultando vehículos desde Supabase...');
      
      // Consultar la tabla correcta
      const { data, error } = await this.client
        .from('vehiculos_publicos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      console.log(`✅ ${data?.length || 0} vehículos obtenidos de la base de datos`);
      
      // Procesar vehículos
      const vehiculosProcesados = this.processVehicles(data || []);
      
      // Guardar en cache
      this.saveToCache(cacheKey, vehiculosProcesados);
      console.log(`💾 ${vehiculosProcesados.length} vehículos guardados en cache`);
      
      return vehiculosProcesados;
      
    } catch (error) {
      console.error('❌ Error en getVehiculos:', error);
      
      // Fallback a cache si está disponible
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData && cachedData.length > 0) {
        console.log('🔄 Fallback a datos cacheados');
        return cachedData;
      }
      
      return [];
    }
  }
  
  // Obtener vehículo por ID
  static async getVehiculoById(id) {
    try {
      if (!this.client) {
        throw new Error('Cliente Supabase no inicializado');
      }
      
      console.log(`🔍 Buscando vehículo con ID: ${id}`);
      
      const { data, error } = await this.client
        .from('vehiculos_publicos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`❌ Error obteniendo vehículo ${id}:`, error);
        return null;
      }
      
      if (!data) {
        console.warn(`⚠️ Vehículo ${id} no encontrado`);
        return null;
      }
      
      const processed = this.processVehicles([data]);
      return processed[0] || null;
      
    } catch (error) {
      console.error(`❌ Error en getVehiculoById:`, error);
      return null;
    }
  }
  
  // Obtener kits (por ahora del config)
  static async getKits() {
    try {
      console.log('📦 Obteniendo kits...');
      
      // Si tienes tabla de kits en Supabase, cambia esto:
      // const { data, error } = await this.client.from('kits').select('*');
      
      // Por ahora devolvemos kits del config
      const kits = window.CONFIG?.app?.kitsDefault || [];
      console.log(`✅ ${kits.length} kits obtenidos del config`);
      
      return kits;
      
    } catch (error) {
      console.error('❌ Error en getKits:', error);
      
      // Fallback a kits por defecto
      return window.CONFIG?.app?.kitsDefault || [
        {
          id: "standard",
          nombre: "Standard",
          precio: 0,
          descripcion: "Preparación básica incluida"
        }
      ];
    }
  }
  
  // Procesar vehículos
  static processVehicles(vehicles) {
    if (!vehicles || !Array.isArray(vehicles)) {
      return [];
    }
    
    return vehicles.map(vehicle => {
      // Extraer imágenes
      let imagenes = [];
      try {
        if (vehicle.images) {
          if (typeof vehicle.images === 'string') {
            imagenes = JSON.parse(vehicle.images);
          } else if (Array.isArray(vehicle.images)) {
            imagenes = vehicle.images;
          }
        }
      } catch (e) {
        console.warn('⚠️ Error procesando imágenes:', e);
        imagenes = [];
      }
      
      // Si no hay imágenes, usar imagen_principal
      if (imagenes.length === 0 && vehicle.imagen_principal) {
        imagenes = [vehicle.imagen_principal];
      }
      
      // Determinar estado
      let estado = 'stock';
      let estadoTexto = 'En Stock Arica';
      let estadoColor = '#34C759';
      let estadoIcono = 'fa-check-circle';
      
      if (vehicle.estado) {
        const estadoLower = vehicle.estado.toLowerCase();
        if (estadoLower.includes('transito') || estadoLower.includes('tránsito')) {
          estado = 'transit';
          estadoTexto = 'En Tránsito';
          estadoColor = '#FF9500';
          estadoIcono = 'fa-shipping-fast';
        } else if (estadoLower.includes('reserva')) {
          estado = 'reserved';
          estadoTexto = 'Reservado';
          estadoColor = '#0066cc';
          estadoIcono = 'fa-calendar-check';
        }
      }
      
      // Buscar configuración de estado
      const estadoConfig = window.CONFIG?.app?.estados?.[estado];
      if (estadoConfig) {
        estadoTexto = estadoConfig.texto || estadoTexto;
        estadoColor = estadoConfig.color || estadoColor;
        estadoIcono = estadoConfig.icono || estadoIcono;
      }
      
      return {
        id: vehicle.id || vehicle.codigo || `vehiculo-${Date.now()}`,
        nombre: vehicle.nombre || vehicle.titulo || 'Vehículo',
        descripcion: vehicle.descripcion || vehicle.detalles || 'Vehículo americano importado',
        precio: vehicle.precio || vehicle.valor || 0,
        estado: estado,
        estadoTexto: estadoTexto,
        estadoColor: estadoColor,
        estadoIcono: estadoIcono,
        imagenes: imagenes,
        imagen_principal: imagenes[0] || vehicle.imagen_principal || window.CONFIG?.app?.defaultImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        ano: vehicle.ano || vehicle.año || null,
        color: vehicle.color || null,
        motor: vehicle.motor || null,
        kilometraje: vehicle.kilometraje || vehicle.kilometros || 0,
        modelo: vehicle.modelo || null,
        marca: vehicle.marca || null,
        transmision: vehicle.transmision || vehicle.caja || null,
        combustible: vehicle.combustible || null,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        orden: vehicle.orden || 999
      };
    });
  }
  
  // Cache management
  static saveToCache(key, data, duration = 5 * 60 * 1000) { // 5 minutos por defecto
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        expires: Date.now() + duration
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
      console.log(`💾 Datos guardados en cache: ${key} (${data.length} items)`);
    } catch (error) {
      console.warn('⚠️ Error guardando en cache:', error);
    }
  }
  
  static getFromCache(key) {
    try {
      const cacheData = localStorage.getItem(key);
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        
        // Verificar si el cache ha expirado
        if (parsed.expires && Date.now() > parsed.expires) {
          console.log(`🗑️ Cache expirado: ${key}`);
          localStorage.removeItem(key);
          return null;
        }
        
        console.log(`📦 Datos obtenidos de cache: ${key} (${parsed.data?.length || 0} items)`);
        return parsed.data;
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo de cache:', error);
    }
    return null;
  }
  
  static clearCache(key = null) {
    try {
      if (key) {
        localStorage.removeItem(key);
        console.log(`🗑️ Cache limpiado: ${key}`);
      } else {
        // Limpiar todos los caches relacionados
        const keys = ['vehiculos_cache', 'kits_cache'];
        keys.forEach(k => localStorage.removeItem(k));
        console.log('🗑️ Todos los caches limpiados');
      }
    } catch (error) {
      console.warn('⚠️ Error limpiando cache:', error);
    }
  }
  
  // Obtener estadísticas
  static async getStats() {
    try {
      const vehiculos = await this.getVehiculos();
      
      const stats = {
        total: vehiculos.length,
        stock: vehiculos.filter(v => v.estado === 'stock').length,
        transit: vehiculos.filter(v => v.estado === 'transit').length,
        reserved: vehiculos.filter(v => v.estado === 'reserved').length
      };
      
      console.log('📊 Estadísticas:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return { total: 0, stock: 0, transit: 0, reserved: 0 };
    }
  }
  
  // Buscar vehículos
  static async searchVehiculos(query, filters = {}) {
    try {
      if (!this.client) {
        throw new Error('Cliente Supabase no inicializado');
      }
      
      let queryBuilder = this.client
        .from('vehiculos_publicos')
        .select('*');
      
      // Aplicar búsqueda
      if (query && query.trim()) {
        queryBuilder = queryBuilder.or(
          `nombre.ilike.%${query}%,descripcion.ilike.%${query}%,marca.ilike.%${query}%,modelo.ilike.%${query}%`
        );
      }
      
      // Aplicar filtros
      if (filters.estado) {
        queryBuilder = queryBuilder.eq('estado', filters.estado);
      }
      
      if (filters.marca) {
        queryBuilder = queryBuilder.eq('marca', filters.marca);
      }
      
      if (filters.minPrecio !== undefined) {
        queryBuilder = queryBuilder.gte('precio', filters.minPrecio);
      }
      
      if (filters.maxPrecio !== undefined) {
        queryBuilder = queryBuilder.lte('precio', filters.maxPrecio);
      }
      
      // Ordenar
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
      
      const { data, error } = await queryBuilder;
      
      if (error) throw error;
      
      return this.processVehicles(data || []);
      
    } catch (error) {
      console.error('❌ Error en searchVehiculos:', error);
      return [];
    }
  }
  
  // Obtener cliente (para debugging)
  static getClient() {
    return this.client;
  }
  
  // Verificar estado
  static getStatus() {
    return {
      initialized: this.initialized,
      clientExists: !!this.client,
      cacheItems: this.getCacheItemsCount()
    };
  }
  
  static getCacheItemsCount() {
    let count = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i).includes('_cache')) {
          count++;
        }
      }
    } catch (e) {
      // Ignorar errores
    }
    return count;
  }
}
