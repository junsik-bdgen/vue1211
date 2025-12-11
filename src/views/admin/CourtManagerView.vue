<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCourtStore } from '../../stores/courts'

const courtStore = useCourtStore()
const activeTab = ref('list') // 'list', 'map', 'slots'
const showAddForm = ref(false)

onMounted(() => {
  courtStore.fetchCourts()
})

const newCourt = ref({
  name: '',
  type: 'Hard',
  surface: '',
  lighting: false,
  x: 50, // Map position X
  y: 50  // Map position Y
})

const timeSlotSettings = ref({
  openTime: '06:00',
  closeTime: '22:00',
  slotDuration: 60, // minutes
  exceptions: []
})

const handleAddCourt = () => {
  if (!newCourt.value.name) return
  
  courtStore.addCourt(newCourt.value)
  
  newCourt.value = {
    name: '',
    type: 'Hard',
    surface: '',
    lighting: false,
    x: 50,
    y: 50
  }
  showAddForm.value = false
}

// Map Dragging Logic (Simplified)
const isDragging = ref(false)
const draggedCourtId = ref(null)

const startDrag = (event, courtId) => {
  isDragging.value = true
  draggedCourtId.value = courtId
}

const onDrag = (event) => {
  if (!isDragging.value || !draggedCourtId.value) return
  
  const mapRect = event.currentTarget.getBoundingClientRect()
  const x = ((event.clientX - mapRect.left) / mapRect.width) * 100
  const y = ((event.clientY - mapRect.top) / mapRect.height) * 100
  
  const court = courtStore.courts.find(c => c.id === draggedCourtId.value)
  if (court) {
    court.x = Math.max(0, Math.min(100, x))
    court.y = Math.max(0, Math.min(100, y))
  }
}

const stopDrag = () => {
  if (isDragging.value && draggedCourtId.value) {
    const court = courtStore.courts.find(c => c.id === draggedCourtId.value)
    if (court) {
      courtStore.updateCourtPosition(court.id, court.x, court.y)
    }
  }
  isDragging.value = false
  draggedCourtId.value = null
}

const getStatusText = (status) => {
  return status === 'Active' ? '활성화' : '점검중'
}
</script>

<template>
  <div class="admin-container">
    <div class="header-actions">
      <h1>코트 관리</h1>
      <div class="tabs">
        <button 
          @click="activeTab = 'list'" 
          :class="['tab-btn', { active: activeTab === 'list' }]"
        >목록</button>
        <button 
          @click="activeTab = 'map'" 
          :class="['tab-btn', { active: activeTab === 'map' }]"
        >지도</button>
        <button 
          @click="activeTab = 'slots'" 
          :class="['tab-btn', { active: activeTab === 'slots' }]"
        >시간 설정</button>
      </div>
      <button v-if="activeTab === 'list'" @click="showAddForm = true" class="btn-add">
        + 코트 추가
      </button>
    </div>

    <!-- LIST VIEW -->
    <div v-if="activeTab === 'list'" class="court-table-container">
      <table class="court-table">
        <thead>
          <tr>
            <th>코트명</th>
            <th>코트유형</th>
            <th>코트면수</th>
            <th>조명</th>
            <th>코트상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="court in courtStore.courts" :key="court.id">
            <td>{{ court.name }}</td>
            <td>{{ court.type }}</td>
            <td>{{ court.surface }}</td>
            <td>
              <span v-if="court.lighting" class="badge-lighting">💡 있음</span>
              <span v-else class="badge-no-lighting">없음</span>
            </td>
            <td>
              <span :class="['status-badge', `status-${court.status.toLowerCase()}`]">
                {{ getStatusText(court.status) }}
              </span>
            </td>
            <td class="actions-cell">
              <button 
                v-if="court.status === 'Active'"
                @click="courtStore.updateCourtStatus(court.id, 'Maintenance')" 
                class="btn-action btn-maintenance"
              >
                점검
              </button>
              <button 
                v-else
                @click="courtStore.updateCourtStatus(court.id, 'Active')" 
                class="btn-action btn-activate"
              >
                활성화
              </button>
              <button @click="courtStore.deleteCourt(court.id)" class="btn-action btn-delete">
                삭제
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MAP VIEW -->
    <div v-if="activeTab === 'map'" class="map-container">
      <div 
        class="court-map" 
        @mousemove="onDrag" 
        @mouseup="stopDrag" 
        @mouseleave="stopDrag"
      >
        <div 
          v-for="court in courtStore.courts" 
          :key="court.id"
          class="court-node"
          :style="{ left: `${court.x || 50}%`, top: `${court.y || 50}%` }"
          @mousedown="startDrag($event, court.id)"
        >
          <div class="court-shape" :class="`type-${court.type.toLowerCase()}`"></div>
          <span class="court-label">{{ court.name }}</span>
        </div>
      </div>
      <p class="map-hint">코트를 드래그하여 위치를 조정하세요.</p>
    </div>

    <!-- TIME SLOTS VIEW -->
    <div v-if="activeTab === 'slots'" class="slots-container">
      <div class="settings-card">
        <h2>운영 시간</h2>
        <div class="form-group">
          <label>오픈 시간</label>
          <input v-model="timeSlotSettings.openTime" type="time" />
        </div>
        <div class="form-group">
          <label>마감 시간</label>
          <input v-model="timeSlotSettings.closeTime" type="time" />
        </div>
        <div class="form-group">
          <label>예약 단위 (분)</label>
          <select v-model="timeSlotSettings.slotDuration">
            <option :value="30">30분</option>
            <option :value="60">60분</option>
            <option :value="90">90분</option>
            <option :value="120">120분</option>
          </select>
        </div>
        <button class="btn-save">설정 저장</button>
      </div>
    </div>

    <!-- Add Court Modal -->
    <div v-if="showAddForm" class="modal-overlay" @click.self="showAddForm = false">
      <div class="modal-content">
        <h2>새 코트 등록</h2>
        
        <div class="form-group">
          <label>코트명</label>
          <input v-model="newCourt.name" placeholder="예: 센터 코트" />
        </div>

        <div class="form-group">
          <label>코트유형</label>
          <select v-model="newCourt.type" placeholder="하드, 잔디, 클레이">
            <option value="Hard">하드</option>
            <option value="Clay">클레이</option>
            <option value="Grass">잔디</option>
          </select>
        </div>

        <div class="form-group">
          <label>코트면수</label>
          <input v-model="newCourt.surface" placeholder="예: 2면,4면, 6면, 9면" />
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="newCourt.lighting" />
            조명 있음
          </label>
        </div>

        <div class="modal-actions">
          <button @click="showAddForm = false" class="btn-cancel">취소</button>
          <button @click="handleAddCourt" class="btn-confirm">추가</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  padding: 1rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  background: #f1f2f6;
  padding: 0.3rem;
  border-radius: 8px;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  color: #666;
}

