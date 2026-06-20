/**
 * SINCE MARKETING - Sistema JavaScript Principal
 * Funcionalidades core sin astronautas
 */

class SinceApp {
  constructor() {
    this.modules = new Map();
    this.observers = new Set();
    this.timers = new Set();
    this.eventListeners = new Map();
    this.isInitialized = false;
  }

  registerModule(name, moduleClass, dependencies = []) {
    this.modules.set(name, {
      class: moduleClass,
      dependencies,
      instance: null,
      loaded: false
    });
  }

  async initModule(name) {
    const module = this.modules.get(name);
    if (!module || module.loaded) return module?.instance;

    for (const dep of module.dependencies) {
      await this.initModule(dep);
    }

    try {
      module.instance = new module.class(this);
      await module.instance.init?.();
      module.loaded = true;
      return module.instance;
    } catch (error) {
      console.error(`Error inicializando módulo ${name}:`, error);
      return null;
    }
  }

  addEventListeners(element, events) {
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, new Map());
    }
    
    const elementListeners = this.eventListeners.get(element);
    
    for (const [event, handler] of Object.entries(events)) {
      element.addEventListener(event, handler, { passive: true });
      elementListeners.set(event, handler);
    }
  }

  addTimer(timerFn, delay = 0) {
    const timer = setTimeout(timerFn, delay);
    this.timers.add(timer);
    return timer;
  }

  addInterval(intervalFn, delay) {
    const interval = setInterval(intervalFn, delay);
    this.timers.add(interval);
    return interval;
  }

  addObserver(observer) {
    this.observers.add(observer);
    return observer;
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect?.());
    this.observers.clear();

    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    this.eventListeners.forEach((events, element) => {
      events.forEach((handler, event) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();

    this.modules.forEach(module => {
      if (module.instance?.cleanup) {
        module.instance.cleanup();
      }
    });
  }

  async init() {
    if (this.isInitialized) return;

    const modulesToLoad = this.determineModulesToLoad();
    const loadPromises = modulesToLoad.map(name => this.initModule(name));
    await Promise.allSettled(loadPromises);

    window.addEventListener('beforeunload', () => this.cleanup());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseModules();
      } else {
        this.resumeModules();
      }
    });

    this.isInitialized = true;
  }

  determineModulesToLoad() {
    const modules = ['whatsapp', 'scrollToTop', 'animations'];
    
    if (document.querySelector('.tarjeta-blog')) {
      modules.push('blogSlider');
    }
    
    if (document.querySelector('.floating-message')) {
      modules.push('floatingMessage');
    }

    return modules;
  }

  pauseModules() {
    this.modules.forEach(module => {
      if (module.instance?.pause) {
        module.instance.pause();
      }
    });
  }

  resumeModules() {
    this.modules.forEach(module => {
      if (module.instance?.resume) {
        module.instance.resume();
      }
    });
  }
}

// ================================
// MÓDULO WHATSAPP CON RECUPERACIÓN
// ================================

class WhatsAppModule {
  constructor(app) {
    this.app = app;
    this.isMobile = /iPhone|Android|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
    this.phone = "3228084525";
    this.hasClickedWhatsApp = false;
    this.exitIntentShown = false;
  }

  async init() {
    const links = document.querySelectorAll("[data-whatsapp-link]");
    if (links.length === 0) return;

    this.setupWhatsAppLinks(links);
    this.setupFloatingButton();
    this.setupExitIntent();
    this.setupVisibilityTracking();
  }

  setupWhatsAppLinks(links) {
    const message = "¡Hola! Necesito más información sobre los servicios que vi en tu página web 🌐";

    const url = this.isMobile
      ? `https://wa.me/${this.phone}?text=${encodeURIComponent(message)}`
      : `https://web.whatsapp.com/send?phone=${this.phone}&text=${encodeURIComponent(message)}`;

    links.forEach(link => {
      link.setAttribute("href", url);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");

      link.addEventListener('click', () => {
        this.hasClickedWhatsApp = true;
        this.trackWhatsAppClick();
        this.hideTooltip();
      });
    });
  }

  setupFloatingButton() {
    // Buscar contenedor y botón flotante de WhatsApp
    const floatingWrapper = document.querySelector('.whatsapp-floating-container');
    this.floatingWrapper = floatingWrapper || null;

    const floatingButton = document.querySelector('.whatsapp-float, .whatsapp-floating, .floating-whatsapp, [class*="whatsapp"][class*="float"]');

    if (floatingButton) {
      this.createFloatingTooltip(floatingButton);
    }
  }

