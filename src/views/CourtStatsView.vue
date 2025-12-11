<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCourtReservationStore } from '../stores/courtReservations'
import { useCourtStore } from '../stores/courts'

const router = useRouter()
const store = useCourtReservationStore()
const courtStore = useCourtStore()

const today = new Date().toISOString().split('T')[0]
const startDate = ref(today)
const endDate = ref(today)
const stats = ref([])

const loadStats = async () => {
  try {
    stats.value = await store.getRevenueStats(startDate.value, endDate.value)
  } catch (e) {
    console.error('Failed to load stats:', e)
  }
}

onMounted(async () => {
  await store.fetchReservations() // Load all reservations for detail list
  await loadStats()
})

watch([startDate, endDate], () => {
  loadStats()
})

const detailedReservations = computed(() => {
  return store.reservations.filter(r => 
    r.date >= startDate.value && r.date <= endDate.value
  ).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    if (a.courtId !== b.courtId) return a.courtId - b.courtId
    return a.time - b.time
  })
})

const cancelledReservations = computed(() => {
  return detailedReservations.value.filter(r => r.status === 'cancelled')
})

const confirmedReservations = computed(() => {
  return detailedReservations.value.filter(r => r.status === 'confirmed')
})

const totalRevenue = computed(() => {
  return stats.value.reduce((sum, item) => sum + item.revenue, 0)
})

const totalRefund = computed(() => {
  return cancelledReservations.value.reduce((sum, r) => sum + (r.fee || 0), 0)
})

const totalCount = computed(() => {
  return stats.value.reduce((sum, item) => sum + item.count, 0)
})

const getCourtName = (courtId) => {
  const court = courtStore.courts.find(c => c.id === courtId)
  return court ? court.name : `${courtId}번 코트`
}

const formatTime = (time) => {
  return `${String(time).padStart(2, '0')}:00`
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="stats-container">
    <div class="header">
      <button @click="goBack" class="btn-back">← 뒤로가기</button>
      <h1>코트별 예약 통계</h1>
    </div>

    <div class="controls">
      <div class="date-group">
        <label>기간:</label>
        <input type="date" v-model="startDate" />
        <span>~</span>
        <input type="date" v-model="endDate" />
      </div>
    </div>

    <div class="stats-card">
      <h2>확정 예약 내역</h2>
      <div class="table-wrapper">
        <table class="detail-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>코트</th>
              <th>시간</th>
              <th>예약자</th>
              <th>전화번호</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reservation in confirmedReservations" :key="reservation.id">
              <td>{{ reservation.date }}</td>
              <td>{{ getCourtName(reservation.courtId) }}</td>
              <td>{{ formatTime(reservation.time) }}</td>
              <td>{{ reservation.userName }}</td>
              <td>{{ reservation.phone }}</td>
              <td class="revenue">{{ reservation.fee.toLocaleString() }}원</td>
            </tr>
            <tr v-if="confirmedReservations.length === 0">
              <td colspan="6" class="empty-message">예약 내역이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="stats-card" v-if="cancelledReservations.length > 0">
      <h2>취소/환불 내역</h2>
      <div class="table-wrapper">
        <table class="detail-table cancelled-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>코트</th>
              <th>시간</th>
              <th>예약자</th>
              <th>전화번호</th>
              <th>환불금액</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reservation in cancelledReservations" :key="reservation.id">
              <td>{{ reservation.date }}</td>
              <td>{{ getCourtName(reservation.courtId) }}</td>
              <td>{{ formatTime(reservation.time) }}</td>
              <td>{{ reservation.userName }}</td>
              <td>{{ reservation.phone }}</td>
              <td class="refund">{{ reservation.fee.toLocaleString() }}원</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="stats-card">
      <h2>코트별 통계</h2>
      <table class="stats-table">
        <thead>
          <tr>
            <th>코트명</th>
            <th>예약 횟수</th>
            <th>매출액 (원)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stat in stats" :key="stat.courtId">
            <td>{{ stat.name }}</td>
            <td>{{ stat.count }}회</td>
            <td class="revenue">{{ stat.revenue.toLocaleString() }}</td>
          </tr>
          <tr class="total-row">
            <td>합계</td>
            <td>{{ totalCount }}회</td>
            <td class="revenue">{{ totalRevenue.toLocaleString() }}</td>
          </tr>
          <tr v-if="totalRefund > 0" class="refund-row">
            <td>환불 합계</td>
            <td>{{ cancelledReservations.length }}건</td>
            <td class="refund">-{{ totalRefund.toLocaleString() }}</td>
          </tr>
          <tr v-if="totalRefund > 0" class="net-row">
            <td>순매출</td>
            <td>-</td>
            <td class="net-revenue">{{ (totalRevenue - totalRefund).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.stats-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn-back {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #666;
}

.controls {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.date-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.1rem;
}

.date-group input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.stats-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.stats-card h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #2c3e50;
  font-size: 1.3rem;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5rem;
}

.table-wrapper {
  overflow-x: auto;
}

.stats-table, .detail-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th, .stats-table td,
.detail-table th, .detail-table td {
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.stats-table th, .detail-table th {
  background: #f8f9fa;
  color: #2c3e50;
  font-weight: bold;
}

.detail-table tbody tr:hover {
  background: #f8f9fa;
}

.revenue {
  font-weight: bold;
  color: #27ae60;
  text-align: right;
  padding-right: 2rem;
}

.refund {
  font-weight: bold;
  color: #e74c3c;
  text-align: right;
  padding-right: 2rem;
}

.net-revenue {
  font-weight: bold;
  color: #2c3e50;
  text-align: right;
  padding-right: 2rem;
  font-size: 1.1rem;
}

.total-row {
  background: #f0f8ff;
  font-weight: bold;
  font-size: 1.1rem;
}

.total-row td {
  border-top: 2px solid #3498db;
  color: #2c3e50;
}

.refund-row {
  background: #fff5f5;
  font-weight: bold;
}

.refund-row td {
  border-top: 1px solid #e74c3c;
}

.net-row {
  background: #e8f8f5;
  font-weight: bold;
  font-size: 1.1rem;
}

.net-row td {
  border-top: 2px solid #27ae60;
  color: #2c3e50;
}

.cancelled-table {
  border: 2px solid #e74c3c;
}

.cancelled-table thead {
  background: #ffe6e6;
}

.empty-message {
  text-align: center;
  color: #95a5a6;
  font-style: italic;
  padding: 2rem;
}
</style>
