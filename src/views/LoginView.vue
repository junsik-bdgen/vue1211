<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) {
    alert('아이디와 비밀번호를 입력해주세요.')
    return
  }

  const success = await authStore.login(username.value, password.value)

  if (success) {
    router.push('/')
  } else {
    alert(authStore.error || '로그인에 실패했습니다.')
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <span class="tennis-icon">🎾</span>
        </div>
        <h1>테니스 협회 플랫폼</h1>
        <p class="subtitle">로그인하여 시작하세요</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">
            <span class="icon">👤</span>
            아이디
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="아이디를 입력하세요"
            autocomplete="username"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">
            <span class="icon">🔒</span>
            비밀번호
          </label>
          <div class="password-input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="비밀번호를 입력하세요"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="btn-login"
          :disabled="authStore.isLoading"
        >
          <span v-if="authStore.isLoading">로그인 중...</span>
          <span v-else>로그인</span>
        </button>
      </form>

      <div class="login-footer">
        <p>계정이 없으신가요?</p>
        <button @click="goToRegister" class="btn-register">
          회원가입
        </button>
      </div>

      <div class="demo-info">
        <p><strong>테스트 계정:</strong></p>
        <p>관리자 - admin / admin123</p>
        <p>일반사용자 - user / user123</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  margin-bottom: 1rem;
}

.tennis-icon {
  font-size: 4rem;
  display: inline-block;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.login-header h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 700;
}

.subtitle {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.95rem;
}

.login-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.95rem;
}

.icon {
  font-size: 1.2rem;
}

.form-group input {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  padding-right: 3rem;
}

.toggle-password {
  position: absolute;
  right: 0.8rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.3rem;
  padding: 0.5rem;
  transition: transform 0.2s;
}

.toggle-password:hover {
  transform: scale(1.1);
}

.btn-login {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.login-footer p {
  margin: 0 0 0.8rem 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.btn-register {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 0.7rem 2rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-register:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.demo-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  text-align: center;
  font-size: 0.85rem;
  color: #666;
}

.demo-info p {
  margin: 0.3rem 0;
}

.demo-info strong {
  color: #2c3e50;
}

/* 모바일 최적화 */
@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
    border-radius: 15px;
  }

  .login-header h1 {
    font-size: 1.5rem;
  }

  .tennis-icon {
    font-size: 3rem;
  }

  .form-group input {
    padding: 0.8rem;
    font-size: 16px; /* iOS zoom 방지 */
  }

  .btn-login {
    padding: 0.9rem;
    font-size: 1rem;
  }

  .demo-info {
    font-size: 0.8rem;
  }
}

/* 태블릿 최적화 */
@media (min-width: 481px) and (max-width: 768px) {
  .login-card {
    max-width: 500px;
  }
}

/* 가로 모드 최적화 */
@media (max-height: 600px) and (orientation: landscape) {
  .login-container {
    padding: 0.5rem;
  }

  .login-card {
    padding: 1.5rem;
  }

  .tennis-icon {
    font-size: 2.5rem;
  }

  .login-header h1 {
    font-size: 1.3rem;
  }

  .demo-info {
    display: none;
  }
}
</style>
