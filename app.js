/**
 * Articrare — Prototype Application Logic (Milestone 1)
 *
 * This script handles:
 * 1. Image selection & live preview via HTML5 FileReader API
 * 2. Drag-and-drop support on the dropzone
 * 3. Adding uploaded sketches dynamically to the Community Gallery
 * 4. Generating realistic critique & ratings for newly submitted sketches
 */

// --- Sample Initial Artworks ---
// These appear when the page loads so the gallery isn't empty!
const initialArtworks = [
  {
    id: 'art-1',
    title: 'Zoro — Two Sword Stance Sketch',
    artist: 'Manish',
    category: 'Anime & Manga',
    focus: 'Linework & Cleanliness',
    notes: 'Working on cloth folds and blade perspective. Struggling slightly with the elbow angle.',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    score: '8.8',
    strengths: 'Dynamic gesture and crisp contour strokes around the shoulders.',
    suggestions: 'Add heavier cross-hatching to the inner cape to push depth forward.',
    likes: 24,
    time: '2 hours ago'
  },
  {
    id: 'art-2',
    title: 'Anatomy Study — Head Angles in Charcoal',
    artist: 'Elena R.',
    category: 'Charcoal',
    focus: 'Anatomy & Proportions',
    notes: 'Trying a 3/4 upward tilt view. Focus on jawline shadow.',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    score: '8.4',
    strengths: 'Accurate eye line alignment and soft tonal gradation.',
    suggestions: 'Increase core shadow beneath the chin to separate jaw from neck.',
    likes: 18,
    time: '5 hours ago'
  }
];

// --- DOM Elements ---
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const dropzonePrompt = document.getElementById('dropzonePrompt');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const removePreviewBtn = document.getElementById('removePreviewBtn');
const sketchForm = document.getElementById('sketchForm');
const galleryGrid = document.getElementById('galleryGrid');

// State tracking current preview image
let currentImageDataUrl = null;

// --- Step 1: File Selection & Preview Handling ---
fileInput.addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (file) {
    loadPreview(file);
  }
});

// Drag & Drop handlers
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    fileInput.files = e.dataTransfer.files;
    loadPreview(e.dataTransfer.files[0]);
  }
});

function loadPreview(file) {
  // Use HTML5 FileReader to convert image into a data URL for instant display
  const reader = new FileReader();
  reader.onload = function (e) {
    currentImageDataUrl = e.target.result;
    imagePreview.src = currentImageDataUrl;
    dropzonePrompt.classList.add('hidden');
    previewContainer.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

// Remove preview
removePreviewBtn.addEventListener('click', function (e) {
  e.stopPropagation();
  resetImagePicker();
});

function resetImagePicker() {
  currentImageDataUrl = null;
  fileInput.value = '';
  imagePreview.src = '';
  dropzonePrompt.classList.remove('hidden');
  previewContainer.classList.add('hidden');
}

// --- Step 2: Form Submission & Gallery Card Creation ---
sketchForm.addEventListener('submit', function (e) {
  e.preventDefault();

  if (!currentImageDataUrl) {
    alert('Please choose or drop an image of your sketch first!');
    return;
  }

  const title = document.getElementById('sketchTitle').value.trim();
  const category = document.getElementById('sketchCategory').value;
  const focus = document.getElementById('sketchFocus').value;
  const notes = document.getElementById('sketchNotes').value.trim() || 'Looking for general impressions and critique.';

  // Generate realistic feedback based on critique focus
  const critique = generateMockCritique(focus);

  const newArtwork = {
    id: 'art-' + Date.now(),
    title: title,
    artist: 'Manish (You)',
    category: category,
    focus: focus,
    notes: notes,
    imageUrl: currentImageDataUrl,
    score: critique.score,
    strengths: critique.strengths,
    suggestions: critique.suggestions,
    likes: 1,
    time: 'Just now'
  };

  // Prepend new artwork to the top of gallery
  const cardElement = createArtworkCard(newArtwork);
  galleryGrid.prepend(cardElement);

  // Reset form and preview
  sketchForm.reset();
  resetImagePicker();

  // Smooth scroll to newly added sketch
  cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// --- Step 3: Card Generator Function ---
function createArtworkCard(art) {
  const card = document.createElement('article');
  card.className = 'artwork-card';
  card.id = art.id;

  card.innerHTML = `
    <div class="artwork-media">
      <img src="${art.imageUrl}" alt="${art.title}">
    </div>
    <div class="artwork-details">
      <div>
        <div class="artwork-meta">
          <span class="artist-tag">Artist: <strong>${art.artist}</strong></span>
          <span class="category-chip">${art.category}</span>
        </div>
        <h3 class="artwork-title">${art.title}</h3>
        <p class="artwork-notes">"${art.notes}"</p>

        <!-- Critique & Rating Box -->
        <div class="critique-box">
          <div class="critique-header">
            <div class="critique-rating">
              <span>★</span>
              <span>${art.score} / 10</span>
            </div>
            <span class="critique-badge">Critique Focus: ${art.focus}</span>
          </div>
          <div class="critique-points">
            <div class="point-strength"><strong>✓ Strength:</strong> ${art.strengths}</div>
            <div class="point-suggestion"><strong>→ Next Step:</strong> ${art.suggestions}</div>
          </div>
        </div>
      </div>

      <div class="artwork-actions">
        <button class="btn-like" data-id="${art.id}">
          <span class="like-icon">♥</span>
          <span class="like-count">${art.likes}</span> Likes
        </button>
        <span class="timestamp">${art.time}</span>
      </div>
    </div>
  `;

  // Attach interactive like button
  const likeBtn = card.querySelector('.btn-like');
  likeBtn.addEventListener('click', function () {
    const isLiked = this.classList.toggle('liked');
    const countSpan = this.querySelector('.like-count');
    let count = parseInt(countSpan.textContent, 10);
    countSpan.textContent = isLiked ? count + 1 : count - 1;
  });

  return card;
}

// Helper: Generates contextual critique based on focus
function generateMockCritique(focus) {
  const critiques = {
    'Anatomy & Proportions': {
      score: '8.6',
      strengths: 'Solid posture grounding and head-to-shoulder ratio.',
      suggestions: 'Double check forearm taper; slightly soften the joint transition.'
    },
    'Shading & Contrast': {
      score: '8.2',
      strengths: 'Clear direction of primary light source across planes.',
      suggestions: 'Push the cast shadows darker with a 4B/6B pencil to increase drama.'
    },
    'Linework & Cleanliness': {
      score: '8.9',
      strengths: 'Confident, unhesitating strokes and distinct silhouette contour.',
      suggestions: 'Vary line weight (thicker on underside shadows, thinner in highlight areas).'
    },
    'Perspective & Depth': {
      score: '8.3',
      strengths: 'Effective foreshortening in the foreground limbs.',
      suggestions: 'Drop background detail saturation to enhance atmospheric depth.'
    },
    'General Feedback': {
      score: '8.5',
      strengths: 'Evocative expression, expressive gesture, and strong personal style.',
      suggestions: 'Keep practicing this angle—push the values further for maximum pop!'
    }
  };

  return critiques[focus] || critiques['General Feedback'];
}

// --- Initialize Gallery on page load ---
function initGallery() {
  initialArtworks.forEach((artwork) => {
    const card = createArtworkCard(artwork);
    galleryGrid.appendChild(card);
  });
}

initGallery();
