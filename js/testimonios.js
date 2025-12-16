import { CONFIG } from './config.js';
import { supabaseService } from './supabase.js';

// Sistema de testimonios y vehículos vendidos
export class TestimoniosManager {
  constructor() {
    this.testimonios = [];
    this.filtroActual = 'all';
    this.currentIndex = 0;
    this.autoRotateInterval = null;
  }
  
  // Inicializar sistema
  async init() {
    await this.cargarTestimonios();
    this.renderSeccionTestimonios();
    this.iniciarAutoRotate();
    this.initEventListeners();
  }
  
  // Cargar testimonios desde Supabase
  async cargarTestimonios() {
    try {
      console.log('📣 Cargando testimonios desde Supabase...');
      
      this.testimonios = await supabaseService.getVendidosConTestimonios(this.filtroActual);
      
      // Si no hay testimonios en Supabase, usar datos de ejemplo
      if (this.testimonios.length === 0) {
        console.log('ℹ️ Usando testimonios de ejemplo para desarrollo');
        this.testimonios = this.getTestimoniosEjemplo();
      }
      
      console.log(`✅ ${this.testimonios.length} testimonios cargados`);
      
    } catch (error) {
      console.error('❌ Error cargando testimonios:', error);
      this.testimonios = this.getTestimoniosEjemplo();
    }
  }
  
  // Renderizar sección completa en el HTML
  renderSeccionTestimonios() {
    const section = document.getElementById('testimoniosSection');
    if (!section) {
      console.warn('⚠️ Sección de testimonios no encontrada en el DOM');
      return;
    }
    
    section.innerHTML = this.getHTMLSeccionCompleta();
    
    // Renderizar testimonios
    this.renderTestimonios();
    
    // Inicializar controles
    this.initTestimonialControls();
  }
  
  // HTML de la sección completa
  getHTMLSeccionCompleta() {
    return `
      <div class="testimonios-section" id="sold">
        <h2 class="section-title">Vendidos con Testimonios Reales</h2>
        <p class="section-subtitle">Clientes satisfechos que ya disfrutan de sus vehículos americanos</p>
        
        <!-- Filtros por kit -->
        <div class="testimonial-filters">
          <button class="filter-btn active" data-filter="all">Todos</button>
          <button class="filter-btn" data-filter="full">
            <i class="fas fa-crown"></i> Kit Full
          </button>
          <button class="filter-btn" data-filter="medium">
            <i class="fas fa-medal"></i> Kit Medium
          </button>
          <button class="filter-btn" data-filter="standar">
            <i class="fas fa-star"></i> Kit Standard
          </button>
        </div>
        
        <!-- Contenedor de testimonios -->
        <div class="testimonios-container">
          <div class="testimonios-carousel" id="testimoniosCarousel">
            <!-- Los testimonios se cargarán aquí -->
          </div>
          
          <!-- Controles de navegación -->
          <div class="testimonial-controls">
            <button class="testimonial-nav-btn prev" id="testimonialPrev">
              <i class="fas fa-chevron-left"></i>
            </button>
            
            <div class="testimonial-indicators" id="testimonialIndicators">
              <!-- Los indicadores se generarán dinámicamente -->
            </div>
            
            <button class="testimonial-nav-btn next" id="testimonialNext">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        
        <!-- Formulario para enviar testimonio (solo visible si el usuario tiene un vehículo) -->
        <div class="testimonial-form-container" style="display: none;" id="testimonialFormContainer">
          <h3>¿Ya tienes tu vehículo IAC? ¡Cuéntanos tu experiencia!</h3>
          <form id="testimonialForm">
            <div class="form-group">
              <input type="text" placeholder="Tu nombre" required id="testimonialName">
            </div>
            <div class="form-group">
              <input type="email" placeholder="Email" id="testimonialEmail">
            </div>
            <div class="form-group">
              <select id="testimonialKit">
                <option value="">¿Qué kit tienes instalado?</option>
                <option value="standar">Kit Standard</option>
                <option value="medium">Kit Medium</option>
                <option value="full">Kit Full</option>
              </select>
            </div>
            <div class="form-group">
              <textarea placeholder="Tu testimonio (mínimo 20 caracteres)" 
                        rows="4" required 
                        minlength="20" maxlength="500" 
                        id="testimonialText"></textarea>
              <div class="char-count">
                <span id="charCount">0</span>/500 caracteres
              </div>
            </div>
            <div class="form-group">
              <div class="rating-stars" id="ratingStars">
                <span class="star" data-rating="1">★</span>
                <span class="star" data-rating="2">★</span>
                <span class="star" data-rating="3">★</span>
                <span class="star" data-rating="4">★</span>
                <span class="star" data-rating="5">★</span>
              </div>
              <input type="hidden" id="testimonialRating" value="5">
            </div>
            <button type="submit" class="button">
              <i class="fas fa-paper-plane"></i> Enviar Testimonio
            </button>
          </form>
        </div>
        
        <!-- Botón para mostrar formulario -->
        <div class="testimonial-cta">
          <button class="button button-outline" id="showTestimonialForm">
            <i class="fas fa-comment-alt"></i> Compartir Mi Experiencia
          </button>
          <p class="testimonial-disclaimer">
            * Todos los testimonios son verificados y aprobados por nuestro equipo.
          </p>
        </div>
      </div>
    `;
  }
  
