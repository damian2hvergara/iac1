// Archivo principal - Inicialización de la aplicación premium
import { CONFIG } from './config.js';
import { productosManager } from './productos.js';
import { testimoniosManager } from './testimonios.js';
import { UI } from './ui.js';
import { mobileNavigation } from './mobile-nav.js';

// Inicializar la aplicación
class App {
  constructor() {
    this.initialized = false;
    this.isOnline = navigator.onLine;
    this.performanceMetrics = {
      startTime: null,
      domLoaded: null,
      appLoaded: null
    };
  }
  
  async init() {
    if (this.initialized) return;
    
    this.performanceMetrics.startTime = performance.now();
    
    console.log('🚀 Import American Cars Premium - Inicializando aplicación...');
    
    try {
      // 1. Registrar métricas de performance
      this.setupPerformanceTracking();
      
      // 2. Verificar conexión
      this.setupConnectionMonitoring();
      
      // 3. Inicializar UI
      UI.init();
      
      // 4. Verificar configuración
      this.verifyConfig();
      
      // 5. Cargar vehículos
      await productosManager.cargarVehiculos();
      
      // 6. Inicializar mobile navigation
      mobileNavigation.init();
      
      // 7. Registrar métricas de carga
      this.performanceMetrics.domLoaded = performance.now();
      
      // 8. Marcar como inicializado
      this.initialized = true;
      this.performanceMetrics.appLoaded = performance.now();
      
      // 9. Registrar métricas de performance
      this.logPerformanceMetrics();
      
      console.log('✅ Aplicación premium inicializada correctamente');
      
      // 10. Inicializar Service Worker si está disponible
      this.initServiceWorker();
      
      // 11. Cargar feed de Instagram
      this.loadInstagramFeed();
      
      // 12. Setup analytics
      this.setupAnalytics();
      
    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
      UI.showError('Error al inicializar la aplicación. Por favor, recarga la página.');
      
      // Fallback: mostrar vehículos de ejemplo
      this.showFallbackContent();
    }
  }
  
  // Setup tracking de performance
  setupPerformanceTracking() {
    // Performance Observer para métricas web vitals
    if ('PerformanceObserver' in window) {
      try {
        // LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('📊 LCP:', lastEntry.startTime);
          
          // Enviar a analytics
          this.trackPerformanceMetric('lcp', lastEntry.startTime);
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // FID (First Input Delay)
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            console.log('📊 FID:', entry.processingStart - entry.startTime);
            this.trackPerformanceMetric('fid', entry.processingStart - entry.startTime);
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        
        // CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          entryList.getEntries().forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          console.log('📊 CLS:', clsValue);
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
      } catch (e) {
        console.warn('⚠️ Performance Observer no disponible:', e);
      }
    }
  }
  
  // Setup monitoreo de conexión
  setupConnectionMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      UI.showNotification('Conexión restablecida', 'success');
      
