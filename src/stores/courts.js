import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCourtStore = defineStore('courts', () => {
    const courts = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    const fetchCourts = async () => {
        isLoading.value = true
        try {
            const response = await fetch('/api/courts')
            if (!response.ok) throw new Error('Failed to fetch courts')
            courts.value = await response.json()
        } catch (e) {
            console.error('Error fetching courts:', e)
            error.value = e.message
        } finally {
            isLoading.value = false
        }
    }

    const addCourt = async (court) => {
        try {
            const response = await fetch('/api/courts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'Active',
                    ...court
                })
            })
            if (!response.ok) throw new Error('Failed to add court')
            const newCourt = await response.json()
            courts.value.push(newCourt)
        } catch (e) {
            console.error('Error adding court:', e)
            throw e
        }
    }

    const updateCourtStatus = async (id, status) => {
        try {
            const response = await fetch(`/api/courts/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            if (!response.ok) throw new Error('Failed to update court status')
            
            const court = courts.value.find(c => c.id === id)
            if (court) {
                court.status = status
            }
        } catch (e) {
            console.error('Error updating court status:', e)
            throw e
        }
    }

    const updateCourtPosition = async (id, x, y) => {
        try {
            const response = await fetch(`/api/courts/${id}/position`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y })
            })
            if (!response.ok) throw new Error('Failed to update court position')
            
            const court = courts.value.find(c => c.id === id)
            if (court) {
                court.x = x
                court.y = y
            }
        } catch (e) {
            console.error('Error updating court position:', e)
            throw e
        }
    }

    const deleteCourt = async (id) => {
        try {
            const response = await fetch(`/api/courts/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete court')
            
            courts.value = courts.value.filter(c => c.id !== id)
        } catch (e) {
            console.error('Error deleting court:', e)
            throw e
        }
    }

    return {
        courts,
        isLoading,
        error,
        fetchCourts,
        addCourt,
        updateCourtStatus,
        updateCourtPosition,
        deleteCourt
    }
})
