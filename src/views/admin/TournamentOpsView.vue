<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useTournamentStore } from '../../stores/tournaments'

const tournamentStore = useTournamentStore()
const bracketCanvas = ref(null)
const selectedTournamentId = ref(null)
const roundCount = ref(3) // Default 8 teams
const backgroundImage = ref(null)

// Get tournaments for selection
const tournaments = computed(() => tournamentStore.tournaments)

// Get teams from selected tournament
const teams = computed(() => {
  if (!selectedTournamentId.value) return []
  
  const tournament = tournamentStore.tournaments.find(t => t.id === selectedTournamentId.value)
  if (!tournament || !tournament.players) return []
  
  return tournament.players.map(p => `${p.playerName}/${p.partnerName}`)
})

const matches = ref([])
const notification = ref({ show: false, message: '', type: '' })

// Load background image from assets
const loadBackgroundImage = () => {
  const img = new Image()
  img.onload = () => {
    backgroundImage.value = img
    drawBracket()
  }
  img.onerror = () => {
    console.error('Failed to load background image')
    backgroundImage.value = null
  }
  // Import the image from assets
  img.src = new URL('@/assets/tennis_ball.jpg', import.meta.url).href
}

// Initialize Bracket Data Structure
const initBracket = () => {
  matches.value = []
  const rounds = roundCount.value
  let currentRoundMatches = Math.pow(2, rounds - 1)
  
  // Create structure
  for (let r = 0; r < rounds; r++) {
    const roundMatches = []
    for (let m = 0; m < currentRoundMatches; m++) {
      let team1 = null
      let team2 = null
      
      if (r === 0) {
        // Populate first round with real teams
        team1 = teams.value[m * 2] || 'BYE'
        team2 = teams.value[m * 2 + 1] || 'BYE'
      }

      roundMatches.push({
        id: `${r}-${m}`,
        r,
        m,
        team1,
        team2,
        score1: 0,
        score2: 0,
        winner: null,
        isSaved: true, // Track if current scores are saved
        x: 0,
        y: 0
      })
    }
    matches.value.push(roundMatches)
    currentRoundMatches /= 2
  }
  
  nextTick(drawBracket)
}

// Watch for tournament selection change to reset bracket
watch(selectedTournamentId, async () => {
  if (teams.value.length > 0) {
    // Auto-calculate appropriate round count based on team size
    const teamCount = teams.value.length
    if (teamCount > 16) roundCount.value = 5 // 32 teams
    else if (teamCount > 8) roundCount.value = 4 // 16 teams
    else if (teamCount > 4) roundCount.value = 3 // 8 teams
    else roundCount.value = 2 // 4 teams
  }
  
  const loaded = await loadBracketState()
  if (!loaded) {
    initBracket()
  }
})

// Mark match as changed when score is modified
const markMatchChanged = (match) => {
  match.isSaved = false
}

// Save individual match score and update bracket
const saveMatch = (r, m) => {
  const match = matches.value[r][m]
  updateMatchWinner(r, m)
  match.isSaved = true
  drawBracket()
  showNotification(`Match ${r + 1}-${m + 1} 스코어가 저장되었습니다.`, 'success')
}

// Save all matches at once
const saveAllMatches = () => {
  let savedCount = 0
  
  for (let r = 0; r < roundCount.value; r++) {
    matches.value[r].forEach((match, m) => {
      if (!match.isSaved) {
        updateMatchWinner(r, m)
        match.isSaved = true
        savedCount++
      }
    })
  }
  
  saveBracketState()
  drawBracket()
  showNotification('대회 결과가 성공적으로 등록되었습니다.', 'success')
}