      // Reintentar carga si falló anteriormente
      if (!this.initialized) {
        this.init();
      }
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      UI.showNotification('Estás offline. Algunas funciones pueden no estar disponibles.', 'warning');
    });
    
    // Detectar conexión lenta
    if ('connection' in navigator) {
      const connection = navigator.connection;
      if (connection) {
        if (connection.downlink < 1) { // Menos de 1 Mbps
          console.warn('⚠️ Conexión lenta detectada');
          UI.showMessage('Conexión lenta detectada. Optimizando carga...');
        }
        
        // Escuchar cambios en la conexión
        connection.addEventListener('change', () => {
          console.log('📶 Cambio en conexión:', {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt
          });
        });
      }
    }
  }
  
  // Verificar configuración
  verifyConfig() {
    const required = [
      'supabase.url',
      'supabase.anonKey',
      'contacto.whatsapp',
      'contacto.instagramUrl'
    ];
    
    const missing = [];
    
    required.forEach(path => {
      const keys = path.split('.');
      let value = CONFIG;
      
      keys.forEach(key => {
        value = value?.[key];
      });
      
      if (!value) {
        missing.push(path);
      }
    });
    
    if (missing.length > 0) {
      console.warn('⚠️ Configuración incompleta. Campos faltantes:', missing);
      UI.showNotification('Configuración incompleta. Verifica las credenciales.', 'warning');
    }
  }
  
  // Inicializar Service Worker
  initServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('✅ Service Worker registrado:', registration.scope);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              console.log('🔄 Nuevo Service Worker encontrado');
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available
                  UI.showNotification(
                    'Nueva versión disponible. Recarga para actualizar.',
                    'info'
                  );
                }
              });
            });
          })
          .catch(error => {
            console.error('❌ Error registrando Service Worker:', error);
          });
      });
    }
  }
  
  // Cargar feed de Instagram
  loadInstagramFeed() {
    const feedContainer = document.getElementById('instagramFeed');
    if (!feedContainer || !CONFIG.app.mostrarInstagram) return;
    
    // Mostrar skeleton loading
    feedContainer.innerHTML = `
      <div class="instagram-skeleton">
        ${Array.from({ length: 4 }).map(() => `
          <div class="skeleton-post">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-line"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Simular carga (en producción, esto sería una llamada a la API de Instagram)
    setTimeout(() => {
      const posts = [
        {
          image: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          caption: 'Chevrolet Silverado 2023 lista para entrega en Arica. Kit Full Upgrade instalado.',
          likes: 142,
          comments: 23,
          url: `${CONFIG.contacto.instagramUrl}?utm_source=web`,
          timestamp: '2024-03-10'
        },
        {
          image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          caption: 'Proceso de instalación Kit Medium en Ford F-150. Transformación completa en nuestro taller.',
          likes: 189,
          comments: 31,
          url: `${CONFIG.contacto.instagramUrl}?utm_source=web`,
          timestamp: '2024-03-09'
        },
        {
          image: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          caption: 'Nuevo lote de vehículos llegando desde USA. Variedad de modelos disponibles.',
          likes: 203,
          comments: 42,
          url: `${CONFIG.contacto.instagramUrl}?utm_source=web`,
          timestamp: '2024-03-08'
        },
        {
          image: 'https://images.unsplash.com/photo-1555212697-194d092e3b8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          caption: 'Comparación antes/después del Kit Full en RAM 1500. La diferencia es impresionante.',
          likes: 256,
          comments: 38,
          url: `${CONFIG.contacto.instagramUrl}?utm_source=web`,
          timestamp: '2024-03-07'
        }
      ];
      
      feedContainer.innerHTML = posts.map(post => `
        <div class="instagram-post" onclick="window.open('${post.url}', '_blank')">
          <img src="${post.image}" 
               alt="Instagram post" 
               class="instagram-image"
               loading="lazy"
               onerror="this.src='${CONFIG.app.defaultImage}'">
          <div class="instagram-info">
            <div class="instagram-stats">
              <span><i class="fas fa-heart"></i> ${post.likes}</span>
              <span><i class="fas fa-comment"></i> ${post.comments}</span>
            </div>
            <div class="instagram-caption">${post.caption}</div>
            <a href="${post.url}" target="_blank" class="instagram-link">
              <i class="fab fa-instagram"></i> Ver en Instagram
            </a>
          </div>
        </div>
      `).join('');
    }, 1500);
  }
  
  // Setup analytics
  setupAnalytics() {
    // Google Analytics 4 (si está configurado)
    if (CONFIG.app.ga4Id && CONFIG.app.ga4Id !== 'G-XXXXXXXXXX') {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.app.ga4Id}`;
      script.async = true;
      document.head.appendChild(script);
      
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', CONFIG.app.ga4Id);
      
      console.log('📊 Google Analytics 4 inicializado');
    }
    
    // Track page view
    this.trackPageView();
  }
  
  // Track page view
  trackPageView() {
    const pageData = {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    };
    
    if (window.supabaseService) {
      window.supabaseService.trackEvent('page_view', pageData);
    }
  }
  
  // Track performance metric
  trackPerformanceMetric(metric, value) {
    if (window.supabaseService) {
      window.supabaseService.trackEvent('performance_metric', {
        metric,
        value: Math.round(value),
        user_agent: navigator.userAgent,
        connection_type: navigator.connection?.effectiveType || 'unknown'
      });
    }
  }
  
  // Log performance metrics
  logPerformanceMetrics() {
    const metrics = {
      dom_load_time: Math.round(this.performanceMetrics.domLoaded - this.performanceMetrics.startTime),
      app_load_time: Math.round(this.performanceMetrics.appLoaded - this.performanceMetrics.startTime),
      vehicle_count: productosManager.vehiculos.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('📈 Métricas de performance:', metrics);
    
    // Enviar a analytics
    this.trackPerformanceMetric('app_load', metrics.app_load_time);
  }
  
  // Mostrar contenido de fallback
  showFallbackContent() {
    UI.showNotification('Usando datos de demostración. Conéctate a internet para datos actualizados.', 'info');
    
    // Cargar testimonios de ejemplo
    if (window.testimoniosManager) {
      testimoniosManager.cargarTestimonios();
    }
  }
  
  // Función para recargar datos
  async reloadData() {
    console.log('🔄 Recargando datos premium...');
    UI.showLoading();
    
    try {
      await productosManager.cargarVehiculos();
      
      if (CONFIG.app.mostrarTestimonios && window.testimoniosManager) {
        await testimoniosManager.cargarTestimonios();
      }
      
      UI.showNotification('Datos actualizados correctamente', 'success');
      
    } catch (error) {
      console.error('❌ Error recargando datos:', error);
      UI.showError('Error al actualizar datos. Verifica tu conexión.');
    } finally {
      UI.hideLoading();
    }
  }
  
  // Función para exportar datos (debug)
  exportData() {
    const data = {
      config: CONFIG,
      vehicles: productosManager.vehiculos,
      testimonios: window.testimoniosManager?.testimonios || [],
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iac-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📤 Datos exportados');
  }
}

// Instancia global de la aplicación
const app = new App();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  app.init().catch(error => {
    console.error('Error fatal al inicializar:', error);
  });
});

// Exportar para acceso global
window.app = app;
window.productosManager = productosManager;
window.UI = UI;

// Hotkeys para desarrollo
if (process.env.NODE_ENV === 'development') {
  document.addEventListener('keydown', (e) => {
    // Ctrl + R para recargar datos
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      app.reloadData();
    }
    
    // Ctrl + E para exportar datos
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      app.exportData();
    }
    
    // Ctrl + D para modo debug
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      console.log('🔧 Debug info:', {
        config: CONFIG,
        vehicles: productosManager.vehiculos.length,
        online: navigator.onLine,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        connection: navigator.connection
      });
    }
  });
}