  createFloatingTooltip(button) {
    // Se eliminó el tooltip/letrero (tracking visual).
    // Mantener el botón flotante controlado solo por scroll (CSS + .is-visible).
    return;
  }

  setupTooltipTriggers() {
    let hasScrolled = false;
    
    const showTooltipOnScroll = () => {
      if (hasScrolled) return;

      // Disparar cuando el usuario haya bajado ~15% de la página
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || document.body.scrollTop || 0;
      const docHeight = Math.max(doc.scrollHeight, document.body.scrollHeight);
      const viewportHeight = window.innerHeight || doc.clientHeight;
      const maxScrollable = Math.max(1, docHeight - viewportHeight);

      const progress = scrollTop / maxScrollable; // 0..1
      if (progress >= 0.15) {
        hasScrolled = true;

        // Mostrar botón flotante cuando se cumpla el umbral
        if (this.floatingWrapper && this.floatingWrapper.parentNode) {
          this.floatingWrapper.classList.add('is-visible');
        }

        // Si el tooltip ya fue removido, no hacer nada
        if (this.tooltip && this.tooltip.parentNode) {
          this.tooltip.style.animation = 'tooltipSlideIn 0.4s ease-out';
          this.tooltip.classList.add('pulse');
        }
      }
    };
    
    this.app.addEventListeners(window, {
      scroll: showTooltipOnScroll
    });
  }

