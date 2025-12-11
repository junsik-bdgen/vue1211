<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTournamentStore } from '../stores/tournaments'

const router = useRouter()
const tournamentStore = useTournamentStore()
const selectedTournament = ref(null)
const showForm = ref(false)

const formData = ref({
  playerName: '',
  playerClub: '',
  playerRank: '비입상',
  playerPoint: '',
  partnerName: '',
  partnerClub: '',
  partnerRank: '비입상',
  partnerPoint: '',
  phone: ''
})

const openRegistration = (tournament) => {
  selectedTournament.value = tournament
  showForm.value = true
  formData.value = {
    playerName: '',
    playerClub: '',
    playerRank: '비입상',
    playerPoint: '',
    partnerName: '',
    partnerClub: '',
    partnerRank: '비입상',
    partnerPoint: '',
    phone: ''
  }
}

const viewParticipants = (tournament) => {
  router.push({ 
    name: 'tournament-participants', 
    params: { id: tournament.id } 
  })
}

const submitRegistration = async () => {
  if (!formData.value.playerName || !formData.value.phone) {
    alert('필수 항목을 입력해주세요 (선수 성명, 전화번호)')
    return
  }

  try {
    console.log('🎾 대회 신청 제출:', {
      tournamentId: selectedTournament.value.id,
      tournamentTitle: selectedTournament.value.title,
      formData: formData.value
    })
    
    const success = await tournamentStore.registerForTournament(selectedTournament.value.id, formData.value)
    
    if (success) {
      alert('✅ 대회 신청이 완료되었습니다!')
      showForm.value = false
      selectedTournament.value = null
    } else {
      alert('❌ 대회 신청에 실패했습니다. 다시 시도해주세요.')
    }
  } catch (error) {
    console.error('❌ 신청 중 오류:', error)
    alert(`❌ 대회 신청 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`)
  }
}

const editTournament = (tournament) => {
  // Placeholder for edit functionality
  const newTitle = prompt('대회명을 수정하시겠습니까?', tournament.title)
  if (newTitle) {
    tournament.title = newTitle
    // In a real app, we'd call a store action to update
  }
}

const deleteTournament = (id) => {
  if (confirm('정말로 이 대회를 삭제하시겠습니까?')) {
    tournamentStore.deleteTournament(id)
  }
}

const getStatusClass = (status) => {
  switch (status.toLowerCase()) {
    case 'open': return 'status-open'
    case 'upcoming': return 'status-upcoming'
    case 'closed': return 'status-closed'
    default: return ''
  }
}
</script>

