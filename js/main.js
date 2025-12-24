// main.js - VERSIÓN COMPLETA CORREGIDA SIN PALABRAS RESERVADAS

// Flag global para prevenir múltiples inicializaciones
window.appInitialized = false;
window.appLoading = false;

// Función principal de inicialización
export async function initializeApp() {
  // Prevenir múltiples inicializaciones simultáneas
  if (window.appLoading) {
    console.log('⏳ La aplicación ya se está inicializando...');
    return;
  }
  
  if (window.appInitialized) {
    console.log('⚠️ La aplicación ya está inicializada');
    return;
  }
  
  window.appLoading = true;
  console.log('🚀 Inicializando aplicación...');
  
  const loadingOverlay = document.getElementById('loadingOverlay');
  const startTime = performance.now();
  
  try {
    // ===================== PASO 1: CARGAR CONFIGURACIÓN =====================
    console.log('📋 Paso 1: Cargando configuración...');
    const { CONFIG } = await import('./config.js');
    window.CONFIG = CONFIG;
    console.log('✅ Configuración cargada');
    
    // ===================== PASO 2: INICIALIZAR SUPABASE =====================
    console.log('🔌 Paso 2: Inicializando Supabase...');
    const { SupabaseService } = await import('./supabase-service.js');
    window.SupabaseService = SupabaseService;
    
    // Inicializar SupabaseService
    const supabaseInitialized = await SupabaseService.init(CONFIG);
    
    if (!supabaseInitialized) {
      throw new Error('No se pudo inicializar la conexión con la base de datos');
    }
    
    console.log('✅ SupabaseService inicializado');
    
    // ===================== PASO 3: INICIALIZAR PRODUCTOS MANAGER =====================
    console.log('🚗 Paso 3: Inicializando ProductosManager...');
    const { ProductosManager } = await import('./productos-manager.js');
    
    // Crear instancia única
    if (!window.productosManager) {
      window.productosManager = new ProductosManager(CONFIG);
      console.log('✅ Nueva instancia de ProductosManager creada');
    } else {
      console.log('⚠️ ProductosManager ya existe, reutilizando instancia');
    }
    
    // Inicializar ProductosManager
    const productosInitialized = await window.productosManager.init();
    
    if (!productosInitialized) {
      console.warn('⚠️ ProductosManager tuvo problemas, pero continuamos...');
    } else {
      console.log('✅ ProductosManager inicializado');
    }
    
    // ===================== PASO 4: CARGAR MÓDULOS UI =====================
    console.log('🎨 Paso 4: Cargando módulos UI...');
    
    // Cargar UI Core
    const { UICore, UINotifications } = await import('./ui-core.js');
    window.UICore = UICore;
    window.UINotifications = UINotifications;
    console.log('✅ UI Core cargado');
    
    // Cargar UI Components
    const { UISlider, UIModals, UIKits } = await import('./ui-components.js');
    window.UISlider = UISlider;
    window.UIModals = UIModals;
    window.UIKits = UIKits;
    console.log('✅ UI Components cargado');
    
    // Cargar UI Manager
    const { UIManager } = await import('./ui-manager.js');
    window.UIManager = UIManager;
    console.log('✅ UI Manager cargado');
    
    // ===================== PASO 5: INICIALIZAR UI MANAGER =====================
    console.log('🎭 Paso 5: Inicializando UIManager...');
    
    if (!window.UIManager?.initialized) {
      await UIManager.init({
        autoInitSlider: true
      });
      console.log('✅ UIManager inicializado');
    } else {
      console.log('⚠️ UIManager ya está inicializado');
    }
    
    // ===================== PASO 6: CONFIGURAR EVENTOS =====================
    console.log('🔗 Paso 6: Configurando event listeners...');
    setupEventListeners();
    console.log('✅ Event listeners configurados');
    
    // ===================== PASO 7: FINALIZAR INICIALIZACIÓN =====================
    window.appInitialized = true;
    window.appLoading = false;
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    console.log(`✨ Aplicación inicializada en ${loadTime.toFixed(0)}ms`);
    
    // Ocultar loading overlay
    if (loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      loadingOverlay.style.transition = 'opacity 0.3s ease';
      
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
      }, 300);
    }
    
    // Notificación de bienvenida
    setTimeout(() => {
      if (window.UINotifications) {
        UINotifications.success('Aplicación lista', 3000);
      }
      
      // Animar indicadores
      animateIndicators();
      
    }, 500);
    
    // ===================== PASO 8: DEBUG INFO =====================
    console.log('📊 === DEBUG INFO ===');
    console.log('appInitialized:', window.appInitialized);
    console.log('productosManager:', window.productosManager ? '✓ Existe' : '✗ No existe');
    console.log('SupabaseService:', window.SupabaseService ? '✓ Existe' : '✗ No existe');
    console.log('UIManager:', window.UIManager ? '✓ Existe' : '✗ No existe');
    
    if (window.productosManager) {
      const status = window.productosManager.getStatus();
      console.log('ProductosManager status:', status);
    }
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO en la inicialización:', error);
    
    // Mostrar error al usuario
    handleCriticalError(error);
    
    // Forzar ocultar loading
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
    
    window.appLoading = false;
    
    // Notificación de error
    if (window.UINotifications) {
      UINotifications.error('Error al cargar la aplicación', 5000);
    }
  }
}

