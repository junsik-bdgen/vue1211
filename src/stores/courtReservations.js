import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCourtReservationStore = defineStore('courtReservations', () => {
  const reservations = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Fetch reservations (optional date filter)
  const fetchReservations = async (date = null) => {
    isLoading.value = true
    try {
      const url = date ? `/api/reservations?date=${date}` : '/api/reservations'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch reservations')
      reservations.value = await response.json()
    } catch (e) {
      console.error('Error fetching reservations:', e)
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  const addReservation = async (reservation) => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation)
      })
      
      if (response.status === 409) {
        throw new Error('이미 예약된 시간입니다.')
      }
      
      if (!response.ok) throw new Error('Failed to add reservation')
      
      const newReservation = await response.json()
      reservations.value.push(newReservation)
      return newReservation
    } catch (e) {
      console.error('Error adding reservation:', e)
      throw e
    }
  }

  const cancelReservation = async (id) => {
    try {
      const response = await fetch(`/api/reservations/${id}/cancel`, {
        method: 'PATCH'
      })
      
      if (!response.ok) throw new Error('Failed to cancel reservation')
      
      const index = reservations.value.findIndex(r => r.id === id)
      if (index !== -1) {
        reservations.value[index].status = 'cancelled'
      }
    } catch (e) {
      console.error('Error cancelling reservation:', e)
      throw e
    }
  }

  // Helper for components that expect synchronous filtering from loaded state
  // Note: Ensure fetchReservations is called before using this
  const getReservationsByDate = (date) => {
    return reservations.value.filter(r => r.date === date && r.status !== 'cancelled')
  }

  const getRevenueStats = async (startDate, endDate) => {
    try {
        const response = await fetch(`/api/reservations/stats?startDate=${startDate}&endDate=${endDate}`)
        if (!response.ok) throw new Error('Failed to fetch stats')
        return await response.json()
    } catch (e) {
        console.error('Error fetching stats:', e)
        throw e
    }
  }

  return {
    reservations,
    isLoading,
    error,
    fetchReservations,
    addReservation,
    cancelReservation,
    getReservationsByDate,
    getRevenueStats
  }
})
