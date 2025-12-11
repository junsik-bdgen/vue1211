<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTournamentStore } from '../stores/tournaments'

const router = useRouter()
const tournamentStore = useTournamentStore()

const formData = ref({
  title: '',
  type: '개인전',
  date: '',
  location: '',
  fee: 0,
  maxParticipants: 32,
  contact: '',
  description: '',
  fileName: ''
})

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    formData.value.fileName = file.name
    // In a real app, you would upload the file here or convert to base64
  }
}

const submitForm = () => {
  if (!formData.value.title || !formData.value.date || !formData.value.location) {
    alert('필수 항목을 모두 입력해주세요.')
    return
  }

  tournamentStore.addTournament(formData.value)
  alert('대회가 성공적으로 생성되었습니다.')
  router.push('/tournaments')
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="create-container">
    <div class="header">
      <button @click="goBack" class="btn-back">&larr; 뒤로가기</button>
      <h1>새 대회 만들기</h1>
    </div>

    <div class="form-card">
      <div class="form-group">
        <label>대회명 *</label>
        <input v-model="formData.title" type="text" placeholder="예: 2025 양주협회장배 개인전" required />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>대회 유형</label>
          <select v-model="formData.type">
            <option value="개인전">개인전</option>
            <option value="단체전">단체전</option>
          </select>
        </div>

        <div class="form-group">
          <label>개최 일자 *</label>
          <input v-model="formData.date" type="date" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>장소 *</label>
          <input v-model="formData.location" type="text" placeholder="예: 양주 테니스장" required />
        </div>

        <div class="form-group">
          <label>참가비 (원)</label>
          <input v-model.number="formData.fee" type="number" min="0" step="1000" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>최대 참가 팀 수</label>
          <input v-model.number="formData.maxParticipants" type="number" min="4" step="4" />
        </div>
        
        <div class="form-group">
          <label>문의처</label>
          <input v-model="formData.contact" type="text" placeholder="예: 010-1234-5678" />
        </div>
      </div>

      <div class="form-group">
        <label>공지사항 / 상세내용</label>
        <textarea v-model="formData.description" rows="5" placeholder="대회 요강 및 공지사항을 입력하세요."></textarea>
      </div>

      <div class="form-group">
        <label>첨부파일 (대회 요강 등)</label>
        <input type="file" @change="handleFileChange" />
        <p v-if="formData.fileName" class="file-name">선택된 파일: {{ formData.fileName }}</p>
      </div>

      <div class="actions">
        <button @click="submitForm" class="btn-submit">대회 생성</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.btn-back {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  padding: 0;
}

h1 {
  color: #2c3e50;
  margin: 0;
}

.form-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 1.5rem;
  flex: 1;
}

.form-row {
  display: flex;
  gap: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

input, select, textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus, select:focus, textarea:focus {
  border-color: #3498db;
  outline: none;
}

textarea {
  resize: vertical;
}

.actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.btn-submit {
  background: #27ae60;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-submit:hover {
  background: #219150;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}

.file-name {
  margin-top: 0.5rem;
  color: #3498db;
  font-size: 0.9rem;
}
</style>
