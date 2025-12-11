<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNoticeStore } from '../stores/notices'

const route = useRoute()
const router = useRouter()
const noticeStore = useNoticeStore()
const notice = ref(null)

onMounted(async () => {
  const id = route.params.id
  
  if (noticeStore.notices.length === 0) {
    await noticeStore.fetchNotices()
  }
  
  notice.value = noticeStore.getNoticeById(id)
  if (!notice.value) {
    router.push('/notices')
  } else {
    noticeStore.incrementViews(id)
  }
})

const deleteNotice = async () => {
  if (confirm('Are you sure you want to delete this notice?')) {
    await noticeStore.deleteNotice(notice.value.id)
    router.push('/notices')
  }
}

const getEventTypeClass = (type) => {
  switch (type) {
    case 'competition': return 'event-competition'
    case 'event': return 'event-general'
    default: return 'event-notice'
  }
}
</script>

<template>
  <div class="notice-detail-container" v-if="notice">
    <div class="notice-header">
      <div class="header-top">
        <span :class="['tag', getEventTypeClass(notice.type)]">{{ notice.type }}</span>
        <span class="date">{{ notice.date }}</span>
      </div>
      <h1>{{ notice.title }}</h1>
    </div>
    
    <div class="notice-content">
      <p>{{ notice.content }}</p>
      
      <div v-if="notice.attachment" class="attachment-section">
        <h3>첨부파일</h3>
        <div v-if="notice.attachment.startsWith('data:image')" class="image-preview">
          <img :src="notice.attachment" :alt="notice.attachmentName || 'Attachment'">
        </div>
        <div class="file-download">
          <a :href="notice.attachment" :download="notice.attachmentName || 'download'">
            {{ notice.attachmentName || '파일 다운로드' }}
          </a>
        </div>
      </div>
    </div>

    <div class="actions">
      <button @click="router.push('/notices')" class="btn-secondary">뒤로 가기</button>
      <div class="admin-actions">
        <button @click="router.push(`/notices/${notice.id}/edit`)" class="btn-primary">수정</button>
        <button @click="deleteNotice" class="btn-danger">삭제</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notice-detail-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tag {
  font-size: 0.85rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  text-transform: uppercase;
  font-weight: bold;
}

.date {
  color: #666;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.notice-content {
  min-height: 200px;
  line-height: 1.6;
  color: #444;
  margin-bottom: 2rem;
  white-space: pre-wrap;
}

.attachment-section {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.attachment-section h3 {
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.image-preview img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
}

.file-download a {
  color: #3498db;
  text-decoration: none;
  font-weight: 600;
}

.file-download a:hover {
  text-decoration: underline;
}

.actions {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #eee;
  padding-top: 2rem;
}

.admin-actions {
  display: flex;
  gap: 1rem;
}

button {
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f1f2f6;
  color: #2c3e50;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Event Type Colors */
.event-competition { background-color: rgba(231, 76, 60, 0.1); color: #e74c3c; }
.event-general { background-color: rgba(39, 174, 96, 0.1); color: #27ae60; }
.event-notice { background-color: rgba(52, 152, 219, 0.1); color: #3498db; }
</style>
