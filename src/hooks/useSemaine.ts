'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useMemo, useCallback } from 'react'
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  parseISO,
  format,
  isValid
} from 'date-fns'

const SEARCH_PARAM_KEY = 'semaine'

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 }) // Monday start
}

function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 }) // Sunday end
}

export function useSemaine() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const semaineCourante = useMemo(() => {
    const semaineParam = searchParams.get(SEARCH_PARAM_KEY)

    if (semaineParam) {
      const parsed = parseISO(semaineParam)
      if (isValid(parsed)) {
        return getWeekStart(parsed)
      }
    }

    return getWeekStart(new Date())
  }, [searchParams])

  const finSemaine = useMemo(() => {
    return getWeekEnd(semaineCourante)
  }, [semaineCourante])

  const joursdelaSemaine = useMemo(() => {
    return eachDayOfInterval({
      start: semaineCourante,
      end: finSemaine
    })
  }, [semaineCourante, finSemaine])

  const updateSemaine = useCallback((date: Date) => {
    const weekStart = getWeekStart(date)
    const params = new URLSearchParams(searchParams.toString())
    params.set(SEARCH_PARAM_KEY, format(weekStart, 'yyyy-MM-dd'))
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, router, pathname])

  const allerSemainePrecedente = useCallback(() => {
    updateSemaine(subWeeks(semaineCourante, 1))
  }, [semaineCourante, updateSemaine])

  const allerSemaineSuivante = useCallback(() => {
    updateSemaine(addWeeks(semaineCourante, 1))
  }, [semaineCourante, updateSemaine])

  const allerADate = useCallback((date: Date) => {
    updateSemaine(date)
  }, [updateSemaine])

  const allerAujourdhui = useCallback(() => {
    updateSemaine(new Date())
  }, [updateSemaine])

  return {
    semaineCourante,
    finSemaine,
    joursdelaSemaine,
    allerSemainePrecedente,
    allerSemaineSuivante,
    allerADate,
    allerAujourdhui
  }
}
