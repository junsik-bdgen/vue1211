<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNoticeStore } from '../stores/notices'

const route = useRoute()
const router = useRouter()
const noticeStore = useNoticeStore()

const isEdit = computed(() => route.params.id !== undefined)
const form = ref({
  title: '',
  date: new Date().toISOString().split('T')[0],
  type: 'notice',
  content: '',
  attachment: null,
  attachmentName: ''
})

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      form.value.attachment = e.target.result
      form.value.attachmentName = file.name
    }
    reader.readAsDataURL(file)
  }
}

const removeAttachment = () => {
  form.value.attachment = null
  form.value.attachmentName = ''
  const fileInput = document.getElementById('attachment')
  if (fileInput) fileInput.value = ''
}

onMounted(async () => {
  if (isEdit.value) {
    // Ensure notices are loaded
    if (noticeStore.notices.length === 0) {
      await noticeStore.fetchNotices()
    }
    
    const notice = noticeStore.getNoticeById(route.params.id)
    if (notice) {
      form.value = { ...notice }
    } else {
      router.push('/notices')
    }
  }
})

const submitForm = async () => {
  try {
    // Prepare attachments array format for API
    const attachments = []
    if (form.value.attachment && form.value.attachmentName) {
      attachments.push({
        name: form.value.attachmentName,
        url: form.value.attachment
      })
    }
    
    const noticeData = {
      title: form.value.title,
      date: form.value.date,
      type: form.value.type,
      content: form.value.content,
      attachments: attachments
    }
    
    if (isEdit.value) {
      await noticeStore.updateNotice({ ...noticeData, id: form.value.id })
    } else {
      await noticeStore.addNotice(noticeData)
    }
    
    // Navigate based on type
    if (form.value.type === 'notice') {
      router.push('/notices')
    } else {
      router.push('/tournaments/calendar')
    }
  } catch (error) {
    console.error('Error submitting notice:', error)
    alert('공지사항 저장에 실패했습니다.')
  }
}
</script>

<template>
  <div class="notice-form-container">
    <h1>{{ isEdit ? '공지 수정' : '공지 등록' }}</h1>
    
    <form @submit.prevent="submitForm" class="notice-form">
      <div class="form-group">
        <label for="title">제목</label>
        <input 
          id="title" 
          v-model="form.title" 
          type="text" 
          required
          placeholder="제목을 입력하세요"
        >
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="date">날짜</label>
          <input 
            id="date" 
            v-model="form.date" 
            type="date" 
            required
          >
        </div>

        <div class="form-group">
          <label for="type">분류</label>
          <select id="type" v-model="form.type" required>
            <option value="notice">공지사항</option>
            <option value="event">행사</option>
            <option value="competition">대회</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="content">내용</label>
        <textarea 
          id="content" 
          v-model="form.content" 
          rows="10" 
          required
          placeholder="대회내용을 기술해주세요."
        ></textarea>
      </div>

      <div class="form-group">
        <label>첨부파일</label>
        <div class="file-upload-container">
          <label for="attachment" class="btn-file-upload">
            파일 선택
          </label>
          <input 
            type="file" 
            id="attachment" 
            @change="handleFileUpload"
            accept="image/*,.pdf,png,.jpg,.gif"
            style="display: none;"
          >
          <div v-if="form.attachmentName" class="file-preview-info">
            <span>{{ form.attachmentName }}</span>
            <button type="button" @click="removeAttachment" class="btn-delete-file">삭제</button>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" @click="router.push('/notices')" class="btn-secondary">취소</button>
        <button type="submit" class="btn-primary">{{ isEdit ? '수정' : '등록' }}</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.notice-form-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
  text-align: center;
}

.notice-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: #2c3e50;
}

input, select, textarea {
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

button {
  padding: 0.8rem 2rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
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

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.file-upload-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.btn-file-upload {
  display: inline-block;
  padding: 0.8rem 2rem;
  border-radius: 6px;
  background: #d4edda;
  color: #666;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.btn-file-upload:hover {
  background: #c3e6cb;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.file-preview-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.btn-delete-file {
  padding: 0.2rem 0.5rem;
  font-size: 0.8rem;
  background: #e74c3c;
  color: white;
  border-radius: 4px;
}

.btn-delete-file:hover {
  background: #c0392b;
  transform: none;
  box-shadow: none;
}
</style>