<template>
  <div class="tournament-container">
    <div v-if="!showForm" class="tournament-list-view">
      <div class="view-header">
        <h1>대회 신청</h1>
        <button @click="router.push('/tournaments/create')" class="btn-create">
          + 새 대회 만들기
        </button>
      </div>
      <div class="tournament-grid">
        <div v-for="tournament in tournamentStore.tournaments" :key="tournament.id" class="tournament-card">
          <div class="card-header">
            <span :class="['status-badge', getStatusClass(tournament.status)]">
              {{ tournament.status }}
            </span>
            <span class="tournament-date">{{ tournament.date }}</span>
          </div>
          
          <h3>{{ tournament.title }}</h3>
          
          <div class="tournament-details">
            <p><strong>유형:</strong> {{ tournament.type }}</p>
            <p><strong>장소:</strong> {{ tournament.location }}</p>
            <p><strong>참가비:</strong> ₩{{ tournament.fee.toLocaleString() }}</p>
            <p><strong>참가 인원:</strong> {{ tournament.participants }} / {{ tournament.maxParticipants }}</p>
            <p v-if="tournament.fileName" class="attachment-info">
              <strong>첨부파일:</strong> <span class="file-link">📎 {{ tournament.fileName }}</span>
            </p>
          </div>

          <div class="card-actions">
            <button 
              @click="openRegistration(tournament)" 
              class="btn-register"
              :disabled="tournament.status !== 'Open'"
            >
              {{ tournament.status === 'Open' ? '지금 신청하기' : '신청 불가' }}
            </button>
            <button 
              @click="viewParticipants(tournament)" 
              class="btn-participants"
            >
              신청내역
            </button>
          </div>
          <div class="admin-actions">
             <button @click="editTournament(tournament)" class="btn-edit">수정</button>
             <button @click="deleteTournament(tournament.id)" class="btn-delete">삭제</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="registration-form-view">
      <button @click="showForm = false" class="btn-back">&larr; 목록으로 돌아가기</button>
      
      <div class="form-card">
        <h2>{{ selectedTournament.title }} 신청</h2>
        <p class="form-subtitle">아래 정보를 입력해주세요.</p>
        
        <div class="form-group">
          <label>선수 성명 *</label>
          <input v-model="formData.playerName" type="text" required />
        </div>
        <div class="form-group">
          <label>선수 클럽명</label>
          <input v-model="formData.playerClub" type="text" required />
        </div>
        <div class="form-group">
          <label>선수 입상여부</label>
          <select v-model="formData.playerRank" class="form-select">
            <option value="비입상">비입상</option>
            <option value="입상">입상</option>
            <option value="준우승">준우승</option>
            <option value="우승">우승</option>
          </select>
        </div>
        <div class="form-group">
          <label>선수 점수</label>
          <input v-model="formData.playerPoint" type="text" required />
        </div>
        <div class="form-group">
          <label>파트너 성명 *</label>
          <input v-model="formData.partnerName" type="text" required />
        </div>
        <div class="form-group">
          <label>파트너 클럽명</label>
          <input v-model="formData.partnerClub" type="text" required />
        </div>
        <div class="form-group">
          <label>파트너 입상여부</label>
          <select v-model="formData.partnerRank" class="form-select">
            <option value="비입상">비입상</option>
            <option value="입상">입상</option>
            <option value="준우승">준우승</option>
            <option value="우승">우승</option>
          </select>
        </div>
        <div class="form-group">
          <label>파트너 점수</label>
          <input v-model="formData.partnerPoint" type="text" required />
        </div>
        <div class="form-group">
          <label>입금자 전화번호 *</label>
          <input v-model="formData.phone" type="tel" required />
        </div>

        <div class="payment-info">
          <h4>입금 정보</h4>
          <p>은행: 농협은행 123-456-7890 <br>입금주: 양주시테니스협회</br></p>
          <p>금액: ₩{{ selectedTournament.fee.toLocaleString() }}</p>
        </div>

        <button @click="submitRegistration" class="btn-submit">신청하기</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tournament-container {
  padding: 1rem;
}

.tournament-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.view-header h1 {
  margin: 0;
}

.btn-create {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 1rem;
}

.btn-create:hover {
  background: #219150;
}

.tournament-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  border-top: 4px solid #2c3e50;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
  text-transform: uppercase;
}

.status-open { background: #e1f7e7; color: #27ae60; }
.status-upcoming { background: #fff3cd; color: #f39c12; }
.status-closed { background: #f2f2f2; color: #7f8c8d; }

.tournament-date {
  color: #666;
  font-size: 0.9rem;
}

.tournament-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.tournament-details p {
  margin: 0.5rem 0;
  color: #555;
}

.file-link {
  color: #3498db;
  cursor: pointer;
  text-decoration: underline;
}

.card-actions {
  margin-top: auto;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.admin-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-register {
  flex: 2;
  padding: 0.8rem;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-register:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-register:not(:disabled):hover {
  background: #34495e;
}

.btn-participants {
  flex: 1;
  padding: 0.8rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-participants:hover {
  background: #2980b9;
}

.btn-edit {
  flex: 1;
  padding: 0.5rem;
  background: #f39c12;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}

.btn-edit:hover {
  background: #d35400;
}

.btn-delete {
  flex: 1;
  padding: 0.5rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}

.btn-delete:hover {
  background: #c0392b;
}

/* Form Styles */
.registration-form-view {
  max-width: 600px;
  margin: 0 auto;
}

.btn-back {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.form-card {
  display: block;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.form-subtitle {
  color: #666;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
  padding-right: 2rem
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input,
.form-select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.payment-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.payment-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.payment-info p {
  margin: 0.2rem 0;
  color: #666;
}

.btn-submit {
  width: 100%;
  padding: 1rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
}

.btn-submit:hover {
  background: #219150;
}
</style>
