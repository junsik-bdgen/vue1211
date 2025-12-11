<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const formData = ref({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  email: '',
  phone: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const handleRegister = async () => {
  // 유효성 검사
  if (!formData.value.username || !formData.value.password || !formData.value.name) {
    alert('필수 항목을 모두 입력해주세요.')
    return
  }

  if (formData.value.password !== formData.value.confirmPassword) {
    alert('비밀번호가 일치하지 않습니다.')
    return
  }

  if (formData.value.password.length < 6) {
    alert('비밀번호는 최소 6자 이상이어야 합니다.')
    return
  }

  const success = await authStore.register({
    username: formData.value.username,
    password: formData.value.password,
    name: formData.value.name,
    email: formData.value.email,
    phone: formData.value.phone
  })

  if (success) {
    alert('회원가입이 완료되었습니다. 로그인해주세요.')
    router.push('/login')
  } else {
    alert(authStore.error || '회원가입에 실패했습니다.')
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <div class="logo">
          <span class="tennis-icon">🎾</span>
        </div>
        <h1>회원가입</h1>
        <p class="subtitle">테니스 협회 플랫폼에 오신 것을 환영합니다</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username">
            <span class="icon">👤</span>
            아이디 <span class="required">*</span>
          </label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            placeholder="아이디를 입력하세요"
            autocomplete="username"
            required
          />
        </div>

        <div class="form-group">
          <label for="name">
            <span class="icon">✏️</span>
            이름 <span class="required">*</span>
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="이름을 입력하세요"
            autocomplete="name"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">
            <span class="icon">📧</span>
            이메일
          </label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="example@email.com"
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="phone">
            <span class="icon">📱</span>
            전화번호
          </label>
          <input
            id="phone"
            v-model="formData.phone"
            type="tel"
            placeholder="010-1234-5678"
            autocomplete="tel"
          />
        </div>

        <div class="form-group">
          <label for="password">
            <span class="icon">🔒</span>
            비밀번호 <span class="required">*</span>
          </label>
          <div class="password-input-wrapper">
            <input
              id="password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="비밀번호 (최소 6자)"
              autocomplete="new-password"
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

        <div class="form-group">
          <label for="confirmPassword">
            <span class="icon">🔐</span>
            비밀번호 확인 <span class="required">*</span>
          </label>
          <div class="password-input-wrapper">
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="비밀번호를 다시 입력하세요"
              autocomplete="new-password"
              required
            />
            <button
              type="button"
              class="toggle-password"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="btn-register"
          :disabled="authStore.isLoading"
        >
          <span v-if="authStore.isLoading">가입 중...</span>
          <span v-else>회원가입</span>
        </button>
      </form>

      <div class="register-footer">
        <p>이미 계정이 있으신가요?</p>
        <button @click="goToLogin" class="btn-login">
          로그인
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.register-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 2.5rem;
  width: 100%;
  max-width: 500px;
  animation: slideUp 0.5s ease-out;
  max-height: 90vh;
  overflow-y: auto;
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

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  margin-bottom: 1rem;
}

.tennis-icon {
  font-size: 3.5rem;
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

.register-header h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 700;
}

.subtitle {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.9rem;
}

.register-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.9rem;
}

.icon {
  font-size: 1.1rem;
}

.required {
  color: #e74c3c;
  font-weight: 700;
}

.form-group input {
  width: 100%;
  padding: 0.8rem 1rem;
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
  font-size: 1.2rem;
  padding: 0.5rem;
  transition: transform 0.2s;
}

.toggle-password:hover {
  transform: scale(1.1);
}

.btn-register {
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
  margin-top: 0.5rem;
}

.btn-register:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.btn-register:active:not(:disabled) {
  transform: translateY(0);
}

.btn-register:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.register-footer p {
  margin: 0 0 0.8rem 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.btn-login {
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

.btn-login:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* 모바일 최적화 */
@media (max-width: 480px) {
  .register-card {
    padding: 2rem 1.5rem;
    border-radius: 15px;
  }

  .register-header h1 {
    font-size: 1.5rem;
  }

  .tennis-icon {
    font-size: 2.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group input {
    padding: 0.7rem;
    font-size: 16px; /* iOS zoom 방지 */
  }

  .btn-register {
    padding: 0.9rem;
    font-size: 1rem;
  }
}

/* 태블릿 최적화 */
@media (min-width: 481px) and (max-width: 768px) {
  .register-card {
    max-width: 550px;
  }
}

/* 가로 모드 최적화 */
@media (max-height: 700px) and (orientation: landscape) {
  .register-container {
    padding: 0.5rem;
  }

  .register-card {
    padding: 1.5rem;
    max-height: 95vh;
  }

  .tennis-icon {
    font-size: 2rem;
  }

  .register-header h1 {
    font-size: 1.3rem;
  }

  .form-group {
    margin-bottom: 0.8rem;
  }
}

/* 스크롤바 스타일링 */
.register-card::-webkit-scrollbar {
  width: 8px;
}

.register-card::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.register-card::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 10px;
}

.register-card::-webkit-scrollbar-thumb:hover {
  background: #764ba2;
}
</style>
