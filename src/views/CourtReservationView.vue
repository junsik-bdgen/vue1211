<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCourtReservationStore } from '../stores/courtReservations'
import { useCourtStore } from '../stores/courts'

const router = useRouter()
const store = useCourtReservationStore()
const courtStore = useCourtStore()

onMounted(() => {
  store.fetchReservations()
})

const selectedDate = ref(new Date().toISOString().split('T')[0])
const showModal = ref(false)
const selectedSlot = ref(null) // { courtId, time }

const reservationForm = ref({
  userName: '',
  phone: '',
  fee: 20000, // Default fee per hour
  startTime: null,
  endTime: null
})

const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6) // 6 to 22

// Calculate total slots dynamically based on registered courts
const totalSlotsPerDay = computed(() => {
  return courtStore.courts.length * 17 // number of courts × 17 time slots
})

const currentReservations = computed(() => {
  return store.getReservationsByDate(selectedDate.value)
})

// Calendar state
const currentMonth = ref(new Date())
const showCalendar = ref(true)

// Korean National Holidays (2024-2025)
const koreanHolidays = {
  '2024-01-01': '신정',
  '2024-02-09': '설날',
  '2024-02-10': '설날',
  '2024-02-11': '설날',
  '2024-03-01': '삼일절',
  '2024-04-10': '국회의원선거',
  '2024-05-05': '어린이날',
  '2024-05-06': '어린이날 대체공휴일',
  '2024-05-15': '부처님오신날',
  '2024-06-06': '현충일',
  '2024-08-15': '광복절',
  '2024-09-16': '추석',
  '2024-09-17': '추석',
  '2024-09-18': '추석',
  '2024-10-03': '개천절',
  '2024-10-09': '한글날',
  '2024-12-25': '크리스마스',
  '2025-01-01': '신정',
  '2025-01-28': '설날',
  '2025-01-29': '설날',
  '2025-01-30': '설날',
  '2025-03-01': '삼일절',
  '2025-05-05': '어린이날',
  '2025-05-06': '부처님오신날',
  '2025-06-06': '현충일',
  '2025-08-15': '광복절',
  '2025-10-03': '개천절',
  '2025-10-05': '추석',
  '2025-10-06': '추석',
  '2025-10-07': '추석',
  '2025-10-09': '한글날',
  '2025-12-25': '크리스마스'
}

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()
  
  const days = []
  
  // Add empty slots for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const reservationsForDay = store.getReservationsByDate(dateStr)
    const isFull = reservationsForDay.length >= totalSlotsPerDay.value
    
    const date = new Date(year, month, day)
    const dayOfWeek = date.getDay()
    const isHoliday = koreanHolidays[dateStr]
    const isSunday = dayOfWeek === 0
    const isSaturday = dayOfWeek === 6
    
    days.push({
      day,
      dateStr,
      isFull,
      reservationCount: reservationsForDay.length,
      isHoliday,
      holidayName: koreanHolidays[dateStr],
      isSunday,
      isSaturday
    })
  }
  
  return days
})

const selectDate = (dateStr) => {
  selectedDate.value = dateStr
  showCalendar.value = false
}

const prevMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1)
}

const nextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1)
}

const monthYearDisplay = computed(() => {
  return `${currentMonth.value.getFullYear()}년 ${currentMonth.value.getMonth() + 1}월`
})

const getReservation = (courtId, time) => {
  return currentReservations.value.find(r => r.courtId === courtId && r.time === time)
}

const handleSlotClick = async (courtId, time) => {
  const existing = getReservation(courtId, time)
  if (existing) {
    if (confirm('예약을 취소하시겠습니까?')) {
      try {
        await store.cancelReservation(existing.id)
      } catch (e) {
        alert(e.message)
      }
    }
  } else {
    selectedSlot.value = { courtId, time }
    reservationForm.value = { 
      userName: '', 
      phone: '', 
      fee: 20000,
      startTime: time,
      endTime: time + 1
    }
    showModal.value = true
  }
}

const submitReservation = async () => {
  if (!reservationForm.value.userName || !reservationForm.value.phone) {
    alert('이름과 전화번호를 입력해주세요.')
    return
  }

  const startTime = reservationForm.value.startTime
  const endTime = reservationForm.value.endTime

  if (endTime <= startTime) {
    alert('종료 시간은 시작 시간보다 늦어야 합니다.')
    return
  }

  try {
    // Create reservation for each hour in the range
    const promises = []
    for (let hour = startTime; hour < endTime; hour++) {
      promises.push(store.addReservation({
        courtId: selectedSlot.value.courtId,
        date: selectedDate.value,
        time: hour,
        userName: reservationForm.value.userName,
        phone: reservationForm.value.phone,
        fee: reservationForm.value.fee
      }))
    }
    
    await Promise.all(promises)
    
    const hours = endTime - startTime
    alert(`${hours}시간 예약이 완료되었습니다.`)
    showModal.value = false
  } catch (e) {
    alert(e.message)
  }
}