// Save bracket state to database
const saveBracketState = async () => {
  if (!selectedTournamentId.value) return
  
  try {
    // Flatten matches array for API
    const flatMatches = []
    matches.value.forEach((round, roundIndex) => {
      round.forEach((match, matchIndex) => {
        flatMatches.push({
          roundIndex,
          matchIndex,
          team1Text: match.team1 || '',
          team2Text: match.team2 || '',
          score1: match.score1 || 0,
          score2: match.score2 || 0,
          winnerText: match.winner || '',
          isSaved: match.isSaved !== undefined ? match.isSaved : true
        })
      })
    })
    
    await tournamentStore.saveMatches(selectedTournamentId.value, flatMatches)
  } catch (error) {
    console.error('Failed to save bracket state:', error)
    showNotification('대진표 저장 실패', 'warning')
  }
}

const loadBracketState = async () => {
  if (!selectedTournamentId.value) return false
  
  try {
    const savedMatches = await tournamentStore.fetchMatches(selectedTournamentId.value)
    
    if (savedMatches && savedMatches.length > 0) {
      // Reconstruct matches array from flat data
      const maxRound = Math.max(...savedMatches.map(m => m.roundIndex))
      roundCount.value = maxRound + 1
      
      matches.value = []
      for (let r = 0; r <= maxRound; r++) {
        matches.value[r] = []
      }
      
      savedMatches.forEach(m => {
        matches.value[m.roundIndex][m.matchIndex] = {
          id: `${m.roundIndex}-${m.matchIndex}`,
          r: m.roundIndex,
          m: m.matchIndex,
          team1: m.team1Text,
          team2: m.team2Text,
          score1: m.score1,
          score2: m.score2,
          winner: m.winnerText,
          isSaved: m.isSaved,
          x: 0,
          y: 0
        }
      })
      
      nextTick(drawBracket)
      return true
    }
  } catch (error) {
    console.error('Failed to load bracket state:', error)
  }
  
  return false
}

// Update Match Winner and Propagate
const updateMatchWinner = (r, m) => {
  const match = matches.value[r][m]
  
  // Determine Winner
  if (match.score1 > match.score2) {
    match.winner = match.team1
  } else if (match.score2 > match.score1) {
    match.winner = match.team2
  } else {
    match.winner = null // Draw or incomplete
  }
  
  // Propagate to next round
  if (r < roundCount.value - 1) {
    const nextRound = matches.value[r + 1]
    const nextMatchIndex = Math.floor(m / 2)
    const nextMatch = nextRound[nextMatchIndex]
    
    if (m % 2 === 0) {
      nextMatch.team1 = match.winner
    } else {
      nextMatch.team2 = match.winner
    }
  }
}

// Export bracket to PDF
const exportToPDF = async () => {
  try {
    // Dynamic import for better bundle size
    const html2canvas = (await import('html2canvas')).default
    const jsPDF = (await import('jspdf')).jsPDF
    
    const canvas = bracketCanvas.value
    if (!canvas) {
      showNotification('대진표를 먼저 생성해주세요.', 'warning')
      return
    }
    
    showNotification('PDF 생성 중...', 'success')
    
    // Capture canvas as image
    const imgData = canvas.toDataURL('image/png')
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width + 40, canvas.height + 40]
    })
    
    pdf.addImage(imgData, 'PNG', 20, 20, canvas.width, canvas.height)
    
    const tournamentName = selectedTournamentId.value 
      ? tournaments.value.find(t => t.id === selectedTournamentId.value)?.title || 'tournament'
      : 'tournament'
    
    pdf.save(`${tournamentName}_bracket.pdf`)
    showNotification('PDF 다운로드가 완료되었습니다.', 'success')
  } catch (error) {
    console.error('PDF export error:', error)
    showNotification('PDF 생성 중 오류가 발생했습니다.', 'warning')
  }
}

