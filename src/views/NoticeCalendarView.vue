<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNoticeStore } from '../stores/notices'

const router = useRouter()
const noticeStore = ref(useNoticeStore())

onMounted(async () => {
  console.log('🔄 NoticeCalendarView mounted - fetching notices...')
  await noticeStore.value.fetchNotices()
  console.log('noticeStore.notices:', noticeStore.value)

})

const searchQuery = ref('')

const filteredNotices = computed(() => {
  const filtered = noticeStore.value.notices.filter(notice => {
    // Only show 'notice' type in the notice board
    if (notice.type !== 'notice') return false
    
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesSearch
  })
  
  console.log('🔍 Filtered notices:', filtered.length, 'of', noticeStore.value.notices.length)
  return filtered
})

const getTypeLabel = (type) => {
  switch (type) {
    case 'competition': return '대회'
    case 'event': return '행사'
    default: return '공지'
  }
}

const getTypeClass = (type) => {
  switch (type) {
    case 'competition': return 'type-competition'
    case 'event': return 'type-event'
    default: return 'type-notice'
  }
}
</script>

<template>
  <div class="notice-board-container">
    <div class="board-header">
      <h1>공지사항</h1>
      <button @click="router.push('/notices/create')" class="btn-create">
        글쓰기
      </button>
    </div>

    <div class="board-controls">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          placeholder="제목 또는 내용으로 검색..." 
          class="search-input"
        />
      </div>
    </div>

    <!-- 로딩 상태 -->
    <!-- <div v-if="noticeStore.isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>공지사항을 불러오는 중...</p>
    </div> -->

    <!-- 에러 메시지 -->
    <!-- <div v-else-if="noticeStore.error" class="error-container">
      <p class="error-message">❌ 오류: {{ noticeStore.error }}</p>
      <button @click="noticeStore.fetchNotices()" class="btn-retry">다시 시도</button>
    </div>

    <!- 공지사항 테이블 -->
    <!-- <div v-else class="board-table-container"> --> -->
      <!-- 디버그 정보 -->
      <!-- <div class="debug-info">
        <p><strong>디버그 정보:</strong></p>
        <p>전체 공지사항: {{ noticeStore.notices.length }}개</p>
        <p>필터링된 공지사항 (type='notice'): {{ filteredNotices.length }}개</p>
        <p>검색어: "{{ searchQuery }}"</p>
        <p>로딩 중: {{ noticeStore.isLoading }}</p>
        <p>에러: {{ noticeStore.error || '없음' }}</p>
      </div> -->

      <table class="board-table">
        <thead>
          <tr>
            <th class="col-number">번호</th>
            <th class="col-title">제목</th>
            <th class="col-author">작성자</th>
            <th class="col-type">타입</th>
            <th class="col-content">내용</th>
            <th class="col-created-at">작성일</th>
            <th class="col-updated-at">수정일</th>
            <th class="col-views">조회</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="notice in noticeStore.notices" :key="notice.id">
            <td>{{ notice.id }}</td>
            <td>{{ notice.title }}</td>
            <td>{{ notice.author }}</td>
            <td>{{ notice.type }}</td>
            <td>{{ notice.content }}</td>
            <td>{{ notice.created_at }}</td>
            <td>{{ notice.updated_at }}</td>
            <td>{{ notice.views }}</td>
          </tr>
        </tbody>
        <!-- <tbody>
          <tr 
            v-for="(notice, index) in filteredNotices" 
            :key="notice.id"
            @click="router.push(`/notices/${notice.id}`)"
            class="board-row"
          >
            <td class="col-number">{{ filteredNotices.length - index }}</td>
            <td class="col-title">
              <div class="title-content">
                {{ notice.title }}
              </div>
            </td>
            <td class="col-author">{{ notice.author || '관리자' }}</td>
            <td class="col-date">{{ notice.date }}</td>
            <td class="col-views">{{ notice.views || 0 }}</td>
          </tr>
        </tbody> -->
    

      <!-- <div v-if="!noticeStore.isLoading && filteredNotices.length === 0" class="no-results">
        <p v-if="noticeStore.notices.length === 0">
          📝 등록된 공지사항이 없습니다.<br>
          <small>데이터베이스에 데이터가 없을 수 있습니다. 'npm run test-display' 실행</small>
        </p>
        <p v-else>
          🔍 'notice' 타입의 공지사항이 없습니다.<br>
          <small>전체 공지사항: {{ noticeStore.notices.length }}개 (다른 타입일 수 있음)</small>
        </p>
      </div> -->
    
    </table>
  </div>
</template>

<style scoped>
.notice-board-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 3px solid #2c3e50;
}

.board-header h1 {
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

.board-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.search-box {
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

/* 로딩 상태 */
.loading-container {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 에러 메시지 */
.error-container {
  text-align: center;
  padding: 3rem;
  background: #ffebee;
  border-radius: 12px;
  border: 2px solid #ef5350;
}

.error-message {
  color: #c62828;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.btn-retry {
  background: #ef5350;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.btn-retry:hover {
  background: #c62828;
}

.board-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
}

.board-table {
  width: 100%;
  border-collapse: collapse;
}

.board-table thead {
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.board-table th {
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.board-table td {
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #eee;
  font-size: 0.95rem;
}

.board-row {
  cursor: pointer;
  transition: background 0.2s;
}

.board-row:hover {
  background: #f8f9fa;
}

.col-number {
  width: 80px;
  color: #666;
}

.col-title {
  text-align: left !important;
  min-width: 100px;
}

.col-author {
  width: 50px;
}

.col-type {
  width: 30px;
}

.col-content {
  width: 350px;
}

.col-created_at {
  width: 20px;
}

.col-updated_at {
  width: 20px;
}

.col-views {
  width: 50px;
}

.title-content {
  font-weight: 500;
  color: #2c3e50;
}

.no-results {
  padding: 3rem;
  text-align: center;
  color: #666;
  font-size: 1.1rem;
}

.no-results small {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #999;
}

@media (max-width: 768px) {
  .notice-board-container {
    padding: 1rem;
  }

  .board-header h1 {
    font-size: 1.5rem;
  }

  .board-controls {
    flex-direction: column;
  }

  .board-table {
    font-size: 0.85rem;
  }

  .col-author,
  .col-views {
    display: none;
  }

  .board-table th,
  .board-table td {
    padding: 0.5rem;
  }

  .debug-info {
    font-size: 0.8rem;
  }
}
</style>
