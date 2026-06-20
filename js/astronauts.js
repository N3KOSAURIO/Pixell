/**
 * SINCE MARKETING - Módulo Astronautas
 * Funcionalidad específica para páginas de servicios con astronautas
 */

class AstronautsController {
  constructor() {
    this.astronauts = [];
    this.serviceSections = [];
    this.currentActiveService = null;
    this.isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    this.observer = null;
    this.scrollTimer = null;
    this.resizeTimer = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    const servicesSection = document.querySelector('.space-services-individual');
    if (!servicesSection || !this.isDesktop) return;

    this.astronauts = document.querySelectorAll('.astronaut-floating');
    this.serviceSections = document.querySelectorAll('.service-individual-section[data-service]');
    
    if (this.astronauts.length === 0 || this.serviceSections.length === 0) return;

    this.preloadImages();
    this.setupObserver();
    this.setupEventListeners();
    this.setupCleanup();
    
    // Inicialización con delay mínimo
    requestAnimationFrame(() => {
      setTimeout(() => this.manualCheck(), 50);
    });

    this.isInitialized = true;
  }

  preloadImages() {
    const imageUrls = [
      'img/astronaut-1.avif',
      'img/astronaut-2.avif', 
      '/img/astronaut-3.png',
      'img/astronaut-4.avif'
    ];
    
    const fragment = document.createDocumentFragment();
    imageUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      fragment.appendChild(link);
    });
    document.head.appendChild(fragment);
  }

  setupObserver() {
    this.observer = new IntersectionObserver(
      (entries) => this.handleServiceIntersection(entries),
      {
        threshold: [0.3, 0.5, 0.7],
        rootMargin: '-10% 0px -10% 0px'
      }
    );

    this.serviceSections.forEach(section => this.observer.observe(section));
  }

  setupEventListeners() {
    const handleScroll = () => {
      if (this.scrollTimer) return;
      
      this.scrollTimer = requestAnimationFrame(() => {
        this.manualCheck();
        this.scrollTimer = null;
      });
    };

    const handleResize = () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.isDesktop = window.matchMedia('(min-width: 1024px)').matches;
        if (!this.isDesktop) {
          this.clearAllAstronauts();
          this.currentActiveService = null;
        } else {
          this.manualCheck();
        }
      }, 250);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
  }

  setupCleanup() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clearAllAstronauts();
        this.currentActiveService = null;
      } else {
        setTimeout(() => this.manualCheck(), 100);
      }
    });
  }

  handleServiceIntersection(entries) {
    let newActiveService = null;
    let maxRatio = 0;
    
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
        maxRatio = entry.intersectionRatio;
        newActiveService = entry.target.dataset.service;
      }
    });
    
    this.updateActiveService(newActiveService);
  }

  manualCheck() {
    if (!this.isDesktop) return;

    let newActiveService = null;
    let maxVisibility = 0;
    
    this.serviceSections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      
      const visibilityTop = Math.max(0, Math.min(viewHeight, rect.bottom) - Math.max(0, rect.top));
      const visibilityPercentage = visibilityTop / viewHeight;
      
      if (visibilityPercentage > maxVisibility && visibilityPercentage > 0.3) {
        maxVisibility = visibilityPercentage;
        newActiveService = section.dataset.service;
      }
    });
    
    this.updateActiveService(newActiveService);
  }

  updateActiveService(newActiveService) {
    if (newActiveService === this.currentActiveService) return;
    
    this.clearAllAstronauts();
    
    if (newActiveService) {
      const astronaut = document.querySelector(`[data-service="${newActiveService}"].astronaut-floating`);
      if (astronaut) {
        astronaut.classList.add('active');
      }
    }
    
    this.currentActiveService = newActiveService;
  }

  clearAllAstronauts() {
    this.astronauts.forEach(astronaut => {
      astronaut.classList.remove('active');
    });
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.scrollTimer) {
      cancelAnimationFrame(this.scrollTimer);
      this.scrollTimer = null;
    }

    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }

    this.clearAllAstronauts();
    this.currentActiveService = null;
  }
}

// ================================
// INICIALIZACIÓN AUTOMÁTICA
// ================================

const astronautsController = new AstronautsController();

// Inicializar cuando DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Limpiar astronautas inmediatamente (reemplaza el script inline)
    document.querySelectorAll('.astronaut-floating').forEach(astronaut => {
      astronaut.classList.remove('active');
    });
    
    // Inicializar controlador
    astronautsController.init();
  });
} else {
  // Limpiar astronautas inmediatamente
  document.querySelectorAll('.astronaut-floating').forEach(astronaut => {
    astronaut.classList.remove('active');
  });
  
  // Inicializar controlador
  astronautsController.init();
}

// Cleanup automático
window.addEventListener('beforeunload', () => {
  astronautsController.cleanup();
});

// Exportar globalmente para debugging
window.astronautsController = astronautsController;