// ===================== FUNCIONES AUXILIARES =====================

function setupEventListeners() {
  console.log('🔗 Configurando event listeners específicos...');
  
  // 1. FILTROS DE VEHÍCULOS
  document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const filtroSeleccionado = this.dataset.filter;
      console.log(`🎯 Filtro clickeado: ${filtroSeleccionado}`);
      
      if (!window.productosManager) {
        console.error('❌ productosManager no disponible');
        return;
      }
      
      // Actualizar botones visualmente
      document.querySelectorAll('.filter-button').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      
      // Aplicar filtro
      window.productosManager.filtrarVehiculos(filtroSeleccionado);
      
      // Scroll suave a vehículos si no estamos ya allí
      if (filtroSeleccionado !== 'all' && window.UICore) {
        setTimeout(() => {
          window.UICore.smoothScrollTo('vehiculos', 100);
        }, 100);
      }
    });
  });
  
  // 2. BOTÓN DE REFRESH
  const refreshButton = document.getElementById('refreshButton');
  if (refreshButton) {
    refreshButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🔄 Botón refresh clickeado');
      
      if (!window.productosManager) {
        console.error('❌ productosManager no disponible');
        return;
      }
      
      // Mostrar notificación
      if (window.UINotifications) {
        window.UINotifications.info('Actualizando vehículos...', 2000);
      }
      
      // Forzar refresh
      window.productosManager.cargarVehiculos(true);
      
      // Animación del botón
      this.classList.add('rotating');
      setTimeout(() => {
        this.classList.remove('rotating');
      }, 1000);
    });
  }
  
  // 3. MENÚ MÓVIL
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const abriendoMenu = !mobileMenu.classList.contains('active');
      
      mobileMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');
      
      // ARIA attributes
      menuToggle.setAttribute('aria-expanded', abriendoMenu);
      
      console.log(`🍔 Menú móvil ${abriendoMenu ? 'abierto' : 'cerrado'}`);
      
      // Prevenir scroll del body cuando el menú está abierto
      if (abriendoMenu) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
    
    // Cerrar menú al hacer clic en enlaces
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        mobileMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        
        console.log('🔗 Enlace de menú clickeado, cerrando menú');
      });
    });
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('active') && 
          !mobileMenu.contains(e.target) && 
          e.target !== menuToggle) {
        mobileMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }
  
  // 4. BOTONES DE ACCIÓN EN EL HERO
  document.querySelectorAll('.hero-cta a, .explore-arrow').forEach(boton => {
    boton.addEventListener('click', function(e) {
      if (this.classList.contains('explore-arrow')) {
        e.preventDefault();
        if (window.UICore) {
          window.UICore.smoothScrollTo('vehiculos', 80);
        }
      }
    });
  });
  
  // 5. SCROLL DEL HEADER
  function manejarScrollHeader() {
    const header = document.querySelector('.header');
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  }
  
  window.addEventListener('scroll', manejarScrollHeader, { passive: true });
  
  // 6. BOTONES DE WHATSAPP
  document.querySelectorAll('.button-whatsapp').forEach(boton => {
    if (!boton.hasAttribute('data-whatsapp-bound')) {
      boton.setAttribute('data-whatsapp-bound', 'true');
      boton.addEventListener('click', function(e) {
        if (!this.href || this.href === '#') {
          console.log('📞 Botón WhatsApp clickeado sin URL específica');
        }
      });
    }
  });
  
  // 7. CERRAR MODALES CON ESCAPE
  function manejarTeclaEscape(e) {
    if (e.key === 'Escape') {
      if (window.UIManager) {
        window.UIManager.closeAllModals();
      }
    }
  }
  
  document.addEventListener('keydown', manejarTeclaEscape);
  
  // 8. ERRORES NO CAPTURADOS
  function manejarErrorGlobal(event) {
    console.error('❌ Error global no capturado:', event.error);
  }
  
  function manejarRechazoPromesa(event) {
    console.error('❌ Promesa rechazada no capturada:', event.reason);
  }
  
  window.addEventListener('error', manejarErrorGlobal);
  window.addEventListener('unhandledrejection', manejarRechazoPromesa);
  
  console.log('✅ Todos los event listeners configurados');
}

