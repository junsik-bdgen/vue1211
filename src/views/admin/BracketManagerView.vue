<script setup>
import { ref, computed, watch } from 'vue'
import { useTournamentStore } from '../../stores/tournaments'
import { useCourtStore } from '../../stores/courts'
import { utils, writeFile } from 'xlsx'

const tournamentStore = useTournamentStore()
const courtStore = useCourtStore()

const selectedTournamentId = ref(null)
const seededTeams = ref([])
const generatedMatches = ref([])
const notification = ref({ show: false, message: '', type: '' })

// Filter only open or upcoming tournaments
const availableTournaments = computed(() => {
  return tournamentStore.tournaments.filter(t => t.status !== 'Closed')
})

const selectedTournament = computed(() => {
  return tournamentStore.tournaments.find(t => t.id === selectedTournamentId.value)
})

const loadBracketData = () => {
  // LocalStorage usage removed as per request
  seededTeams.value = []
  generatedMatches.value = []
}

watch(selectedTournamentId, () => {
  loadBracketData()
})

watch(selectedTournamentId, () => {
  loadBracketData()
})

const exportResults = () => {
  if (seededTeams.value.length === 0) {
    showNotification('내보낼 데이터가 없습니다.', 'warning')
    return
  }

  const wb = utils.book_new()

  const seedData = seededTeams.value.map(t => ({
    '시드': t.seed,
    '팀명': `${t.playerName} / ${t.partnerName}`,
    '클럽': `${t.playerClub} / ${t.partnerClub}`,
    '총 포인트': t.totalPoints
  }))
  const wsSeeds = utils.json_to_sheet(seedData)
  utils.book_append_sheet(wb, wsSeeds, "시드 배정 결과")

  if (generatedMatches.value.length > 0) {
    const matchData = generatedMatches.value.map(m => ({
      'Match No': m.id,
      'Team 1': `${m.team1.playerName}/${m.team1.partnerName} (#${m.team1.seed})`,
      'Team 2': `${m.team2.playerName}/${m.team2.partnerName} (#${m.team2.seed})`,
      '배정 코트': m.court || '미배정'
    }))
    const wsMatches = utils.json_to_sheet(matchData)
    utils.book_append_sheet(wb, wsMatches, "대진 및 코트")
  }

  const fileName = selectedTournament.value 
    ? `${selectedTournament.value.title}_bracket_results.xlsx` 
    : 'bracket_results.xlsx'
    
  writeFile(wb, fileName)
  showNotification('엑셀 파일로 저장되었습니다.', 'success')
}

const showNotification = (message, type = 'success') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}
</script>

<template>
  <div class="seeding-container">
    <h1>대진표</h1>
    
    <div class="controls-card">
      <div class="control-group">
        <label>대회 선택</label>
        <select v-model="selectedTournamentId">
          <option v-for="t in availableTournaments" :key="t.id" :value="t.id">
            {{ t.title }}
          </option>
        </select>
      </div>
      
      <div class="actions">
        <button @click="exportResults" class="btn-export">결과 엑셀 저장</button>
      </div>
    </div>

    <div class="results-grid">
      <!-- Seed List -->
      <div v-if="seededTeams.length > 0" class="result-section">
        <h2>시드 배정 결과</h2>
        <div class="table-wrapper">
          <table class="seed-table">
            <thead>
              <tr>
                <th>시드</th>
                <th>팀명 (선수/파트너)</th>
                <th>클럽</th>
                <th>총 포인트</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="team in seededTeams" :key="team.id">
                <td class="seed-cell">#{{ team.seed }}</td>
                <td>{{ team.playerName }} / {{ team.partnerName }}</td>
                <td>{{ team.playerClub }} / {{ team.partnerClub }}</td>
                <td>{{ team.totalPoints }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Match List -->
      <div v-if="generatedMatches.length > 0" class="result-section">
        <h2>예선 대진 및 코트 배정</h2>
        <div class="table-wrapper">
          <table class="match-table">
            <thead>
              <tr>
                <th>조 별</th>
                <th>선수명 / 클럽 (Seed)</th>
                <th>선수명 / 클럽 (Seed)</th>
                <th>배정 코트</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="match in generatedMatches" :key="match.id">
                <td>{{ match.id }} 조</td>
                <td>
                  <div class="team-info">
                    <span class="team-name">{{ match.team1.playerName }}/{{ match.team1.partnerName }}</span>
                    <span class="team-club">{{ match.team1.playerClub }}/{{ match.team1.partnerClub }}</span>
                    <span class="seed-badge">#{{ match.team1.seed }}</span>
                  </div>
                </td>
                <td>
                  <div class="team-info">
                    <span class="team-name">{{ match.team2.playerName }}/{{ match.team2.partnerName }}</span>
                    <span class="team-club">{{ match.team2.playerClub }}/{{ match.team2.partnerClub }}</span>
                    <span class="seed-badge">#{{ match.team2.seed }}</span>
                  </div>
                </td>
                <td class="court-cell">{{ match.court || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Notification Toast -->
    <div v-if="notification.show" :class="['notification', notification.type]">
      {{ notification.message }}
    </div>
  </div>
</template>

<style scoped>
.seeding-container {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.controls-card {
  background: rgb(218, 226, 245);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 0.1rem;
  display: flex;
  gap: 2rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

.control-group label {
  font-weight: bold;
  color: #2c3e50;
}

.control-group select {
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1rem;
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn-primary, .btn-secondary, .btn-export {
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  white-space: nowrap;
}

.btn-primary { background: #2c3e50; }
.btn-secondary { background: #27ae60; }
.btn-export { background: #f39c12; }

.results-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 1024px) {
  .results-grid {
    grid-template-columns: 1fr;
  }
}

.result-section {
  background: rgb(255, 255, 255);
  padding: 0.1rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  background-image: url('@assets/images/tennisCourt.jpg');
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  padding: 0.8rem;
  text-align: center;
  border-bottom: 1px solid #eceaeae5;
}

h2 {
  color: #2c3e50;
  text-align: center;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.seed-cell {
  font-weight: bold;
  color: #2c3e50;
}

.seed-badge {
  background: #eee;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  text-align: center;
  margin-left: 0.5rem;
  color: #666;
}

.team-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.team-club {
  font-size: 1rem;
  color: #5139e8;
}
.team-name {
  font-size: 1rem;
  color: #030111;
}
.court-cell {
  font-weight: bold;
  color: #e67e22;
}

.notification {
  position: fixed;
  top: 80px;
  right: 20px;
  padding: 1rem 2rem;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  animation: slideIn 0.3s ease;
}

.notification.success { background: #27ae60; }
.notification.warning { background: #f39c12; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
