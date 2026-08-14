/**
 * Creatinas — Profile Header
 * Interações: seleção de marca (bolinhas) e abas Posts/Reels.
 */
(() => {
  'use strict';

  const toast = document.getElementById('toast');

  let toastTimer = null;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };

  /* =====================================================
     Categories Row + Photo Grid — cada bolinha é uma marca;
     clicar nela filtra o grid pra mostrar só os posts dela.
     ===================================================== */

  const categories = Array.from(document.querySelectorAll('.category'));
  // O avatar principal (o maior, acima de tudo) também seleciona marca —
  // é ele quem carrega o feed de Creatinas agora que a bolinha própria
  // dela foi removida da fileira.
  const avatarButton = document.querySelector('.avatar');
  const brandSelectors = avatarButton ? [avatarButton, ...categories] : categories;

  // Nome exibido no cabeçalho do Story Viewer para cada marca — usa
  // data-story-name quando definido (ex: Carnitech, cujo data-category
  // "best-whey" não é o nome de exibição), senão o próprio data-category
  // em caixa alta (ex: "creatinas" -> "CREATINAS").
  const categoryStoryNames = new Map(
    brandSelectors.map((selector) => [
      selector.dataset.category,
      selector.dataset.storyName || (selector.dataset.category || '').toUpperCase(),
    ])
  );
  // Capa (banner do topo) — troca junto com a marca selecionada quando a
  // bolinha tem data-banner-src (ex: Carnitech usa assets/bannertopo.png
  // no lugar da capa padrão de Creatinas).
  const bannerImg = document.getElementById('bannerImg');
  const updateBanner = (selector) => {
    if (!bannerImg || !selector?.dataset.bannerSrc) return;
    bannerImg.src = selector.dataset.bannerSrc;
    bannerImg.alt = selector.dataset.bannerAlt || bannerImg.alt;
  };

  const tabs = Array.from(document.querySelectorAll('.tabs__tab'));
  const tabsIndicator = document.getElementById('tabsIndicator');
  const photoGrid = document.querySelector('.photo-grid');
  const photoCards = photoGrid ? Array.from(photoGrid.querySelectorAll('.photo-card')) : [];
  const gridEmpty = document.getElementById('gridEmpty');

  // "creatinas" é a marca desta prévia — mesmo sem bolinha própria na
  // fileira (removida), é ela que o grid mostra por padrão ao carregar.
  let activeCategory =
    brandSelectors.find((c) => c.classList.contains('is-active'))?.dataset.category ??
    'creatinas';

  /* =====================================================
     Salvos — bandeirinha em cada card guarda/remove a publicação
     de uma lista persistida no navegador (localStorage), acessível
     pela aba SALVOS ao lado de REELS.
     ===================================================== */

  const SAVED_STORAGE_KEY = 'creatinas-saved-posts';

  const loadSavedIndices = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) || '[]');
      return new Set(Array.isArray(stored) ? stored : []);
    } catch (err) {
      return new Set();
    }
  };

  const savedIndices = loadSavedIndices();

  const persistSavedIndices = () => {
    try {
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(Array.from(savedIndices)));
    } catch (err) {
      // localStorage indisponível (ex: modo privado) — segue só na sessão atual.
    }
  };

  const savedBadge = document.getElementById('savedBadge');
  const updateSavedBadge = () => {
    if (!savedBadge) return;
    savedBadge.textContent = String(savedIndices.size);
    savedBadge.hidden = savedIndices.size === 0;
  };
  updateSavedBadge();

  // Mostra só os posts da marca selecionada (aba Posts) ou só os salvos
  // (aba Salvos). Se não houver nenhum, troca o grid por um aviso em vez
  // de deixar a tela em branco.
  const updateGrid = () => {
    if (!photoGrid) return;

    const activeTabName = tabs.find((t) => t.classList.contains('is-active'))?.dataset.tab;

    if (activeTabName === 'reels') {
      photoGrid.style.display = 'none';
      if (gridEmpty) gridEmpty.hidden = true;
      return;
    }

    const isSavedTab = activeTabName === 'saved';
    let visibleCount = 0;
    photoCards.forEach((card) => {
      const photo = card.querySelector('.photo');
      if (!photo) return;
      const matches = isSavedTab
        ? savedIndices.has(photo.dataset.storyIndex)
        : photo.dataset.category === activeCategory;
      card.style.display = matches ? '' : 'none';
      if (matches) visibleCount += 1;
    });

    photoGrid.style.display = visibleCount > 0 ? 'grid' : 'none';
    if (gridEmpty) {
      gridEmpty.hidden = visibleCount > 0;
      gridEmpty.textContent = isSavedTab
        ? 'Você ainda não salvou nenhuma publicação.'
        : 'Em breve, publicações dessa marca por aqui.';
    }
  };

  photoCards.forEach((card) => {
    const photo = card.querySelector('.photo');
    const saveBtn = card.querySelector('.photo-card__save');
    if (!photo || !saveBtn) return;

    const index = photo.dataset.storyIndex;
    saveBtn.classList.toggle('is-saved', savedIndices.has(index));

    saveBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const nowSaved = !savedIndices.has(index);
      if (nowSaved) {
        savedIndices.add(index);
      } else {
        savedIndices.delete(index);
      }
      saveBtn.classList.toggle('is-saved', nowSaved);
      saveBtn.setAttribute('aria-label', nowSaved ? 'Remover dos salvos' : 'Salvar publicação');
      persistSavedIndices();
      updateSavedBadge();
      showToast(nowSaved ? 'Publicação salva.' : 'Publicação removida dos salvos.');

      const activeTabName = tabs.find((t) => t.classList.contains('is-active'))?.dataset.tab;
      if (activeTabName === 'saved') updateGrid();
    });
  });

  brandSelectors.forEach((selector) => {
    selector.addEventListener('click', () => {
      if (selector.dataset.category === activeCategory) return;
      activeCategory = selector.dataset.category;
      brandSelectors.forEach((s) => s.classList.toggle('is-active', s === selector));
      updateBanner(selector);
      updateGrid();
    });
  });

  /* =====================================================
     Tabs — Posts / Reels
     ===================================================== */

  const activateTab = (tab) => {
    tabs.forEach((t) => t.classList.toggle('is-active', t === tab));

    if (tabsIndicator) {
      tabsIndicator.style.left = `${tab.offsetLeft}px`;
      tabsIndicator.style.width = `${tab.offsetWidth}px`;
    }

    updateGrid();
    if (tab.dataset.tab === 'reels') {
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
  } else {
    updateGrid();
  }

  /* =====================================================
     Story Viewer — lightbox das publicações do grid
     ===================================================== */

  const storyModal = document.getElementById('storyModal');
  const storyImage = document.getElementById('storyImage');
  const storyName = document.getElementById('storyName');
  const storyProgress = document.getElementById('storyProgress');
  const storyStage = document.querySelector('.story-modal__stage');
  const storyCard = document.querySelector('.story-modal__card');
  const storyBackdrop = document.querySelector('.story-modal__backdrop');
  const storyDownloadBtn = document.getElementById('storyDownloadBtn');
  const storyCloseBtn = document.getElementById('storyCloseBtn');
  const storyPrevBtn = document.getElementById('storyPrevBtn');
  const storyNextBtn = document.getElementById('storyNextBtn');

  if (storyModal && storyImage && storyProgress) {
    // Uma entrada por publicação única (1-9), na ordem em que aparecem no grid.
    // Cada post pode ter uma arte retangular própria pra tela ampliada
    // (data-story-src, ex: assets/story-1.png) — diferente da foto quadrada
    // usada no feed. Enquanto essa arte não existir (404), cai de volta pra
    // foto do feed, sem quebrar o Stories.
    const posts = Array.from(
      new Map(
        Array.from(document.querySelectorAll('.photo[data-story-index]')).map((img) => {
          const gridSrc = img.currentSrc || img.src;
          return [
            img.dataset.storyIndex,
            {
              index: img.dataset.storyIndex,
              category: img.dataset.category,
              src: img.dataset.storySrc || gridSrc,
              fallbackSrc: gridSrc,
              alt: img.alt || `Publicação ${img.dataset.storyIndex}`,
            },
          ];
        })
      ).values()
    );

    const STORY_DURATION = 5000; // ms por publicação — mesmo ritmo do Stories do Instagram

    let currentIndex = 0;
    let lastTrigger = null;
    let advanceTimer = null;
    let isPaused = false;
    // A publicação clicada define o grupo (marca) do story: abrir uma foto
    // de Carnitech mostra só as publicações de Carnitech, não o feed todo.
    let activePosts = posts;
    let segments = [];

    // (Re)monta os segmentos da barra de progresso — um por publicação do
    // grupo ativo. Chamado toda vez que um story de uma marca é aberto.
    const buildSegments = (count) => {
      storyProgress.innerHTML = '';
      segments = Array.from({ length: count }, () => {
        const segment = document.createElement('div');
        segment.className = 'story-modal__segment';
        segment.innerHTML = '<span></span>';
        storyProgress.appendChild(segment);
        return segment;
      });
    };

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

    // Se a arte retangular (data-story-src) ainda não existir, volta pra
    // foto do feed em vez de deixar a tela ampliada com imagem quebrada.
    storyImage.addEventListener('error', () => {
      if (storyImage.dataset.fallback && storyImage.src !== storyImage.dataset.fallback) {
        storyImage.src = storyImage.dataset.fallback;
      }
    });

    const renderSlide = () => {
      const post = activePosts[currentIndex];
      if (!post) return;
      storyImage.dataset.fallback = post.fallbackSrc;
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

    const openStory = (postsGroup, index, trigger) => {
      activePosts = postsGroup.length ? postsGroup : posts;
      buildSegments(activePosts.length);
      currentIndex = ((index % activePosts.length) + activePosts.length) % activePosts.length;
      lastTrigger = trigger ?? null;
      isPaused = false;
      storyModal.classList.remove('is-paused');
      if (storyName) {
        const category = activePosts[currentIndex]?.category;
        storyName.textContent = categoryStoryNames.get(category) || (category || '').toUpperCase();
      }
      renderSlide();
      storyModal.classList.add('is-open');
      storyModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      // Foca o card (não o botão de fechar) — move o foco pra dentro do
      // modal para teclado/leitor de tela sem acender o anel de foco em
      // cima do X, que ficava com uma borda mais grossa que o normal.
      storyCard?.focus();
    };

    const closeStory = () => {
      clearAdvanceTimer();
      isPaused = false;
      storyModal.classList.remove('is-open', 'is-paused');
      storyModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lastTrigger?.focus();
      // Limpa qualquer transform/opacidade deixada pelo arrastar-pra-fechar,
      // senão o card reabre já deslocado na próxima vez.
      storyCard.style.transition = '';
      storyCard.style.transform = '';
      if (storyBackdrop) storyBackdrop.style.opacity = '';
    };

    const goTo = (delta) => {
      currentIndex = ((currentIndex + delta) % activePosts.length + activePosts.length) % activePosts.length;
      isPaused = false;
      storyModal.classList.remove('is-paused');
      renderSlide();
    };

    document.querySelectorAll('.photo[data-story-index]').forEach((img) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        // Só as publicações da mesma marca da foto clicada entram nesse
        // story — evita misturar Creatinas com Carnitech, por exemplo.
        const groupPosts = posts.filter((p) => p.category === img.dataset.category);
        const index = groupPosts.findIndex((p) => p.index === img.dataset.storyIndex);
        openStory(groupPosts, index === -1 ? 0 : index, img);
      });
    });

    storyModal.querySelectorAll('[data-story-close]').forEach((el) => {
      el.addEventListener('click', closeStory);
    });

    storyPrevBtn?.addEventListener('click', () => goTo(-1));
    storyNextBtn?.addEventListener('click', () => goTo(1));

    // Baixa a imagem da publicação aberta no momento. Busca como blob em
    // vez de só apontar o href pro <a download> porque alguns navegadores
    // ignoram o atributo "download" e abrem a imagem numa aba nova.
    storyDownloadBtn?.addEventListener('click', async () => {
      const src = storyImage.src;
      if (!src) return;
      const filename = src.split('/').pop().split('?')[0] || 'publicacao.png';
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        window.open(src, '_blank');
      }
    });

    /* Segurar em qualquer ponto do palco (imagem ou áreas de navegação)
       pausa; soltar, sair da área ou cancelar o toque retoma de onde
       parou. Arrastar pra baixo, junto disso, encolhe o card seguindo o
       dedo — solta acima do limite fecha (gesto do Stories real). */
    const DRAG_CLOSE_THRESHOLD = 110; // px arrastados pra soltar e fechar
    let dragPointerId = null;
    let dragStartY = 0;
    let dragDeltaY = 0;
    let isDraggingToClose = false;

    const applyDragTransform = (deltaY) => {
      const clamped = Math.max(deltaY, 0);
      const scale = Math.max(1 - clamped / 2000, 0.85);
      storyCard.style.transition = 'none';
      storyCard.style.transform = `translateY(${clamped}px) scale(${scale})`;
      if (storyBackdrop) {
        storyBackdrop.style.opacity = String(Math.max(1 - clamped / 400, 0.3));
      }
    };

    const snapCardBack = () => {
      storyCard.style.transition = 'transform 0.25s ease';
      storyCard.style.transform = '';
      if (storyBackdrop) storyBackdrop.style.opacity = '';
    };

    const handleStagePointerDown = (event) => {
      pauseStory();
      dragPointerId = event.pointerId;
      dragStartY = event.clientY;
      dragDeltaY = 0;
      isDraggingToClose = false;
    };

    const handleStagePointerMove = (event) => {
      if (event.pointerId !== dragPointerId) return;
      const delta = event.clientY - dragStartY;
      if (!isDraggingToClose) {
        // Só assume que é um arrastar-pra-fechar depois de um mínimo de
        // movimento pra baixo — evita brigar com o toque parado (pausa)
        // e com o clique nos botões de navegar/avançar.
        if (delta < 12) return;
        isDraggingToClose = true;
      }
      dragDeltaY = delta;
      applyDragTransform(delta);
    };

    const endStageDrag = () => {
      if (isDraggingToClose) {
        if (dragDeltaY > DRAG_CLOSE_THRESHOLD) {
          closeStory();
        } else {
          snapCardBack();
        }
      }
      dragPointerId = null;
      isDraggingToClose = false;
      dragDeltaY = 0;
      resumeStory();
    };

    if (storyStage) {
      storyStage.addEventListener('pointerdown', handleStagePointerDown);
      storyStage.addEventListener('pointermove', handleStagePointerMove);
      storyStage.addEventListener('pointerup', endStageDrag);
      storyStage.addEventListener('pointerleave', endStageDrag);
      storyStage.addEventListener('pointercancel', endStageDrag);
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
