/**
 * Articrare — Client-side Interactivity (Milestone 2)
 *
 * Handles:
 * 1. Instant image preview when user selects or drops a file
 * 2. Drag-and-drop feedback
 * 3. Asynchronous like counter via Django API
 */

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const dropzone = document.getElementById('dropzone');
  const dropzonePrompt = document.getElementById('dropzonePrompt');
  const previewContainer = document.getElementById('previewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const removePreviewBtn = document.getElementById('removePreviewBtn');

  // File selection & live preview
  if (fileInput) {
    fileInput.addEventListener('change', function (event) {
      const file = event.target.files[0];
      if (file) {
        loadPreview(file);
      }
    });
  }

  // Drag & drop handlers
  if (dropzone) {
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
  }

  function loadPreview(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
      dropzonePrompt.classList.add('hidden');
      previewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  // Remove preview button
  if (removePreviewBtn) {
    removePreviewBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      fileInput.value = '';
      imagePreview.src = '';
      dropzonePrompt.classList.remove('hidden');
      previewContainer.classList.add('hidden');
    });
  }

  // Like buttons connected to Django backend
  const likeButtons = document.querySelectorAll('.btn-like');
  likeButtons.forEach((btn) => {
    btn.addEventListener('click', function () {
      const artId = this.getAttribute('data-id');
      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

      fetch(`/like/${artId}/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(data => {
        const countSpan = this.querySelector('.like-count');
        countSpan.textContent = data.likes;
        this.classList.add('liked');
      })
      .catch(err => {
        console.error('Error updating like:', err);
      });
    });
  });
});
