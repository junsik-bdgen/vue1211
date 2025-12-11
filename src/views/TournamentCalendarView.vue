<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNoticeStore } from '../stores/notices'
import { getHoliday } from '../utils/holidays'

const router = useRouter()
const noticeStore = useNoticeStore()
const currentDate = ref(new Date())

const currentMonthName = computed(() => {
  return currentDate.value.toLocaleString('ko-KR', { month: 'long', year: 'numeric' })
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const days = []
  
  // Padding for days before first day of month
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ date: null })
  }
  
  // Days of the month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const dateObj = new Date(year, month, i)
    const dayOfWeek = dateObj.getDay() // 0 = Sun, 6 = Sat
    const holidayName = getHoliday(year, month, i)
    
    days.push({
      date: i,
      fullDate: dateStr,
      dayOfWeek,
      isHoliday: !!holidayName,
      holidayName,
      events: noticeStore.eventsByDate[dateStr] || []
    })
  }
  
  return days
})

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const getEventTypeClass = (type) => {
  switch (type) {
    case 'competition': return 'event-competition'
    case 'event': return 'event-general'
    default: return 'event-notice'
  }
}

const getTypeLabel = (type) => {
  switch (type) {
    case 'competition': return '대회'
    case 'event': return '행사'
    default: return '공지'
  }
}

// Filter only competition and event types for calendar
const tournamentEvents = computed(() => {
  return noticeStore.notices.filter(notice => 
    notice.type === 'competition' || notice.type === 'event'
  )
})
</script>

<template>
  <div class="tournament-calendar-container">
    <div class="calendar-header-section">
      <h1>대회 일정</h1>
      <button @click="router.push('/notices/create')" class="btn-create">
        일정 추가
      </button>
    </div>

    <div class="layout-grid">
      <!-- Calendar Section -->
      <div class="calendar-section">
        <div class="calendar-header">
          <button @click="prevMonth" class="btn-nav">◀</button>
          <h2>{{ currentMonthName }}</h2>
          <button @click="nextMonth" class="btn-nav">▶</button>
        </div>
        
        <div class="calendar-grid">
          <div class="weekday sunday">일</div>
          <div class="weekday">월</div>
          <div class="weekday">화</div>
          <div class="weekday">수</div>
          <div class="weekday">목</div>
          <div class="weekday">금</div>
          <div class="weekday saturday">토</div>
          
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index" 
            class="calendar-day"
            :class="{ 
              'empty': !day.date,
              'is-sunday': day.dayOfWeek === 0 || day.isHoliday,
              'is-saturday': day.dayOfWeek === 6 && !day.isHoliday
            }"
          >
            <div v-if="day.date" class="day-header">
              <span class="day-number">{{ day.date }}</span>
              <span v-if="day.holidayName" class="holiday-name">{{ day.holidayName }}</span>
            </div>
            <div v-if="day.events && day.events.length > 0" class="day-events">
              <div 
                v-for="event in day.events" 
                :key="event.id" 
                class="mini-event"
                :class="getEventTypeClass(event.type)"
                :title="event.title"
                @click="router.push(`/notices/${event.id}`)"
              >
                {{ event.title }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Event List Section -->
      <div class="event-list-section">
        <h2>예정된 일정</h2>
        <div class="event-list">
          <div 
            v-for="event in tournamentEvents" 
            :key="event.id" 
            class="event-item"
            @click="router.push(`/notices/${event.id}`)"
          >
            <div class="event-date">{{ event.date }}</div>
            <div class="event-content">
              <h3>{{ event.title }}</h3>
              <span :class="['tag', getEventTypeClass(event.type)]">
                {{ getTypeLabel(event.type) }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="tournamentEvents.length === 0" class="no-events">
          예정된 일정이 없습니다.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tournament-calendar-container {
  padding: 2rem;
}

.calendar-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 3px solid #2c3e50;
}

.calendar-header-section h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2rem;
}

.btn-create {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-create:hover {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(39, 174, 96, 0.3);
}

.layout-grid {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
}

/* Calendar Styles */
.calendar-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.calendar-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.btn-nav {
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.btn-nav:hover {
  background: #f8f9fa;
  border-color: #2c3e50;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}

.weekday {
  text-align: center;
  font-weight: bold;
  color: #666;
  padding: 0.5rem;
  font-size: 0.9rem;
}

.weekday.sunday { color: #e74c3c; }
.weekday.saturday { color: #3498db; }

.calendar-day {
  min-height: 100px;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 0.3rem;
  position: relative;
  background: white;
  transition: all 0.2s;
}

.calendar-day:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.calendar-day.empty {
  background: #f9f9f9;
  border: none;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 0.3rem;
}

.day-number {
  font-size: 0.9rem;
  font-weight: bold;
  color: #2c3e50;
}

.is-sunday .day-number,
.is-sunday .holiday-name {
  color: #e74c3c;
}

.is-saturday .day-number {
  color: #3498db;
}

.holiday-name {
  font-size: 0.65rem;
  color: #e74c3c;
  text-align: right;
  width: 100%;
  margin-top: 2px;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mini-event {
  font-size: 0.75rem;
  padding: 3px 5px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  line-height: 1.3;
  transition: all 0.2s;
}

.mini-event:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Event Type Colors */
.event-competition { 
  background-color: #e74c3c; 
  color: white; 
}

.event-general { 
  background-color: #27ae60; 
  color: white; 
}

.event-notice { 
  background-color: #3498db; 
  color: white; 
}

/* Event List Styles */
.event-list-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  max-height: 800px;
  overflow-y: auto;
}

.event-list-section h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.3rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #eee;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #2c3e50;
  cursor: pointer;
  transition: all 0.3s;
}

.event-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.event-date {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.event-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #2c3e50;
}

.tag {
  font-size: 0.75rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-weight: bold;
}

.tag.event-competition { 
  background-color: rgba(231, 76, 60, 0.1); 
  color: #e74c3c; 
}

.tag.event-general { 
  background-color: rgba(39, 174, 96, 0.1); 
  color: #27ae60; 
}

.tag.event-notice { 
  background-color: rgba(52, 152, 219, 0.1); 
  color: #3498db; 
}

.no-events {
  padding: 2rem;
  text-align: center;
  color: #999;
}
</style>
