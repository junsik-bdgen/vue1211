<script setup>
import { useRouter } from 'vue-router' // 버튼화면으로 화면 하나 추가시 vue-router 추가//
import { useMemberStore } from '../stores/members'
import { onMounted } from 'vue'

const router = useRouter()  // 버튼 추가시 rout 초기화 //
const memberStore = useMemberStore()

onMounted(() => {
  memberStore.fetchMembers()
})

const handleImport = () => {
  document.getElementById('import-file').click()
}

const onFileChange = async (event) => {
  const file = event.target.files[0]
  if (file) {
    try {
      await memberStore.importFromExcel(file)
      alert('회원 명부가 성공적으로 가져와졌습니다.')
    } catch (error) {
      console.error('Import failed:', error)
      alert('파일 가져오기에 실패했습니다.')
    }
    // Reset input
    event.target.value = ''
  }
}
</script>

<template>
  <div class="directory-container">
    <div class="header-actions">
      <h1>회원 명부</h1>
      <div class="action-buttons">
        <button @click="router.push('/members/create')" class="btn-add">
          회원 추가
        </button>
        <button @click="memberStore.exportToExcel" class="btn-export">
          Excel 내보내기
        </button>
        <button @click="handleImport" class="btn-import">
          Excel 가져오기
        </button>
        <button @click="memberStore.downloadTemplate" class="btn-template">
          양식 다운로드
        </button>
        <input 
          type="file" 
          id="import-file" 
          @change="onFileChange" 
          accept=".xlsx, .xls" 
          style="display: none;"
        >
      </div>
    </div>
    <div class="filters">
      <input 
        v-model="memberStore.searchQuery" 
        placeholder="회원 검색..." 
        class="search-input"
      />
      <select v-model="memberStore.selectedClub" class="club-select">
        <option v-for="club in memberStore.uniqueClubs" :key="club" :value="club">
          {{ club }}
        </option>
      </select>
    </div>

    <div class="table-container">
      <table class="member-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>클럽</th>
            <th>전화번호</th>
            <th>활동지역</th>
            <th>입상여부</th>
            <th>점수</th>

          </tr>
        </thead>
        <tbody>
          <tr v-for="member in memberStore.filteredMembers" :key="member.id">
            <td>{{ member.name }}</td>
            <td>{{ member.club }}</td>
            <td>{{ member.tel }}</td>
            <td>{{ member.area }}</td>
            <td>
              <span :class="['rank-badge', `rank-${member.rank}`]">
                {{ member.rank }}
              </span>
            </td>
            <td>{{ member.points }}</td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="memberStore.filteredMembers.length === 0" class="no-results">
        검색 결과가 없습니다.
      </div>
    </div>
  </div>
</template>

<style scoped>
.directory-container {
  padding: 1rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.btn-export {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.btn-import {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.btn-template {
  background: #f1c40f;
  color: #2c3e50;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.btn-add {
  background: #ae6827;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-input {
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.club-select {
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  min-width: 150px;
  font-size: 1rem;
}

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
}

.member-table {
  width: 100%;
  border-collapse: collapse;
}

.member-table th,
.member-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.member-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.member-table tr:hover {
  background: #f1f2f6;
}

.rank-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: bold;
}

.rank-우승 { background: #ffd700; color: #d35400; }
.rank-준우승 { background: #c0c0c0; color: #2c3e50; }
.rank-입상 { background: #cd7f32; color: white; }
.rank-비입상 { background: #3532cd; color: white; }

.no-results {
  padding: 2rem;
  text-align: center;
  color: #666;
}
</style>
