import { useCallback, useEffect, useRef, useState } from 'react'

export interface FloatingPosition {
  top: number
  left: number
  width: number
}

/**
 * Tracks a trigger element's on-screen position so a portaled panel (rendered
 * into document.body) can anchor to it — needed because these panels live
 * inside Modal's `overflow-y-auto` body, which would otherwise clip them.
 */
export function useFloatingPanel(open: boolean) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<FloatingPosition | null>(null)

  const update = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPosition({ top: rect.bottom + 6, left: rect.left, width: rect.width })
  }, [])

  useEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, update])

  return { triggerRef, panelRef, position }
}

/** Closes an open floating panel on an outside pointer-down or Escape. */
export function useCloseOnOutsideOrEscape(
  open: boolean,
  refs: Array<React.RefObject<HTMLElement | null>>,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (refs.some((ref) => ref.current?.contains(target))) return
      onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose])
}
