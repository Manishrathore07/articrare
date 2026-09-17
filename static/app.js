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
     1. 3D Floating Starfield, Ink Nodes & Graphite Constellation Canvas
     ========================================================================== */
  const canvas = document.getElementById('artDustCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0;
    let particles = [];
    const PARTICLE_COUNT = 140; // Richer star & dust density
    const FOV = 450;

    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0, rawX: -9999, rawY: -9999 };
    let isVisible = true;

    function resizeCanvas() {
      const hero = canvas.closest('.hero-section') || canvas.parentElement;
      const rect = hero.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    // Double-check resize after load to guarantee exact pixel resolution
    window.addEventListener('load', resizeCanvas);

    // Track mouse and scroll velocity over hero section
    const heroSection = canvas.closest('.hero-section') || canvas.parentElement;
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    window.addEventListener('scroll', () => {
      const curY = window.scrollY;
      scrollVelocity = (curY - lastScrollY) * 0.15;
      lastScrollY = curY;
    }, { passive: true });

    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      mouse.rawX = e.clientX - rect.left;
      mouse.rawY = e.clientY - rect.top;
      // Responsive dynamic tilt target
      mouse.targetX = ((mouse.rawX / rect.width) - 0.5) * 0.0035;
      mouse.targetY = ((mouse.rawY / rect.height) - 0.5) * 0.0035;
    });

    heroSection.addEventListener('mouseleave', () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
      mouse.rawX = -9999;
      mouse.rawY = -9999;
    });

    // 3D Particles with multiple star types: luminous ink stars, cyan beacons, and graphite dust
    class Particle3D {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = (Math.random() - 0.5) * (width || 1200) * 1.5;
        this.y = (Math.random() - 0.5) * (height || 600) * 1.5;
        this.z = init ? Math.random() * 600 - 300 : 300;
        
        // Dynamic drift speeds with continuous ambient float
        this.vx = (Math.random() - 0.5) * 0.75;
        this.vy = (Math.random() - 0.5) * 0.75;
        this.vz = -0.5 - Math.random() * 0.65;
        
        // Star pulse cycle
        this.pulseAngle = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02 + Math.random() * 0.035;

        // Variety of particle types:
        const rand = Math.random();
        if (rand > 0.65) {
          // Luminous purple ink star (medium-large, glowing)
          this.type = 'ink';
          this.baseRadius = 1.8 + Math.random() * 2.2;
          this.colorBase = '168, 85, 247';
        } else if (rand > 0.40) {
          // Electric cyan pulse star
          this.type = 'cyan';
          this.baseRadius = 1.5 + Math.random() * 1.8;
          this.colorBase = '56, 189, 248';
        } else {
          // Silver-white graphite diamond / micro-star
          this.type = 'graphite';
          this.baseRadius = 1.0 + Math.random() * 1.6;
          this.colorBase = '226, 232, 240';
        }
      }

      update(rotX, rotY, velY, mouseRawX, mouseRawY, cx, cy) {
        // Rotate around Y axis
        const cosY = Math.cos(rotX);
        const sinY = Math.sin(rotX);
        let x1 = this.x * cosY - this.z * sinY;
        let z1 = this.z * cosY + this.x * sinY;

        // Rotate around X axis
        const cosX = Math.cos(rotY);
        const sinX = Math.sin(rotY);
        let y1 = this.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + this.y * sinX;

        // Cursor proximity gravity/deflection
        if (mouseRawX > -1000) {
          const depth = z2 + FOV;
          if (depth > 10) {
            const scale = FOV / depth;
            const sx = x1 * scale + cx;
            const sy = y1 * scale + cy;
            const dx = sx - mouseRawX;
            const dy = sy - mouseRawY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 130 && dist > 1) {
              const push = (130 - dist) * 0.003;
              this.x += (dx / dist) * push * 6;
              this.y += (dy / dist) * push * 6;
            }
          }
        }

        // Natural movement + velocity reactive float
        this.x += this.vx;
        this.y += this.vy - velY * 0.6;
        this.z += this.vz;
        this.pulseAngle += this.pulseSpeed;

        // Boundary wrapping
        if (this.z < -FOV + 40 || Math.abs(this.x) > width * 0.95 || Math.abs(this.y) > height * 0.95) {
          this.reset(false);
        }

        return { x: x1, y: y1, z: z2 };
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle3D());
    }

    // Intersection observer to pause rendering when scrolled out of view
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(heroSection);

    let curRotX = 0, curRotY = 0;

    function render3D() {
      if (!isVisible) {
        requestAnimationFrame(render3D);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      curRotX += (mouse.targetX - curRotX) * 0.08;
      curRotY += (mouse.targetY - curRotY) * 0.08;
      scrollVelocity *= 0.92; // Decay scroll velocity smoothly

      const cx = width / 2;
      const cy = height / 2;
      const projected = [];

      // Project particles to 2D
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const pos = p.update(curRotX, curRotY, scrollVelocity, mouse.rawX, mouse.rawY, cx, cy);
        const depth = pos.z + FOV;

        if (depth > 10) {
          const scale = FOV / depth;
          const sx = pos.x * scale + cx;
          const sy = pos.y * scale + cy;

          // Star pulse factor
          const pulse = 0.85 + Math.sin(p.pulseAngle) * 0.25;
          const r = Math.max(0.7, p.baseRadius * scale * pulse);
          const alpha = Math.min(0.95, Math.max(0.15, (scale * 0.9) * pulse));

          projected.push({ sx, sy, r, alpha, colorBase: p.colorBase, type: p.type });

          // Draw Glowing Star
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.colorBase}, ${alpha})`;
          ctx.fill();

          // Outer halo on larger stars
          if (r > 2.2) {
            ctx.beginPath();
            ctx.arc(sx, sy, r * 2.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.colorBase}, ${alpha * 0.22})`;
            ctx.fill();
          }

          // Twinkle cross on prominent beacon stars
          if (p.type === 'ink' && r > 2.6) {
            ctx.strokeStyle = `rgba(196, 181, 253, ${alpha * 0.45})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(sx - r * 2.8, sy);
            ctx.lineTo(sx + r * 2.8, sy);
            ctx.moveTo(sx, sy - r * 2.8);
            ctx.lineTo(sx, sy + r * 2.8);
            ctx.stroke();
          }
        }
      }

      // Draw constellation connective lines between neighboring stars
      ctx.lineWidth = 0.75;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.sx - p2.sx;
          const dy = p1.sy - p2.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const lineAlpha = (1 - dist / 110) * 0.25;
            // Gradient or dual-tone stroke
            ctx.strokeStyle = (p1.type === 'ink' || p2.type === 'ink')
              ? `rgba(168, 85, 247, ${lineAlpha})`
              : `rgba(56, 189, 248, ${lineAlpha * 0.85})`;
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }
        }

        // Draw interactive line from cursor to nearby stars
        if (mouse.rawX > -1000) {
          const p = projected[i];
          const dx = p.sx - mouse.rawX;
          const dy = p.sy - mouse.rawY;
          const mouseDist = Math.sqrt(dx * dx + dy * dy);
          if (mouseDist < 120) {
            const mLineAlpha = (1 - mouseDist / 120) * 0.45;
            ctx.strokeStyle = `rgba(196, 181, 253, ${mLineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(mouse.rawX, mouse.rawY);
            ctx.lineTo(p.sx, p.sy);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(render3D);
    }
    render3D();
  }

  /* ==========================================================================
     Studio Torchlight & Dynamic Cursor Spotlight (taste-skill / impeccable)
     ========================================================================== */
  const heroTorch = document.getElementById('heroTorchlight');
  const heroSec = document.getElementById('hero');
  if (heroTorch && heroSec) {
    let torchX = window.innerWidth / 2, torchY = 250;
    let targetTorchX = torchX, targetTorchY = torchY;
    let torchActive = false;

    heroSec.addEventListener('mousemove', (e) => {
      const rect = heroSec.getBoundingClientRect();
      targetTorchX = e.clientX - rect.left;
      targetTorchY = e.clientY - rect.top;
      torchActive = true;
    });

    heroSec.addEventListener('mouseleave', () => {
      torchActive = false;
    });

    function updateTorch() {
      if (torchActive) {
        torchX += (targetTorchX - torchX) * 0.08;
        torchY += (targetTorchY - torchY) * 0.08;
        heroTorch.style.setProperty('--torch-x', `${torchX.toFixed(1)}px`);
        heroTorch.style.setProperty('--torch-y', `${torchY.toFixed(1)}px`);
        heroTorch.style.opacity = '1';
      } else {
        heroTorch.style.opacity = '0.5';
      }
      requestAnimationFrame(updateTorch);
    }
    updateTorch();
  }

  /* ==========================================================================
     Navbar Scroll Compacting & Frosted Glass Dynamics
     ========================================================================== */
  const mainNavbar = document.getElementById('mainNavbar');
  if (mainNavbar) {
    const handleNavScroll = () => {
      if (window.scrollY > 30) {
        mainNavbar.classList.add('scrolled');
      } else {
        mainNavbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();
  }

  /* ==========================================================================
     Magnetic Kinetic Buttons (Awwwards-grade Spring Physics)
     ========================================================================== */
  const magneticBtns = document.querySelectorAll('.btn-magnetic');
  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.28}px, ${y * 0.28}px) scale(1.03)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0px, 0px) scale(1)';
    });
  });

  /* ==========================================================================
     2. 3D Perspective Card Tilt & Dynamic Specular Sheen Engine
     ========================================================================== */
  const tiltCards = document.querySelectorAll('[data-tilt]');

  tiltCards.forEach(card => {
    let bounds = null;
    const mediaLayer = card.querySelector('.layer-3d-media');
    const contentLayer = card.querySelector('.layer-3d-content');

    function onMouseEnter(e) {
      bounds = card.getBoundingClientRect();
      card.style.setProperty('--glare-opacity', '1');
    }

    function onMouseMove(e) {
      if (!bounds) bounds = card.getBoundingClientRect();

      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;

      const normX = (mouseX / bounds.width) - 0.5;
      const normY = (mouseY / bounds.height) - 0.5;

      // Max 12 deg pitch, 14 deg yaw
      const tiltX = (normY * -12).toFixed(2);
      const tiltY = (normX * 14).toFixed(2);

      card.style.transform = `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.018, 1.018, 1.018)`;
      card.style.setProperty('--mouse-x', `${mouseX}px`);
      card.style.setProperty('--mouse-y', `${mouseY}px`);
      card.style.setProperty('--glare-x', `${(mouseX / bounds.width * 100).toFixed(1)}%`);
      card.style.setProperty('--glare-y', `${(mouseY / bounds.height * 100).toFixed(1)}%`);

      // Parallax layer offsets inside card
      if (mediaLayer) {
        mediaLayer.style.transform = `translateZ(26px) translateX(${(normX * 6).toFixed(1)}px) translateY(${(normY * 6).toFixed(1)}px)`;
      }
      if (contentLayer) {
        contentLayer.style.transform = `translateZ(14px) translateX(${(normX * 3).toFixed(1)}px) translateY(${(normY * 3).toFixed(1)}px)`;
      }
    }

    function onMouseLeave() {
      card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      card.style.setProperty('--glare-opacity', '0');
      if (mediaLayer) {
        mediaLayer.style.transform = 'translateZ(26px) translateX(0px) translateY(0px)';
      }
      if (contentLayer) {
        contentLayer.style.transform = 'translateZ(14px) translateX(0px) translateY(0px)';
      }
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

  /* ==========================================================================
     13. GSAP & ScrollTrigger 3D Motion Engine & Storytelling
     ========================================================================== */
  const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // A. Hero Multi-Layer Parallax
  if (hasGsap && !hasReducedMotion) {
    gsap.to('.hero-depth-bg', {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    gsap.to('.hero-depth-mid', {
      yPercent: 32,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    gsap.to('#heroTitle', {
      y: -35,
      opacity: 0.6,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    // B. Cinematic Sketchbook Reveal
    gsap.fromTo('#sketchbookStage', 
      { scale: 0.85, opacity: 0.35, rotateX: 6 },
      {
        scale: 1,
        opacity: 1,
        rotateX: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#sketchbook-reveal',
          start: 'top 85%',
          end: 'top 35%',
          scrub: 1.2
        }
      }
    );

    // C. Stacked Physical Showcase Deck Entrance
    gsap.from('.showcase-sheet', {
      y: 60,
      opacity: 0,
      scale: 0.88,
      stagger: 0.16,
      duration: 0.9,
      ease: 'back.out(1.2)',
      scrollTrigger: {
        trigger: '#sketchbook-showcase',
        start: 'top 75%'
      }
    });

    // D. Daily Challenge 3D Entrance
    gsap.fromTo('#challengeCard',
      { scale: 0.82, opacity: 0.4 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#daily-challenge',
          start: 'top 80%'
        }
      }
    );
  }

  /* ==========================================================================
     14. Stepwise AI Vision Scanner (Interactive + Scroll-Scrubbed)
     ========================================================================== */
  const stepBtns = document.querySelectorAll('.scan-step-btn');
  const stepwiseScannerStage = document.getElementById('scannerStage');

  function setScannerStep(step) {
    stepBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.step === String(step));
    });
    if (stepwiseScannerStage) {
      stepwiseScannerStage.setAttribute('data-step', String(step));
    }
  }

  stepBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const step = btn.dataset.step;
      setScannerStep(step);
      showToast(`AI Vision Analysis: Step 0${step}`);
    });
  });

  // Scroll scrub for AI Vision section
  if (hasGsap && !hasReducedMotion) {
    ScrollTrigger.create({
      trigger: '#ai-vision',
      start: 'top 55%',
      end: 'bottom 45%',
      onUpdate: (self) => {
        const step = Math.min(6, Math.max(1, Math.ceil(self.progress * 6)));
        setScannerStep(step);
      }
    });
  }

  /* ==========================================================================
     15. "Improve My Sketch" Reveal & Sequential Directives
     ========================================================================== */
  const improveCard = document.getElementById('improveSketchCard');
  const improveScoreEl = document.getElementById('improveScoreNum');
  const btnGenerateGuide = document.getElementById('btnGenerateGuide');
  const stepItems = document.querySelectorAll('.improve-step-item');
  let improveAnimated = false;

  function runImproveAnimation() {
    if (improveAnimated) return;
    improveAnimated = true;
    if (improveScoreEl) {
      let cur = 0;
      const target = 7.4;
      const timer = setInterval(() => {
        cur += 0.25;
        if (cur >= target) {
          cur = target;
          clearInterval(timer);
        }
        improveScoreEl.textContent = cur.toFixed(1);
      }, 35);
    }
  }

  if (improveCard) {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        runImproveAnimation();
      }
    }, { threshold: 0.3 });
    obs.observe(improveCard);
  }

  if (btnGenerateGuide) {
    btnGenerateGuide.addEventListener('click', () => {
      stepItems.forEach((item, idx) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(18px)';
        setTimeout(() => {
          item.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        }, (idx + 1) * 140);
      });
      showToast('✦ 4-Step Improvement Directives Activated');
    });
  }

  /* ==========================================================================
     16. Before vs After Animated Counters & Progress Bars
     ========================================================================== */
  const baCard = document.getElementById('beforeAfterCard');
  let baTriggered = false;

  function runBeforeAfterAnim() {
    if (baTriggered) return;
    baTriggered = true;
    const fills = document.querySelectorAll('.ba-progress-fill');
    fills.forEach(fill => {
      const targetWidth = fill.style.width;
      fill.style.width = '0%';
      setTimeout(() => {
        fill.style.width = targetWidth;
      }, 200);
    });
  }

  if (baCard) {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        runBeforeAfterAnim();
      }
    }, { threshold: 0.3 });
    obs.observe(baCard);
  }

  /* ==========================================================================
     17. Interactive 10-Node Artistic Skill Tree
     ========================================================================== */
  const treeNodes = document.querySelectorAll('.tree-node');
  const inspectorName = document.getElementById('inspectorSkillName');
  const inspectorLevel = document.getElementById('inspectorSkillLevel');
  const inspectorScore = document.getElementById('inspectorSkillScore');
  const inspectorDesc = document.getElementById('inspectorSkillDesc');

  treeNodes.forEach(node => {
    function activateNode() {
      treeNodes.forEach(n => n.classList.remove('node-active'));
      node.classList.add('node-active');

      const skill = node.dataset.skill;
      const score = node.dataset.score;
      const level = node.dataset.level;
      const desc = node.dataset.desc;

      if (inspectorName) inspectorName.textContent = skill;
      if (inspectorLevel) inspectorLevel.textContent = level;
      if (inspectorScore) inspectorScore.textContent = `${score} / 10`;
      if (inspectorDesc) inspectorDesc.textContent = desc;
    }

    node.addEventListener('mouseenter', activateNode);
    node.addEventListener('click', (e) => {
      e.preventDefault();
      activateNode();
      showToast(`Skill Tree: ${node.dataset.skill} (${node.dataset.score}/10)`);
    });
  });

  /* ==========================================================================
     18. Connected Artistic Journey Timeline Progress
     ========================================================================== */
  const journeyProgress = document.getElementById('journeyPathProgress');
  if (journeyProgress && hasGsap && !hasReducedMotion) {
    gsap.fromTo(journeyProgress,
      { strokeDashoffset: 1000 },
      {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '#artisticJourney',
          start: 'top 70%',
          end: 'bottom 60%',
          scrub: 1
        }
      }
    );
  }

  /* ==========================================================================
     19. Magnetic Button Micro-Interactions
     ========================================================================== */
  if (!hasReducedMotion) {
    const magneticButtons = document.querySelectorAll('.btn-magnetic');
    magneticButtons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.28;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.28;
        btn.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  /* ==========================================================================
     20. Navbar Dropdown Interactions & Mobile Hamburger Menu
     ========================================================================== */
  const navHamburger = document.getElementById('navHamburger');
  const navMenu = document.getElementById('navMenu');
  const dropdownItems = document.querySelectorAll('.nav-item-dropdown');

  if (navHamburger && navMenu) {
    navHamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.toggle('mobile-menu-open');
      navHamburger.classList.toggle('is-active', isOpen);
      navHamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close mobile menu when clicking any nav link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-menu-open');
        navHamburger.classList.remove('is-active');
        navHamburger.setAttribute('aria-expanded', 'false');
        dropdownItems.forEach(item => {
          item.classList.remove('mobile-open');
          const trigger = item.querySelector('.nav-dropdown-trigger');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
      });
    });
  }

  // Toggle dropdown on click for touch screens and keyboards
  dropdownItems.forEach(item => {
    const trigger = item.querySelector('.nav-dropdown-trigger');
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isMobile = window.innerWidth <= 860;
        if (isMobile) {
          item.classList.toggle('mobile-open');
          const isExpanded = item.classList.contains('mobile-open');
          trigger.setAttribute('aria-expanded', String(isExpanded));
        } else {
          const isOpen = item.classList.toggle('dropdown-open');
          trigger.setAttribute('aria-expanded', String(isOpen));
          // Close sibling dropdowns
          dropdownItems.forEach(sibling => {
            if (sibling !== item) {
              sibling.classList.remove('dropdown-open');
              const sibTrigger = sibling.querySelector('.nav-dropdown-trigger');
              if (sibTrigger) sibTrigger.setAttribute('aria-expanded', 'false');
            }
          });
        }
      });
    }
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item-dropdown')) {
      dropdownItems.forEach(item => {
        item.classList.remove('dropdown-open');
        const trigger = item.querySelector('.nav-dropdown-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    }
    if (navMenu && !e.target.closest('.navbar')) {
      navMenu.classList.remove('mobile-menu-open');
      if (navHamburger) {
        navHamburger.classList.remove('is-active');
        navHamburger.setAttribute('aria-expanded', 'false');
      }
    }
  });

});


