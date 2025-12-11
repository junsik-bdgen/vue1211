import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePhotoStore = defineStore('photos', () => {
    const albums = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    const fetchAlbums = async () => {
        isLoading.value = true
        try {
            const response = await fetch('/api/photos')
            if (!response.ok) throw new Error('Failed to fetch albums')
            albums.value = await response.json()
        } catch (e) {
            console.error('Error fetching albums:', e)
            error.value = e.message
        } finally {
            isLoading.value = false
        }
    }

    const addAlbum = async (album) => {
        try {
            const response = await fetch('/api/photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: '',
                    ...album
                })
            })
            if (!response.ok) throw new Error('Failed to add album')
            
            const newAlbum = await response.json()
            // Ensure photos array exists
            if (!newAlbum.photos) newAlbum.photos = []
            
            albums.value.unshift(newAlbum)
            return newAlbum.id
        } catch (e) {
            console.error('Error adding album:', e)
            throw e
        }
    }

    const updateAlbum = async (id, updates) => {
        // TODO: Implement backend API for updating album details
        const index = albums.value.findIndex(a => a.id === id)
        if (index !== -1) {
            albums.value[index] = { ...albums.value[index], ...updates }
        }
    }

    const deleteAlbum = async (id) => {
        try {
            const response = await fetch(`/api/photos/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete album')
            
            albums.value = albums.value.filter(a => a.id !== id)
        } catch (e) {
            console.error('Error deleting album:', e)
            throw e
        }
    }

    const addPhoto = async (albumId, photo) => {
        return addPhotos(albumId, [photo])
    }

    const addPhotos = async (albumId, newPhotos) => {
        try {
            const response = await fetch(`/api/photos/${albumId}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photos: newPhotos })
            })
            
            if (!response.ok) throw new Error('Failed to add photos')
            
            const addedPhotos = await response.json()
            
            const album = albums.value.find(a => a.id === Number(albumId))
            if (album) {
                if (!album.photos) album.photos = []
                album.photos.unshift(...addedPhotos)
            }
        } catch (e) {
            console.error('Error adding photos:', e)
            throw e
        }
    }

    const deletePhoto = async (albumId, photoId) => {
        try {
            const response = await fetch(`/api/photos/${albumId}/photos/${photoId}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete photo')
            
            const album = albums.value.find(a => a.id === Number(albumId))
            if (album && album.photos) {
                album.photos = album.photos.filter(p => p.id !== photoId)
            }
        } catch (e) {
            console.error('Error deleting photo:', e)
            throw e
        }
    }

    const getAlbumById = (id) => {
        return albums.value.find(a => a.id === Number(id))
    }

    return {
        albums,
        isLoading,
        error,
        fetchAlbums,
        addAlbum,
        updateAlbum,
        deleteAlbum,
        addPhoto,
        addPhotos,
        deletePhoto,
        getAlbumById
    }
})
