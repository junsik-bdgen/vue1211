<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const activeDropdown = ref(null)

const toggleDropdown = (name) => {
  if (activeDropdown.value === name) {
    activeDropdown.value = null
  } else {
    activeDropdown.value = name
  }
}

const closeDropdown = () => {
  activeDropdown.value = null
}

const navigateTo = (path) => {
  closeDropdown()
  router.push(path)
}

const handleLogout = () => {
  if (confirm('로그아웃하시겠습니까?')) {
    authStore.logout()
    router.push('/login')
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.dropdown-container')) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const navItems = [
  { name: '홈', path: '/' },
  { name: '공지사항', path: '/notices' },
  { name: '대회 일정', path: '/tournaments/calendar' },
  { name: '클럽 앨범', path: '/photos' },
  { name: '회원 명부', path: '/members' },
  { name: '대회 신청', path: '/tournaments' },
]

const adminItems = [
  { name: '코트 관리', path: '/admin/courts' },
  { name: '시드 배정', path: '/admin/seeding' },
  { name: '대회 운영', path: '/admin/ops' },
  { name: '대진표', path: '/admin/bracket' },
]
</script>

<template>
  <nav class="nav-container">
    <div class="nav-grid">
      <!-- Standard Links -->
      <div 
        v-for="item in navItems" 
        :key="item.name" 
        class="nav-card"
        @click="navigateTo(item.path)"
      >
        <div class="nav-overlay">
          <span class="nav-text">{{ item.name }}</span>
        </div>
      </div>


      <!-- Admin Dropdown -->
      <div 
        v-if="authStore.isAdmin"
        class="nav-card dropdown-container" 
        :class="{ active: activeDropdown === 'admin' }"
        @click.stop="toggleDropdown('admin')"
      >
        <div class="nav-overlay">
          <span class="nav-text">관리자 {{ activeDropdown === 'admin' ? '▼' : '▶' }}</span>
        </div>
        
        <div 
          v-show="activeDropdown === 'admin'" 
          class="dropdown-content"
          :style="{ pointerEvents: 'auto', display: activeDropdown === 'admin' ? 'block' : 'none' }"
        >
          <div 
            v-for="item in adminItems" 
            :key="item.name" 
            class="dropdown-item"
            @click.stop="navigateTo(item.path)"
          >
            {{ item.name }}
          </div>
        </div>
      </div>

      <!-- User Info / Login -->
      <div 
        v-if="authStore.isAuthenticated"
        class="nav-card dropdown-container user-menu" 
        :class="{ active: activeDropdown === 'user' }"
        @click.stop="toggleDropdown('user')"
      >
        <div class="nav-overlay">
          <span class="nav-text">
            👤 {{ authStore.user?.name || authStore.user?.username }}
            {{ activeDropdown === 'user' ? '▼' : '▶' }}
          </span>
        </div>
        
        <div 
          v-show="activeDropdown === 'user'" 
          class="dropdown-content"
        >
          <div class="dropdown-item user-info">
            <strong>{{ authStore.user?.name }}</strong>
            <small>{{ authStore.user?.email }}</small>
          </div>
          <div class="dropdown-divider"></div>
          <div 
            class="dropdown-item logout-btn"
            @click.stop="handleLogout"
          >
            🚪 로그아웃
          </div>
        </div>
      </div>

      <!-- Login Button -->
      <div 
        v-else
        class="nav-card login-btn"
        @click="navigateTo('/login')"
      >
        <div class="nav-overlay">
          <span class="nav-text">🔐 로그인</span>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav-container {
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  /* background-image: url("@/assets/tennis_tournamen/t.png.jpg"); */
  cursor: url('@/assets/tennis_ball_cursor.png') 16 16, auto;
}

.nav-grid {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  flex-wrap: wrap;
}

.nav-card {
  position: relative;
  cursor: url('@/assets/tennis_ball_cursor.png') 16 16, pointer;
  padding: 0.5rem 0;
  /* background-image: url("@/assets/tennis_tournament.png.jpg"); */
}

.nav-card:hover .nav-text,
.nav-card.active .nav-text {
  color: #a2f67b;
  transform: translateY(-7px);
}

.nav-card:hover .nav-text::after,
.nav-card.active .nav-text::after {
  width: 100%;
  
}

.nav-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-text {
  color: #ecf0f1;
  font-weight: 500;
  font-size: 1.5rem;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  padding-bottom: 0.25rem;
  /* background-image: url("@/assets/tennis_tournament.png.jpg"); */
}

.nav-text::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: #a5ee37;
  transition: width 0.3s ease;
}

/* Login Button */
.login-btn .nav-text {
  color: #ffd700;
  font-weight: 700;
}

.login-btn:hover .nav-text {
  color: #ffed4e;
}

/* User Menu */
.user-menu .nav-text {
  color: #a5ee37;
}

/* Dropdown Styles */
.dropdown-content {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  min-width: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  z-index: 9999;
  overflow: hidden;
}

.dropdown-item {
  display: block;
  padding: 0.75rem 1.5rem;
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.2s;
  text-align: center;
  cursor: url('@/assets/tennis_ball_cursor.png') 16 16, pointer;
  background: white;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: #ecf0f1;
  color: #3498db;
  padding-left: 2rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1rem 1.5rem;
  cursor: default !important;
}

.user-info:hover {
  background: white;
  padding-left: 1.5rem;
}

.user-info strong {
  color: #2c3e50;
  font-size: 1.1rem;
}

.user-info small {
  color: #7f8c8d;
  font-size: 0.85rem;
}

.dropdown-divider {
  height: 1px;
  background: #ecf0f1;
  margin: 0.5rem 0;
}

.logout-btn {
  color: #e74c3c !important;
  font-weight: 600;
}

.logout-btn:hover {
  background: #ffebee !important;
  color: #c62828 !important;
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .nav-container {
    padding: 0.8rem 1rem;
  }

  .nav-grid {
    gap: 1rem;
  }

  .nav-text {
    font-size: 1rem;
  }

  .dropdown-content {
    min-width: 150px;
  }

  .dropdown-item {
    font-size: 0.9rem;
    padding: 0.6rem 1rem;
  }
}

@media (max-width: 480px) {
  .nav-grid {
    gap: 0.5rem;
  }

  .nav-text {
    font-size: 0.9rem;
  }

  .user-info {
    padding: 0.8rem 1rem;
  }
}
</style>
