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

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentQuery = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }

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

  // Open lightbox when clicking on any sketch image in the gallery
  document.querySelectorAll('.inspectable-image, .layer-3d-media').forEach(el => {
    el.addEventListener('click', (e) => {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      if (img) {
        const fullSrc = img.getAttribute('data-full') || img.src;
        const title = img.alt || 'Sketch Inspection';
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
      })
      .catch(err => console.error('Error liking sketch:', err));
    });
  });

});
