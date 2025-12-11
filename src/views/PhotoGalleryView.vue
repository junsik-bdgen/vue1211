<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePhotoStore } from '../stores/photos'

const router = useRouter()
const photoStore = usePhotoStore()
const showUploadModal = ref(false)
const newAlbumTitle = ref('')
const newAlbumDescription = ref('')

onMounted(() => {
  photoStore.fetchAlbums()
})

const getAlbumCover = (album) => {
  // If album has photos, use the first one as cover
  if (album.photos && album.photos.length > 0) {
    return album.photos[0].url
  }
  
  // Fallback to default cover asset
  const name = album.cover || 'tennis_court_background.png'
  if (name.startsWith('data:') || name.startsWith('http')) {
    return name
  }
  
  try {
    return new URL(`../assets/${name}`, import.meta.url).href
  } catch (e) {
    return 'https://via.placeholder.com/300?text=No+Image'
  }
}

const handleCreateAlbum = async () => {
  if (!newAlbumTitle.value) return
  
  try {
    await photoStore.addAlbum({
      title: newAlbumTitle.value,
      description: newAlbumDescription.value,
      date: new Date().toISOString().split('T')[0],
      cover: 'tennis_court_background.png' // Default cover
    })
    
    newAlbumTitle.value = ''
    newAlbumDescription.value = ''
    showUploadModal.value = false
  } catch (e) {
    alert('앨범 생성 실패: ' + e.message)
  }
}

const navigateToAlbum = (id) => {
  router.push(`/photos/${id}`)
}
</script>

<template>
  <div class="gallery-container">
    <div class="header-actions">
      <h1>클럽 앨범</h1>
      <button @click="showUploadModal = true" class="btn-add">
        +  새 앨범 만들기
      </button>
    </div>

    <div class="albums-grid">
      <!-- Loading State -->
      <div v-if="photoStore.isLoading" class="loading-message">
        <p>앨범을 불러오는 중...</p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="photoStore.error" class="error-message">
        <p>❌ 앨범을 불러오는데 실패했습니다: {{ photoStore.error }}</p>
        <button @click="photoStore.fetchAlbums()" class="btn-retry">다시 시도</button>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="!photoStore.albums || photoStore.albums.length === 0" class="empty-message">
        <p>📸 아직 앨범이 없습니다.</p>
        <p>새 앨범을 만들어 사진을 업로드해보세요!</p>
      </div>
      
      <!-- Albums Grid -->
      <div v-else v-for="album in photoStore.albums" :key="album.id" class="album-card" @click="navigateToAlbum(album.id)">
        <div class="album-cover" :style="{ backgroundImage: `url(${getAlbumCover(album)})` }">
          <div class="album-overlay">
            <span>View Album</span>
          </div>
        </div>
        <div class="album-info">
          <h3>{{ album.title }}</h3>
          <p>{{ album.date }}</p>
          <p class="photo-count" v-if="album.photos">{{ album.photos.length }} photos</p>
        </div>
      </div>
    </div>

    <!-- Create Album Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click.self="showUploadModal = false">
      <div class="modal-content">
        <h2>새 앨범 만들기</h2>
        <input v-model="newAlbumTitle" placeholder="앨범 제목" class="input-field" />
        <textarea v-model="newAlbumDescription" placeholder="앨범 설명 (선택사항)" class="input-field textarea"></textarea>
        <div class="modal-actions">
          <button @click="showUploadModal = false" class="btn-cancel">Cancel</button>
          <button @click="handleCreateAlbum" class="btn-confirm">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-container {
  padding: 1rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-add {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.loading-message,
.error-message,
.empty-message {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.loading-message p {
  font-size: 1.1rem;
  color: #666;
}

.error-message p {
  font-size: 1.1rem;
  color: #e74c3c;
  margin-bottom: 1rem;
}

.empty-message p {
  font-size: 1.1rem;
  color: #666;
  margin: 0.5rem 0;
}

.empty-message p:first-child {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.btn-retry {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: #2980b9;
}

.album-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s;
  cursor: pointer;
}

.album-card:hover {
  transform: translateY(-5px);
}

.album-cover {
  aspect-ratio: 1;
  background-size: cover;
  background-position: center;
  position: relative;
}

.album-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.album-card:hover .album-overlay {
  opacity: 1;
}

.album-info {
  padding: 1rem;
}

.album-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.album-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.photo-count {
  margin-top: 0.5rem !important;
  font-size: 0.8rem !important;
  color: #888 !important;
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
  max-width: 400px;
}

.input-field {
  width: 100%;
  padding: 0.8rem;
  margin: 1rem 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.textarea {
  min-height: 80px;
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
</style>
