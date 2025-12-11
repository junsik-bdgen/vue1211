<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useMemberStore } from '../stores/members'
import { useTournamentStore } from '../stores/tournaments'
import { useNoticeStore } from '../stores/notices'
import { computed, onMounted } from 'vue'

const router = useRouter()
const memberStore = useMemberStore()
const tournamentStore = useTournamentStore()
const noticeStore = useNoticeStore()

onMounted(() => {
  memberStore.fetchMembers()
  tournamentStore.fetchTournaments()
  noticeStore.fetchNotices()
})

const clubCount = computed(() => memberStore.uniqueClubs.length - 1) // Subtract 'All'
const memberCount = computed(() => memberStore.members.length)
const tournamentCount = computed(() => tournamentStore.tournaments.length)

const serviceItems = [
  { 
    title: '공지사항', 
    desc: '협회의 최신 소식과 공지사항을 확인하세요.', 
    path: '/notices' 
  },
  { 
    title: '대회안내', 
    desc: '연간 대회 일정 및 상세 요강을 안내합니다.', 
    path: '/tournaments/calendar' 
  },
  { 
    title: '대회참가신청', 
    desc: '진행 중인 대회에 참가 신청을 할 수 있습니다.', 
    path: '/tournaments' 
  },
  { 
    title: '대진표', 
    desc: '대회 대진표를 실시간으로 확인하세요.', 
    path: '/tournaments/bracket' 
  },
  { 
    title: '대진결과', 
    desc: '대회 경기 결과와 입상자 명단을 확인하세요.', 
    path: '/admin/ops' 
  }
]

const navigateTo = (path) => {
  router.push(path)
}
</script>

<template>
  <div class="home-container">
    <section class="hero-section">
      <h1>테니스 협회 플랫폼</h1>
      <p class="subtitle">커뮤니티에 참여하고, 대회에 도전하며, 클럽을 관리하세요.</p>
      <div class="cta-buttons">
        <router-link to="/tournaments" class="btn-primary">대회 참가하기</router-link>
        <router-link to="/courts/reservation" class="btn-primary">남방코트예약</router-link>
        <router-link to="/members" class="btn-secondary">회원 찾기</router-link>
      </div>
    </section>

    <section class="stats-section">
      <div class="stat-card">
        <h3>{{ clubCount }}</h3>
        <p><b>등록 클럽</b></p>
      </div>
      <div class="stat-card">
        <h3>{{ memberCount }}</h3>
        <p><b>활동 회원</b></p>
      </div>
      <div class="stat-card">
        <h3>{{ tournamentCount }}</h3>
        <p><b>개최 대회</b></p>
      </div>
    </section>

    <section class="services-preview">
      <!-- <h2>제공 서비스</h2> -->
      <div class="services-grid">
        <div 
          v-for="item in serviceItems" 
          :key="item.title" 
          class="service-item"
          @click="navigateTo(item.path)"
        >
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-container {
  text-align: center;
  /* Background Image Setup */
  background-image: url("@/assets/tennis_tournament.png.jpg");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.hero-section {
  padding: 2rem 10;
  background: rgba(221, 230, 211, 0.85); /* Light overlay for readability */
  backdrop-filter: blur(5px);
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  text-shadow: 1px 1px 1px rgba(255,255,255,0.5);
}

.subtitle {
  font-size: 1.5rem;
  color: #444;
  /* margin-bottom: 2.5rem; */
  font-weight: 500;
}

.cta-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.btn-primary, .btn-secondary {
  padding: 1rem 2rem;
  border-radius: 50px; /* Pill shape */
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
  font-size: 1.1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.btn-primary {
  background: #2c3e50;
  color: white;
}

.btn-secondary {
  background: white;
  color: #2c3e50;
  border: 2px solid #2c3e50;
}

.btn-primary:hover, .btn-secondary:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

.stats-section {
  display: flex;
  justify-content: space-around;
  padding: 1rem 1rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  margin: 0 auto 3rem;
  max-width: 1000px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  width: 90%;
}

.stat-card h3 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 800;
  text-align: center;
}

.stat-card p {
  color: #666;
  font-size: 1.1rem;
  margin-top: 0.5rem;
  text-align: center;
}

.services-preview {
  background: white;
  padding: 1rem 2rem;
  background-image: url("@/assets/tennis_tournament.png.jpg");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.services-preview h2 {
  font-size: 2.5rem;
  color: #f2e710;
  margin-bottom: 1rem;
  text-align: center;

}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  text-align: left;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  width: 100%;
}

.service-item {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  border-top: 5px solid #2c3e50;
  cursor: pointer;
}

.service-item:hover {
  transform: translateY(-5px);
  background: white;
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  border-top-color: #3498db;
}

.service-item h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 700;
}

.service-item p {
  color: #666;
  line-height: 1.5;
  font-size: 0.95rem;
  margin: 0;
}
</style>
