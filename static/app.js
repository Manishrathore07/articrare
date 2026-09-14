/**
 * Articrare — 3D Studio & Motion Engine
 * Features:
 * 1. 3D Floating Graphite & Ink Particle Canvas
 * 2. 3D Perspective Card Tilt & Dynamic Spotlight Sheen
 * 3. Live Client-Side Search & Medium Filter
 * 4. 3D Sketch Inspector / Lightbox Modal with Zoom
 * 5. Drag-and-Drop Image Preview & Django AJAX Like System
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. 3D Floating Charcoal & Ink Dust Particle Canvas
     ========================================================================== */
  const canvas = document.getElementById('artDustCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const PARTICLE_COUNT = 65;
    const FOV = 400;

    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let isVisible = true;

    function resizeCanvas() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse over hero section
    const heroSection = canvas.parentElement;
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      mouse.targetX = (e.clientX - rect.left - rect.width / 2) * 0.0008;
      mouse.targetY = (e.clientY - rect.top - rect.height / 2) * 0.0008;
    });

    heroSection.addEventListener('mouseleave', () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
    });

    // Initialize 3D particles in a virtual volume
    class Particle3D {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = (Math.random() - 0.5) * (width || 800) * 1.2;
        this.y = (Math.random() - 0.5) * (height || 400) * 1.2;
        this.z = init ? Math.random() * 500 - 250 : 250;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.vz = -0.4 - Math.random() * 0.4;
        this.baseRadius = 1.2 + Math.random() * 2.2;
        // Dual palette: Charcoal graphite dust vs luminous purple ink
        this.isInk = Math.random() > 0.65;
        this.color = this.isInk
          ? `rgba(168, 85, 247, ${0.4 + Math.random() * 0.4})`
          : `rgba(203, 213, 225, ${0.25 + Math.random() * 0.35})`;
      }

      update(rotX, rotY) {
        // Rotate around Y axis
        let cosY = Math.cos(rotX);
        let sinY = Math.sin(rotX);
        let x1 = this.x * cosY - this.z * sinY;
        let z1 = this.z * cosY + this.x * sinY;

        // Rotate around X axis
        let cosX = Math.cos(rotY);
        let sinX = Math.sin(rotY);
        let y1 = this.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + this.y * sinX;

        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        if (this.z < -FOV + 50 || Math.abs(this.x) > width || Math.abs(this.y) > height) {
          this.reset(false);
        }

        return { x: x1, y: y1, z: z2 };
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle3D());
    }

    // Intersection observer to pause when hero is scrolled out of view
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(heroSection);

    let curRotX = 0, curRotY = 0;

    function render3D() {
      if (!isVisible) {
        requestAnimationFrame(render3D);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      curRotX += (mouse.targetX - curRotX) * 0.05;
      curRotY += (mouse.targetY - curRotY) * 0.05;

      const cx = width / 2;
      const cy = height / 2;
      const projected = [];

      // Project particles to 2D
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const pos = p.update(curRotX, curRotY);
        const depth = pos.z + FOV;

        if (depth > 10) {
          const scale = FOV / depth;
          const sx = pos.x * scale + cx;
          const sy = pos.y * scale + cy;
          const r = Math.max(0.6, p.baseRadius * scale);
          const alpha = Math.min(0.85, Math.max(0.1, scale * 0.8));

          projected.push({ sx, sy, r, alpha, color: p.color, isInk: p.isInk });

          // Draw particle
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      }

      // Draw subtle sketch constellation lines between nearby particles
      ctx.lineWidth = 0.6;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.sx - p2.sx;
          const dy = p1.sy - p2.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 85) {
            const lineAlpha = (1 - dist / 85) * 0.18;
            ctx.strokeStyle = `rgba(148, 163, 184, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(render3D);
    }
    render3D();
  }


  /* ==========================================================================
     2. 3D Perspective Card Tilt & Spotlight Sheen Engine
     ========================================================================== */
  const tiltCards = document.querySelectorAll('[data-tilt]');

  tiltCards.forEach(card => {
    let bounds;

    function onMouseEnter(e) {
      bounds = card.getBoundingClientRect();
      card.style.setProperty('--glare-opacity', '1');
      card.style.setProperty('--tilt-scale', '1.018');
    }

    function onMouseMove(e) {
      if (!bounds) bounds = card.getBoundingClientRect();

      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;

      const normX = (mouseX / bounds.width) - 0.5;
      const normY = (mouseY / bounds.height) - 0.5;

      // Max 10 deg pitch, 12 deg yaw
      const tiltX = (normY * -16).toFixed(2);
      const tiltY = (normX * 18).toFixed(2);

      card.style.setProperty('--tilt-x', `${tiltX}deg`);
      card.style.setProperty('--tilt-y', `${tiltY}deg`);
      card.style.setProperty('--glare-x', `${(mouseX / bounds.width * 100).toFixed(1)}%`);
      card.style.setProperty('--glare-y', `${(mouseY / bounds.height * 100).toFixed(1)}%`);
    }

    function onMouseLeave() {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--tilt-scale', '1');
      card.style.setProperty('--glare-opacity', '0');
      bounds = null;
    }

    card.addEventListener('mouseenter', onMouseEnter);
    card.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseleave', onMouseLeave);
  });


  /* ==========================================================================
     3. Live Client-Side Search & Medium Filter
     ========================================================================== */
  const searchInput = document.getElementById('sketchSearchInput');
  const filterPills = document.querySelectorAll('#filterPillsRow .pill');
  const artworkCards = document.querySelectorAll('.artwork-card');
  const galleryCount = document.getElementById('galleryCount');

  let currentCategory = 'all';
  let currentQuery = '';

  function applyFilters() {
    let visibleCount = 0;

    artworkCards.forEach(card => {
      const cardCategory = card.getAttribute('data-category') || '';
      const cardTitle = card.getAttribute('data-title') || '';
      const cardArtist = card.getAttribute('data-artist') || '';

      const matchesCategory = (currentCategory === 'all') || (cardCategory.toLowerCase() === currentCategory.toLowerCase());
      const matchesSearch = !currentQuery || cardTitle.includes(currentQuery) || cardArtist.includes(currentQuery);

      if (matchesCategory && matchesSearch) {
        card.style.display = 'grid';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (galleryCount) {
      galleryCount.textContent = visibleCount;
    }
  }

  const searchClearBtn = document.getElementById('searchClearBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentQuery = e.target.value.trim().toLowerCase();
      applyFilters();

      if (searchClearBtn) {
        if (currentQuery.length > 0) {
          searchClearBtn.classList.remove('hidden');
        } else {
          searchClearBtn.classList.add('hidden');
        }
      }
    });

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentQuery = '';
        applyFilters();
        searchClearBtn.classList.add('hidden');
        searchInput.focus();
        showToast('Search cleared');
      });
    }

    // Jitter Typewriter Animated Placeholder
    const PLACEHOLDER_STRINGS = [
      "Search 'Zoro anatomy study'...",
      "Search 'charcoal portraits'...",
      "Search 'manga linework'...",
      "Search 'pencil shading'...",
      "Search 'concept mecha'...",
      "Search artists & critiques..."
    ];
    let placeholderIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typewriterTimer = null;

    function runTypewriter() {
      if (document.activeElement === searchInput || (searchInput.value && searchInput.value.length > 0)) {
        typewriterTimer = setTimeout(runTypewriter, 1500);
        return;
      }

      const currentString = PLACEHOLDER_STRINGS[placeholderIndex];
      if (isDeleting) {
        charIndex--;
        searchInput.setAttribute('placeholder', currentString.substring(0, charIndex));
        if (charIndex <= 0) {
          isDeleting = false;
          placeholderIndex = (placeholderIndex + 1) % PLACEHOLDER_STRINGS.length;
          typewriterTimer = setTimeout(runTypewriter, 500);
          return;
        }
        typewriterTimer = setTimeout(runTypewriter, 40);
      } else {
        charIndex++;
        searchInput.setAttribute('placeholder', currentString.substring(0, charIndex));
        if (charIndex >= currentString.length) {
          isDeleting = true;
          typewriterTimer = setTimeout(runTypewriter, 2400);
          return;
        }
        typewriterTimer = setTimeout(runTypewriter, 75);
      }
    }
    typewriterTimer = setTimeout(runTypewriter, 1200);

    searchInput.addEventListener('focus', () => {
      searchInput.setAttribute('placeholder', 'Search sketches, artists, mediums...');
    });
  }

  // Jitter Animated Search: Global Ctrl+K / Cmd+K Shortcut
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const gallery = document.getElementById('gallery');
      if (gallery) {
        gallery.scrollIntoView({ behavior: 'smooth' });
      }
      if (searchInput) {
        setTimeout(() => {
          searchInput.focus();
          searchInput.select();
        }, 300);
      }
      showToast('🔍 Search focused (Ctrl+K)');
    }
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });


  /* ==========================================================================
     4. Fullscreen 3D Lightbox & Sketch Inspector Modal
     ========================================================================== */
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxStage = document.getElementById('lightboxStage');
  const lightboxViewport = document.getElementById('lightboxViewport');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const resetZoomBtn = document.getElementById('resetZoomBtn');
  const zoomLevelText = document.getElementById('zoomLevelText');

  let currentZoom = 1;

  function updateZoom(newZoom) {
    currentZoom = Math.min(3, Math.max(0.6, newZoom));
    if (lightboxImage) {
      lightboxImage.style.transform = `translateZ(30px) scale(${currentZoom})`;
    }
    if (zoomLevelText) {
      zoomLevelText.textContent = `${Math.round(currentZoom * 100)}%`;
    }
  }

  function openLightbox(src, title) {
    if (!lightboxModal) return;
    lightboxImage.src = src;
    if (lightboxTitle) lightboxTitle.textContent = title || 'Sketch Inspection';
    updateZoom(1);
    lightboxModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // Open lightbox when clicking on any sketch image or [Inspect] button
  document.querySelectorAll('.inspectable-image, .layer-3d-media, .btn-inspect-action').forEach(el => {
    el.addEventListener('click', (e) => {
      // Don't trigger if clicked on like button inside media
      if (e.target.closest('.btn-like-corner')) return;
      
      const card = el.closest('.artwork-card');
      const img = el.tagName === 'IMG' ? el : card?.querySelector('.inspectable-image');
      if (img) {
        const fullSrc = img.getAttribute('data-full') || img.src;
        const title = img.alt || card?.querySelector('.artwork-title')?.textContent || 'Sketch Inspection';
        openLightbox(fullSrc, title);
      }
    });
  });

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  if (zoomInBtn) zoomInBtn.addEventListener('click', () => updateZoom(currentZoom + 0.25));
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => updateZoom(currentZoom - 0.25));
  if (resetZoomBtn) resetZoomBtn.addEventListener('click', () => updateZoom(1));

  // 3D paper tilt simulation inside the lightbox viewport
  if (lightboxViewport && lightboxStage) {
    lightboxViewport.addEventListener('mousemove', (e) => {
      const rect = lightboxViewport.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      lightboxStage.style.transform = `perspective(900px) rotateX(${y * -14}deg) rotateY(${x * 16}deg)`;
    });

    lightboxViewport.addEventListener('mouseleave', () => {
      lightboxStage.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    });
  }


  /* ==========================================================================
     5. Drag-and-Drop Image Preview & Django AJAX Like System
     ========================================================================== */
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const dropzonePrompt = document.getElementById('dropzonePrompt');
  const previewContainer = document.getElementById('previewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const removePreviewBtn = document.getElementById('removePreviewBtn');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
      if (e.target !== removePreviewBtn && !previewContainer.contains(e.target)) {
        fileInput.click();
      }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        fileInput.files = files;
        showPreview(files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        showPreview(fileInput.files[0]);
      }
    });

    if (removePreviewBtn) {
      removePreviewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = '';
        imagePreview.src = '';
        previewContainer.classList.add('hidden');
        dropzonePrompt.classList.remove('hidden');
      });
    }

    function showPreview(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        dropzonePrompt.classList.add('hidden');
        previewContainer.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  }

  // Floating Toast Notification System
  const toastContainer = document.getElementById('toastContainer');

  function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✦</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Share Link Button (1-Click Copy to Clipboard)
  document.querySelectorAll('.btn-share-link').forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const relativeUrl = this.getAttribute('data-url');
      const fullUrl = window.location.origin + relativeUrl;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(fullUrl).then(() => {
          showToast('Link copied to clipboard!');
        }).catch(() => {
          showToast('Failed to copy link');
        });
      } else {
        showToast('Link copied to clipboard!');
      }
    });
  });

  // Submit button loading feedback
  const sketchForm = document.getElementById('sketchForm');
  const submitSketchBtn = document.getElementById('submitSketchBtn');

  if (sketchForm && submitSketchBtn) {
    sketchForm.addEventListener('submit', () => {
      submitSketchBtn.classList.add('btn-loading');
      submitSketchBtn.innerHTML = `
        <span class="btn-spinner"></span>
        <span>Analyzing &amp; Publishing...</span>
      `;
    });
  }

  // Like button with Django AJAX & CSRF Token
  document.querySelectorAll('.btn-like').forEach(button => {
    button.addEventListener('click', function () {
      const artId = this.getAttribute('data-id');
      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
      const token = csrfToken ? csrfToken.value : '';

      fetch(`/like/${artId}/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': token,
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        const countSpan = this.querySelector('.like-count');
        if (countSpan) countSpan.textContent = data.likes;
        this.classList.add('liked');
        showToast('Liked sketch! ♥');
      })
      .catch(err => console.error('Error liking sketch:', err));
    });
  });

  /* ==========================================================================
     6. Interactive AI Vision Scanner Simulator (Raw vs. AI Heatmap)
     ========================================================================== */
  const btnViewRaw = document.getElementById('btnViewRaw');
  const btnViewAi = document.getElementById('btnViewAi');
  const scannerStage = document.getElementById('scannerStage');

  if (btnViewRaw && btnViewAi && scannerStage) {
    btnViewRaw.addEventListener('click', () => {
      btnViewRaw.classList.add('active');
      btnViewAi.classList.remove('active');
      scannerStage.setAttribute('data-mode', 'raw');
      showToast('Viewing raw graphite study');
    });

    btnViewAi.addEventListener('click', () => {
      btnViewAi.classList.add('active');
      btnViewRaw.classList.remove('active');
      scannerStage.setAttribute('data-mode', 'ai');
      showToast('✦ Structural landmarks & draftsmanship analysis enabled');
    });
  }

  /* ==========================================================================
     7. Daily Sketch Challenge & Dynamic Random Prompt Generator
     ========================================================================== */
  const PROMPT_COLLECTION = [
    {
      title: "Dynamic Foreshortened Hand Holding a Pocket Watch",
      category: "Pencil & Graphite",
      level: "Intermediate Tier",
      desc: "Focus on finger joint compression, knuckle planes, and elliptical perspective of the circular watch rim. Keep preliminary block-in gestures under 5 minutes before applying shading.",
      tips: [
        "Block the palm as a solid wedge before detailing fingers.",
        "Check negative space between thumb and index finger.",
        "Reserve pure white highlights for the polished glass face."
      ]
    },
    {
      title: "Cyberpunk Ronin Silhouette in Pouring Rain",
      category: "Ink & Line Art",
      level: "Advanced Tier",
      desc: "Master high-contrast chiaroscuro with intense black shadows. Use negative white streaks to imply slanted neon raindrops hitting shoulder armor plates.",
      tips: [
        "Establish an unmistakable dynamic silhouette first.",
        "Keep rim lighting sharp along the blade edge.",
        "Limit hatching to contact shadows and wet fabric creases."
      ]
    },
    {
      title: "Subsurface Translucency on a Classical Statuary Ear",
      category: "Charcoal",
      level: "Intermediate Tier",
      desc: "Anatomy master study focusing on the helix, anti-helix, and tragus. Capture the soft gradient falloff where light penetrates thin cartilage.",
      tips: [
        "Use a kneaded eraser to pull out delicate cartilaginous highlights.",
        "Differentiate soft cast shadows from sharp contact crevices.",
        "Avoid black outlines—define edges purely with value contrast."
      ]
    },
    {
      title: "Angular Concept Mecha Helmet with Visor Reflections",
      category: "Concept Art",
      level: "Advanced Tier",
      desc: "Practice hard-surface drafting: 2-point perspective construction of beveled chins, hexagonal intake vents, and a curved glass visor reflecting a horizon.",
      tips: [
        "Use subtle cross-contour lines to show surface taper.",
        "Contrast matte armor plating against ultra-reflective visor glass.",
        "Vary line thickness: thick underside lines ground mechanical weight."
      ]
    },
    {
      title: "Expressive Manga Character with Wind-Swept Hair Dynamics",
      category: "Anime & Manga",
      level: "Beginner Tier",
      desc: "Focus on eye expression, clean tapered eyelash contours, and hair clumps that twist in 3D ribbon-like layers around the skull volume.",
      tips: [
        "Draw the skull volume first before layering hair strands.",
        "Group hair into large primary clumps rather than single lines.",
        "Taper stroke ends with swift, confident flicks."
      ]
    },
    {
      title: "Folded Silk Drapery Suspended Over an Asymmetrical Sphere",
      category: "Pencil & Graphite",
      level: "Intermediate Tier",
      desc: "Classical fabric study: observe pipe folds, diaper folds, and spiral tensions as heavy fabric cascades over a spherical mass under directional overhead light.",
      tips: [
        "Identify the primary point of tension before drawing folds.",
        "Keep core shadows soft on curved drapery peaks.",
        "Deepen drop shadows right under where cloth touches the floor."
      ]
    }
  ];

  let currentPromptIndex = 0;
  const challengeTitleText = document.getElementById('challengeTitleText');
  const challengeDescText = document.getElementById('challengeDescText');
  const challengeCategoryBadge = document.getElementById('challengeCategoryBadge');
  const challengeLevelBadge = document.getElementById('challengeLevelBadge');
  const btnRollPrompt = document.getElementById('btnRollPrompt');
  const btnAcceptChallenge = document.getElementById('btnAcceptChallenge');

  function updateChallengeCard(index) {
    const p = PROMPT_COLLECTION[index];
    if (!p) return;

    // Jitter Motion Blur Text: Trigger blur entrance on update
    if (challengeTitleText) {
      challengeTitleText.classList.remove('motion-blur-active');
      void challengeTitleText.offsetWidth; // force DOM reflow
      challengeTitleText.classList.add('motion-blur-active');
      challengeTitleText.textContent = p.title;
    }
    if (challengeDescText) {
      challengeDescText.classList.remove('motion-blur-active');
      void challengeDescText.offsetWidth;
      challengeDescText.classList.add('motion-blur-active');
      challengeDescText.textContent = p.desc;
    }
    if (challengeCategoryBadge) challengeCategoryBadge.textContent = p.category;
    if (challengeLevelBadge) challengeLevelBadge.textContent = p.level;

    // Update tips if container exists
    const tipCards = document.querySelectorAll('.challenge-tips-grid .tip-card span:last-child');
    if (tipCards && p.tips) {
      tipCards.forEach((span, i) => {
        if (p.tips[i]) span.textContent = p.tips[i];
      });
    }
  }

  if (btnRollPrompt) {
    btnRollPrompt.addEventListener('click', () => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * PROMPT_COLLECTION.length);
      } while (nextIndex === currentPromptIndex && PROMPT_COLLECTION.length > 1);

      currentPromptIndex = nextIndex;
      updateChallengeCard(currentPromptIndex);
      showToast('🎲 New sketch prompt rolled!');
    });
  }

  if (btnAcceptChallenge) {
    btnAcceptChallenge.addEventListener('click', () => {
      const p = PROMPT_COLLECTION[currentPromptIndex];
      const titleInput = document.getElementById('sketchTitle');
      const categorySelect = document.getElementById('sketchCategory');
      const uploadSection = document.getElementById('upload');

      if (titleInput && p) {
        titleInput.value = `[Challenge] ${p.title}`;
      }
      if (categorySelect && p) {
        // Try to select matching category
        for (let opt of categorySelect.options) {
          if (opt.value.toLowerCase().includes(p.category.toLowerCase().slice(0, 4))) {
            categorySelect.value = opt.value;
            break;
          }
        }
      }

      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth' });
        const dropzone = document.getElementById('dropzone');
        if (dropzone) {
          dropzone.classList.add('dropzone-active');
          setTimeout(() => dropzone.classList.remove('dropzone-active'), 1500);
        }
      }

      showToast('Challenge accepted! Drop your study above.');
    });
  }

  // Daily Challenge Countdown Timer
  const challengeTimer = document.getElementById('challengeTimer');
  if (challengeTimer) {
    function updateCountdown() {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const diff = Math.max(0, endOfDay - now);

      const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
      const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
      const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');

      challengeTimer.textContent = `${hours}h ${minutes}m ${seconds}s`;
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  /* ==========================================================================
     8. Interactive 10-Point Scorecard & Live Calculator
     ========================================================================== */
  const rangeAnatomy = document.getElementById('rangeAnatomy');
  const rangeValues = document.getElementById('rangeValues');
  const rangeLinework = document.getElementById('rangeLinework');
  const rangeComposition = document.getElementById('rangeComposition');

  const valAnatomy = document.getElementById('valAnatomy');
  const valValues = document.getElementById('valValues');
  const valLinework = document.getElementById('valLinework');
  const valComposition = document.getElementById('valComposition');

  const totalScoreNumber = document.getElementById('totalScoreNumber');
  const scoreTierBadge = document.getElementById('scoreTierBadge');
  const scoreVerdictText = document.getElementById('scoreVerdictText');

  function calculateScore() {
    if (!rangeAnatomy || !rangeValues || !rangeLinework || !rangeComposition) return;

    const a = parseFloat(rangeAnatomy.value) || 0;
    const v = parseFloat(rangeValues.value) || 0;
    const l = parseFloat(rangeLinework.value) || 0;
    const c = parseFloat(rangeComposition.value) || 0;

    if (valAnatomy) valAnatomy.textContent = `${a.toFixed(1)} / 2.5`;
    if (valValues) valValues.textContent = `${v.toFixed(1)} / 2.5`;
    if (valLinework) valLinework.textContent = `${l.toFixed(1)} / 2.5`;
    if (valComposition) valComposition.textContent = `${c.toFixed(1)} / 2.5`;

    const total = Math.min(10, Math.max(0, a + v + l + c)).toFixed(1);
    if (totalScoreNumber) totalScoreNumber.textContent = total;

    if (scoreTierBadge && scoreVerdictText) {
      if (total >= 9.0) {
        scoreTierBadge.textContent = '✦ Exhibition Masterpiece';
        scoreTierBadge.style.background = 'rgba(16, 185, 129, 0.15)';
        scoreTierBadge.style.color = '#34d399';
        scoreTierBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        scoreVerdictText.textContent = 'Exceptional anatomical fidelity and confidence. Rich tonal transitions bring palpable weight and 3D depth to the form.';
      } else if (total >= 7.5) {
        scoreTierBadge.textContent = '★ Studio Grade Study';
        scoreTierBadge.style.background = 'rgba(56, 189, 248, 0.15)';
        scoreTierBadge.style.color = '#38bdf8';
        scoreTierBadge.style.borderColor = 'rgba(56, 189, 248, 0.4)';
        scoreVerdictText.textContent = 'Solid proportional foundation and confident contour hierarchy. Deepen midtones and ambient occlusion to push it to gallery tier.';
      } else if (total >= 6.0) {
        scoreTierBadge.textContent = '▲ Foundation in Progress';
        scoreTierBadge.style.background = 'rgba(245, 158, 11, 0.15)';
        scoreTierBadge.style.color = '#fbbf24';
        scoreTierBadge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        scoreVerdictText.textContent = 'Grounded gesture and strong silhouette. Clean up secondary scratch lines and pay closer attention to limb foreshortening angles.';
      } else {
        scoreTierBadge.textContent = '● Raw Warmup Block-in';
        scoreTierBadge.style.background = 'rgba(244, 63, 94, 0.15)';
        scoreTierBadge.style.color = '#fb7185';
        scoreTierBadge.style.borderColor = 'rgba(244, 63, 94, 0.4)';
        scoreVerdictText.textContent = 'Energetic initial gesture lines. Spend more time blocking in primary geometric masses with loose shoulder strokes before detailing.';
      }
    }
  }

  [rangeAnatomy, rangeValues, rangeLinework, rangeComposition].forEach(slider => {
    if (slider) slider.addEventListener('input', calculateScore);
  });

  /* ==========================================================================
     9. Growth Protocols "Practice This" Action Handlers
     ========================================================================== */
  document.querySelectorAll('.practice-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const practiceTopic = this.getAttribute('data-practice') || 'Technique Study';
      const titleInput = document.getElementById('sketchTitle');
      const uploadSection = document.getElementById('upload');

      if (titleInput) {
        titleInput.value = `[Practice] ${practiceTopic}`;
      }

      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth' });
        const dropzone = document.getElementById('dropzone');
        if (dropzone) {
          dropzone.classList.add('dropzone-active');
          setTimeout(() => dropzone.classList.remove('dropzone-active'), 1500);
        }
      }

      showToast(`Selected practice: ${practiceTopic}`);
    });
  });

  /* ==========================================================================
     10. CTA Smooth Scroll Handlers
     ========================================================================== */
  const btnScrollToUpload = document.getElementById('btnScrollToUpload');
  const btnScrollToGallery = document.getElementById('btnScrollToGallery');

  if (btnScrollToUpload) {
    btnScrollToUpload.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('upload');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ==========================================================================
     11. Floating Action Menu / Spring Dock Logic (Custom 60fps Motion)
     ========================================================================== */
  const fabDock = document.getElementById('floatingActionDock');
  const fabTriggerBtn = document.getElementById('fabTriggerBtn');
  const fabActionUpload = document.getElementById('fabActionUpload');
  const fabActionRoll = document.getElementById('fabActionRoll');
  const fabActionSearch = document.getElementById('fabActionSearch');

  if (fabDock && fabTriggerBtn) {
    function toggleFab(forceState = null) {
      const isExpanded = forceState !== null ? forceState : !fabDock.classList.contains('active');
      if (isExpanded) {
        fabDock.classList.add('active');
        fabTriggerBtn.setAttribute('aria-expanded', 'true');
      } else {
        fabDock.classList.remove('active');
        fabTriggerBtn.setAttribute('aria-expanded', 'false');
      }
    }

    fabTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFab();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!fabDock.contains(e.target)) {
        toggleFab(false);
      }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && fabDock.classList.contains('active')) {
        toggleFab(false);
      }
    });

    // Action 1: Upload Study
    if (fabActionUpload) {
      fabActionUpload.addEventListener('click', () => {
        toggleFab(false);
        const upload = document.getElementById('upload');
        if (upload) {
          upload.scrollIntoView({ behavior: 'smooth' });
          const dropzone = document.getElementById('dropzone');
          if (dropzone) {
            dropzone.classList.add('dropzone-active');
            setTimeout(() => dropzone.classList.remove('dropzone-active'), 1500);
          }
        }
        showToast('Ready to upload your study');
      });
    }

    // Action 2: Roll Random Prompt
    if (fabActionRoll) {
      fabActionRoll.addEventListener('click', () => {
        toggleFab(false);
        if (btnRollPrompt) {
          btnRollPrompt.click();
          const challenge = document.getElementById('daily-challenge');
          if (challenge) challenge.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Action 3: Search Gallery (Ctrl+K)
    if (fabActionSearch) {
      fabActionSearch.addEventListener('click', () => {
        toggleFab(false);
        const gallery = document.getElementById('gallery');
        if (gallery) gallery.scrollIntoView({ behavior: 'smooth' });
        if (searchInput) {
          setTimeout(() => {
            searchInput.focus();
            searchInput.select();
          }, 350);
        }
        showToast('🔍 Search focused (Ctrl+K)');
      });
    }
  }

  /* ==========================================================================
     12. Artist Progress Timeline Step Interactions
     ========================================================================== */
  const timelineSteps = document.querySelectorAll('.timeline-step');
  timelineSteps.forEach((step) => {
    step.addEventListener('click', () => {
      timelineSteps.forEach(s => s.classList.remove('active'));
      step.classList.add('active');
      const score = step.getAttribute('data-score');
      const num = step.querySelector('.step-num')?.textContent || '';
      showToast(`Study ${num}: Score ${score}/10`);
    });
  });

});