  hideTooltip() {
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.style.animation = 'tooltipSlideIn 0.3s ease-out reverse';
      this.app.addTimer(() => this.tooltip.remove(), 300);
    }
  }

  tryNativeWhatsApp(message) {
    // Intentar protocolo nativo
    const nativeUrl = `whatsapp://send?phone=${this.phone}&text=${encodeURIComponent(message)}`;
    window.location.href = nativeUrl;
    
    // Fallback a WhatsApp Web después de 2 segundos
    this.app.addTimer(() => {
      if (document.visibilityState === 'visible') {
        const webUrl = `https://web.whatsapp.com/send?phone=${this.phone}&text=${encodeURIComponent(message)}`;
        window.open(webUrl, '_blank');
      }
    }, 2000);
  }

  setupExitIntent() {
    this.exitIntentTimer = null;

    this.app.addEventListeners(document, {
      mouseleave: (e) => {
        if (e.clientY <= 0 && this.hasClickedWhatsApp && !this.exitIntentShown) {
          if (this.exitIntentTimer) clearTimeout(this.exitIntentTimer);
          this.exitIntentTimer = this.app.addTimer(() => this.showExitIntentPopup(), 500);
        }
      },
      mouseenter: () => {
        if (this.exitIntentTimer) {
          clearTimeout(this.exitIntentTimer);
          this.exitIntentTimer = null;
        }
      }
    });
  }

  setupVisibilityTracking() {
    let pageStartTime = Date.now();
    let pendingRecovery = false;

    this.app.addEventListeners(document, {
      visibilitychange: () => {
        if (document.hidden) {
          const timeSpent = Date.now() - pageStartTime;
          if (timeSpent > 30000 && this.hasClickedWhatsApp && !this.exitIntentShown) {
            pendingRecovery = true;
          }
        } else {
          pageStartTime = Date.now();
          if (pendingRecovery) {
            pendingRecovery = false;
            this.app.addTimer(() => this.showRecoveryPopup(), 3000);
          }
        }
      }
    });
  }

  showExitIntentPopup() {
    if (this.exitIntentShown) return;
    
    this.exitIntentShown = true;
    
    const modal = this.createWhatsAppModal({
      title: "¿Se te complicó abrir WhatsApp? 🤔",
      subtitle: "Parece que tuviste problemas para contactarnos",
      message: "Intentémoslo de nuevo o copia nuestro número",
      buttonText: "Intentar de nuevo",
      type: "exit-intent",
      showCopyOption: true
    });
    
    document.body.appendChild(modal);
    
    // Auto-close después de 15 segundos
    this.app.addTimer(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 15000);
  }

  showRecoveryPopup() {
    if (this.exitIntentShown) return;
    
    this.exitIntentShown = true;
    
    const modal = this.createWhatsAppModal({
      title: "¿Te funcionó el enlace de WhatsApp? 📱",
      subtitle: "Vemos que intentaste contactarnos hace un momento",
      message: "Si no se abrió WhatsApp, aquí tienes otras opciones",
      buttonText: "Abrir WhatsApp",
      type: "recovery",
      showCopyOption: true
    });
    
    document.body.appendChild(modal);
    
    // Auto-close después de 20 segundos
    this.app.addTimer(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 20000);
  }

  createWhatsAppModal({ title, subtitle, message, buttonText, type, showCopyOption = false }) {
    // Inyectar CSS del modal una sola vez en el documento
    if (!document.getElementById('whatsapp-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'whatsapp-modal-styles';
      style.textContent = `
        .whatsapp-modal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .3s ease-out}
        .whatsapp-modal-content{background:#fff;border-radius:16px;padding:24px;max-width:400px;width:100%;position:relative;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,.1);animation:slideUp .3s ease-out}
        .whatsapp-modal-close{position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#666;line-height:1;padding:4px;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center}
        .whatsapp-modal-close:hover{background:#f5f5f5}
        .whatsapp-modal-header h3{margin:0 0 8px;color:#333;font-size:22px}
        .whatsapp-modal-header p{margin:0 0 16px;color:#666;font-size:15px}
        .whatsapp-modal-body p{margin:0 0 20px;color:#555;line-height:1.4}
        .whatsapp-modal-button{display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:16px;transition:all .3s ease;border:2px solid #25D366;min-width:200px;justify-content:center;margin-bottom:12px}
        .whatsapp-modal-button:hover{background:#128C7E;border-color:#128C7E;transform:translateY(-2px)}
        .whatsapp-copy-button{display:block;background:#f5f5f5;color:#333;padding:10px 20px;border-radius:8px;border:none;cursor:pointer;font-size:14px;transition:all .3s ease;width:100%;margin-top:8px}
        .whatsapp-copy-button:hover{background:#e0e0e0}
        .whatsapp-modal-footer{margin-top:16px;color:#888;font-size:14px}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @media(max-width:480px){.whatsapp-modal{padding:16px}.whatsapp-modal-content{padding:20px}}
      `;
      document.head.appendChild(style);
    }

    const whatsappMessage = `¡Hola! ${subtitle} Necesito más información sobre los servicios que vi en: ${window.location.href}`;

    const url = this.isMobile
      ? `https://wa.me/${this.phone}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://web.whatsapp.com/send?phone=${this.phone}&text=${encodeURIComponent(whatsappMessage)}`;

    const modal = document.createElement('div');
    modal.className = 'whatsapp-modal';
    modal.innerHTML = `
      <div class="whatsapp-modal-content">
        <button class="whatsapp-modal-close" aria-label="Cerrar">×</button>

        <div class="whatsapp-modal-header">
          <h3>${title}</h3>
          <p>${subtitle}</p>
        </div>

        <div class="whatsapp-modal-body">
          <p>${message}</p>

          <a href="${url}"
             target="_blank"
             rel="noopener noreferrer"
             class="whatsapp-modal-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.482"/>
            </svg>
            ${buttonText}
          </a>

          ${showCopyOption ? `<button class="whatsapp-copy-button">Copiar número: ${this.phone}</button>` : ''}
        </div>

        <div class="whatsapp-modal-footer">
          <small>Te respondemos en minutos</small>
        </div>
      </div>
    `;

    modal.querySelector('.whatsapp-modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.whatsapp-modal-button').addEventListener('click', () => modal.remove());

    if (showCopyOption) {
      const copyBtn = modal.querySelector('.whatsapp-copy-button');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(this.phone);
        copyBtn.textContent = '¡Copiado!';
        this.app.addTimer(() => { copyBtn.textContent = `Copiar número: ${this.phone}`; }, 2000);
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    return modal;
  }

  trackWhatsAppClick() {
    // Tracking eliminado (Google Analytics/GTM/dataLayer/cookies).
    // Se conserva el comportamiento funcional del enlace/click sin enviar eventos.
  }

}

// ================================
// OTROS MÓDULOS (sin cambios)
// ================================

class ScrollToTopModule {
  constructor(app) {
    this.app = app;
    this.button = document.getElementById('scroll-to-top');
    this.isVisible = false;
    this.scrollTimer = null;
  }

  async init() {
    if (!this.button) return;

    this.app.addEventListeners(window, {
      scroll: () => this.handleScroll()
    });

    this.app.addEventListeners(this.button, {
      click: () => this.scrollToTop()
    });
  }

  handleScroll() {
    if (this.scrollTimer) return;
    
    this.scrollTimer = requestAnimationFrame(() => {
      this.toggleVisibility();
      this.scrollTimer = null;
    });
  }

  toggleVisibility() {
    const shouldShow = window.pageYOffset > 300;
    if (shouldShow !== this.isVisible) {
      this.isVisible = shouldShow;
      this.button.classList.toggle('visible', shouldShow);
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  pause() {
    if (this.scrollTimer) {
      cancelAnimationFrame(this.scrollTimer);
      this.scrollTimer = null;
    }
  }
}

class AnimationsModule {
  constructor(app) {
    this.app = app;
    this.elements = [];
  }

  async init() {
    this.elements = document.querySelectorAll('.animate-element');
    if (this.elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: 0.2,
        rootMargin: '50px'
      }
    );

    this.app.addObserver(observer);
    
    this.elements.forEach(element => {
      element.classList.add('is-hidden');
      observer.observe(element);
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      const element = entry.target;
      if (entry.isIntersecting) {
        element.classList.remove('is-hidden');
        requestAnimationFrame(() => {
          element.classList.add('is-visible');
        });
      } else {
        element.classList.remove('is-visible');
        element.classList.add('is-hidden');
      }
    });
  }
}

class BlogSliderModule {
  constructor(app) {
    this.app = app;
    this.sliders = [];
    this.animationIds = new Map();
  }

  async init() {
    this.sliders = document.querySelectorAll('.tarjeta-blog');
    if (this.sliders.length === 0) return;

    this.sliders.forEach(slider => this.setupSlider(slider));
  }

  setupSlider(slider) {
    const items = slider.querySelectorAll('.digital-item');
    if (items.length <= 1) return;

    let scrollAmount = 0;
    const scrollSpeed = 1.5;
    let isScrolling = true;

    const animateScroll = () => {
      if (!isScrolling) return;

      scrollAmount += scrollSpeed;
      slider.scrollLeft = scrollAmount;

      if (scrollAmount >= (slider.scrollWidth - slider.offsetWidth)) {
        scrollAmount = 0;
        slider.scrollLeft = 0;
      }

      const animationId = requestAnimationFrame(animateScroll);
      this.animationIds.set(slider, animationId);
    };

    const startAnimation = () => {
      const currentId = this.animationIds.get(slider);
      if (currentId) cancelAnimationFrame(currentId);
      
      const animationId = requestAnimationFrame(animateScroll);
      this.animationIds.set(slider, animationId);
    };

    const stopAnimation = () => {
      const currentId = this.animationIds.get(slider);
      if (currentId) {
        cancelAnimationFrame(currentId);
        this.animationIds.delete(slider);
      }
      isScrolling = false;
    };

    const resumeAnimation = () => {
      isScrolling = true;
      startAnimation();
    };

    this.setupDragFunctionality(slider, stopAnimation, resumeAnimation);

    this.app.addEventListeners(slider, {
      mouseenter: stopAnimation,
      mouseleave: resumeAnimation,
      touchstart: stopAnimation,
      touchend: resumeAnimation
    });

    startAnimation();
  }

  setupDragFunctionality(slider, stopAnimation, resumeAnimation) {
    let isDragging = false;
    let startPosition = 0;
    let startScrollLeft = 0;

    const startDrag = (e) => {
      isDragging = true;
      slider.style.cursor = 'grabbing';
      startPosition = e.pageX - slider.offsetLeft;
      startScrollLeft = slider.scrollLeft;
      stopAnimation();
    };

    const drag = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const scroll = (x - startPosition) * 2;
      slider.scrollLeft = startScrollLeft - scroll;
    };

    const stopDrag = () => {
      isDragging = false;
      slider.style.cursor = 'grab';
      resumeAnimation();
    };

    this.app.addEventListeners(slider, {
      mousedown: startDrag,
      mousemove: drag,
      mouseup: stopDrag,
      mouseleave: stopDrag
    });
  }

  cleanup() {
    this.animationIds.forEach(id => cancelAnimationFrame(id));
    this.animationIds.clear();
  }
}

class FloatingMessageModule {
  constructor(app) {
    this.app = app;
    this.message = document.querySelector('.floating-message');
  }

  async init() {
    if (!this.message) return;

    this.app.addTimer(() => {
      this.message.style.transition = 'transform 0.5s ease-out';
      this.message.style.transform = 'translateX(0)';
    }, 1000);

    window.closeFloatingMessage = () => this.closeMessage();
  }

  closeMessage() {
    if (this.message) {
      this.message.style.transition = 'transform 0.5s ease-in-out';
      this.message.style.transform = 'translateX(150%)';
      this.app.addTimer(() => this.message.remove(), 500);
    }
  }
}

// ================================
// INICIALIZACIÓN
// ================================

const sinceApp = new SinceApp();

sinceApp.registerModule('whatsapp', WhatsAppModule);
sinceApp.registerModule('scrollToTop', ScrollToTopModule);
sinceApp.registerModule('animations', AnimationsModule);
sinceApp.registerModule('blogSlider', BlogSliderModule);
sinceApp.registerModule('floatingMessage', FloatingMessageModule);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => sinceApp.init());
} else {
  sinceApp.init();
}

window.sinceApp = sinceApp;