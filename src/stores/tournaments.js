import { defineStore } from 'pinia'
import { ref } from 'vue'
import { read, utils, writeFile } from 'xlsx'

export const useTournamentStore = defineStore('tournaments', () => {
    const tournaments = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    const fetchTournaments = async () => {
        isLoading.value = true
        try {
            const response = await fetch('/api/tournaments')
            if (!response.ok) throw new Error('Failed to fetch tournaments')
            tournaments.value = await response.json()
        } catch (e) {
            console.error('Error fetching tournaments:', e)
            error.value = e.message
        } finally {
            isLoading.value = false
        }
    }

    const addTournament = async (tournamentData) => {
        try {
            const response = await fetch('/api/tournaments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tournamentData)
            })
            if (!response.ok) throw new Error('Failed to add tournament')
            
            const newTournament = await response.json()
            tournaments.value.push(newTournament)
            return newTournament.id
        } catch (e) {
            console.error('Error adding tournament:', e)
            throw e
        }
    }

    const deleteTournament = async (id) => {
        try {
            const response = await fetch(`/api/tournaments/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete tournament')
            
            tournaments.value = tournaments.value.filter(t => t.id !== id)
        } catch (e) {
            console.error('Error deleting tournament:', e)
            throw e
        }
    }

    const registerForTournament = async (tournamentId, formData) => {
        try {
            console.log('📝 대회 신청 시작:', { tournamentId, formData })
            
            const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            
            console.log('📡 서버 응답:', { status: response.status, statusText: response.statusText, ok: response.ok })
            
            if (!response.ok) {
                const errorData = await response.json()
                console.error('❌ 서버 에러:', errorData)
                throw new Error(errorData.error || 'Failed to register')
            }
            
            const newPlayer = await response.json()
            console.log('✅ 신청 성공:', newPlayer)
            
            const tournament = tournaments.value.find(t => t.id === tournamentId)
            if (tournament) {
                if (!tournament.players) tournament.players = []
                tournament.players.push(newPlayer)
                tournament.participants++
                console.log('✅ 로컬 상태 업데이트 완료')
            }
            return true
        } catch (e) {
            console.error('❌ 대회 신청 오류:', e)
            throw e
        }
    }

    const removePlayer = (tournamentId, playerId) => {
        const tournament = tournaments.value.find(t => t.id === tournamentId)
        if (tournament && tournament.players) {
            const index = tournament.players.findIndex(p => p.id === playerId)
            if (index !== -1) {
                tournament.players.splice(index, 1)
                tournament.participants--
            }
        }
    }

    const updatePlayer = (tournamentId, updatedPlayer) => {
        const tournament = tournaments.value.find(t => t.id === tournamentId)
        if (tournament && tournament.players) {
            const index = tournament.players.findIndex(p => p.id === updatedPlayer.id)
            if (index !== -1) {
                tournament.players[index] = { ...updatedPlayer }
            }
        }
    }

    const downloadTemplate = () => {
        const headers = [
            '선수 성명', '선수 클럽명', '선수 입상여부', '선수 점수',
            '파트너 성명', '파트너 클럽', '파트너 입상여부', '파트너 점수',
            '입금자 전화번호'
        ]
        const exampleData = [
            {
                '선수 성명': '홍길동',
                '선수 클럽명': '테니스클럽',
                '선수 입상여부': '비입상',
                '선수 점수': 1200,
                '파트너 성명': '김철수',
                '파트너 클럽': '스매시',
                '파트너 입상여부': '우승',
                '파트너 점수': 1500,
                '입금자 전화번호': '010-1234-5678'
            }
        ]

        const ws = utils.json_to_sheet(exampleData, { header: headers })
        const wb = utils.book_new()
        utils.book_append_sheet(wb, ws, "Registration_Template")
        writeFile(wb, "tournament_registration_template.xlsx")
    }

    const importFromExcel = async (tournamentId, file) => {
        console.log('📊 엑셀 일괄 등록 시작:', { tournamentId, fileName: file.name })
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = async (e) => {
                try {
                    console.log('📖 파일 읽기 완료, 데이터 파싱 중...')
                    const data = new Uint8Array(e.target.result)
                    const workbook = read(data, { type: 'array' })
                    const firstSheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[firstSheetName]
                    const jsonData = utils.sheet_to_json(worksheet)

                    console.log('📋 엑셀 데이터:', {
                        sheetName: firstSheetName,
                        rowCount: jsonData.length,
                        firstRow: jsonData[0]
                    })

                    const tournament = tournaments.value.find(t => t.id === tournamentId)
                    if (!tournament) {
                        console.error('❌ 대회를 찾을 수 없음:', tournamentId)
                        reject(new Error('Tournament not found'))
                        return
                    }

                    console.log('🎾 대회 정보:', {
                        id: tournament.id,
                        title: tournament.title,
                        currentParticipants: tournament.participants,
                        maxParticipants: tournament.maxParticipants
                    })

                    let addedCount = 0
                    let skippedCount = 0
                    let errorCount = 0
                    
                    console.log('\n⏳ 순차적 등록 시작 (0.1초 간격)...\n')
                    
                    // 순차적으로 처리 (0.1초 간격)
                    for (let index = 0; index < jsonData.length; index++) {
                        const row = jsonData[index]
                        console.log(`\n📝 Row ${index + 1}/${jsonData.length}:`, row)
                        
                        // 대회 정원 확인 로직 제거 (일괄 등록 시 정원 초과 허용)
                        // if (tournament.participants >= tournament.maxParticipants) { ... }

                        const player = {
                            playerName: row['선수 성명'],
                            playerClub: row['선수 클럽명'] || '',
                            playerRank: row['선수 입상여부'] || '비입상',
                            playerPoint: row['선수 점수'] || 0,
                            partnerName: row['파트너 성명'] || '',
                            partnerClub: row['파트너 클럽'] || '',
                            partnerRank: row['파트너 입상여부'] || '비입상',
                            partnerPoint: row['파트너 점수'] || 0,
                            phone: row['입금자 전화번호'],
                            force: true // 정원 초과 시에도 강제 등록
                        }

                        console.log(`   매핑된 데이터:`, player)

                        if (!player.playerName || !player.phone) {
                            console.warn(`⚠️  Row ${index + 1}: 필수 항목 누락 (선수 성명 또는 전화번호), 건너뜀`)
                            skippedCount++
                            continue
                        }

                        console.log(`✅ Row ${index + 1}: 유효성 검사 통과, 등록 시도...`)
                        
                        try {
                            // 순차적으로 등록
                            await registerForTournament(tournamentId, player)
                            addedCount++
                            console.log(`✅ Row ${index + 1}: 등록 성공 (총 ${addedCount}개)`)
                            
                            // 0.1초 대기 (마지막 항목은 대기하지 않음)
                            if (index < jsonData.length - 1) {
                                console.log(`   ⏱️  0.1초 대기 중...`)
                                await new Promise(resolve => setTimeout(resolve, 100))
                            }
                        } catch (err) {
                            errorCount++
                            console.error(`❌ Row ${index + 1}: 등록 실패:`, err.message)
                            // 에러가 발생해도 계속 진행
                        }
                    }
                    
                    console.log('\n========================================')
                    console.log('📊 엑셀 일괄 등록 완료')
                    console.log('========================================')
                    console.log(`✅ 성공: ${addedCount}개`)
                    console.log(`⚠️  건너뜀: ${skippedCount}개`)
                    console.log(`❌ 실패: ${errorCount}개`)
                    console.log(`📋 총 처리: ${jsonData.length}개`)
                    console.log(`⏱️  소요 시간: 약 ${(jsonData.length * 0.1).toFixed(1)}초`)
                    console.log('========================================\n')
                    
                    resolve(addedCount)
                } catch (error) {
                    console.error('❌ 엑셀 파싱 오류:', error)
                    reject(error)
                }
            }
            reader.onerror = (error) => {
                console.error('❌ 파일 읽기 오류:', error)
                reject(error)
            }
            reader.readAsArrayBuffer(file)
        })
    }

    const exportToExcel = (tournamentId) => {
        const tournament = tournaments.value.find(t => t.id === tournamentId)
        if (!tournament || !tournament.players) return

        const headers = [
            '선수 성명', '선수 클럽명', '선수 입상여부', '선수 점수',
            '파트너 성명', '파트너 클럽', '파트너 입상여부', '파트너 점수',
            '입금자 전화번호'
        ]
        
        const data = tournament.players.map(p => ({
            '선수 성명': p.playerName,
            '선수 클럽명': p.playerClub,
            '선수 입상여부': p.playerRank,
            '선수 점수': p.playerPoint,
            '파트너 성명': p.partnerName,
            '파트너 클럽': p.partnerClub,
            '파트너 입상여부': p.partnerRank,
            '파트너 점수': p.partnerPoint,
            '입금자 전화번호': p.phone
        }))

        const ws = utils.json_to_sheet(data, { header: headers })
        const wb = utils.book_new()
        utils.book_append_sheet(wb, ws, "Participants")
        writeFile(wb, `${tournament.title}_participants.xlsx`)
    }

    const fetchMatches = async (tournamentId) => {
        try {
            const response = await fetch(`/api/tournaments/${tournamentId}/matches`)
            if (!response.ok) throw new Error('Failed to fetch matches')
            return await response.json()
        } catch (e) {
            console.error('Error fetching matches:', e)
            throw e
        }
    }

    const saveMatches = async (tournamentId, matches) => {
        try {
            const response = await fetch(`/api/tournaments/${tournamentId}/matches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matches })
            })
            if (!response.ok) throw new Error('Failed to save matches')
            return await response.json()
        } catch (e) {
            console.error('Error saving matches:', e)
            throw e
        }
    }

    const updateMatch = async (tournamentId, matchId, matchData) => {
        try {
            const response = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(matchData)
            })
            if (!response.ok) throw new Error('Failed to update match')
            return await response.json()
        } catch (e) {
            console.error('Error updating match:', e)
            throw e
        }
    }

    const saveSeeding = async (tournamentId, seededTeams, matches, seedingMethod = 'points') => {
        try {
            console.log('💾 Saving seeding to DB...', {
                tournamentId,
                seedingMethod,
                seededTeamsCount: seededTeams.length,
                matchesCount: matches.length
            })

            const response = await fetch(`/api/tournaments/${tournamentId}/seeding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    seededTeams,
                    matches,
                    seedingMethod
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to save seeding')
            }

            const result = await response.json()
            console.log('✅ Seeding saved successfully:', result)
            
            return result
        } catch (e) {
            console.error('❌ Error saving seeding:', e)
            throw e
        }
    }

    return {
        tournaments,
        isLoading,
        error,
        fetchTournaments,
        addTournament,
        deleteTournament,
        registerForTournament,
        removePlayer,
        updatePlayer,
        downloadTemplate,
        importFromExcel,
        exportToExcel,
        fetchMatches,
        saveMatches,
        updateMatch,
        saveSeeding
    }
})
