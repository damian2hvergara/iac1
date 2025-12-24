// main.js - VERSIÓN COMPLETA Y CORREGIDA
export async function initializeApp() {
  console.log('🚀 Inicializando aplicación...');
  
  const loadingOverlay = document.getElementById('loadingOverlay');
  
  try {
    // 1. Cargar configuración
    const { CONFIG } = await import('./config.js');
    window.CONFIG = CONFIG;
    console.log('✅ Configuración cargada');
    
    // 2. Cargar e inicializar SupabaseService (SOLO UNA VEZ)
    const { SupabaseService } = await import('./supabase-service.js');
    
    // Inicializar SupabaseService
    console.log('🔌 Probando conexión con Supabase...');
    const supabaseInitialized = await SupabaseService.init(CONFIG);
    
    if (!supabaseInitialized) {
      throw new Error('Error de conexión con Supabase');
    }
    
    console.log('✅ Conexión establecida con Supabase');
    
    // 3. Cargar ProductosManager
    const { ProductosManager } = await import('./productos-manager.js');
    
    // 4. Crear instancia única de ProductosManager
    if (!window.productosManager) {
      window.productosManager = new ProductosManager(CONFIG);
      
      // Inicializar ProductosManager
      const productosInitialized = await window.productosManager.init();
      
      if (!productosInitialized) {
        console.warn('⚠️ ProductosManager tuvo problemas, continuando...');
      }
    } else {
      console.log('⚠️ ProductosManager ya existe, usando instancia existente');
    }
    
    // 5. Cargar módulos UI
    const { UICore, UINotifications } = await import('./ui-core.js');
    const { UISlider, UIModals, UIKits } = await import('./ui-components.js');
    const { UIManager } = await import('./ui-manager.js');
    
    // Hacer disponibles globalmente (solo una vez)
    if (!window.UICore) {
      window.UICore = UICore;
      window.UINotifications = UINotifications;
      window.UISlider = UISlider;
      window.UIModals = UIModals;
      window.UIKits = UIKits;
      window.UIManager = UIManager;
    }
    
    // 6. Inicializar UIManager (solo una vez)
    if (!window.UIManager?.initialized) {
      await UIManager.init();
    }
    
    // 7. Configurar eventos
    setupEventListeners();
    
    // 8. Ocultar loading
    if (loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
      }, 300);
    }
    
    // 9. Mostrar notificación de éxito
    setTimeout(() => {
      if (window.UINotifications) {
        UINotifications.success('Aplicación cargada correctamente', 3000);
      }
    }, 500);
    
    console.log('✅ Aplicación inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error crítico en la aplicación:', error);
    
    // Manejo de error crítico
    handleCriticalError(error);
    
    // Forzar ocultar loading
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }
}

// FUNCIONES AUXILIARES
function setupEventListeners() {
  console.log('🔗 Configurando event listeners...');
  
  // Filtros
  document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const filter = this.dataset.filter;
      if (window.productosManager) {
        // Actualizar botones visualmente
        document.querySelectorAll('.filter-button').forEach(btn => {
          btn.classList.remove('active');
        });
        this.classList.add('active');
        
        // Aplicar filtro
        window.productosManager.filtrarVehiculos(filter);
      }
    });
  });
  
  // Botón refresh
  const refreshButton = document.getElementById('refreshButton');
  if (refreshButton && window.productosManager) {
    refreshButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (window.UINotifications) {
        UINotifications.info('Actualizando vehículos...', 2000);
      }
      
      window.productosManager.cargarVehiculos(true);
    });
  }
  
  // Menú móvil
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      mobileMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');
      
      // ARIA attributes
      const isExpanded = mobileMenu.classList.contains('active');
      menuToggle.setAttribute('aria-expanded', isExpanded);
    });
    
    // Cerrar menú al hacer clic en enlaces
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
  
  // Scroll del header
  window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });
  
  console.log('✅ Event listeners configurados');
}

function handleCriticalError(error) {
  console.error('💥 Error crítico manejado:', error);
  
  // Mostrar mensaje al usuario
  const vehiclesContainer = document.getElementById('vehiclesContainer');
  if (vehiclesContainer) {
    vehiclesContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 class="empty-state-title">Error crítico</h3>
        <p class="empty-state-message">
          Hubo un problema grave en la aplicación.<br>
          Error: ${error.message || 'Desconocido'}
        </p>
        <div class="empty-state-actions">
          <button class="button" onclick="window.location.reload()">
            <i class="fas fa-redo"></i> Recargar aplicación
          </button>
          <a href="https://wa.me/56938654827" target="_blank" class="button button-outline">
            <i class="fab fa-whatsapp"></i> Reportar problema
          </a>
        </div>
      </div>
    `;
  }
  
  // Mostrar notificación si está disponible
  if (window.UINotifications) {
    UINotifications.error(`Error crítico: ${error.message || 'Contacta con soporte'}`, 10000);
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
} else {
  initializeApp();
}
