// main.js - VERSIÓN SIMPLIFICADA Y ROBUSTA
export async function initializeApp() {
  console.log('🚀 Inicializando aplicación...');
  
  const loadingOverlay = document.getElementById('loadingOverlay');
  
  try {
    // 1. Cargar configuración
    const { CONFIG } = await import('./config.js');
    window.CONFIG = CONFIG;
    console.log('✅ Configuración cargada');
    
    // 2. Cargar e inicializar SupabaseService
    const { SupabaseService } = await import('./supabase-service.js');
    
    // Test de conexión
    console.log('🔌 Probando conexión con Supabase...');
    const connected = await SupabaseService.init(CONFIG);
    
    if (!connected) {
      console.error('❌ No se pudo conectar con Supabase');
      throw new Error('Error de conexión con la base de datos');
    }
    
    console.log('✅ Conexión establecida con Supabase');
    
    // 3. Cargar ProductosManager
    const { ProductosManager } = await import('./productos-manager.js');
    
    // 4. Crear instancia de ProductosManager
    window.productosManager = new ProductosManager(CONFIG);
    
    // Inicializar ProductosManager
    const productosInitialized = await window.productosManager.init();
    
    if (!productosInitialized) {
      throw new Error('Error inicializando el gestor de productos');
    }
    
    // 5. Cargar módulos UI
    const { UICore, UINotifications } = await import('./ui-core.js');
    const { UISlider, UIModals, UIKits } = await import('./ui-components.js');
    const { UIManager } = await import('./ui-manager.js');
    
    // Hacer disponibles globalmente
    window.UICore = UICore;
    window.UINotifications = UINotifications;
    window.UISlider = UISlider;
    window.UIModals = UIModals;
    window.UIKits = UIKits;
    window.UIManager = UIManager;
    
    // 6. Inicializar UIManager
    await UIManager.init();
    
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
      UINotifications.success('Aplicación cargada correctamente', 3000);
    }, 500);
    
    console.log('✅ Aplicación inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error crítico en la aplicación:', error);
    handleCriticalError(error);
    
    // Forzar ocultar loading
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }
}
