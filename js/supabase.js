import { CONFIG } from './config.js';

console.log('🔧 Inicializando conexión a Supabase Premium...');

// Servicio de datos mejorado con todas las nuevas funcionalidades
export const supabaseService = {
  sessionId: this.generateSessionId(),
  
  // Generar ID de sesión para analytics
  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  },
  
  // =================== VEHÍCULOS ===================
  async getVehiculos() {
    console.log('🚗 Iniciando carga de vehículos...');
    
    try {
      const url = `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.tables.vehiculos}?select=*`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('❌ Error cargando vehículos:', response.status);
        return [];
      }
      
      const data = await response.json();
      console.log(`✅ ${data?.length || 0} vehículos obtenidos`);
      
      // Registrar interacción
      this.trackEvent('vehicles_loaded', { count: data?.length || 0 });
      
      return data;
      
    } catch (error) {
      console.error('❌ Error general en getVehiculos:', error);
      return [];
    }
  },
  
  // =================== KITS ===================
  async getKits() {
    console.log('🛠️ Cargando kits de mejora...');
    
    try {
      const url = `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.tables.kits}?select=*&order=precio.asc`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn('⚠️ No se pudieron cargar kits, usando por defecto');
        return this.getDefaultKits();
      }
      
      const data = await response.json();
      console.log(`📦 ${data.length} kits cargados`);
      return data;
      
    } catch (error) {
      console.error('❌ Error al cargar kits:', error);
      return this.getDefaultKits();
    }
  },
  
  // =================== VEHÍCULOS VENDIDOS (TESTIMONIOS) ===================
  async getVendidosConTestimonios(filtroKit = 'all') {
    console.log('🏆 Cargando vehículos vendidos...');
    
    try {
      let url = `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.tables.vendidos}?select=*&aprobado=eq.true&order=fecha_venta.desc`;
      
      // Aplicar filtro por kit si no es 'all'
      if (filtroKit !== 'all') {
        url += `&kit_instalado=eq.${filtroKit}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'apikey': CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`
        }
      });
      
      if (!response.ok) {
        console.warn('⚠️ No se pudieron cargar vendidos:', response.status);
        return [];
      }
      
      const data = await response.json();
      console.log(`🎯 ${data.length} testimonios aprobados cargados`);
      return data;
      
    } catch (error) {
      console.error('❌ Error cargando vendidos:', error);
      return [];
    }
  },
  
  // =================== IMÁGENES ESPECÍFICAS POR KIT ===================
  async getKitImagesForVehicle(vehiculoId, kitId) {
    console.log(`🖼️ Buscando imágenes para vehículo ${vehiculoId} - kit ${kitId}`);
    
    try {
      const url = `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.tables.kitImagenes}?select=*&vehiculo_id=eq.${vehiculoId}&kit_id=eq.${kitId}&activo=eq.true&order=orden.asc`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`
        }
      });
      
      if (!response.ok) {
        // No es error crítico, solo devolver null
        return null;
      }
      
      const data = await response.json();
      return data.length > 0 ? data : null;
      
    } catch (error) {
      console.warn('⚠️ Error no crítico en imágenes de kit:', error);
      return null;
    }
  },
  
  // =================== PRECIOS ESPECÍFICOS ===================
  async getPrecioEspecifico(vehiculoId, kitId) {
    try {
      const url = `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.tables.preciosEspecificos}?select=*&vehiculo_id=eq.${vehiculoId}&kit_id=eq.${kitId}&activo=eq.true`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data[0]?.precio || null;
      }
      
      return null;
      
    } catch (error) {
      console.warn('⚠️ Error obteniendo precio específico:', error);
      return null;
    }
  },
  
  // =================== ENVIAR TESTIMONIO ===================
  async enviarTestimonio(testimonioData) {
    console.log('📝 Enviando testimonio...');
    
    try {
      const url = `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.tables.testimonios}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(testimonioData)
      });
      
      if (response.ok) {
        console.log('✅ Testimonio enviado para moderación');
        return { success: true, message: 'Gracias por tu testimonio. Será revisado por nuestro equipo.' };
      } else {
        console.error('❌ Error enviando testimonio:', response.status);
        return { success: false, message: 'Error al enviar testimonio. Intenta nuevamente.' };
      }
      
    } catch (error) {
      console.error('❌ Error enviando testimonio:', error);
      return { success: false, message: 'Error de conexión.' };
    }
  },
  
  // =================== TRACKING DE EVENTOS ===================
  async trackEvent(tipoEvento, datos = {}) {
    if (!CONFIG.app.trackEvents) return;
    
    try {
      const eventData = {
        session_id: this.sessionId,
        tipo_evento: tipoEvento,
        datos: datos,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      
      const url = `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.tables.interacciones}`;
      
      // Usar fetch con catch silencioso para no bloquear la app
      fetch(url, {
        method: 'POST',
        headers: {
          'apikey': CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      }).catch(() => {
        // Silenciar errores de tracking
      });
      
    } catch (error) {
      // Silenciar errores
    }
  },
  
  // =================== FUNCIONES HELPER ===================
  
  // Obtener precio del vehículo
  findVehiclePrice(vehiculo) {
    const posiblesColumnas = ['precio', 'price', 'costo', 'valor'];
    for (const columna of posiblesColumnas) {
      if (vehiculo[columna] !== undefined && vehiculo[columna] !== null) {
        const precio = parseFloat(vehiculo[columna]);
        if (!isNaN(precio) && precio > 0) {
          return precio;
        }
      }
    }
    return 0;
  },
  
  // Kits por defecto
  getDefaultKits() {
    return [
      {
        id: "standar",
        nombre: "Standard",
        precio: 0,
        descripcion: "Preparación básica incluida",
        nivel: "standar",
        includes: [
          "Lavado y encerado exterior completo",
          "Limpieza interior profunda",
          "Revisión mecánica básica",
          "Cambio de aceite y filtros",
          "Documentación en regla"
        ]
      },
      {
        id: "medium",
        nombre: "Medium",
        precio: 1200000,
        descripcion: "Mejoras estéticas y funcionales",
        nivel: "medium",
        includes: [
          "Todo lo del kit Standard",
          "Llantas deportivas 20\"",
          "Tinte de ventanas premium",
          "Step bar laterales",
          "Sistema de audio mejorado"
        ]
      },
      {
        id: "full",
        nombre: "Full",
        precio: 2500000,
        descripcion: "Transformación premium completa",
        nivel: "full",
        includes: [
          "Todo lo del kit Medium",
          "Lift kit suspensión 2\"",
          "Rines Fuel de 22\"",
          "Neumáticos Off-Road 35\"",
          "Kit carrocería exclusivo",
          "Sistema de escape deportivo"
        ]
      }
    ];
  },
  
  // Obtener vehículo por ID
  async getVehiculoById(id) {
    try {
      const response = await fetch(
        `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.tables.vehiculos}?id=eq.${id}&select=*`,
        {
          headers: {
            'apikey': CONFIG.supabase.anonKey,
            'Authorization': `Bearer ${CONFIG.supabase.anonKey}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data[0] || null;
      }
      
      return null;
      
    } catch (error) {
      console.error('Error obteniendo vehículo:', error);
      return null;
    }
  }
};

// Probar conexión inicial
console.log('🔄 Probando conexión con Supabase Premium...');
supabaseService.getVehiculos()
  .then(data => {
    if (data && data.length > 0) {
      console.log('🎉 CONEXIÓN EXITOSA - Modo Premium Activado');
      console.log(`📊 ${data.length} vehículos listos`);
      
      // Registrar evento de conexión exitosa
      supabaseService.trackEvent('app_loaded', { 
        vehicle_count: data.length,
        premium_features: true 
      });
    }
  })
  .catch(error => {
    console.error('❌ Error en conexión inicial:', error);
  });