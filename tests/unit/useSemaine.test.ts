import { describe, it, expect } from 'vitest'
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  format,
  parseISO
} from 'date-fns'
import { fr } from 'date-fns/locale'

// Test the date calculation logic used in useSemaine hook
// We test the pure functions since the hook uses Next.js router

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 })
}

function getWeekDays(weekStart: Date, weekEnd: Date): Date[] {
  return eachDayOfInterval({ start: weekStart, end: weekEnd })
}

describe('Week Calculation Logic', () => {
  describe('getWeekStart', () => {
    it('should return Monday for any day in a week', () => {
      // Test with Wednesday January 8, 2026
      const wednesday = new Date(2026, 0, 8) // Month is 0-indexed
      const weekStart = getWeekStart(wednesday)

      expect(weekStart.getDay()).toBe(1) // Monday
      expect(weekStart.getDate()).toBe(5) // January 5, 2026
    })

    it('should return the same Monday if already Monday', () => {
      const monday = new Date(2026, 0, 5)
      const weekStart = getWeekStart(monday)

      expect(weekStart.getDate()).toBe(5)
    })

    it('should return previous Monday for Sunday', () => {
      const sunday = new Date(2026, 0, 11) // Sunday January 11
      const weekStart = getWeekStart(sunday)

      expect(weekStart.getDay()).toBe(1)
      expect(weekStart.getDate()).toBe(5) // January 5, 2026
    })
  })

  describe('getWeekEnd', () => {
    it('should return Sunday for any day in a week', () => {
      const wednesday = new Date(2026, 0, 8)
      const weekEnd = getWeekEnd(wednesday)

      expect(weekEnd.getDay()).toBe(0) // Sunday
      expect(weekEnd.getDate()).toBe(11) // January 11, 2026
    })
  })

  describe('getWeekDays', () => {
    it('should return exactly 7 days', () => {
      const weekStart = getWeekStart(new Date(2026, 0, 8))
      const weekEnd = getWeekEnd(new Date(2026, 0, 8))
      const days = getWeekDays(weekStart, weekEnd)

      expect(days).toHaveLength(7)
    })

    it('should return days from Monday to Sunday in order', () => {
      const weekStart = getWeekStart(new Date(2026, 0, 8))
      const weekEnd = getWeekEnd(new Date(2026, 0, 8))
      const days = getWeekDays(weekStart, weekEnd)

      // Check day names (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      expect(days[0].getDay()).toBe(1) // Monday
      expect(days[1].getDay()).toBe(2) // Tuesday
      expect(days[2].getDay()).toBe(3) // Wednesday
      expect(days[3].getDay()).toBe(4) // Thursday
      expect(days[4].getDay()).toBe(5) // Friday
      expect(days[5].getDay()).toBe(6) // Saturday
      expect(days[6].getDay()).toBe(0) // Sunday
    })
  })

  describe('Week Navigation', () => {
    it('should navigate to previous week correctly', () => {
      const currentWeekStart = new Date(2026, 0, 5) // Monday Jan 5
      const previousWeekStart = subWeeks(currentWeekStart, 1)

      expect(previousWeekStart.getDate()).toBe(29) // December 29, 2025
      expect(previousWeekStart.getMonth()).toBe(11) // December (0-indexed)
      expect(previousWeekStart.getFullYear()).toBe(2025)
    })

    it('should navigate to next week correctly', () => {
      const currentWeekStart = new Date(2026, 0, 5) // Monday Jan 5
      const nextWeekStart = addWeeks(currentWeekStart, 1)

      expect(nextWeekStart.getDate()).toBe(12) // January 12
      expect(nextWeekStart.getMonth()).toBe(0) // January
    })
  })

  describe('URL Parameter Parsing', () => {
    it('should parse valid ISO date string from URL', () => {
      const urlParam = '2026-01-05'
      const parsed = parseISO(urlParam)

      expect(parsed.getFullYear()).toBe(2026)
      expect(parsed.getMonth()).toBe(0) // January
      expect(parsed.getDate()).toBe(5)
    })

    it('should format date for URL parameter', () => {
      const date = new Date(2026, 0, 5)
      const formatted = format(date, 'yyyy-MM-dd')

      expect(formatted).toBe('2026-01-05')
    })
  })

  describe('Week Range Display', () => {
    it('should format range within same month', () => {
      const weekStart = new Date(2026, 0, 5) // Jan 5
      const weekEnd = new Date(2026, 0, 11) // Jan 11

      const debut = format(weekStart, 'd', { locale: fr })
      const fin = format(weekEnd, 'd MMM yyyy', { locale: fr })

      expect(`${debut} - ${fin}`).toBe('5 - 11 janv. 2026')
    })

    it('should format range across months', () => {
      const weekStart = new Date(2025, 11, 29) // Dec 29
      const weekEnd = new Date(2026, 0, 4) // Jan 4

      // When months differ, show month for both
      const debut = format(weekStart, 'd MMM', { locale: fr })
      const fin = format(weekEnd, 'd MMM yyyy', { locale: fr })

      expect(`${debut} - ${fin}`).toBe('29 déc. - 4 janv. 2026')
    })
  })

  describe('Edge Cases', () => {
    it('should handle year boundary correctly', () => {
      const newYearDate = new Date(2026, 0, 1) // January 1, 2026 (Thursday)
      const weekStart = getWeekStart(newYearDate)

      // Week containing Jan 1, 2026 starts on Monday Dec 29, 2025
      expect(weekStart.getFullYear()).toBe(2025)
      expect(weekStart.getMonth()).toBe(11) // December
      expect(weekStart.getDate()).toBe(29)
    })

    it('should handle leap year', () => {
      // 2028 is a leap year
      const leapDay = new Date(2028, 1, 29) // February 29, 2028
      const weekStart = getWeekStart(leapDay)

      expect(weekStart.getDay()).toBe(1) // Monday
    })
  })
})
