import type { ParamStat } from './syntheseDataProcessor'

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>
  error?: { message?: string }
}

export const FAMILLE_LABELS: Record<string, string> = {
  nutriments: 'paramètres azotés et phosphorés',
  physico_chimie: 'paramètres physico-chimiques',
  metaux: 'métaux traces',
  microbiologie: 'paramètres microbiologiques',
  autres: 'autres paramètres',
}

export const FAMILLE_HEADINGS: Record<string, string> = {
  nutriments: 'Paramètres azotés et phosphorés',
  physico_chimie: 'Paramètres physico-chimiques',
  metaux: 'Métaux traces',
  microbiologie: 'Microbiologie',
  autres: 'Autres paramètres',
}

export function groupByFamille(stats: ParamStat[]) {
  const groups: Record<string, ParamStat[]> = {}
  for (const param of stats) {
    const famille = param.famille || 'autres'
    if (!groups[famille]) groups[famille] = []
    groups[famille].push(param)
  }
  return groups
}

function buildPrompt(
  famille: string,
  params: ParamStat[],
  clientNom: string,
  milieu: string,
  annee: number
) {
  const label = FAMILLE_LABELS[famille] || famille
  const dataJson = JSON.stringify(params, null, 2)
  return `Tu es un ingénieur environnemental rédigeant un rapport de synthèse de surveillance qualité de l'eau.

Client : ${clientNom}
Type de milieu : ${milieu}
Année : ${annee}
Famille de paramètres : ${label}

Rédige une interprétation technique concise. Pour chaque paramètre :
- Commente le niveau mesuré (champs "moyenne", "min", "max", "n")
- Si un seuil est fourni (champ "seuil" non nul), indique s'il est respecté
- Commente la tendance pluriannuelle si elle est significative (champs "tendance" et "historique")
- Style technique neutre, 2-3 phrases par paramètre

Données :
${dataJson}

Réponds directement avec le texte, sans titre ni introduction.`
}

export async function generateInterpretations(
  apiKey: string,
  groups: Record<string, ParamStat[]>,
  clientNom: string,
  milieu: string,
  annee: number,
  onProgress?: (famille: string) => void
): Promise<Record<string, string>> {
  if (!apiKey) {
    throw new Error('Clé API Anthropic manquante.')
  }

  const results: Record<string, string> = {}

  for (const [famille, params] of Object.entries(groups)) {
    if (onProgress) onProgress(famille)
    
    const prompt = buildPrompt(famille, params, clientNom, milieu, annee)
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (!response.ok) {
        const errData: AnthropicResponse = await response.json().catch(() => ({}))
        throw new Error(errData.error?.message || `Erreur HTTP ${response.status}`)
      }

      const data: AnthropicResponse = await response.json()

      const textContent = (data.content ?? [])
        .filter((block) => block.type === 'text')
        .map((block) => block.text ?? '')
        .join('')
      results[famille] = textContent || 'Aucune réponse générée.'
    } catch (err) {
      console.error(err)
      results[famille] = `Erreur de génération : ${err instanceof Error ? err.message : String(err)}`
    }
  }

  return results
}
