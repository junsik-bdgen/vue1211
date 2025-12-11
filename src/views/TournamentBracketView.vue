<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTournamentStore } from '../stores/tournaments'
import { utils, writeFile } from 'xlsx'

const tournamentStore = useTournamentStore()
const selectedTournamentId = ref(null)
const matches = ref([])

// Get tournaments for selection
const tournaments = computed(() => tournamentStore.tournaments)

// Get selected tournament details
const selectedTournament = computed(() => {
  return tournamentStore.tournaments.find(t => t.id === selectedTournamentId.value)
})

// Generate Match List with Court Assignments
const generateMatchList = () => {
  if (!selectedTournament.value || !selectedTournament.value.players) {
    matches.value = []
    return
  }

  const players = selectedTournament.value.players
  const matchList = []
  
  // Simple pairing logic (1 vs 2, 3 vs 4, etc.) - matching TournamentOpsView logic
  // In a real app, this would come from a persistent match store
  for (let i = 0; i < players.length; i += 2) {
    if (i + 1 < players.length) {
      const team1 = players[i]
      const team2 = players[i + 1]
      
      matchList.push({
        round: '32강', // Defaulting to first round for now
        court: `Court ${Math.floor(i/2) + 1}`, // Mock Court Assignment
        team1: team1,
        team2: team2
      })
    }
  }
  
  matches.value = matchList
}

const handleTournamentChange = () => {
  generateMatchList()
}

const exportToExcel = () => {
  if (matches.value.length === 0) return

  const headers = ['라운드', '코트', '팀 1 (선수/클럽)', '팀 2 (선수/클럽)']
  const data = matches.value.map(m => ({
    '라운드': m.round,
    '코트': m.court,
    '팀 1 (선수/클럽)': `${m.team1.playerName} (${m.team1.playerClub}) / ${m.team1.partnerName} (${m.team1.partnerClub})`,
    '팀 2 (선수/클럽)': `${m.team2.playerName} (${m.team2.playerClub}) / ${m.team2.partnerName} (${m.team2.partnerClub})`
  }))

  const ws = utils.json_to_sheet(data, { header: headers })
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, "CourtAssignments")
  
  const fileName = `${selectedTournament.value.title}_court_assignments.xlsx`
  writeFile(wb, fileName)
}

onMounted(async () => {
  if (tournamentStore.tournaments.length === 0) {
    await tournamentStore.fetchTournaments()
  }

  if (tournaments.value.length > 0) {
    selectedTournamentId.value = tournaments.value[0].id
    generateMatchList()
  }
})
</script>

<template>
  <div class="bracket-view-container">
    <div class="header-section">
      <h1>대진표 및 코트 배정 현황</h1>
      <p class="subtitle">각 코트별 배정된 대진을 확인하고 엑셀로 다운로드할 수 있습니다.</p>
    </div>

    <div class="controls">
      <div class="control-group">
        <label>대회 선택:</label>
        <select v-model="selectedTournamentId" @change="handleTournamentChange">
          <option v-for="t in tournaments" :key="t.id" :value="t.id">
            {{ t.title }}
          </option>
        </select>
      </div>
      
      <button @click="exportToExcel" class="btn-excel">
        엑셀 다운로드
      </button>
    </div>

    <div class="table-container">
      <table class="match-table">
        <thead>
          <tr>
            <th>라운드</th>
            <th>코트 배정</th>
            <th>팀 1</th>
            <th>VS</th>
            <th>팀 2</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="matches.length === 0">
            <td colspan="5" class="empty-message">등록된 대진이 없습니다.</td>
          </tr>
          <tr v-for="(match, index) in matches" :key="index">
            <td><span class="badge round">{{ match.round }}</span></td>
            <td><span class="badge court">{{ match.court }}</span></td>
            <td class="team-cell">
              <div class="player-info">
                <span class="name">{{ match.team1.playerName }}</span>
                <span class="club">{{ match.team1.playerClub }}</span>
              </div>
              <div class="player-info">
                <span class="name">{{ match.team1.partnerName }}</span>
                <span class="club">{{ match.team1.partnerClub }}</span>
              </div>
            </td>
            <td class="vs-cell">VS</td>
            <td class="team-cell">
              <div class="player-info">
                <span class="name">{{ match.team2.playerName }}</span>
                <span class="club">{{ match.team2.playerClub }}</span>
              </div>
              <div class="player-info">
                <span class="name">{{ match.team2.partnerName }}</span>
                <span class="club">{{ match.team2.partnerClub }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.bracket-view-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  color: #2c3e50;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 250px;
}

.btn-excel {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
}

.btn-excel:hover {
  background: #219150;
}

.table-container {
  overflow-x: auto;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border-radius: 8px;
}

.match-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.match-table th,
.match-table td {
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.match-table th {
  background: #2c3e50;
  color: white;
  font-weight: 600;
}

.match-table tr:hover {
  background: #f8f9fa;
}

.badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
}

.badge.round {
  background: #e8f6f3;
  color: #16a085;
}

.badge.court {
  background: #fef9e7;
  color: #f1c40f;
}

.team-cell {
  text-align: left;
}

.player-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.2rem;
}

.player-info .name {
  font-weight: bold;
  color: #2c3e50;
}

.player-info .club {
  font-size: 0.85rem;
  color: #7f8c8d;
  background: #f0f0f0;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.vs-cell {
  font-weight: 900;
  color: #bdc3c7;
  font-style: italic;
}

.empty-message {
  padding: 3rem;
  color: #95a5a6;
}
</style>
