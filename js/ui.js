import { CONFIG } from './config.js';

// Bottom Navigation para móviles
export class MobileNavigation {
  constructor() {
    this.navElement = null;
    this.activeItem = 'home';
    this.isVisible = false;
  }
  
  // Inicializar navegación
  init() {
    if (!this.shouldShowMobileNav()) return;
    
    this.createNavElement();
    this.appendToDOM();
    this.setupEventListeners();
    this.updateActiveItem();
    
    console.log('📱 Mobile Navigation inicializada');
  }
  
  // Verificar si debe mostrarse (solo en móviles)
  shouldShowMobileNav() {
    return window.innerWidth <= 768;
  }
  
  // Crear elemento de navegación
  createNavElement() {
    this.navElement = document.createElement('div');
    this.navElement.className = 'mobile-bottom-nav';
    this.navElement.id = 'mobileBottomNav';
    
    this.navElement.innerHTML = `
      <div class="mobile-nav-container">
        ${CONFIG.mobileNav.items.map(item => `
          <button class="mobile-nav-item ${item.section === 'home' ? 'active' : ''}" 
                  data-section="${item.section}">
            <div class="nav-icon">
              <i class="fas ${item.icon}"></i>
            </div>
            <div class="nav-label">${item.label}</div>
          </button>
        `).join('')}
      </div>
    `;
  }
  
  // Agregar al DOM
  appendToDOM() {
    document.body.appendChild(this.navElement);
    
    // Ajustar padding del body para no cubrir contenido
    const navHeight = this.navElement.offsetHeight;
    document.body.style.paddingBottom = `${navHeight}px`;
  }
  
  // Configurar event listeners
  setupEventListeners() {
    // Navegación por items
    this.navElement.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        this.navigateToSection(section);
      });
    });
    
    // Ocultar en scroll down, mostrar en scroll up
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scroll down
        this.hideNav();
      } else {
        // Scroll up
        this.showNav();
      }
      
      lastScrollTop = scrollTop;
      
      // Actualizar item activo basado en scroll
      this.updateActiveItemOnScroll();
    }, { passive: true });
    
    // Resize listener
    window.addEventListener('resize', () => {
      if (this.shouldShowMobileNav()) {
        this.showNav();
      } else {
        this.hideNav();
      }
    });
  }
  
  // Navegar a sección
  navigateToSection(section) {
    const targetElement = document.getElementById(section);
    if (!targetElement) return;
    
    // Actualizar item activo
    this.setActiveItem(section);
    
    // Smooth scroll
    window.scrollTo({
      top: targetElement.offsetTop - 20,
      behavior: 'smooth'
    });
    
    // Cerrar menú hamburguesa si está abierto
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
      mobileMenu.classList.remove('active');
    }
    
    // Feedback háptico (si soportado)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Track event
    if (window.supabaseService) {
      window.supabaseService.trackEvent('mobile_nav_click', { section });
    }
  }
  
  // Establecer item activo
  setActiveItem(section) {
    this.activeItem = section;
    
    this.navElement.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });
  }
  
  // Actualizar item activo basado en scroll
  updateActiveItemOnScroll() {
    if (!this.shouldShowMobileNav()) return;
    
    const sections = CONFIG.mobileNav.items.map(item => ({
      id: item.section,
      element: document.getElementById(item.section)
    })).filter(s => s.element);
    
    const scrollPosition = window.scrollY + 100;
    
    for (const section of sections) {
      const { element, id } = section;
      const rect = element.getBoundingClientRect();
      const offsetTop = rect.top + window.scrollY;
      const offsetBottom = offsetTop + rect.height;
      
      if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
        if (this.activeItem !== id) {
          this.setActiveItem(id);
        }
        break;
      }
    }
  }
  
  // Forzar actualización de item activo
  updateActiveItem() {
    this.updateActiveItemOnScroll();
  }
  
  // Mostrar navegación
  showNav() {
    if (this.navElement && !this.isVisible) {
      this.navElement.classList.remove('hidden');
      this.isVisible = true;
    }
  }
  
  // Ocultar navegación
  hideNav() {
    if (this.navElement && this.isVisible) {
      this.navElement.classList.add('hidden');
      this.isVisible = false;
    }
  }
  
  // Destruir navegación (para cambios de tamaño)
  destroy() {
    if (this.navElement && this.navElement.parentNode) {
      this.navElement.parentNode.removeChild(this.navElement);
      document.body.style.paddingBottom = '';
    }
  }
}

// Instancia global
export const mobileNavigation = new MobileNavigation();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  mobileNavigation.init();
  
  // Re-inicializar en resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (mobileNavigation.shouldShowMobileNav()) {
        if (!document.getElementById('mobileBottomNav')) {
          mobileNavigation.init();
        }
      } else {
        mobileNavigation.destroy();
      }
    }, 250);
  });
});