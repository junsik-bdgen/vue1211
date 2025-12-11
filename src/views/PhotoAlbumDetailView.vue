<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePhotoStore } from '../stores/photos'

const route = useRoute()
const router = useRouter()
const photoStore = usePhotoStore()

const album = computed(() => photoStore.getAlbumById(route.params.id))
const showUploadModal = ref(false)
const showEditModal = ref(false)
const editTitle = ref('')
const editDescription = ref('')

const fileInput = ref(null)
const stagedPhotos = ref([])

onMounted(async () => {
  if (photoStore.albums.length === 0) {
    await photoStore.fetchAlbums()
  }

  if (!album.value) {
    router.push('/photos')
  } else {
    editTitle.value = album.value.title
    editDescription.value = album.value.description || ''
  }
})

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (!files.length) return

  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const maxDim = 800

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height *= maxDim / width
            width = maxDim
          } else {
            width *= maxDim / height
            height = maxDim
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const compressedUrl = canvas.toDataURL('image/jpeg', 0.7)
        
        stagedPhotos.value.push({
          url: compressedUrl,
          caption: file.name,
          file: file
        })
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
  
  event.target.value = ''
}

const removeStagedPhoto = (index) => {
  stagedPhotos.value.splice(index, 1)
}

const completeUpload = async () => {
  const photosToAdd = stagedPhotos.value.map(photo => ({
    url: photo.url,
    caption: photo.caption
  }))
  
  try {
    await photoStore.addPhotos(album.value.id, photosToAdd)
    
    stagedPhotos.value = []
    showUploadModal.value = false
  } catch (e) {
    alert('Failed to upload photos: ' + e.message)
  }
}

const openUploadModal = () => {
  stagedPhotos.value = []
  showUploadModal.value = true
}

const handleDeletePhoto = async (photoId) => {
  if (confirm('Are you sure you want to delete this photo?')) {
    try {
      await photoStore.deletePhoto(album.value.id, photoId)
    } catch (e) {
      alert('Failed to delete photo: ' + e.message)
    }
  }
}

const handleUpdateAlbum = async () => {
  // TODO: Implement async update in store
  photoStore.updateAlbum(album.value.id, {
    title: editTitle.value,
    description: editDescription.value
  })
  showEditModal.value = false
}

const handleDeleteAlbum = async () => {
  if (confirm('Are you sure you want to delete this entire album?')) {
    try {
      await photoStore.deleteAlbum(album.value.id)
      router.push('/photos')
    } catch (e) {
      alert('Failed to delete album: ' + e.message)
    }
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}
</script>

<template>
  <div class="album-detail-container" v-if="album">
    <div class="header-actions">
      <button @click="router.push('/photos')" class="btn-back">← Back</button>
      <div class="actions">
        <button @click="showEditModal = true" class="btn-edit">Edit Album</button>
        <button @click="handleDeleteAlbum" class="btn-delete">Delete Album</button>
      </div>
    </div>

    <div class="album-header">
      <h1>{{ album.title }}</h1>
      <p class="date">{{ album.date }}</p>
      <p class="description">{{ album.description }}</p>
    </div>

    <div class="upload-section">
      <button @click="openUploadModal" class="btn-upload">
        + Upload Photos
      </button>
    </div>

    <div class="photos-grid">
      <div v-for="photo in album.photos" :key="photo.id" class="photo-card">
        <img :src="photo.url" :alt="photo.caption" />
        <button @click="handleDeletePhoto(photo.id)" class="btn-delete-photo">×</button>
      </div>
      <div v-if="!album.photos || album.photos.length === 0" class="empty-state">
        <p>No photos yet. Upload one!</p>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click.self="showUploadModal = false">
      <div class="modal-content upload-modal">
        <h2>Upload Photos</h2>
        
        <div class="upload-controls">
          <button @click="triggerFileInput" class="btn-select-files">Select Files</button>
          <input 
            type="file" 
            ref="fileInput" 
            @change="handleFileSelect" 
            accept="image/*" 
            multiple
            style="display: none" 
          />
          <span class="file-count" v-if="stagedPhotos.length > 0">
            {{ stagedPhotos.length }} files selected
          </span>
        </div>

        <div class="staged-photos-grid" v-if="stagedPhotos.length > 0">
          <div v-for="(photo, index) in stagedPhotos" :key="index" class="staged-photo-card">
            <img :src="photo.url" :alt="photo.caption" />
            <button @click="removeStagedPhoto(index)" class="btn-remove-staged">×</button>
          </div>
        </div>
        <div v-else class="upload-placeholder">
          <p>Select photos to add to this album</p>
        </div>

        <div class="modal-actions">
          <button @click="showUploadModal = false" class="btn-cancel">Cancel</button>
          <button 
            @click="completeUpload" 
            class="btn-confirm"
            :disabled="stagedPhotos.length === 0"
          >
            Complete Upload
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <h2>Edit Album</h2>
        <input v-model="editTitle" placeholder="Album Title" class="input-field" />
        <textarea v-model="editDescription" placeholder="Description" class="input-field textarea"></textarea>
        <div class="modal-actions">
          <button @click="showEditModal = false" class="btn-cancel">Cancel</button>
          <button @click="handleUpdateAlbum" class="btn-confirm">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.album-detail-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.btn-back {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #666;
}

.actions {
  display: flex;
  gap: 1rem;
}

.album-header {
  margin-bottom: 2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.album-header h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.date {
  color: #888;
  font-size: 0.9rem;
}

.description {
  margin-top: 1rem;
  line-height: 1.6;
}

.upload-section {
  margin-bottom: 2rem;
}

.btn-upload {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
}

.btn-edit {
  background: #f39c12;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-delete {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.photo-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  aspect-ratio: 1;
}

.photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-delete-photo {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete-photo:hover {
  background: rgba(231, 76, 60, 0.8);
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  background: #f9f9f9;
  border-radius: 8px;
  color: #666;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.upload-modal {
  max-width: 800px; /* Wider for upload modal */
}

.upload-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn-select-files {
  background: #2ecc71;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.file-count {
  color: #666;
  font-size: 0.9rem;
}

.staged-photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.staged-photo-card {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.staged-photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-remove-staged {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.upload-placeholder {
  text-align: center;
  padding: 3rem;
  background: #f9f9f9;
  border-radius: 8px;
  color: #999;
  margin-bottom: 2rem;
  border: 2px dashed #ddd;
}

.input-field {
  width: 100%;
  padding: 0.8rem;
  margin: 1rem 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-confirm {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-confirm:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
