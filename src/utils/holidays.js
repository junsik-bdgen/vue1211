// Simple holiday calculation for 2024-2025
// In a real app, this might use a library or API for lunar calendar conversion

const solarHolidays = {
    '01-01': '신정',
    '03-01': '삼일절',
    '05-05': '어린이날',
    '06-06': '현충일',
    '08-15': '광복절',
    '10-03': '개천절',
    '10-09': '한글날',
    '12-25': '크리스마스'
}

const lunarHolidays2024 = {
    '2024-02-09': '설날 연휴',
    '2024-02-10': '설날',
    '2024-02-11': '설날 연휴',
    '2024-02-12': '대체공휴일',
    '2024-04-10': '국회의원 선거일',
    '2024-05-06': '대체공휴일',
    '2024-05-15': '부처님 오신 날',
    '2024-09-16': '추석 연휴',
    '2024-09-17': '추석',
    '2024-09-18': '추석 연휴'
}

const lunarHolidays2025 = {
    '2025-01-28': '설날 연휴',
    '2025-01-29': '설날',
    '2025-01-30': '설날 연휴',
    '2025-03-03': '대체공휴일', // 3.1절 대체
    '2025-05-05': '어린이날',
    '2025-05-06': '부처님 오신 날', // 대략적
    '2025-10-05': '추석 연휴',
    '2025-10-06': '추석',
    '2025-10-07': '추석 연휴'
}

export const getHoliday = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const monthDay = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // Check solar holidays
    if (solarHolidays[monthDay]) {
        return solarHolidays[monthDay]
    }

    // Check specific lunar/substitute holidays
    if (year === 2024 && lunarHolidays2024[dateStr]) {
        return lunarHolidays2024[dateStr]
    }
    if (year === 2025 && lunarHolidays2025[dateStr]) {
        return lunarHolidays2025[dateStr]
    }

    return null
}
