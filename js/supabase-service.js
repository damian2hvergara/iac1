// supabase-service.js - VERSIÓN SIMPLIFICADA Y FUNCIONAL
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export class SupabaseService {
  static client = null;
  
  static async init(config) {
    try {
      console.log('🔌 Inicializando conexión con Supabase...');
      console.log('URL:', config.supabase.url);
      console.log('Tabla:', config.supabase.table);
      
      this.client = createClient(config.supabase.url, config.supabase.anonKey);
      
      // Test de conexión
      const testResult = await this.testConnection();
      if (testResult.success) {
        console.log('✅ Conexión establecida con Supabase');
        return true;
      } else {
        console.error('❌ Error en test de conexión:', testResult.error);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error inicializando SupabaseService:', error);
      return false;
    }
  }
  
  static async testConnection() {
    try {
      if (!this.client) {
        return { success: false, error: 'Cliente no inicializado' };
      }
      
      const { data, error } = await this.client
        .from('vehiculos_publicos')
        .select('count')
        .limit(1);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, count: data?.length || 0 };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async getVehiculos(forceRefresh = false) {
    try {
      if (!this.client) {
        console.error('❌ Cliente Supabase no inicializado');
        throw new Error('Supabase no inicializado');
      }
      
      console.log('📡 Consultando vehículos desde Supabase...');
      
      const { data, error } = await this.client
        .from('vehiculos_publicos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error Supabase:', error);
        throw error;
      }
      
      console.log(`✅ ${data?.length || 0} vehículos obtenidos`);
      
      // Procesar datos
      const processed = this.processVehicles(data || []);
      
      // Guardar en cache local
      this.saveToLocalStorage('vehiculos', processed);
      
      return processed;
      
    } catch (error) {
      console.error('❌ Error obteniendo vehículos:', error);
      
      // Intentar cargar desde cache
      const cached = this.loadFromLocalStorage('vehiculos');
      if (cached && cached.length > 0) {
        console.log('🔄 Usando datos cacheados');
        return cached;
      }
      
      return [];
    }
  }
  
  static processVehicles(vehicles) {
    return vehicles.map(vehicle => {
      // Extraer imágenes
      let images = [];
      try {
        if (vehicle.images) {
          if (typeof vehicle.images === 'string') {
            images = JSON.parse(vehicle.images);
          } else if (Array.isArray(vehicle.images)) {
            images = vehicle.images;
          }
        }
      } catch (e) {
        console.warn('⚠️ Error procesando imágenes:', e);
      }
      
      // Determinar estado
      let status = 'stock';
      let statusText = 'En Stock Arica';
      let statusColor = '#34C759';
      
      if (vehicle.estado) {
        const estado = vehicle.estado.toLowerCase();
        if (estado.includes('transito') || estado.includes('tránsito')) {
          status = 'transit';
          statusText = 'En Tránsito';
          statusColor = '#FF9500';
        } else if (estado.includes('reserva')) {
          status = 'reserved';
          statusText = 'Reservado';
          statusColor = '#0066cc';
        }
      }
      
      return {
        id: vehicle.id,
        nombre: vehicle.nombre || vehicle.titulo || 'Vehículo',
        descripcion: vehicle.descripcion || '',
        precio: vehicle.precio || vehicle.valor || 0,
        estado: status,
        estadoTexto: statusText,
        estadoColor: statusColor,
        imagenes: images,
        imagen_principal: images[0] || vehicle.imagen_principal || '',
        ano: vehicle.ano || vehicle.año || null,
        color: vehicle.color || null,
        motor: vehicle.motor || null,
        kilometraje: vehicle.kilometraje || vehicle.kilometros || 0,
        modelo: vehicle.modelo || null,
        marca: vehicle.marca || null,
        transmision: vehicle.transmision || vehicle.caja || null,
        combustible: vehicle.combustible || null,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at
      };
    });
  }
  
  static async getVehiculoById(id) {
    try {
      if (!this.client) {
        throw new Error('Cliente no inicializado');
      }
      
      const { data, error } = await this.client
        .from('vehiculos_publicos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const processed = this.processVehicles([data]);
      return processed[0] || null;
      
    } catch (error) {
      console.error(`❌ Error obteniendo vehículo ${id}:`, error);
      
      // Buscar en cache
      const cached = this.loadFromLocalStorage('vehiculos');
      if (cached) {
        return cached.find(v => v.id === id) || null;
      }
      
      return null;
    }
  }
  
  static async getKits() {
    // Por ahora usamos los kits del config
    // Si en el futuro tienes tabla de kits, cambia esto
    return window.CONFIG?.app?.kitsDefault || [];
  }
  
  static saveToLocalStorage(key, data) {
    try {
      const storageKey = window.CONFIG?.storageKeys?.[key] || key;
      const item = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(item));
    } catch (error) {
      console.warn('⚠️ Error guardando en localStorage:', error);
    }
  }
  
  static loadFromLocalStorage(key) {
    try {
      const storageKey = window.CONFIG?.storageKeys?.[key] || key;
      const item = localStorage.getItem(storageKey);
      if (item) {
        const parsed = JSON.parse(item);
        // Cache válido por 5 minutos
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando de localStorage:', error);
    }
    return null;
  }
  
  static getClient() {
    return this.client;
  }
}