  // Renderizar testimonios en el carrusel
  renderTestimonios() {
    const carousel = document.getElementById('testimoniosCarousel');
    const indicators = document.getElementById('testimonialIndicators');
    
    if (!carousel || !indicators) return;
    
    // Limpiar contenido anterior
    carousel.innerHTML = '';
    indicators.innerHTML = '';
    
    if (this.testimonios.length === 0) {
      carousel.innerHTML = `
        <div class="testimonial-card empty">
          <div class="empty-testimonial">
            <i class="fas fa-comments" style="font-size: 48px; color: #86868b; margin-bottom: 16px;"></i>
            <h3>Próximamente más testimonios</h3>
            <p>Sé el primero en compartir tu experiencia</p>
            <button class="button" id="beFirstTestimonial">
              <i class="fas fa-pen"></i> Compartir Mi Experiencia
            </button>
          </div>
        </div>
      `;
      return;
    }
    
    // Generar testimonios
    this.testimonios.forEach((testimonio, index) => {
      const testimonioHTML = this.generateTestimonialHTML(testimonio, index);
      carousel.innerHTML += testimonioHTML;
      
      // Generar indicador
      indicators.innerHTML += `
        <button class="testimonial-indicator ${index === 0 ? 'active' : ''}" 
                data-index="${index}">
          <span class="sr-only">Testimonio ${index + 1}</span>
        </button>
      `;
    });
    
    // Mostrar primer testimonio
    this.showTestimonial(0);
  }
  
