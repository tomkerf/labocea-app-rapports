import type { FillState } from '../components/ui/Section'

/**
 * Détermine si une valeur est "remplie" :
 * - chaîne non vide après trim
 * - nombre fini (pas NaN)
 * - booléen true (false = "non" choisi mais info présente, on compte aussi true OU false explicite ailleurs)
 * - objet/array : récursif (au moins un champ rempli)
 */
function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (typeof v === 'number') return Number.isFinite(v)
  if (typeof v === 'boolean') return v // false ne compte pas comme une réponse explicite
  if (Array.isArray(v)) return v.some((x) => isFilled(x))
  if (typeof v === 'object') {
    return Object.values(v as Record<string, unknown>).some((x) => isFilled(x))
  }
  return false
}

/**
 * Compte les "feuilles" remplies dans un objet (récursif).
 */
function countLeaves(obj: unknown): { filled: number; total: number } {
  if (obj === null || obj === undefined) return { filled: 0, total: 1 }
  if (
    typeof obj === 'string' ||
    typeof obj === 'number' ||
    typeof obj === 'boolean'
  ) {
    return { filled: isFilled(obj) ? 1 : 0, total: 1 }
  }
  if (Array.isArray(obj)) {
    return obj.reduce(
      (acc, x) => {
        const r = countLeaves(x)
        return { filled: acc.filled + r.filled, total: acc.total + r.total }
      },
      { filled: 0, total: 0 },
    )
  }
  if (typeof obj === 'object') {
    return Object.values(obj as Record<string, unknown>).reduce(
      (acc: { filled: number; total: number }, x) => {
        const r = countLeaves(x)
        return { filled: acc.filled + r.filled, total: acc.total + r.total }
      },
      { filled: 0, total: 0 },
    )
  }
  return { filled: 0, total: 0 }
}

export function fillStateOf(obj: unknown): FillState {
  const { filled, total } = countLeaves(obj)
  if (total === 0 || filled === 0) return 'empty'
  if (filled >= total) return 'full'
  return 'partial'
}

/**
 * Variante : on considère "full" dès qu'au moins X champs sont remplis (utile
 * pour des sections où tous les champs ne sont pas obligatoires).
 */
export function fillStateLoose(obj: unknown, minFilled = 1): FillState {
  const { filled } = countLeaves(obj)
  if (filled === 0) return 'empty'
  if (filled >= minFilled) return 'full'
  return 'partial'
}
