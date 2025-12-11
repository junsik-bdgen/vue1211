<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTournamentStore } from '../../stores/tournaments'
import { useCourtStore } from '../../stores/courts'
import { utils, writeFile } from 'xlsx'

const tournamentStore = useTournamentStore()
const courtStore = useCourtStore()

const selectedTournamentId = ref(null)
const seedingMethod = ref('points')
const seededTeams = ref([])
const generatedMatches = ref([])
const notification = ref({ show: false, message: '', type: '' })

onMounted(async () => {
  await tournamentStore.fetchTournaments()
  await courtStore.fetchCourts()
})

// Filter only open or upcoming tournaments
const availableTournaments = computed(() => {
  return tournamentStore.tournaments.filter(t => t.status !== 'Closed')
})

const selectedTournament = computed(() => {
  return tournamentStore.tournaments.find(t => t.id === selectedTournamentId.value)
})

// Helper functions (Hoisted)
function showNotification(message, type = 'success') {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

function distributeByClub(group) {
  // 1. Group by Club
  const clubMap = {}
  group.forEach(p => {
    const club = p.playerClub || 'Unknown'
    if (!clubMap[club]) clubMap[club] = []
    clubMap[club].push(p)
  })
  
  // 2. Shuffle each club's players internally
  Object.keys(clubMap).forEach(club => {
    clubMap[club].sort(() => Math.random() - 0.5)
  })
  
  // 3. Interleave players from different clubs
  const result = []
  const clubs = Object.keys(clubMap)
  clubs.sort((a, b) => clubMap[b].length - clubMap[a].length)
  
  let hasMore = true
  while (hasMore) {
    hasMore = false
    for (const club of clubs) {
      if (clubMap[club].length > 0) {
        result.push(clubMap[club].shift())
        hasMore = true
      }
    }
  }
  return result
}

function hasClubConflict(t1, t2) {
  const t1Clubs = [t1.playerClub, t1.partnerClub]
  const t2Clubs = [t2.playerClub, t2.partnerClub]
  return t1Clubs.some(c => t2Clubs.includes(c))
}

// Main Functions
const generateSeeds = async () => {
  try {
    console.log('Starting generateSeeds...')
    
    if (!selectedTournament.value) {
      showNotification('대회를 선택해주세요.', 'warning')
      return
    }

    const players = [...(selectedTournament.value.players || [])]
    if (players.length === 0) {
      showNotification('참가 신청자가 없습니다.', 'warning')
      return
    }
    
    console.log(`Processing ${players.length} players`)

    // 1. Calculate Points
    players.forEach(p => {
      p.totalPoints = (parseInt(p.playerPoint) || 0) + (parseInt(p.partnerPoint) || 0)
    })

    // 2. Sort by Points (Descending)
    players.sort((a, b) => b.totalPoints - a.totalPoints)

    // 3. Handle Tie-breakers (Club Distribution)
    let sortedPlayers = []
    if (seedingMethod.value === 'points') {
      let i = 0
      while (i < players.length) {
        let j = i + 1
        while (j < players.length && players[j].totalPoints === players[i].totalPoints) {
          j++
        }
        
        const group = players.slice(i, j)
        if (group.length > 1) {
          const distributedGroup = distributeByClub(group)
          sortedPlayers.push(...distributedGroup)
        } else {
          sortedPlayers.push(group[0])
        }
        i = j
      }
    } else {
      sortedPlayers = distributeByClub(players)
    }
    
    // 4. Assign Seeds
    seededTeams.value = sortedPlayers.map((team, index) => ({
      ...team,
      seed: index + 1
    }))
    
    // 5. Generate Groups and Matches
    generateGroupsAndMatches(seededTeams.value)
    
    // 6. Auto-save to DB
    const result = await tournamentStore.saveSeeding(
      selectedTournamentId.value,
      seededTeams.value,
      generatedMatches.value,
      seedingMethod.value
    )
    
    if (result.success) {
      showNotification('시드가 생성되고 DB에 저장되었습니다.', 'success')
    } else {
      console.error('Save failed:', result.error)
      showNotification('시드는 생성되었으나 DB 저장에 실패했습니다: ' + result.error, 'warning')
    }
    
  } catch (error) {
    console.error('Error in generateSeeds:', error)
    showNotification('시드 생성 중 오류 발생: ' + error.message, 'error')
  }
}

const generateGroupsAndMatches = (teams) => {
  // 1. Calculate number of groups (Math.ceil to allow 2-team groups)
  let numGroups = Math.ceil(teams.length / 3)
  if (numGroups < 1) numGroups = 1
  
  const groups = Array.from({ length: numGroups }, () => [])
  
  // 2. Snake Seeding Distribution
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i]
    const round = Math.floor(i / numGroups)
    const position = i % numGroups
    
    let groupIndex
    if (round % 2 === 0) {
      groupIndex = position
    } else {
      groupIndex = numGroups - 1 - position
    }
    
    groups[groupIndex].push(team)
    team.groupNumber = groupIndex + 1
  }
  
  // 3. Generate Matches (Round Robin)
  let allMatches = []
  let matchIdCounter = 1
  
  groups.forEach((group, index) => {
    const groupNum = index + 1
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        allMatches.push({
          id: matchIdCounter++,
          groupNumber: groupNum,
          team1: group[i],
          team2: group[j],
          court: null
        })
      }
    }
  })
  
  generatedMatches.value = allMatches
}

