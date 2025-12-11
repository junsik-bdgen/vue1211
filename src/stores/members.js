import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { read, utils, writeFile } from 'xlsx'

export const useMemberStore = defineStore('members', () => {
    const members = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    // Fetch members from API
    const fetchMembers = async () => {
        isLoading.value = true
        error.value = null
        try {
            const response = await fetch('/api/members')
            if (!response.ok) throw new Error('Failed to fetch members')
            const data = await response.json()
            
            // Map API response to frontend model if needed
            // Backend uses snake_case or same names depending on query
            // Our API returns: id, name, club, tel, area, rank_level, points
            members.value = data.map(m => ({
                id: m.id,
                name: m.name,
                club: m.club,
                tel: m.tel,
                area: m.area,
                rank: m.rank_level || m.rank, // Handle both
                points: m.points
            }))
        } catch (e) {
            console.error('Error fetching members:', e)
            error.value = e.message
        } finally {
            isLoading.value = false
        }
    }

    const searchQuery = ref('')
    const selectedClub = ref('All')

    const filteredMembers = computed(() => {
        return members.value.filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                member.club.toLowerCase().includes(searchQuery.value.toLowerCase())
            const matchesClub = selectedClub.value === 'All' || member.club === selectedClub.value
            return matchesSearch && matchesClub
        })
    })

    const uniqueClubs = computed(() => {
        const clubs = new Set(members.value.map(m => m.club))
        return ['All', ...Array.from(clubs)]
    })

    const addMember = async (member) => {
        try {
            const response = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...member,
                    rank: member.rank // API expects rank or rank_level
                })
            })
            
            if (!response.ok) throw new Error('Failed to add member')
            
            const newMember = await response.json()
            
            // Add to local state
            members.value.unshift({
                id: newMember.id,
                name: newMember.name,
                club: newMember.club,
                tel: newMember.tel,
                area: newMember.area,
                rank: newMember.rank || newMember.rank_level,
                points: newMember.points
            })
            return newMember
        } catch (e) {
            console.error('Error adding member:', e)
            throw e
        }
    }

    const updateMember = async (updatedMember) => {
        try {
            const response = await fetch(`/api/members/${updatedMember.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedMember)
            })
            
            if (!response.ok) throw new Error('Failed to update member')
            
            const index = members.value.findIndex(m => m.id === updatedMember.id)
            if (index !== -1) {
                members.value[index] = updatedMember
            }
        } catch (e) {
            console.error('Error updating member:', e)
            throw e
        }
    }

    const deleteMember = async (id) => {
        try {
            const response = await fetch(`/api/members/${id}`, {
                method: 'DELETE'
            })
            
            if (!response.ok) throw new Error('Failed to delete member')
            
            members.value = members.value.filter(m => m.id !== id)
        } catch (e) {
            console.error('Error deleting member:', e)
            throw e
        }
    }

    const getMemberById = (id) => {
        return members.value.find(m => m.id === Number(id))
    }

    const exportToExcel = () => {
        const headers = ['ID', 'Name', 'Club', 'Rank', 'Points', 'Tel', 'Area']
        const data = filteredMembers.value.map(m => ({
            ID: m.id,
            Name: m.name,
            Club: m.club,
            Rank: m.rank,
            Points: m.points,
            Tel: m.tel,
            Area: m.area
        }))

        const ws = utils.json_to_sheet(data, { header: headers })
        const wb = utils.book_new()
        utils.book_append_sheet(wb, ws, "Members")
        writeFile(wb, "members_export.xlsx")
    }

    const importFromExcel = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result)
                    const workbook = read(data, { type: 'array' })
                    const firstSheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[firstSheetName]
                    const jsonData = utils.sheet_to_json(worksheet)

                    const promises = []
                    
                    jsonData.forEach(row => {
                        const name = row.Name || row['이름']
                        const club = row.Club || row['클럽']
                        
                        if (name && club) {
                            promises.push(addMember({
                                name: name,
                                club: club,
                                rank: row.Rank || row['입상여부'] || '비입상',
                                points: row.Points || row['점수'] || 0,
                                tel: row.Tel || row['전화번호'] || '',
                                area: row.Area || row['활동지역'] || ''
                            }))
                        }
                    })
                    
                    await Promise.all(promises)
                    resolve()
                } catch (error) {
                    reject(error)
                }
            }
            reader.onerror = reject
            reader.readAsArrayBuffer(file)
        })
    }

    const downloadTemplate = () => {
        const headers = ['이름', '클럽', '전화번호', '활동지역', '입상여부', '점수']
        const exampleData = [
            {
                '이름': '홍길동',
                '클럽': '테니스클럽',
                '전화번호': '010-0000-0000',
                '활동지역': '서울',
                '입상여부': '비입상',
                '점수': 0
            }
        ]

        const ws = utils.json_to_sheet(exampleData, { header: headers })
        const wb = utils.book_new()
        utils.book_append_sheet(wb, ws, "Template")
        writeFile(wb, "member_template.xlsx")
    }

    return {
        members,
        isLoading,
        error,
        searchQuery,
        selectedClub,
        filteredMembers,
        uniqueClubs,
        fetchMembers,
        exportToExcel,
        importFromExcel,
        downloadTemplate,
        addMember,
        updateMember,
        deleteMember,
        getMemberById
    }
})