const formatTime = (time) => {
  return `${String(time).padStart(2, '0')}:00`
}
</script>

<template>
  <div class="reservation-container">
    <div class="header">
      <h1>남방코트 예약 시스템</h1>
      <div class="actions">
        <button @click="router.push('/courts/stats')" class="btn-stats">통계 보기</button>
      </div>
    </div>

    <div class="controls">
      <div class="selected-date">
        선택된 날짜: {{ selectedDate }}
      </div>
    </div>

    <div class="main-layout">
      <!-- Calendar View -->
      <div class="calendar-container">
        <div class="calendar-header">
          <button @click="prevMonth" class="btn-nav">◀</button>
          <h2>{{ monthYearDisplay }}</h2>
          <button @click="nextMonth" class="btn-nav">▶</button>
        </div>
        
        <div class="calendar-grid">
          <div class="day-header">일</div>
          <div class="day-header">월</div>
          <div class="day-header">화</div>
          <div class="day-header">수</div>
          <div class="day-header">목</div>
          <div class="day-header">금</div>
          <div class="day-header">토</div>
          
          <div 
            v-for="(dayInfo, index) in calendarDays" 
            :key="index"
            class="calendar-day"
            :class="{
              'empty': !dayInfo,
              'full': dayInfo && dayInfo.isFull,
              'partial': dayInfo && dayInfo.reservationCount > 0 && !dayInfo.isFull,
              'selected': dayInfo && dayInfo.dateStr === selectedDate,
              'holiday': dayInfo && (dayInfo.isHoliday || dayInfo.isSunday),
              'saturday': dayInfo && dayInfo.isSaturday && !dayInfo.isHoliday
            }"
            @click="dayInfo && selectDate(dayInfo.dateStr)"
          >
            <span 
              v-if="dayInfo" 
              class="day-number"
              :class="{
                'red-day': dayInfo.isHoliday || dayInfo.isSunday,
                'blue-day': dayInfo.isSaturday && !dayInfo.isHoliday
              }"
            >
              {{ dayInfo.day }}
            </span>
            <span v-if="dayInfo && dayInfo.holidayName" class="holiday-name">{{ dayInfo.holidayName }}</span>
            <span v-if="dayInfo && dayInfo.isFull" class="status-badge">마감</span>
            <span v-if="dayInfo && dayInfo.reservationCount > 0 && !dayInfo.isFull" class="count-badge">
              {{ dayInfo.reservationCount }}
            </span>
          </div>
        </div>
        
        <div class="calendar-legend">
          <div class="legend-item"><span class="dot available"></span> 예약 가능</div>
          <div class="legend-item"><span class="dot partial"></span> 일부 예약</div>
          <div class="legend-item"><span class="dot full"></span> 예약 마감</div>
        </div>
      </div>

      <!-- Schedule Grid -->
      <div class="schedule-grid" :style="{ gridTemplateColumns: `80px repeat(${courtStore.courts.length}, 1fr)` }">
      <div class="time-column">
        <div class="header-cell">Time</div>
        <div v-for="time in timeSlots" :key="time" class="time-cell">
          {{ formatTime(time) }}
        </div>
      </div>

      <div v-for="court in courtStore.courts" :key="court.id" class="court-column">
        <div class="header-cell">{{ court.name }}</div>
        <div 
          v-for="time in timeSlots" 
          :key="time" 
          class="slot-cell"
          :class="{ 'reserved': getReservation(court.id, time) }"
          @click="handleSlotClick(court.id, time)"
        >
          <div v-if="getReservation(court.id, time)" class="reservation-info">
            <span class="user-name">{{ getReservation(court.id, time).userName }}</span>
          </div>
          <div v-else class="empty-slot">+</div>
        </div>
      </div>
    </div>
    </div>

    <!-- Reservation Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h2>예약 하기</h2>
        <p class="modal-info">{{ selectedDate }} - {{ courtStore.courts.find(c => c.id === selectedSlot.courtId).name }}</p>
        
        <div class="time-range-group">
          <div class="form-group">
            <label>시작 시간</label>
            <select v-model.number="reservationForm.startTime" class="time-select">
              <option v-for="time in timeSlots" :key="time" :value="time">
                {{ formatTime(time) }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>종료 시간</label>
            <select v-model.number="reservationForm.endTime" class="time-select">
              <option v-for="time in timeSlots.filter(t => t > reservationForm.startTime)" :key="time" :value="time">
                {{ formatTime(time) }}
              </option>
            </select>
          </div>
        </div>

        <div class="duration-info" v-if="reservationForm.endTime > reservationForm.startTime">
          <strong>예약 시간:</strong> {{ reservationForm.endTime - reservationForm.startTime }}시간
          <br>
          <strong>총 금액:</strong> {{ ((reservationForm.endTime - reservationForm.startTime) * reservationForm.fee).toLocaleString() }}원
        </div>
        
        <div class="form-group">
          <label>예약자 성명</label>
          <input v-model="reservationForm.userName" placeholder="이름" />
        </div>
        
        <div class="form-group">
          <label>전화번호</label>
          <input v-model="reservationForm.phone" placeholder="010-0000-0000" />
        </div>

        <div class="form-group">
          <label>시간당 사용료 (원)</label>
          <input v-model.number="reservationForm.fee" type="number" />
        </div>

        <div class="modal-actions">
          <button @click="showModal = false" class="btn-cancel">취소</button>
          <button @click="submitReservation" class="btn-confirm">예약 완료</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reservation-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.controls {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.btn-toggle-calendar {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  display: none; /* Hide toggle button since we're showing both */
}

.selected-date {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
}

/* Main content layout - side by side */
.main-layout {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 1.1rem;
  align-items: start;
}

@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
  
  .btn-toggle-calendar {
    display: block;
  }
}

/* Calendar Styles */
.calendar-container {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.calendar-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.btn-nav {
  background: #ecf0f1;
  border: none;
  padding: 0.7rem 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.3rem;
}

.btn-nav:hover {
  background: #bdc3c7;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}

.day-header {
  text-align: center;
  font-weight: bold;
  padding: 0.8rem;
  color: #7f8c8d;
  background: #ecf0f1;
  border-radius: 4px;
  font-size: 1rem;
}

.calendar-day {
  min-height: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 0.8rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  background: white;
}

.calendar-day.empty {
  cursor: default;
  background: #f8f9fa;
  border-color: transparent;
}

.calendar-day:not(.empty):hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.calendar-day.selected {
  border-color: #3498db;
  background: #ebf5fb;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.calendar-day.partial {
  background: #fff9e6;
  border-color: #f39c12;
}

.calendar-day.full {
  background: #ffe6e6;
  border-color: #e74c3c;
  cursor: not-allowed;
}

.day-number {
  font-size: 1.3rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.3rem;
}

.day-number.red-day {
  color: #e74c3c;
}

.day-number.blue-day {
  color: #3498db;
}

.holiday-name {
  font-size: 0.65rem;
  color: #e74c3c;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
  margin-top: 0.2rem;
  padding: 0 0.2rem;
}

.status-badge {
  position: absolute;
  bottom: 4px;
  background: #e74c3c;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
}

.count-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #f39c12;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 50%;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 2px solid;
}

.dot.available {
  background: white;
  border-color: #ecf0f1;
}

.dot.partial {
  background: #fff9e6;
  border-color: #f39c12;
}

.dot.full {
  background: #ffe6e6;
  border-color: #e74c3c;
}

.schedule-grid {
  display: grid;
  gap: 1px;
  background: #ddd;
  border: 1px solid #ddd;
  overflow-x: auto;
}

.time-column, .court-column {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.header-cell {
  background: #2c3e50;
  color: white;
  padding: 1rem;
  text-align: center;
  font-weight: bold;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-cell {
  background: white;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #666;
}

.slot-cell {
  background: white;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.slot-cell:hover {
  background: #f0f8ff;
}

.slot-cell.reserved {
  background: #e8f8f5;
  border-left: 4px solid #27ae60;
}

.reservation-info {
  text-align: center;
}

.user-name {
  font-weight: bold;
  color: #27ae60;
  display: block;
}

.empty-slot {
  color: #ddd;
  font-size: 1.5rem;
  opacity: 0;
}

.slot-cell:hover .empty-slot {
  opacity: 1;
}

.btn-stats {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
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

.modal-info {
  color: #7f8c8d;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.time-display {
  background: #f8f9fa;
  cursor: not-allowed;
  font-weight: bold;
  text-align: center;
  font-size: 1.1rem;
  color: #2c3e50;
}

.time-range-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.time-range-group .form-group {
  flex: 1;
  margin-bottom: 0;
}

.time-select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background: white;
}

.duration-info {
  background: #e8f8f5;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border-left: 4px solid #27ae60;
  color: #2c3e50;
}

.duration-info strong {
  color: #27ae60;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-confirm {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}
</style>
