import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface FloatingPosition {
  top: number
  left: number
  width: number
}

/**
 * Minimum gap kept between a floating panel and the viewport edge, in px.
 * Matches the `calc(100vw - 1.5rem)` / `min(320px, calc(100vw - 1.5rem))`
 * max-width rules in globals.css (.calendar-panel, .select-panel) — 12px on
 * each side adds up to the same 1.5rem (24px) total budget, so the CSS
 * sizing and this JS positioning agree on how much edge margin to leave.
 */
const VIEWPORT_GUTTER = 12

/** Vertical gap kept between the trigger and the panel, below or (when flipped) above it. */
const PANEL_GAP = 6

/**
 * Tracks a trigger element's on-screen position so a portaled panel (rendered
 * into document.body) can anchor to it — needed because these panels can sit
 * inside a Modal's `overflow-y-auto` body (or a scrollable dashboard content
 * area), which would otherwise clip them.
 *
 * Also clamps the panel horizontally inside the viewport (minus a small
 * gutter) and flips it above the trigger when there's no room below but more
 * room above, so panels near a viewport edge stay fully on-screen.
 *
 * The panel isn't in the DOM yet on the very first `update()` of an open
 * cycle — consumers only portal it once `position` is non-null — so on that
 * first pass `panelRef.current` is null and the panel's real size is
 * unknown. We fall back to the trigger's own width (and skip the flip check)
 * for that pass, then a `useLayoutEffect` that re-runs `update()` after every
 * commit (while open) picks up the now-mounted panel's real size and
 * re-clamps, synchronously, before the browser paints. The functional
 * `setPosition` update returns the previous object reference once a
 * recomputation matches the previous result, so React bails out of
 * re-rendering and this settles after exactly one corrective pass instead of
 * looping.
 */
export function useFloatingPanel(open: boolean) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<FloatingPosition | null>(null)

  const update = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const triggerRect = el.getBoundingClientRect()
    // Null on the first pass of an open cycle, before the panel has mounted.
    const panelRect = panelRef.current?.getBoundingClientRect() ?? null

    const panelWidth = panelRect ? panelRect.width : triggerRect.width
    const maxLeft = window.innerWidth - VIEWPORT_GUTTER - panelWidth
    const left = Math.min(
      Math.max(triggerRect.left, VIEWPORT_GUTTER),
      Math.max(maxLeft, VIEWPORT_GUTTER),
    )

    let top = triggerRect.bottom + PANEL_GAP
    if (panelRect) {
      const roomBelow = window.innerHeight - VIEWPORT_GUTTER - top
      const roomAbove = triggerRect.top - VIEWPORT_GUTTER
      const fitsBelow = panelRect.height <= roomBelow
      if (!fitsBelow && roomAbove > roomBelow) {
        top = Math.max(VIEWPORT_GUTTER, triggerRect.top - panelRect.height - PANEL_GAP)
      }
    }
    // else: panel not mounted yet — keep the simple below-trigger placement;
    // the follow-up pass (once mounted) flips it above if there's no room.

    setPosition((prev) => {
      if (prev && prev.top === top && prev.left === left && prev.width === triggerRect.width) {
        return prev
      }
      return { top, left, width: triggerRect.width }
    })
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

  // Re-measure after every commit while open: the first commit of an open
  // cycle has no panel in the DOM yet (see `update` above), so this picks up
  // the panel's real size as soon as it mounts and re-clamps before paint.
  // Once a pass's result matches the previous one, `update`'s bail-out means
  // no new state is set, so this effect simply stops re-running on its own —
  // it does not loop indefinitely.
  useLayoutEffect(() => {
    if (!open) return
    update()
  })

  return { triggerRef, panelRef, position }
}

/**
 * Every portaled panel's root carries this attribute. A panel can host other
 * panels (e.g. the hour/minute/AM-PM <Select>s inside <DatePicker>'s time
 * section) whose own dropdowns portal to document.body as siblings, not DOM
 * descendants of the outer panel — so plain ref.contains() would see a click
 * on a nested dropdown's option as "outside" and close the outer panel too.
 * Exempting clicks anywhere inside a marked panel fixes that regardless of
 * nesting depth.
 */
export const FLOATING_PANEL_ATTR = 'data-floating-panel'

/**
 * Open floating panels, most-recently-opened last — lets Escape close only
 * the topmost one instead of cascading through every ancestor picker at once.
 */
const openStack: Array<() => void> = []

/** Closes an open floating panel on an outside pointer-down or Escape. */
export function useCloseOnOutsideOrEscape(
  open: boolean,
  refs: Array<React.RefObject<HTMLElement | null>>,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return

    openStack.push(onClose)

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (refs.some((ref) => ref.current?.contains(target))) return
      if (target instanceof Element && target.closest(`[${FLOATING_PANEL_ATTR}]`)) return
      onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openStack[openStack.length - 1] === onClose) onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      const index = openStack.lastIndexOf(onClose)
      if (index !== -1) openStack.splice(index, 1)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose])
}