function animateIndicators() {
  const indicators = document.querySelectorAll('.indicator');
  indicators.forEach((indicator, index) => {
    setTimeout(() => {
      indicator.classList.add('indicator-pulse');
      setTimeout(() => {
        indicator.classList.remove('indicator-pulse');
      }, 300);
    }, index * 100);
  });
}

function handleCriticalError(error) {
  console.error('💥 MANEJO DE ERROR CRÍTICO:', error);
  
  // 1. Mostrar mensaje en el contenedor de vehículos
  const vehiclesContainer = document.getElementById('vehiclesContainer');
  if (vehiclesContainer) {
    vehiclesContainer.innerHTML = `
      <div class="critical-error" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%); border-radius: var(--radius); border: 2px solid var(--error);">
        <div style="font-size: 3rem; color: var(--error); margin-bottom: 1rem;">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <h3 style="font-size: 1.5rem; color: var(--error); margin-bottom: 0.5rem;">
          Error Crítico
        </h3>
        <p style="color: var(--gray-700); margin-bottom: 1rem;">
          Ha ocurrido un error grave al cargar la aplicación.
        </p>
        <div style="background: white; padding: 1rem; border-radius: var(--radius); margin-bottom: 1.5rem; font-family: monospace; text-align: left; font-size: 0.875rem;">
          <strong>Error:</strong> ${error.message || 'Desconocido'}<br>
          <strong>Tipo:</strong> ${error.name || 'Error'}<br>
          <strong>URL:</strong> ${window.location.href}
        </div>
        <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
          <button class="button" onclick="window.location.reload()" style="background: var(--error); color: white;">
            <i class="fas fa-redo"></i> Recargar Aplicación
          </button>
          <a href="https://wa.me/56938654827" target="_blank" class="button button-outline" style="border-color: var(--error); color: var(--error);">
            <i class="fab fa-whatsapp"></i> Soporte Técnico
          </a>
          <button class="button button-outline" onclick="mostrarInfoDebug()">
            <i class="fas fa-bug"></i> Info de Depuración
          </button>
        </div>
      </div>
    `;
  }
  
  // 2. Mostrar notificación si es posible
  if (window.UINotifications) {
    window.UINotifications.error(
      `Error crítico: ${error.message || 'Contacta con soporte'}`,
      10000
    );
  } else {
    // Fallback: alerta simple
    alert(`Error crítico en la aplicación:\n\n${error.message || 'Error desconocido'}\n\nPor favor, recarga la página.`);
  }
  
  // 3. Registrar error para análisis
  registrarErrorServidor(error);
}

function registrarErrorServidor(error) {
  const datosError = {
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    appVersion: '2.0.0'
  };
  
  console.log('📤 Error registrado para análisis:', datosError);
}

function mostrarInfoDebug() {
  const infoDebug = {
    appInitialized: window.appInitialized,
    appLoading: window.appLoading,
    config: window.CONFIG ? {
      supabaseUrl: window.CONFIG.supabase.url,
      table: window.CONFIG.supabase.table,
      anonKeyConfigured: !!window.CONFIG.supabase.anonKey
    } : 'No configurado',
    modules: {
      productosManager: !!window.productosManager,
      SupabaseService: !!window.SupabaseService,
      UIManager: !!window.UIManager,
      UICore: !!window.UICore
    },
    screen: {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio
    },
    network: {
      online: navigator.onLine,
      connection: navigator.connection ? navigator.connection.effectiveType : 'No disponible'
    },
    localStorage: {
      enabled: typeof localStorage !== 'undefined',
      items: localStorage ? localStorage.length : 0
    }
  };
  
  alert(`=== DEBUG INFO ===\n\n${JSON.stringify(infoDebug, null, 2)}`);
}

