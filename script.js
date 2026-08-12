/**
 * Creatinas — Profile Header
 * Interações: botão de mensagem.
 */
(() => {
  'use strict';

  const messageBtn = document.getElementById('messageBtn');
  const toast = document.getElementById('toast');

  let toastTimer = null;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };

  messageBtn.addEventListener('click', () => {
    showToast('Abrindo mensagens com @creatinas…');
  });

  /* =====================================================
     Categories Row — seleção de categoria
     ===================================================== */

  document.querySelectorAll('.category').forEach((category) => {
    category.addEventListener('click', () => {
      const label = category.querySelector('.category__label')?.textContent ?? '';
      showToast(`Categoria selecionada: ${label}`);
    });
  });

  /* =====================================================
     Tabs — Posts / Reels
     ===================================================== */

  const tabs = Array.from(document.querySelectorAll('.tabs__tab'));
  const tabsIndicator = document.getElementById('tabsIndicator');
  const photoGrid = document.querySelector('.photo-grid');

  const activateTab = (tab) => {
    tabs.forEach((t) => t.classList.toggle('is-active', t === tab));

    if (tabsIndicator) {
      tabsIndicator.style.left = `${tab.offsetLeft}px`;
      tabsIndicator.style.width = `${tab.offsetWidth}px`;
    }

    const isReels = tab.dataset.tab === 'reels';
    if (photoGrid) {
      photoGrid.style.display = isReels ? 'none' : 'flex';
    }
    if (isReels) {
      showToast('Reels em breve nesta prévia.');
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab));
  });

  const initialTab = tabs.find((t) => t.classList.contains('is-active'));
  if (initialTab && tabsIndicator) {
    // Aguarda o layout (fontes/imagens) para medir a posição real da aba.
    requestAnimationFrame(() => activateTab(initialTab));
  }

  /* =====================================================
     Story Viewer — lightbox das publicações do grid
     ===================================================== */

  const storyModal = document.getElementById('storyModal');
  const storyImage = document.getElementById('storyImage');
  const storyProgress = document.getElementById('storyProgress');
  const storyStage = document.querySelector('.story-modal__stage');
  const storyCloseBtn = document.getElementById('storyCloseBtn');
  const storyPrevBtn = document.getElementById('storyPrevBtn');
  const storyNextBtn = document.getElementById('storyNextBtn');

  if (storyModal && storyImage && storyProgress) {
    // Uma entrada por publicação única (1-9), na ordem em que aparecem no grid.
    const posts = Array.from(
      new Map(
        Array.from(document.querySelectorAll('.photo[data-story-index]')).map((img) => [
          img.dataset.storyIndex,
          { src: img.currentSrc || img.src, alt: img.alt || `Publicação ${img.dataset.storyIndex}` },
        ])
      ).values()
    );

    const STORY_DURATION = 5000; // ms por publicação — mesmo ritmo do Stories do Instagram

    let currentIndex = 0;
    let lastTrigger = null;
    let advanceTimer = null;
    let isPaused = false;

    // Monta os segmentos da barra de progresso (um por publicação).
    storyProgress.innerHTML = '';
    const segments = posts.map(() => {
      const segment = document.createElement('div');
      segment.className = 'story-modal__segment';
      segment.innerHTML = '<span></span>';
      storyProgress.appendChild(segment);
      return segment;
    });

    const clearAdvanceTimer = () => {
      if (advanceTimer) {
        clearTimeout(advanceTimer);
        advanceTimer = null;
      }
    };

    const updateSegments = () => {
      segments.forEach((segment, i) => {
        segment.classList.toggle('is-filled', i < currentIndex);
        segment.classList.toggle('is-active', i === currentIndex);
      });
    };

    // Faz a barra da publicação atual "andar sozinha": reinicia a animação
    // CSS do zero (por isso o reflow forçado) e agenda a troca automática
    // de publicação para quando ela terminar de preencher.
    const playActiveSegment = () => {
      clearAdvanceTimer();
      const span = segments[currentIndex]?.querySelector('span');
      if (!span) return;

      span.style.setProperty('--story-duration', `${STORY_DURATION}ms`);
      span.style.animationName = 'none';
      void span.offsetWidth; // força o navegador a "esquecer" a animação anterior
      span.style.animationName = '';

      if (!isPaused) {
        advanceTimer = setTimeout(() => goTo(1), STORY_DURATION);
      }
    };

    const renderSlide = () => {
      const post = posts[currentIndex];
      if (!post) return;
      storyImage.src = post.src;
      storyImage.alt = post.alt;
      updateSegments();
      playActiveSegment();
    };

    // Pressionar e segurar a publicação pausa a barra e a troca automática —
    // soltar retoma de onde parou. Igual ao gesto do Stories do Instagram.
    const pauseStory = () => {
      if (isPaused) return;
      isPaused = true;
      storyModal.classList.add('is-paused');
      clearAdvanceTimer();
    };

    const resumeStory = () => {
      if (!isPaused) return;
      isPaused = false;
      storyModal.classList.remove('is-paused');

      const segment = segments[currentIndex];
      const span = segment?.querySelector('span');
      if (!segment || !span) return;

      const doneRatio = Math.min(span.getBoundingClientRect().width / segment.getBoundingClientRect().width, 1);
      const remaining = Math.max(STORY_DURATION * (1 - doneRatio), 0);
      advanceTimer = setTimeout(() => goTo(1), remaining);
    };

    const openStory = (index, trigger) => {
      currentIndex = ((index % posts.length) + posts.length) % posts.length;
      lastTrigger = trigger ?? null;
      isPaused = false;
      storyModal.classList.remove('is-paused');
      renderSlide();
      storyModal.classList.add('is-open');
      storyModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      storyCloseBtn?.focus();
    };

    const closeStory = () => {
      clearAdvanceTimer();
      isPaused = false;
      storyModal.classList.remove('is-open', 'is-paused');
      storyModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lastTrigger?.focus();
    };

    const goTo = (delta) => {
      currentIndex = ((currentIndex + delta) % posts.length + posts.length) % posts.length;
      isPaused = false;
      storyModal.classList.remove('is-paused');
      renderSlide();
    };

    document.querySelectorAll('.photo[data-story-index]').forEach((img) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        const index = posts.findIndex((p) => p.src === (img.currentSrc || img.src));
        openStory(index === -1 ? 0 : index, img);
      });
    });

    storyModal.querySelectorAll('[data-story-close]').forEach((el) => {
      el.addEventListener('click', closeStory);
    });

    storyPrevBtn?.addEventListener('click', () => goTo(-1));
    storyNextBtn?.addEventListener('click', () => goTo(1));

// Segurar em qualquer ponto do palco (imagem ou áreas de navegação) pausa;
    // soltar, sair da área ou cancelar o toque retoma de onde parou.
    if (storyStage) {
      storyStage.addEventListener('pointerdown', pauseStory);
      storyStage.addEventListener('pointerup', resumeStory);
      storyStage.addEventListener('pointerleave', resumeStory);
      storyStage.addEventListener('pointercancel', resumeStory);
    }

    document.addEventListener('keydown', (event) => {
      if (!storyModal.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeStory();
      if (event.key === 'ArrowRight') goTo(1);
      if (event.key === 'ArrowLeft') goTo(-1);
      if (event.key === ' ') {
        event.preventDefault();
        isPaused ? resumeStory() : pauseStory();
      }
    });

    // Pausa automaticamente se o usuário trocar de aba/app e retoma ao voltar.
    document.addEventListener('visibilitychange', () => {
      if (!storyModal.classList.contains('is-open')) return;
      if (document.hidden) pauseStory();
      else resumeStory();
    });
  }
})();
