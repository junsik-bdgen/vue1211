import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  const isLoading = ref(false);
  const error = ref(null);

  // 로그인 상태 확인
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  // 로그인
  const login = async (username, password) => {
    isLoading.value = true;
    error.value = null;

    console.log('🔐 Attempting login:', username);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      // 토큰과 사용자 정보 저장
      token.value = data.token;
      user.value = data.user;

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      console.log('✅ Login successful:', data.user.username);

      return true;
    } catch (e) {
      console.error('❌ Login error:', e);
      error.value = e.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 회원가입
  const register = async (userData) => {
    isLoading.value = true;
    error.value = null;

    console.log('📝 Attempting registration:', userData.username);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.');
      }

      console.log('✅ Registration successful');

      return true;
    } catch (e) {
      console.error('❌ Registration error:', e);
      error.value = e.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 로그아웃
  const logout = () => {
    console.log('🚪 Logging out');

    token.value = null;
    user.value = null;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // 현재 사용자 정보 가져오기
  const fetchCurrentUser = async () => {
    if (!token.value) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      user.value = data;
      localStorage.setItem('user', JSON.stringify(data));
    } catch (e) {
      console.error('❌ Fetch user error:', e);
      // 토큰이 유효하지 않으면 로그아웃
      logout();
    }
  };

  // API 요청 헤더 가져오기
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.value}`,
    };
  };

  return {
    token,
    user,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    fetchCurrentUser,
    getAuthHeaders,
  };
});
