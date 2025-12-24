// main.js - Inicialización simplificada y robusta
export async function initializeApp() {
    console.log('🚀 Inicializando aplicación...');
    
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    try {
        // 1. Cargar Configuración
        const { CONFIG } = await import('./config.js');
        window.CONFIG = CONFIG;
        console.log('✅ Configuración cargada');
        
        // 2. Cargar SupabaseService
        const { SupabaseService } = await import('./supabase-service.js');
        window.SupabaseService = SupabaseService;
        console.log('✅ SupabaseService cargado');
        
        // 3. Cargar ProductosManager
        const { ProductosManager } = await import('./productos-manager.js');
        console.log('✅ ProductosManager cargado');
        
        // 4. Cargar UI Core
        const { UICore, UINotifications } = await import('./ui-core.js');
        window.UICore = UICore;
        window.UINotifications = UINotifications;
        console.log('✅ UI Core cargado');
        
        // 5. Cargar UI Components
        const { UISlider, UIModals, UIKits } = await import('./ui-components.js');
        window.UISlider = UISlider;
        window.UIModals = UIModals;
        window.UIKits = UIKits;
        console.log('✅ UI Components cargado');
        
        // 6. Cargar UI Manager
        const { UIManager } = await import('./ui-manager.js');
        window.UIManager = UIManager;
        console.log('✅ UI Manager cargado');
        
        // 7. Inicializar UIManager
        await UIManager.init({
            autoInitSlider: true
        });
        console.log('✅ UIManager inicializado');
        
        // 8. Crear instancia de ProductosManager
        window.productosManager = new ProductosManager(CONFIG);
        console.log('✅ ProductosManager instanciado');
        
        // 9. Configurar eventos
        setupEventListeners();
        console.log('✅ Event listeners configurados');
        
        // 10. Ocultar loading
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }
        
        // 11. Notificación de éxito
        setTimeout(() => {
            if (window.UINotifications) {
                UINotifications.success('Aplicación cargada correctamente', 3000);
            }
        }, 1000);
        
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando la aplicación:', error);
        handleError(error);
        
        // Forzar ocultar loading en caso de error
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

function setupEventListeners() {
    // Filtros
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const filter = this.dataset.filter;
            if (window.productosManager) {
                window.productosManager.filtrarVehiculos(filter);
            }
        });
    });
    
    // Botón refresh
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            if (window.productosManager) {
                window.productosManager.cargarVehiculos(true);
            }
        });
    }
    
    // Menú móvil
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }
    
    // Cerrar menú al hacer clic en enlace
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu) {
                mobileMenu.classList.remove('active');
                if (menuToggle) menuToggle.classList.remove('active');
            }
        });
    });
}

function handleError(error) {
    const vehiclesContainer = document.getElementById('vehiclesContainer');
    if (vehiclesContainer) {
        vehiclesContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="empty-state-title">Error al cargar</h3>
                <p class="empty-state-message">
                    Hubo un problema al cargar los vehículos.<br>
                    Por favor, recarga la página o contacta con soporte.
                </p>
                <div class="empty-state-actions">
                    <button class="button" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Recargar página
                    </button>
                    <a href="https://wa.me/56938654827" target="_blank" class="button button-outline">
                        <i class="fab fa-whatsapp"></i> Contactar soporte
                    </a>
                </div>
            </div>
        `;
    }
    
    // Mostrar notificación si está disponible
    if (window.UINotifications) {
        UINotifications.error('Error al inicializar: ' + error.message);
    }
}

// Manejar errores globales
window.addEventListener('error', function(event) {
    console.error('❌ Error no capturado:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Promesa rechazada:', event.reason);
});