  // Generar HTML de un testimonio individual
  generateTestimonialHTML(testimonio, index) {
    const fotos = testimonio.fotos_post_venta || [];
    const primeraFoto = fotos.length > 0 ? fotos[0] : CONFIG.app.testimonialPlaceholder;
    
    // Estrellas de calificación
    const rating = testimonio.calificacion || 5;
    const starsHTML = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    
    // Fecha formateada
    const fecha = new Date(testimonio.fecha_venta || testimonio.created_at);
    const fechaFormateada = fecha.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long'
    });
    
    return `
      <div class="testimonial-card ${index === 0 ? 'active' : ''}" 
           data-index="${index}" 
           style="display: ${index === 0 ? 'flex' : 'none'};">
        
        <div class="testimonial-images">
          <div class="main-testimonial-image">
            <img src="${primeraFoto}" 
                 alt="Vehículo de ${testimonio.cliente_nombre}"
                 loading="lazy"
                 onerror="this.src='${CONFIG.app.testimonialPlaceholder}'">
          </div>
          
          ${fotos.length > 1 ? `
          <div class="testimonial-thumbnails">
            ${fotos.slice(0, 3).map((foto, i) => `
              <div class="thumbnail ${i === 0 ? 'active' : ''}">
                <img src="${foto}" 
                     alt="Foto ${i + 1}"
                     loading="lazy"
                     onclick="testimoniosManager.showTestimonialImage(${index}, ${i})">
              </div>
            `).join('')}
            ${fotos.length > 3 ? `
              <div class="thumbnail more-count">
                +${fotos.length - 3}
              </div>
            ` : ''}
          </div>
          ` : ''}
        </div>
        
        <div class="testimonial-content">
          <div class="testimonial-header">
            <div class="testimonial-rating">
              <span class="stars">${starsHTML}</span>
              <span class="rating-text">${rating}/5</span>
            </div>
            <div class="testimonial-date">${fechaFormateada}</div>
          </div>
          
          <div class="testimonial-text">
            "${testimonio.testimonio}"
          </div>
          
          <div class="testimonial-author">
            <div class="author-info">
              <h4>${testimonio.cliente_nombre}</h4>
              <p>${testimonio.cliente_ciudad || 'Arica, Chile'}</p>
            </div>
            <div class="author-kit">
              <span class="kit-badge ${testimonio.kit_instalado || 'standar'}">
                <i class="fas fa-${testimonio.kit_instalado === 'full' ? 'crown' : testimonio.kit_instalado === 'medium' ? 'medal' : 'star'}"></i>
                Kit ${testimonio.kit_instalado || 'Standard'}
              </span>
            </div>
          </div>
          
          ${testimonio.video_url ? `
          <div class="testimonial-video">
            <a href="${testimonio.video_url}" target="_blank" class="video-link">
              <i class="fas fa-play-circle"></i> Ver video del vehículo
            </a>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  // Mostrar testimonio específico
  showTestimonial(index) {
    // Ocultar todos
    document.querySelectorAll('.testimonial-card').forEach(card => {
      card.style.display = 'none';
      card.classList.remove('active');
    });
    
    // Mostrar seleccionado
    const selectedCard = document.querySelector(`.testimonial-card[data-index="${index}"]`);
    if (selectedCard) {
      selectedCard.style.display = 'flex';
      selectedCard.classList.add('active');
      
      // Actualizar indicadores
      document.querySelectorAll('.testimonial-indicator').forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
      });
      
      this.currentIndex = index;
      
      // Reiniciar auto-rotate
      this.restartAutoRotate();
    }
  }
  
  // Inicializar controles
  initTestimonialControls() {
    // Botones anterior/siguiente
    document.getElementById('testimonialPrev')?.addEventListener('click', () => {
      this.prevTestimonial();
    });
    
    document.getElementById('testimonialNext')?.addEventListener('click', () => {
      this.nextTestimonial();
    });
    
    // Indicadores
    document.querySelectorAll('.testimonial-indicator').forEach(indicator => {
      indicator.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.showTestimonial(index);
      });
    });
    
    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const filter = e.currentTarget.dataset.filter;
        await this.filterTestimonios(filter);
        
        // Actualizar estado activo de filtros
        document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
      });
    });
    
    // Formulario
    this.initTestimonialForm();
  }
  
  // Filtrar testimonios
  async filterTestimonios(filter) {
    this.filtroActual = filter;
    await this.cargarTestimonios();
    this.renderTestimonios();
    
    // Track event
    supabaseService.trackEvent('filter_testimonials', { filter });
  }
  
  // Navegación anterior
  prevTestimonial() {
    let newIndex = this.currentIndex - 1;
    if (newIndex < 0) {
      newIndex = this.testimonios.length - 1;
    }
    this.showTestimonial(newIndex);
  }
  
  // Navegación siguiente
  nextTestimonial() {
    let newIndex = this.currentIndex + 1;
    if (newIndex >= this.testimonios.length) {
      newIndex = 0;
    }
    this.showTestimonial(newIndex);
  }
  
  // Auto-rotate del carrusel
  iniciarAutoRotate() {
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
    }
    
    this.autoRotateInterval = setInterval(() => {
      if (this.testimonios.length > 1) {
        this.nextTestimonial();
      }
    }, CONFIG.testimonios.autoRotateInterval);
  }
  
  restartAutoRotate() {
    clearInterval(this.autoRotateInterval);
    this.iniciarAutoRotate();
  }
  
  // Inicializar formulario de testimonio
  initTestimonialForm() {
    const form = document.getElementById('testimonialForm');
    const textarea = document.getElementById('testimonialText');
    const charCount = document.getElementById('charCount');
    const showFormBtn = document.getElementById('showTestimonialForm');
    const formContainer = document.getElementById('testimonialFormContainer');
    
    if (!form) return;
    
    // Contador de caracteres
    if (textarea && charCount) {
      textarea.addEventListener('input', () => {
        const length = textarea.value.length;
        charCount.textContent = length;
        
        if (length < 20) {
          charCount.style.color = 'var(--error)';
        } else if (length > 450) {
          charCount.style.color = 'var(--warning)';
        } else {
          charCount.style.color = 'var(--success)';
        }
      });
    }
    
    // Estrellas de rating
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('testimonialRating');
    
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.rating);
        ratingInput.value = rating;
        
        // Actualizar visualización
        stars.forEach((s, i) => {
          if (i < rating) {
            s.classList.add('selected');
          } else {
            s.classList.remove('selected');
          }
        });
      });
    });
    
    // Mostrar/ocultar formulario
    if (showFormBtn && formContainer) {
      showFormBtn.addEventListener('click', () => {
        formContainer.style.display = 'block';
        showFormBtn.style.display = 'none';
        window.scrollTo({
          top: formContainer.offsetTop - 100,
          behavior: 'smooth'
        });
      });
    }
    
    // Enviar formulario
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const testimonioData = {
        cliente_nombre: document.getElementById('testimonialName').value,
        cliente_email: document.getElementById('testimonialEmail').value,
        mensaje: document.getElementById('testimonialText').value,
        calificacion: parseInt(document.getElementById('testimonialRating').value),
        kit_instalado: document.getElementById('testimonialKit').value,
        aprobado: false // Siempre false inicialmente
      };
      
      // Validación básica
      if (testimonioData.mensaje.length < 20) {
        alert('El testimonio debe tener al menos 20 caracteres');
        return;
      }
      
      // Enviar a Supabase
      const result = await supabaseService.enviarTestimonio(testimonioData);
      
      if (result.success) {
        alert(result.message);
        form.reset();
        formContainer.style.display = 'none';
        if (showFormBtn) showFormBtn.style.display = 'block';
        
        // Track event
        supabaseService.trackEvent('testimonial_submitted', {
          has_rating: !!testimonioData.calificacion,
          has_kit: !!testimonioData.kit_instalado
        });
      } else {
        alert(result.message);
      }
    });
  }
  
  // Testimonios de ejemplo (para desarrollo)
  getTestimoniosEjemplo() {
    return [
      {
        id: "1",
        cliente_nombre: "Carlos Rodríguez",
        cliente_ciudad: "Arica",
        testimonio: "Excelente experiencia con Import American Cars. Mi Ford F-150 llegó en perfecto estado y el kit full transformó completamente el vehículo. Superó todas mis expectativas.",
        calificacion: 5,
        kit_instalado: "full",
        fotos_post_venta: [
          "https://images.unsplash.com/photo-1580274455191-1c62238fa333?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        ],
        video_url: "https://www.instagram.com/reel/example",
        fecha_venta: "2024-02-15",
        aprobado: true
      },
      {
        id: "2",
        cliente_nombre: "María González",
        cliente_ciudad: "Iquique",
        testimonio: "Compré mi Chevrolet Silverado con kit medium y estoy encantada. El proceso fue transparente y el vehículo llegó antes de lo esperado. Totalmente recomendado.",
        calificacion: 5,
        kit_instalado: "medium",
        fotos_post_venta: [
          "https://images.unsplash.com/photo-1555212697-194d092e3b8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        ],
        fecha_venta: "2024-01-20",
        aprobado: true
      },
      {
        id: "3",
        cliente_nombre: "Juan Pérez",
        cliente_ciudad: "Arica",
        testimonio: "Mi primera experiencia importando un vehículo y fue impecable. El equipo de IAC se encargó de todo. Mi RAM 1500 con kit standard es justo lo que necesitaba para mi negocio.",
        calificacion: 4,
        kit_instalado: "standar",
        fotos_post_venta: [
          "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        ],
        fecha_venta: "2023-12-10",
        aprobado: true
      }
    ];
  }
}

// Instancia global
export const testimoniosManager = new TestimoniosManager();

// Hacer accesible globalmente para onclick
window.testimoniosManager = testimoniosManager;