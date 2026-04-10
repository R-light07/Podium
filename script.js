/**
 * PODIUM — SCRIPT.JS
 * Funcionalidades: Header scroll, Menu mobile, Contadores de estatísticas,
 * Slider de depoimentos, Tabs, Scroll reveal, Validação de formulário
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     1. HEADER — Sticky com background ao scroll
     ============================================================ */
  const header = document.getElementById('header');

  const handleScroll = () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Executar na inicialização

  /* ============================================================
     2. MENU HAMBURGER (Mobile)
     ============================================================ */
  const hamburger = document.getElementById('hamburger');
  const nav       = document.getElementById('nav');

  hamburger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen.toString());
    // Prevenir scroll do body quando menu está aberto
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Fechar menu ao clicar em um link de navegação
  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Fechar menu ao clicar fora
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') &&
        !nav.contains(e.target) &&
        !hamburger.contains(e.target)) {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* ============================================================
     3. ACTIVE NAV LINK baseado em scroll
     ============================================================ */
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav__link');

  const observerOptions = {
    root: null,
    rootMargin: '-40% 0px -55% 0px',
    threshold: 0
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => sectionObserver.observe(sec));

  /* ============================================================
     4. CONTADORES DE ESTATÍSTICAS (animação ao entrar na viewport)
     ============================================================ */
  const statNumbers = document.querySelectorAll('.stat__number[data-target]');

  /**
   * Anima um número de 0 até o valor alvo
   * @param {HTMLElement} el — elemento a animar
   * @param {number} target — valor final
   * @param {number} duration — duração em ms
   */
  const animateCounter = (el, target, duration = 2000) => {
    const start     = performance.now();
    const isLarge   = target >= 1000;
    const suffix    = isLarge ? 'K+' : '+';
    const displayTarget = isLarge ? target / 1000 : target;

    const step = (timestamp) => {
      const elapsed  = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: ease-out
      const eased   = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * displayTarget);

      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = displayTarget + suffix;
      }
    };

    requestAnimationFrame(step);
  };

  // Observar quando a stats bar entra na viewport
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statNumbers.forEach(el => {
          const target = parseInt(el.getAttribute('data-target'), 10);
          animateCounter(el, target);
        });
        statsObserver.disconnect(); // Animar apenas uma vez
      }
    });
  }, { threshold: 0.5 });

  const statsBar = document.querySelector('.stats-bar');
  if (statsBar) statsObserver.observe(statsBar);

  /* ============================================================
     5. TABS — Alternância entre secções de conteúdo
     ============================================================ */
  const tabBtns = document.querySelectorAll('.tab-btn');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remover active de todos
      tabBtns.forEach(b => b.classList.remove('active'));
      // Activar o clicado
      btn.classList.add('active');

      // Scroll suave para a secção correspondente
      const targetId = btn.getAttribute('data-tab');
      const sectionMap = {
        'noticias-tab': '#noticias',
        'agenda-tab':   '#agenda'
      };
      const targetSection = document.querySelector(sectionMap[targetId]);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ============================================================
     6. SLIDER DE DEPOIMENTOS (automático + manual por dots)
     ============================================================ */
  const testimonials = document.querySelectorAll('.testimonial');
  const dots         = document.querySelectorAll('.dot');
  let currentSlide   = 0;
  let autoPlayTimer;

  /**
   * Mostrar slide específico
   * @param {number} index — índice do slide
   */
  const showSlide = (index) => {
    testimonials.forEach((t, i) => t.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    currentSlide = index;
  };

  // Avançar para o próximo slide
  const nextSlide = () => {
    showSlide((currentSlide + 1) % testimonials.length);
  };

  // Iniciar autoplay
  const startAutoPlay = () => {
    autoPlayTimer = setInterval(nextSlide, 4500);
  };

  // Parar autoplay
  const stopAutoPlay = () => {
    clearInterval(autoPlayTimer);
  };

  // Eventos nos dots
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      stopAutoPlay();
      showSlide(parseInt(dot.getAttribute('data-index'), 10));
      startAutoPlay();
    });
  });

  // Iniciar
  if (testimonials.length > 0) startAutoPlay();

  // Pausar no hover
  const testimonialSlider = document.getElementById('testimonialSlider');
  if (testimonialSlider) {
    testimonialSlider.addEventListener('mouseenter', stopAutoPlay);
    testimonialSlider.addEventListener('mouseleave', startAutoPlay);
  }

  /* ============================================================
     7. SCROLL REVEAL — Animação de entrada dos elementos
     ============================================================ */
  const revealElements = document.querySelectorAll(
    '.news-card, .team-card, .cat-card, .timeline__item, ' +
    '.stat, .about__content, .about__visual, ' +
    '.news__header, .team__header, .categories__header, .agenda__header'
  );

  // Adicionar classe reveal a elementos relevantes
  revealElements.forEach(el => {
    el.classList.add('reveal');
  });

  // Adicionar reveal-group a grids
  document.querySelectorAll(
    '.news__grid, .team__grid, .categories__grid'
  ).forEach(grid => {
    grid.classList.add('reveal-group');
    // Remover reveal individual dos filhos diretos quando em grupo
    grid.querySelectorAll(':scope > .reveal').forEach(child => {
      child.classList.remove('reveal');
    });
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.reveal, .reveal-group').forEach(el => {
    revealObserver.observe(el);
  });

  /* ============================================================
     8. VALIDAÇÃO DO FORMULÁRIO DE NEWSLETTER
     ============================================================ */
  const form        = document.getElementById('newsletterForm');
  const emailInput  = document.getElementById('emailInput');
  const formError   = document.getElementById('formError');
  const formSuccess = document.getElementById('formSuccess');

  /**
   * Validar formato de email
   * @param {string} email
   * @returns {boolean}
   */
  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  if (form) {
    // Limpar erros ao digitar
    emailInput.addEventListener('input', () => {
      formError.textContent   = '';
      formSuccess.textContent = '';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();

      // Resetar mensagens
      formError.textContent   = '';
      formSuccess.textContent = '';

      // Validações
      if (!email) {
        formError.textContent = 'Por favor, introduza o seu email.';
        emailInput.focus();
        return;
      }

      if (!isValidEmail(email)) {
        formError.textContent = 'Por favor, introduza um email válido.';
        emailInput.focus();
        return;
      }

      // Simular envio (em produção: substituir por chamada API real)
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = '⟳';
      submitBtn.disabled    = true;

      setTimeout(() => {
        formSuccess.textContent = '✓ Subscrito com sucesso! Bem-vindo à comunidade Podium.';
        emailInput.value        = '';
        submitBtn.textContent   = '→';
        submitBtn.disabled      = false;

        // Limpar mensagem de sucesso após 5 segundos
        setTimeout(() => { formSuccess.textContent = ''; }, 5000);
      }, 1200);
    });
  }

  /* ============================================================
     9. NAVEGAÇÃO DAS NOTÍCIAS (botões de setas)
     ============================================================ */
  const newsPrev = document.getElementById('newsPrev');
  const newsNext = document.getElementById('newsNext');
  const newsGrid = document.querySelector('.news__grid');

  // Simulação simples de paginação (animar grelha)
  if (newsPrev && newsNext && newsGrid) {
    const animateGrid = (direction) => {
      newsGrid.style.opacity   = '0';
      newsGrid.style.transform = `translateX(${direction === 'next' ? '-20px' : '20px'})`;

      setTimeout(() => {
        // Em produção: carregar artigos reais via fetch/API
        newsGrid.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        newsGrid.style.opacity    = '1';
        newsGrid.style.transform  = 'translateX(0)';
      }, 300);
    };

    newsGrid.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    newsNext.addEventListener('click', () => animateGrid('next'));
    newsPrev.addEventListener('click', () => animateGrid('prev'));
  }

  /* ============================================================
     10. SCROLL SUAVE — Todos os links âncora internos
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = header ? header.offsetHeight + 16 : 80;
        const top    = target.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ============================================================
     11. HOVER PARALLAX — Cards das categorias
     ============================================================ */
  document.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const centerX = rect.left + rect.width  / 2;
      const centerY = rect.top  + rect.height / 2;
      const deltaX  = (e.clientX - centerX) / (rect.width  / 2);
      const deltaY  = (e.clientY - centerY) / (rect.height / 2);

      card.style.transform = `
        translateY(-6px)
        rotateY(${deltaX * 4}deg)
        rotateX(${-deltaY * 4}deg)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s ease';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease';
    });
  });

});