.tab-btn.active {
  background: white;
  color: #2c3e50;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.btn-add {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

/* Table Styles (Same as before) */
.court-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
}

.court-table {
  width: 100%;
  border-collapse: collapse;
}

.court-table th,
.court-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.court-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.badge-lighting { background: #fff3cd; color: #856404; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem; }
.badge-no-lighting { color: #666; font-size: 0.85rem; }
.status-badge { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.85rem; font-weight: bold; }
.status-active { background: #d4edda; color: #155724; }
.status-maintenance { background: #f8d7da; color: #721c24; }
.actions-cell { display: flex; gap: 0.5rem; }
.btn-action { padding: 0.4rem 0.8rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
.btn-maintenance { background: #f39c12; color: white; }
.btn-activate { background: #27ae60; color: white; }
.btn-delete { background: #e74c3c; color: white; }

/* Map Styles */
.map-container {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.court-map {
  width: 100%;
  height: 500px;
  background: #e8f5e9; /* Grass-like background */
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #c8e6c9;
}

.court-node {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: grab;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.court-node:active {
  cursor: grabbing;
}

.court-shape {
  width: 80px;
  height: 50px;
  border: 2px solid white;
  background: #3498db; /* Hard court default */
  border-radius: 2px;
}

.type-clay { background: #d35400; }
.type-grass { background: #27ae60; }
.type-carpet { background: #8e44ad; }

.court-label {
  margin-top: 5px;
  font-size: 0.8rem;
  font-weight: bold;
  background: rgba(255,255,255,0.8);
  padding: 2px 6px;
  border-radius: 4px;
}

.map-hint {
  text-align: center;
  color: #666;
  margin-top: 1rem;
}

/* Slots Styles */
.slots-container {
  max-width: 600px;
  margin: 0 auto;
}

.settings-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.btn-save {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  width: 100%;
  margin-top: 1rem;
}

/* Modal Styles (Same as before) */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: white; padding: 2rem; border-radius: 12px; width: 100%; max-width: 500px; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
.form-group input, .form-group select { width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 4px; }
.checkbox-group label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.checkbox-group input { width: auto; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
.btn-cancel { background: #95a5a6; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 4px; cursor: pointer; }
.btn-confirm { background: #2c3e50; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 4px; cursor: pointer; }
</style>
