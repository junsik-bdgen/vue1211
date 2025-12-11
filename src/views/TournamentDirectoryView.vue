<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTournamentStore } from '../stores/tournaments'

const route = useRoute()
const router = useRouter()
const tournamentStore = useTournamentStore()

const tournament = ref(null)
const fileInput = ref(null)
const editingPlayer = ref(null)

// Pagination
const currentPage = ref(1)
const itemsPerPage = 10

onMounted(async () => {
  const id = parseInt(route.params.id)
  
  if (tournamentStore.tournaments.length === 0) {
    await tournamentStore.fetchTournaments()
  }
  
  tournament.value = tournamentStore.tournaments.find(t => t.id === id)
  
  if (!tournament.value) {
    alert('Tournament not found')
    router.push('/tournaments')
  }
})

const paginatedPlayers = computed(() => {
  if (!tournament.value || !tournament.value.players) return []
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return tournament.value.players.slice(start, end)
})

const totalPages = computed(() => {
  if (!tournament.value || !tournament.value.players) return 0
  return Math.ceil(tournament.value.players.length / itemsPerPage)
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const goBack = () => {
  router.push('/tournaments')
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  console.log('📄 엑셀 파일 업로드:', file.name)

  try {
    const count = await tournamentStore.importFromExcel(tournament.value.id, file)
    
    if (count > 0) {
      alert(`✅ ${count}개 팀이 정상적으로 등록되었습니다!\n\n브라우저 콘솔(F12)을 확인하여 상세 내역을 보세요.`)
    } else {
      alert('⚠️  등록된 팀이 없습니다.\n\n엑셀 파일의 데이터를 확인하거나 브라우저 콘솔(F12)을 확인하세요.')
    }
    
    event.target.value = ''
    
    // Refresh tournament data
    await tournamentStore.fetchTournaments()
    tournament.value = tournamentStore.tournaments.find(t => t.id === tournament.value.id)
  } catch (error) {
    console.error('❌ 엑셀 업로드 오류:', error)
    alert(`❌ 엑셀 파일 가져오기 실패:\n\n${error.message}\n\n브라우저 콘솔(F12)을 확인하여 상세 오류를 보세요.`)
  }
}

const downloadTemplate = () => {
  tournamentStore.downloadTemplate()
}

const exportData = () => {
  tournamentStore.exportToExcel(tournament.value.id)
}

const deletePlayer = (player) => {
  if (confirm('정말로 이 참가팀을 삭제하시겠습니까?')) {
    tournamentStore.removePlayer(tournament.value.id, player.id)
  }
}

const editPlayer = (player) => {
  editingPlayer.value = { ...player }
}

const savePlayer = () => {
  if (editingPlayer.value) {
    tournamentStore.updatePlayer(tournament.value.id, editingPlayer.value)
    editingPlayer.value = null
  }
}

const cancelEdit = () => {
  editingPlayer.value = null
}
</script>

<template>
  <div class="directory-container" v-if="tournament">
    <div class="header-actions">
      <button @click="goBack" class="btn-back">&larr; 대회 목록으로</button>
      <h1>{{ tournament.title }} 신청 내역</h1>
      
      <div class="excel-actions">
        <button @click="downloadTemplate" class="btn-secondary">양식 다운로드</button>
        <button @click="triggerFileInput" class="btn-primary">엑셀 일괄 등록</button>
        <button @click="exportData" class="btn-export">엑셀 내보내기</button>
        <input 
          type="file" 
          ref="fileInput" 
          @change="handleFileUpload" 
          accept=".xlsx, .xls" 
          style="display: none" 
        />
      </div>
    </div>

    <div class="summary-card">
      <div class="summary-item">
        <span class="label">총 신청 팀</span>
        <span class="value">{{ tournament.players ? tournament.players.length : 0 }} / {{ tournament.maxParticipants }}</span>
      </div>
      <div class="summary-item">
        <span class="label">대회 날짜</span>
        <span class="value">{{ tournament.date }}</span>
      </div>
      <div class="summary-item">
        <span class="label">장소</span>
        <span class="value">{{ tournament.location }}</span>
      </div>
    </div>

    <div class="table-container">
      <table class="participants-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>선수 성명</th>
            <th>선수 클럽</th>
            <th>선수 입상</th>
            <th>선수 점수</th>
            <th>파트너 성명</th>
            <th>파트너 클럽</th>
            <th>파트너 입상</th>
            <th>파트너 점수</th>
            <th>연락처</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(player, index) in paginatedPlayers" :key="player.id || index">
            <td>{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
            <td>{{ player.playerName }}</td>
            <td>{{ player.playerClub }}</td>
            <td>{{ player.playerRank || '-' }}</td>
            <td>{{ player.playerPoint }}</td>
            <td>{{ player.partnerName }}</td>
            <td>{{ player.partnerClub }}</td>
            <td>{{ player.partnerRank || '-' }}</td>
            <td>{{ player.partnerPoint }}</td>
            <td>{{ player.phone }}</td>
            <td class="actions-cell">
              <button @click="editPlayer(player)" class="btn-icon edit" title="수정">✏️</button>
              <button @click="deletePlayer(player)" class="btn-icon delete" title="삭제">🗑️</button>
            </td>
          </tr>
          <tr v-if="!tournament.players || tournament.players.length === 0">
            <td colspan="11" class="empty-message">신청 내역이 없습니다.</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          &lt;
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          &gt;
        </button>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingPlayer" class="modal-overlay">
      <div class="modal-content">
        <h3>참가자 정보 수정</h3>
        <div class="modal-grid">
          <div class="form-group">
            <label>선수 성명</label>
            <input v-model="editingPlayer.playerName" type="text" />
          </div>
          <div class="form-group">
            <label>선수 클럽</label>
            <input v-model="editingPlayer.playerClub" type="text" />
          </div>
          <div class="form-group">
            <label>선수 입상</label>
            <select v-model="editingPlayer.playerRank">
               <option value="비입상">비입상</option>
               <option value="입상">입상</option>
               <option value="준우승">준우승</option>
               <option value="우승">우승</option>
            </select>
          </div>
          <div class="form-group">
            <label>선수 점수</label>
            <input v-model="editingPlayer.playerPoint" type="text" />
          </div>
          
          <div class="form-group">
            <label>파트너 성명</label>
            <input v-model="editingPlayer.partnerName" type="text" />
          </div>
          <div class="form-group">
            <label>파트너 클럽</label>
            <input v-model="editingPlayer.partnerClub" type="text" />
          </div>
          <div class="form-group">
            <label>파트너 입상</label>
            <select v-model="editingPlayer.partnerRank">
               <option value="비입상">비입상</option>
               <option value="입상">입상</option>
               <option value="준우승">준우승</option>
               <option value="우승">우승</option>
            </select>
          </div>
          <div class="form-group">
            <label>파트너 점수</label>
            <input v-model="editingPlayer.partnerPoint" type="text" />
          </div>
          
          <div class="form-group full-width">
            <label>연락처</label>
            <input v-model="editingPlayer.phone" type="text" />
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="cancelEdit" class="btn-cancel">취소</button>
          <button @click="savePlayer" class="btn-save">저장</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.directory-container {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.excel-actions {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
}

.btn-primary {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.btn-export {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.btn-back {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.btn-back:hover {
  background: #f1f2f6;
  color: #2c3e50;
}

h1 {
  margin: 0;
  color: #2c3e50;
}

.summary-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin-bottom: 2rem;
  display: flex;
  gap: 3rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
}

.value {
  font-size: 1.2rem;
  color: #2c3e50;
  font-weight: bold;
}

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
  overflow-x: auto;
  display: flex;
  flex-direction: column;
}

.participants-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.participants-table th,
.participants-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.participants-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
}

.participants-table tr:hover {
  background: #f1f2f6;
}

.empty-message {
  text-align: center;
  color: #999;
  padding: 3rem;
  font-size: 1.1rem;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.2rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #f0f0f0;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  gap: 1rem;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.page-btn:disabled {
  background: #eee;
  color: #999;
  cursor: not-allowed;
}

.page-info {
  font-weight: bold;
  color: #2c3e50;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1.5rem 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-save {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
}
</style>