// ===================== INICIALIZACIÓN AUTOMÁTICA =====================

// Función para verificar si podemos inicializar
function puedeInicializar() {
  // Verificar que estamos en un navegador
  if (typeof window === 'undefined') return false;
  
  // Verificar que no estamos en un iframe (opcional)
  if (window.self !== window.top) {
    console.log('⚠️ Detectado iframe, inicialización limitada');
  }
  
  // Verificar que tenemos los elementos DOM básicos
  if (!document.body || !document.head) {
    console.log('⏳ Esperando por DOM...');
    return false;
  }
  
  return true;
}

// Manejar diferentes estados de readiness del DOM
function manejarDOMListo() {
  if (!puedeInicializar()) {
    setTimeout(manejarDOMListo, 100);
    return;
  }
  
  console.log('📄 DOM listo, iniciando aplicación...');
  initializeApp();
}

// Verificar el estado actual del documento
if (document.readyState === 'loading') {
  // El DOM todavía se está cargando
  document.addEventListener('DOMContentLoaded', manejarDOMListo);
} else {
  // El DOM ya está listo
  manejarDOMListo();
}

// También inicializar cuando la ventana se carga completamente
window.addEventListener('load', () => {
  console.log('🖼️ Página completamente cargada');
  
  // Si por alguna razón no se inicializó antes, intentar ahora
  if (!window.appInitialized && !window.appLoading) {
    console.log('🔄 Intentando inicialización tardía...');
    setTimeout(initializeApp, 500);
  }
});

// Exportar funciones para testing/debugging
if (typeof window !== 'undefined') {
  window.debugApp = {
    reinitialize: () => {
      window.appInitialized = false;
      window.appLoading = false;
      initializeApp();
    },
    mostrarInfoDebug,
    testSupabase: async () => {
      if (window.SupabaseService) {
        const estado = window.SupabaseService.getStatus();
        alert(`Supabase Status:\n${JSON.stringify(estado, null, 2)}`);
      } else {
        alert('SupabaseService no disponible');
      }
    },
    clearCache: () => {
      if (window.SupabaseService) {
        window.SupabaseService.clearCache();
        alert('Cache limpiado');
      }
      if (localStorage) {
        localStorage.clear();
        alert('LocalStorage limpiado');
      }
    }
  };
}

// Añadir estilos para animaciones (SOLO si no existen ya)
if (!document.getElementById('ui-manager-styles')) {
  const estilo = document.createElement('style');
  estilo.id = 'ui-manager-styles';
  estilo.textContent = `
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .rotating {
      animation: rotate 1s linear;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .indicator-pulse {
      animation: pulse 0.3s ease;
    }
    
    .card-hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
    
    .filter-active {
      transform: scale(1.05);
      transition: transform 0.2s ease;
    }
    
    .critical-error {
      animation: fadeIn 0.5s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .counter-updated {
      animation: pulse 0.5s ease;
    }
  `;
  document.head.appendChild(estilo);
}

// Detector de palabras reservadas (para debugging)
function buscarPalabrasReservadas() {
  const palabrasReservadas = [
    'class', 'let', 'const', 'var', 'function', 'return', 'if', 'else',
    'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'default',
    'try', 'catch', 'finally', 'throw', 'new', 'delete', 'typeof', 'instanceof',
    'void', 'this', 'super', 'extends', 'export', 'import', 'async', 'await',
    'yield', 'get', 'set', 'static', 'private', 'public', 'protected', 'interface',
    'implements', 'package', 'enum'
  ];
  
  let encontradas = [];
  
  // Revisar todas las variables globales
  for (let clave in window) {
    if (palabrasReservadas.includes(clave.toLowerCase())) {
      encontradas.push(`Variable global: ${clave}`);
    }
  }
  
  if (encontradas.length > 0) {
    console.error('❌ Palabras reservadas encontradas:', encontradas);
  } else {
    console.log('✅ No se encontraron palabras reservadas usadas como variables');
  }
}

// Ejecutar después de un momento
setTimeout(buscarPalabrasReservadas, 2000);