const drawBracket = () => {
  const canvas = bracketCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  
  const rounds = roundCount.value
  const matchWidth = 140
  const matchHeight = 60
  const gapX = 60
  
  // Calculate total bracket width
  const totalBracketWidth = rounds * matchWidth + (rounds - 1) * gapX
  
  // Adjust canvas size based on round count
  const requiredWidth = totalBracketWidth + 100 // Add padding for margins
  const requiredHeight = Math.pow(2, rounds - 1) * 80 + 100
  
  canvas.width = Math.max(800, requiredWidth)
  canvas.height = Math.max(600, requiredHeight)
  
  const width = canvas.width
  const height = canvas.height
  
  // Calculate starting X to center the bracket
  const startX = (width - totalBracketWidth) / 2
  
  ctx.clearRect(0, 0, width, height)
  
  // Draw background image if available
  if (backgroundImage.value) {
    ctx.globalAlpha = 0.15 // Make background subtle
    ctx.drawImage(backgroundImage.value, 0, 0, width, height)
    ctx.globalAlpha = 1.0 // Reset alpha
  }
  
  ctx.font = '12px Inter'
  
  // Round labels mapping
  const roundLabels = {
    5: ['32강', '16강', '8강', '4강', '결승'],
    4: ['16강', '8강', '4강', '결승'],
    3: ['8강', '4강', '결승'],
    2: ['4강', '결승']
  }
  
  const labels = roundLabels[rounds] || []
  
  // 1. Calculate Coordinates
  // Round 0 (First Round)
  const round0Matches = matches.value[0]
  const totalHeight = height - 40
  const spacing = totalHeight / round0Matches.length
  
  round0Matches.forEach((match, i) => {
    match.x = startX
    match.y = 20 + i * spacing + spacing / 2 - matchHeight / 2
  })
  
  // Subsequent Rounds
  for (let r = 1; r < rounds; r++) {
    const roundMatches = matches.value[r]
    const prevRoundMatches = matches.value[r - 1]
    
    roundMatches.forEach((match, i) => {
      const child1 = prevRoundMatches[i * 2]
      const child2 = prevRoundMatches[i * 2 + 1]
      
      match.x = startX + r * (matchWidth + gapX)
      match.y = (child1.y + child2.y) / 2
    })
  }
  
  // 2. Draw Round Labels
  ctx.font = 'bold 16px Inter'
  ctx.fillStyle = '#2c3e50'
  ctx.textAlign = 'center'
  
  for (let r = 0; r < rounds; r++) {
    const x = startX + r * (matchWidth + gapX) + matchWidth / 2
    const y = 15
    
    if (labels[r]) {
      ctx.fillText(labels[r], x, y)
    }
  }
  
  // Reset font for match drawing
  ctx.font = '12px Inter'
  
  // 3. Draw Connections (Lines)
  const drawConnection = (match, nextMatch, isTeam1, isRedPass) => {
    const startX = match.x + matchWidth
    const endX = nextMatch.x
    const endY = nextMatch.y + matchHeight / 2
    
    const startY = isTeam1 ? match.y + matchHeight / 4 : match.y + (matchHeight * 3 / 4)
    
    const winner = isTeam1 ? match.team1 : match.team2
    const isWinner = match.winner === winner && winner !== 'BYE' && (match.score1 > 0 || match.score2 > 0)
    
    // If we are drawing red pass, we only draw if it IS a winner (red line)
    // If we are drawing gray pass, we only draw if it is NOT a winner (gray line)
    if (isRedPass !== isWinner) return
    
    ctx.beginPath()
    if (isWinner) {
      ctx.strokeStyle = '#e74c3c'
      ctx.lineWidth = 3
    } else {
      ctx.strokeStyle = '#95a5a6'
      ctx.lineWidth = 2
    }
    
    ctx.moveTo(startX, startY)
    ctx.lineTo((startX + endX) / 2, startY)
    ctx.lineTo((startX + endX) / 2, endY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  }

  // Pass 1: Draw Gray Lines
  for (let r = 0; r < rounds - 1; r++) {
    matches.value[r].forEach(match => {
      const nextMatch = matches.value[r + 1][Math.floor(match.m / 2)]
      drawConnection(match, nextMatch, true, false)
      drawConnection(match, nextMatch, false, false)
    })
  }

  // Pass 2: Draw Red Lines (on top)
  for (let r = 0; r < rounds - 1; r++) {
    matches.value[r].forEach(match => {
      const nextMatch = matches.value[r + 1][Math.floor(match.m / 2)]
      drawConnection(match, nextMatch, true, true)
      drawConnection(match, nextMatch, false, true)
    })
  }
  
  // 4. Draw Match Boxes
  matches.value.flat().forEach(match => {
    // Box
    ctx.fillStyle = 'white'
    ctx.shadowColor = 'rgba(0,0,0,0.1)'
    ctx.shadowBlur = 0
    ctx.fillRect(match.x, match.y, matchWidth, matchHeight)
    ctx.shadowBlur = 0
    
    ctx.strokeStyle = '#95a5a6'
    ctx.lineWidth = 1
    ctx.strokeRect(match.x, match.y, matchWidth, matchHeight)
    
    // Text
    ctx.fillStyle = '#2c3e50'
    ctx.textAlign = 'left'
    
    // Team 1
    ctx.font = match.winner === match.team1 && match.team1 !== 'BYE' && (match.score1 > 0 || match.score2 > 0) ? 'bold 12px Inter' : '12px Inter'
    ctx.fillStyle = match.winner === match.team1 && match.team1 !== 'BYE' && (match.score1 > 0 || match.score2 > 0) ? '#e74c3c' : '#2c3e50'
    ctx.fillText(match.team1 || '-', match.x + 10, match.y + 20)
    ctx.fillText(match.score1, match.x + 110, match.y + 20)
    
    // Divider
    ctx.beginPath()
    ctx.strokeStyle = '#f0f0f0'
    ctx.moveTo(match.x, match.y + 30)
    ctx.lineTo(match.x + matchWidth, match.y + 30)
    ctx.stroke()
    
    // Team 2
    ctx.font = match.winner === match.team2 && match.team2 !== 'BYE' && (match.score1 > 0 || match.score2 > 0) ? 'bold 12px Inter' : '12px Inter'
    ctx.fillStyle = match.winner === match.team2 && match.team2 !== 'BYE' && (match.score1 > 0 || match.score2 > 0) ? '#e74c3c' : '#2c3e50'
    ctx.fillText(match.team2 || '-', match.x + 10, match.y + 50)
    ctx.fillText(match.score2, match.x + 110, match.y + 50)
  })
}

const handleRefresh = () => {
  initBracket()
  showNotification('대진표가 새로고침 되었습니다.', 'success')
}

const showNotification = (message, type = 'success') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// Get round label in Korean
const getRoundLabel = (rIndex) => {
  const roundLabels = {
    5: ['32강', '16강', '8강', '4강', '결승'],
    4: ['16강', '8강', '4강', '결승'],
    3: ['8강', '4강', '결승'],
    2: ['4강', '결승']
  }
  
  const labels = roundLabels[roundCount.value] || []
  return labels[rIndex] || `Round ${rIndex + 1}`
}

onMounted(async () => {
  if (tournamentStore.tournaments.length === 0) {
    await tournamentStore.fetchTournaments()
  }

  // Select first tournament by default if available
  if (tournamentStore.tournaments.length > 0) {
    selectedTournamentId.value = tournamentStore.tournaments[0].id
  }
  loadBackgroundImage()
  initBracket()
})

watch(roundCount, initBracket)
</script>

<template>
  <div class="ops-container">
    <h1>대회 운영 및 스코어 관리</h1>
    
    <div class="controls">
      <div class="control-group">
        <label>대회 선택:</label>
        <select v-model="selectedTournamentId">
          <option v-for="t in tournaments" :key="t.id" :value="t.id">
            {{ t.title }}
          </option>
        </select>
      </div>

      <div class="control-group">
        <label>라운드 수:</label>
        <select v-model="roundCount">
          <option :value="2">2 라운드 (4강)</option>
          <option :value="3">3 라운드 (8강)</option>
          <option :value="4">4 라운드 (16강)</option>
          <option :value="5">5 라운드 (32강)</option>
        </select>
      </div>
      
      <button @click="handleRefresh" class="btn-refresh">대진표 초기화</button>
      <button @click="exportToPDF" class="btn-export-pdf">대진표 PDF 다운로드</button>
    </div>

    <div class="main-content">
      <div class="canvas-container">
        <canvas ref="bracketCanvas" width="800" height="600"></canvas>
      </div>
      
      <div class="score-panel">
        <h2>스코어 입력</h2>
        <div class="rounds-container">
          <div v-for="(round, rIndex) in matches" :key="rIndex" class="round-column">
            <h3>{{ getRoundLabel(rIndex) }}</h3>
            <div v-for="match in round" :key="match.id" class="match-card">
              <div class="match-header">Match {{ match.r + 1 }}-{{ match.m + 1 }}</div>
              <div class="team-input">
                <span :class="{ winner: match.winner === match.team1 }">{{ match.team1 || 'TBD' }}</span>
                <input type="number" v-model.number="match.score1" @input="markMatchChanged(match)" min="0">
              </div>
              <div class="team-input">
                <span :class="{ winner: match.winner === match.team2 }">{{ match.team2 || 'TBD' }}</span>
                <input type="number" v-model.number="match.score2" @input="markMatchChanged(match)" min="0">
              </div>
              <button 
                @click="saveMatch(match.r, match.m)" 
                class="btn-match-save"
                :class="{ 'saved': match.isSaved }"
              >
                {{ match.isSaved ? '저장됨' : '저장' }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="bulk-save-section">
          <button @click="saveAllMatches" class="btn-bulk-save">
            대회 결과 등록
          </button>
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

h2 {
  color: white;
  text-align: center;
  background: #2c3e50;
  padding: 20px;
}

.ops-container {
  padding: 1rem;
}

.controls {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.control-group label {
  white-space: nowrap;
}

.bg-url-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
  font-size: 0.9rem;
}

.btn-load-bg {
  background: #9b59b6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  white-space: nowrap;
}

.btn-load-bg:hover {
  background: #8e44ad;
}

.main-content {
  display: flex;
  gap: 2rem;
  flex-direction: column;
}

.canvas-container {
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: auto;
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

canvas {
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-refresh {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-export-pdf {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-export-pdf:hover {
  background: #c0392b;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.score-panel {
  background: rgba(255, 255, 255, 0.85);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  /* background-image: url("@/assets/tennis_tournament.png.jpg"); */
}

.rounds-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.round-column {
  min-width: 200px;
  background: rgba(248, 249, 250, 0.7);
  padding: 1rem;
  border-radius: 8px;
  backdrop-filter: blur(5px);
}

.round-column h3 {
  margin-top: 0;
  text-align: center;
  color: #7f8c8d;
  font-size: 1rem;
}

.match-card {
  background: white;
  padding: 0.8rem;
  margin-bottom: 0.8rem;
  border-radius: 6px;
  border: 1px solid #eee;
}

.match-header {
  font-size: 0.8rem;
  color: #95a5a6;
  margin-bottom: 0.5rem;
}

.team-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
  gap: 0.5rem;
}

.team-input span {
  font-size: 0.85rem;
  flex: 1;
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
  word-break: break-word;
  line-height: 1.3;
}

.team-input span.winner {
  color: #e74c3c;
  font-weight: bold;
}

.team-input input {
  width: 50px;
  padding: 0.2rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

.btn-match-save {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-match-save:hover {
  background: #229954;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn-match-save:active {
  transform: translateY(0);
}

.btn-match-save.saved {
  background: #3498db;
}

.btn-match-save.saved:hover {
  background: #2980b9;
}

.bulk-save-section {
  display: flex;
  justify-content: center;
  padding-top: 1.5rem;
  margin-top: 1rem;
  border-top: 2px solid #ecf0f1;
}

.btn-bulk-save {
  background: #3498db;
  color: white;
  border: none;
  padding: 1rem 3rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-bulk-save:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.btn-bulk-save:active {
  transform: translateY(0);
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

.notification.success {
  background: #27ae60;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
