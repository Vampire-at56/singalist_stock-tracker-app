"use client"

import { useCallback, useEffect, useRef } from "react"

// Returns a stable debounced callback that always calls the latest `fn`.
export function useDebounce<T extends (...args: unknown[]) => void>(fn: T, delayMs: number) {
  const fnRef = useRef(fn)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => fnRef.current(...args), delayMs)
    },
    [delayMs]
  )
}
