/**
 * Creatinas — Profile Header
 * Interações: seguir/deixar de seguir (com contador real) e botão de mensagem.
 */
(() => {
  'use strict';

  const followBtn = document.getElementById('followBtn');
  const followLabel = document.getElementById('followLabel');
  const followersValue = document.getElementById('followersValue');
  const messageBtn = document.getElementById('messageBtn');
  const toast = document.getElementById('toast');

  let isFollowing = false;
  let toastTimer = null;

  /**
   * Formata um número no padrão compacto do Instagram (32000 -> "32K").
   * Implementado manualmente (em vez de Intl.NumberFormat com notation:
   * "compact") porque o locale pt-BR escreve por extenso ("32 mil"),
   * enquanto o padrão do produto usa sempre o sufixo K/M truncado.
   */
  const formatCompact = (n) => {
    const truncate = (value, divisor, suffix) => {
      const scaled = Math.floor((value / divisor) * 10) / 10;
      const text = Number.isInteger(scaled) ? scaled.toFixed(0) : scaled.toFixed(1);
      return `${text}${suffix}`;
    };
    if (n >= 1_000_000) return truncate(n, 1_000_000, 'M');
    if (n >= 1_000) return truncate(n, 1_000, 'K');
    return String(n);
  };

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };

  const updateFollowersDisplay = () => {
    const count = Number(followersValue.dataset.count);
    followersValue.textContent = formatCompact(count);
  };

  const setFollowing = (following) => {
    isFollowing = following;
    followBtn.classList.toggle('is-following', following);
    followBtn.setAttribute('aria-pressed', String(following));
    followLabel.textContent = following ? 'SEGUINDO' : 'SEGUIR';

    const baseCount = Number(followersValue.dataset.count);
    followersValue.dataset.count = following ? baseCount + 1 : baseCount - 1;
    updateFollowersDisplay();
  };

  followBtn.addEventListener('click', () => {
    setFollowing(!isFollowing);
    showToast(isFollowing ? 'Você começou a seguir @creatinas' : 'Você deixou de seguir @creatinas');
  });

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
  const storyCloseBtn = document.getElementById('storyCloseBtn');
  const storyMoreBtn = document.getElementById('storyMoreBtn');
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

    let currentIndex = 0;
    let lastTrigger = null;

    // Monta os segmentos da barra de progresso (um por publicação).
    storyProgress.innerHTML = '';
    const segments = posts.map(() => {
      const segment = document.createElement('div');
      segment.className = 'story-modal__segment';
      segment.innerHTML = '<span></span>';
      storyProgress.appendChild(segment);
      return segment;
    });

    const updateSegments = () => {
      segments.forEach((segment, i) => segment.classList.toggle('is-filled', i <= currentIndex));
    };

    const renderSlide = () => {
      const post = posts[currentIndex];
      if (!post) return;
      storyImage.src = post.src;
      storyImage.alt = post.alt;
      updateSegments();
    };

    const openStory = (index, trigger) => {
      currentIndex = ((index % posts.length) + posts.length) % posts.length;
      lastTrigger = trigger ?? null;
      renderSlide();
      storyModal.classList.add('is-open');
      storyModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      storyCloseBtn?.focus();
    };

    const closeStory = () => {
      storyModal.classList.remove('is-open');
      storyModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lastTrigger?.focus();
    };

    const goTo = (delta) => {
      currentIndex = ((currentIndex + delta) % posts.length + posts.length) % posts.length;
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

    storyMoreBtn?.addEventListener('click', () => showToast('Mais opções em breve.'));

    document.addEventListener('keydown', (event) => {
      if (!storyModal.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeStory();
      if (event.key === 'ArrowRight') goTo(1);
      if (event.key === 'ArrowLeft') goTo(-1);
    });
  }
})();