const autoAssignCourts = () => {
  if (generatedMatches.value.length === 0) {
    showNotification('먼저 시드를 생성해주세요.', 'warning')
    return
  }

  const activeCourts = courtStore.courts.filter(c => c.status === 'Active')
  let courtList = []

  activeCourts.forEach(c => {
    const count = parseInt(c.surface.replace(/[^0-9]/g, '')) || 1
    for (let i = 1; i <= count; i++) {
      courtList.push(`${c.name} ${i}번 코트`)
    }
  })

  if (courtList.length === 0) {
    showNotification('사용 가능한 코트가 없습니다.', 'warning')
    return
  }

  const matchesByGroup = {}
  generatedMatches.value.forEach(m => {
    if (!matchesByGroup[m.groupNumber]) matchesByGroup[m.groupNumber] = []
    matchesByGroup[m.groupNumber].push(m)
  })
  
  const groupNumbers = Object.keys(matchesByGroup).sort((a, b) => parseInt(a) - parseInt(b))
  
  groupNumbers.forEach((gNum, index) => {
    const court = courtList[index % courtList.length]
    matchesByGroup[gNum].forEach(m => m.court = court)
  })

  showNotification(`총 ${groupNumbers.length}개 조에 코트가 배정되었습니다.`, 'success')
}

const saveBracketData = async () => {
  if (!selectedTournamentId.value) {
    showNotification('대회를 선택해주세요.', 'warning')
    return
  }

  if (seededTeams.value.length === 0) {
    showNotification('먼저 시드를 생성해주세요.', 'warning')
    return
  }

  if (generatedMatches.value.length === 0) {
    showNotification('먼저 코트를 할당해주세요.', 'warning')
    return
  }

  try {
    const result = await tournamentStore.saveSeeding(
      selectedTournamentId.value,
      seededTeams.value,
      generatedMatches.value,
      seedingMethod.value
    );

    if (result.success) {
      showNotification(
        `✅ ${result.message}\n시드: ${result.data.seededTeamsCount}팀, 대진: ${result.data.matchesCount}경기, 코트: ${result.data.courtsUsedCount}개`,
        'success'
      );
    } else {
      throw new Error(result.error || '저장 실패');
    }
  } catch (error) {
    console.error('❌ Save error:', error);
    showNotification(`저장 실패: ${error.message}`, 'warning');
  }
}

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

  if (groupedTeams.value.length > 0) {
    const matchData = groupedTeams.value.map(g => ({
      'Group': g.groupNumber,
      'Team 1': `${g.teams[0].playerName}/${g.teams[0].partnerName}`,
      'Team 2': `${g.teams[1].playerName}/${g.teams[1].partnerName}`,
      'Team 3': g.teams[2] ? `${g.teams[2].playerName}/${g.teams[2].partnerName}` : 'BYE',
      '배정 코트': g.court
    }))
    const wsMatches = utils.json_to_sheet(matchData)
    utils.book_append_sheet(wb, wsMatches, "대진 및 코트")
  }

  const fileName = selectedTournament.value 
    ? `${selectedTournament.value.title}_seeding_results.xlsx` 
    : 'seeding_results.xlsx'
    
  writeFile(wb, fileName)
  showNotification('엑셀 파일로 저장되었습니다.', 'success')
}

// Computed for Group Display (with BYE logic)
const groupedTeams = computed(() => {
  if (seededTeams.value.length === 0) return []
  
  const groups = {}
  seededTeams.value.forEach(team => {
    if (!team.groupNumber) return
    if (!groups[team.groupNumber]) groups[team.groupNumber] = []
    groups[team.groupNumber].push(team)
  })
  
  return Object.keys(groups)
    .sort((a, b) => Number(a) - Number(b))
    .map(gNum => {
      const teams = groups[gNum].sort((a, b) => a.seed - b.seed)
      
      // Find court from generatedMatches
      const match = generatedMatches.value.find(m => m.groupNumber == gNum)
      const court = match ? match.court : '-'

      const displayTeams = [...teams]
      while (displayTeams.length < 3) {
        displayTeams.push({
          id: `bye-${gNum}-${displayTeams.length}`,
          seed: '-',
          playerName: 'BYE',
          partnerName: '',
          playerClub: '-',
          partnerClub: '',
          isBye: true
        })
      }
      return {
        groupNumber: gNum,
        teams: displayTeams,
        court: court
      }
    })
})
</script>

