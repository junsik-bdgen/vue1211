<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMemberStore } from '../stores/members'

const route = useRoute()
const router = useRouter()
const memberStore = useMemberStore()

const isEdit = computed(() => route.params.id !== undefined)
const form = ref({
  name: '',
  club: '',
  tel: '',
  area: '양주-관내',
  rank: '비입상',
  points: 2                                                                                                                              
})

const ranks = ['비입상', '우승', '준우승', '입상']
const areas = ['양주-관내', '양주-직장', '관외-지역']

onMounted(() => {
  if (isEdit.value) {
    const member = memberStore.getMemberById(route.params.id)
    if (member) {
      form.value = { ...member }
    } else {
      router.push('/members')
    }
  }
})

const submitForm = () => {
  if (isEdit.value) {
    memberStore.updateMember(form.value)
  } else {
    memberStore.addMember(form.value)
  }
  router.push('/members')
}
</script>

<template>
  <div class="member-form-container">
    <h1>{{ isEdit ? 'Edit Member' : '회원 추가' }}</h1>
    
    <form @submit.prevent="submitForm" class="member-form">
      <div class="form-group">
        <label for="name">회원명</label>
        <input 
          id="name" 
          v-model="form.name" 
          type="text" 
          required
          placeholder="이름일 기입하세요"
        >
      </div>

      <div class="form-group">
        <label for="club">소속 클럽</label>
        <input 
          id="club" 
          v-model="form.club" 
          type="text" 
          required
          placeholder="소속 클럽을 기입하세요"
        >
      </div>
      <div class="form-group">
        <label for="tel">전화번호</label>
        <input 
          id="tel" 
          v-model="form.tel" 
          type="text" 
          required
          placeholder="010-1234-5678 형식으로 기입하세요"
        >
      </div>
      <div class="form-group">
        <label for="area">활동지역</label>
        <input 
          id="area" 
          v-model="form.area" 
          type="text" 
          required
          placeholder="양주-관내, 양주-직장, 관외-지역 형식으로 기입하세요"
        >
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="rank">입상여부</label>
          <select id="rank" v-model="form.rank" required>
            <option v-for="rank in ranks" :key="rank" :value="rank">{{ rank }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="area">활동지역</label>
          <select id="area" v-model="form.area" required>
            <option v-for="area in areas" :key="area" :value="area">{{ area }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="points">점수제</label>
          <input 
            id="points" 
            v-model="form.points" 
            type="text" 
            required
            min="2"
            placeholder="해당하는 점수를 기입하세요"
          >
        </div>
      </div>

      <div class="form-actions">
        <button type="button" @click="router.push('/members')" class="btn-secondary">Cancel</button>
        <button type="submit" class="btn-primary">{{ isEdit ? 'Update' : 'Add' }}</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.member-form-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
  text-align: center;
}

.member-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: #2c3e50;
}

input, select {
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus, select:focus {
  outline: none;
  border-color: #3498db;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

button {
  padding: 0.8rem 2rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f1f2f6;
  color: #2c3e50;
}

.btn-primary {
  background: #3498db;
  color: white;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
