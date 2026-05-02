/**
 * Formate une date ISO en chaîne courte adaptée à l'affichage en liste.
 * - aujourd'hui : "aujourd'hui 14h32"
 * - hier : "hier 09h12"
 * - cette semaine : "lundi 14h32" (jour de la semaine)
 * - cette année : "30 avril"
 * - sinon : "30/04/2025"
 */
export function relativeDate(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'

  const now = new Date()

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  const heure = `${hh}h${mm}`

  if (sameDay(d, now)) return `aujourd'hui ${heure}`
  if (sameDay(d, yesterday)) return `hier ${heure}`

  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)

  // Cette semaine (≤ 6 jours en arrière) → jour de la semaine
  if (diffDays >= 0 && diffDays < 6) {
    const jour = d.toLocaleDateString('fr-FR', { weekday: 'long' })
    return `${jour} ${heure}`
  }

  // Cette année → "30 avril"
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  }

  // Autre année → DD/MM/YYYY
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