<template>
  <div class="seeding-container">
    <h1>시드 배정 및 코트 할당</h1>
    
    <div class="controls-card">
      <!-- ... (controls remain same) ... -->
      <div class="control-group">
        <label>대회 선택</label>
        <select v-model="selectedTournamentId">
          <option :value="null">대회를 선택하세요</option>
          <option v-for="t in availableTournaments" :key="t.id" :value="t.id">
            {{ t.title }} ({{ t.participants }}/{{ t.maxParticipants }}팀)
          </option>
        </select>
      </div>

      <div class="control-group">
        <label>배정 방식</label>
        <select v-model="seedingMethod">
          <option value="points">랭킹 포인트순</option>
          <option value="random">무작위 추첨</option>
        </select>
      </div>
      
      <div class="actions">
        <button @click="generateSeeds" class="btn-primary">시드 생성</button>
        <button @click="autoAssignCourts" class="btn-secondary">코트 자동 할당</button>
        <button @click="saveBracketData" class="btn-save">💾 저장하기</button>
        <button @click="exportResults" class="btn-export">결과 엑셀 저장</button>
      </div>
    </div>

    <div class="results-grid">
      <!-- Group Composition List -->
      <div v-if="groupedTeams.length > 0" class="result-section full-width">
        <h2>조별 편성 현황</h2>
        <div class="groups-container">
          <div v-for="group in groupedTeams" :key="group.groupNumber" class="group-card">
            <h3>{{ group.groupNumber }} 조</h3>
            <div class="group-members">
              <div v-for="team in group.teams" :key="team.id" class="member-row">
                <span class="seed-badge">#{{ team.seed }}</span>
                <span class="member-name">{{ team.playerName }}/{{ team.partnerName }}</span>
                <span class="member-club">({{ team.playerClub }}/{{ team.partnerClub }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Seed List -->
      <div v-if="seededTeams.length > 0" class="result-section">
        <h2>시드 배정 결과</h2>
        <div class="table-wrapper">
          <table class="seed-table">
            <thead>
              <tr>
                <th><span style="color: #ffffff;">시드</span></th>
                <th><span style="color: #ffffff;">선수 / 파트너</span></th>
                <th><span style="color: #ffffff;">클럽</span></th>
                <th><span style="color: #ffffff;">포인트</span></th>
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

      <!-- Group Court Assignment List -->
      <div v-if="groupedTeams.length > 0" class="result-section">
        <h2>예선 대진 및 코트 배정</h2>
        <div class="table-wrapper">
          <table class="match-table">
            <thead>
              <tr>
                <th><span style="color: #ffffff;">조 별</span></th>
                <th><span style="color: #ffffff;">Team 1</span></th>
                <th><span style="color: #ffffff;">Team 2</span></th>
                <th><span style="color: #ffffff;">Team 3</span></th>
                <th><span style="color: #ffffff;">배정 코트</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in groupedTeams" :key="group.groupNumber">
                <td>{{ group.groupNumber }} 조</td>
                <td v-for="(team, idx) in group.teams.slice(0, 3)" :key="idx">
                  <div class="team-info">
                    <span class="team-name">{{ team.playerName }}/{{ team.partnerName }}</span>
                    <span class="seed-badge" v-if="!team.isBye">#{{ team.seed }}</span>
                  </div>
                </td>
                <td class="court-cell">{{ group.court }}</td>
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
  max-width: 1500px;
  margin: 0 auto;
}

.controls-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
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
  font-size: 1.3rem;
}

.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary, .btn-export, .btn-save {
  color: white;
  border: 2px solid #cfcece;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.btn-primary { 
  background: #2c3e50; 
}

.btn-primary:hover {
  background: #1a252f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(44, 62, 80, 0.3);
}

.btn-secondary { 
  background: #27ae60; 
}

.btn-secondary:hover {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(39, 174, 96, 0.3);
}

.btn-export { 
  background: #f39c12; 
}

.btn-export:hover {
  background: #e67e22;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(243, 156, 18, 0.3);
}

.btn-save { 
  background: #3498db;
  font-size: 1.1rem;
}

.btn-save:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

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
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
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
    border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  background-color: #0a4550;
}

h2 {
  font-weight: 600;
  color: #026702;
  text-align: center;
}

.seed-cell {
  font-weight: bold;
  color: #2c3e50;
  font-size: 1.1rem;
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
  font-size: 0.9rem;
  color: #5139e8;
}

.team-name {
  font-size: 1rem;
  color: #030111;
  font-weight: 500;
}

.court-cell {
  font-weight: bold;
  color: #e67e22;
  font-size: 1rem;
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
  white-space: pre-line;
  max-width: 400px;
}

.notification.success { background: #27ae60; }
.notification.warning { background: #f39c12; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.full-width {
  grid-column: 1 / -1;
}

.groups-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.group-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.group-card h3 {
  margin-top: 0;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5rem;
  margin-bottom: 0.8rem;
  text-align: center;
}

.group-members {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  padding: 0.3rem;
  background: white;
  border-radius: 4px;
}

.member-name {
  font-weight: bold;
  color: #2c3e50;
}

.member-club {
  color: #7f8c8d;
  font-size: 0.8rem;
}
</style>
