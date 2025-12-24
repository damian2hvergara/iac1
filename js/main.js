// main.js - Inicialización simplificada
import { CONFIG } from './config.js';
import { SupabaseService } from './supabase-service.js';
import { ProductosManager } from './productos-manager.js';
import { UICore, UINotifications } from './ui-core.js';
import { UISlider, UIModals, UIKits } from './ui-components.js';
import { UIManager } from './ui-manager.js';

export async function initializeApp() {
    console.log('🚀 Inicializando aplicación...');
    
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    try {
        // 1. Configurar globales
        window.CONFIG = CONFIG;
        console.log('✅ Configuración cargada');
        
        // 2. Inicializar servicios
        window.SupabaseService = SupabaseService;
        console.log('✅ SupabaseService disponible');
        
        // 3. Inicializar UI Manager primero
        window.UICore = UICore;
        window.UINotifications = UINotifications;
        window.UISlider = UISlider;
        window.UIModals = UIModals;
        window.UIKits = UIKits;
        window.UIManager = UIManager;
        
        console.log('✅ Módulos UI cargados');
        
        // 4. Inicializar UIManager
        await UIManager.init({
            autoInitSlider: true
        });
        console.log('✅ UIManager inicializado');
        
        // 5. Inicializar ProductosManager
        window.productosManager = new ProductosManager(CONFIG);
        console.log('✅ ProductosManager inicializado');
        
        // 6. Configurar eventos básicos
        setupEventListeners();
        console.log('✅ Event listeners configurados');
        
        // 7. Ocultar loading
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }
        
        // 8. Notificación de éxito
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
    const closeMenu = document.getElementById('closeMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }
    
    if (closeMenu && mobileMenu) {
        closeMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
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
            <div class="empty-state">
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
        UINotifications.error('Error al inicializar la aplicación: ' + error.message);
    }
}

// Manejar errores no capturados
window.addEventListener('error', function(event) {
    console.error('❌ Error no capturado:', event.error);
    if (window.UINotifications) {
        UINotifications.error('Error en la aplicación');
    }
});

// Manejar promesas rechazadas
window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Promesa rechazada no capturada:', event.reason);
});
