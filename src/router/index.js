import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import PhotoGalleryView from '../views/PhotoGalleryView.vue'
import MemberDirectoryView from '../views/MemberDirectoryView.vue'
import NoticeCalendarView from '../views/NoticeCalendarView.vue'
import TournamentRegisterView from '../views/TournamentRegisterView.vue'
import CourtManagerView from '../views/admin/CourtManagerView.vue'
import TournamentDirectoryView from '../views/TournamentDirectoryView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: LoginView,
            meta: { requiresGuest: true }
        },
        {
            path: '/register',
            name: 'register',
            component: RegisterView,
            meta: { requiresGuest: true }
        },
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/photos',
            name: 'photos',
            component: PhotoGalleryView
        },
        {
            path: '/photos/:id',
            name: 'photo-detail',
            component: () => import('../views/PhotoAlbumDetailView.vue')
        },
        {
            path: '/members',
            name: 'members',
            component: MemberDirectoryView
        },
        {
            path: '/tournaments/:id/participants',
            name: 'tournament-participants',
            component: TournamentDirectoryView
        },
        {
            path: '/members/create',
            name: 'member-create',
            component: () => import('../views/MemberFormView.vue')
        },
        {
            path: '/members/:id/edit',
            name: 'member-edit',
            component: () => import('../views/MemberFormView.vue')
        },
        {
            path: '/notices',
            name: 'notices',
            component: NoticeCalendarView
        },
        {
            path: '/tournaments/calendar',
            name: 'tournament-calendar',
            component: () => import('../views/TournamentCalendarView.vue')
        },
        {
            path: '/tournaments/bracket',
            name: 'tournament-bracket',
            component: () => import('../views/TournamentBracketView.vue')
        },
        {
            path: '/notices/create',
            name: 'notice-create',
            component: () => import('../views/NoticeFormView.vue')
        },
        {
            path: '/notices/:id',
            name: 'notice-detail',
            component: () => import('../views/NoticeDetailView.vue')
        },
        {
            path: '/notices/:id/edit',
            name: 'notice-edit',
            component: () => import('../views/NoticeFormView.vue')
        },
        {
            path: '/tournaments',
            name: 'tournaments',
            component: TournamentRegisterView
        },
        {
            path: '/tournaments/create',
            name: 'tournament-create',
            component: () => import('../views/TournamentCreateView.vue')
        },
        {
            path: '/admin/courts',
            name: 'admin-courts',
            component: CourtManagerView
        },
        {
            path: '/admin/seeding',
            name: 'admin-seeding',
            component: () => import('../views/admin/SeedingManagerView.vue')
        },
        {
            path: '/admin/ops',
            name: 'admin-ops',
            component: () => import('../views/admin/TournamentOpsView.vue')
        },
        {
            path: '/admin/bracket',
            name: 'admin-bracket',
            component: () => import('../views/admin/BracketManagerView.vue')
        },
        {
            path: '/courts/reservation',
            name: 'court-reservation',
            component: () => import('../views/CourtReservationView.vue')
        },
        {
            path: '/courts/stats',
            name: 'court-stats',
            component: () => import('../views/CourtStatsView.vue')
        }
    ]
})

// 인증 가드
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    
    // 로그인이 필요한 페이지 (선택사항 - 필요시 meta: { requiresAuth: true } 추가)
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    }
    // 로그인한 사용자는 로그인/회원가입 페이지 접근 불가
    else if (to.meta.requiresGuest && authStore.isAuthenticated) {
        next('/')
    }
    else {
        next()
    }
})

export default router

