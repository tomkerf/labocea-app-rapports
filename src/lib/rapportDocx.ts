/**
 * Génération du rapport d'intervention Word (.docx)
 * Combine les données de la fiche terrain + les résultats DiPLABO.
 */
import {
  Document, Header, Footer, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType,
  PageBreak, PageNumber, ShadingType, BorderStyle,
  // PageNumber est un enum (CURRENT, TOTAL_PAGES…) utilisé dans TextRun.children
} from 'docx'
import { saveAs } from 'file-saver'
import type { Intervention } from '../schemas/intervention'
import type { ParsedDiplabo } from './parseDiplabo'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VleEntry {
  /** VLE de concentration (mg/L) */
  vle: string
  /** Unité de la VLE concentration */
  unite: string
  /** VLE de charge (kg/j) — optionnel, PAUTO uniquement */
  vleCharge?: string
}

export interface RapportOptions {
  numRapport: string
  intervention: Intervention
  diplabo: ParsedDiplabo
  vle: Record<string, VleEntry>
  /** Rédacteur (nom complet, ex : "T. Kerfendal") */
  redacteur: string
  /** Volume rejeté en m³ pour le calcul des charges (PAUTO uniquement) */
  volumeM3?: number
}

// ─── Couleurs ─────────────────────────────────────────────────────────────────

const BLEU_LABOCEA   = '003C7A'
const BLEU_CLAIR     = 'E8F0F8'   // alternance lignes tableau
const GRIS_EN_TETE   = 'D6E4F0'
const GRIS_BORDURE   = 'BBBBBB'
const BLANC          = 'FFFFFF'
const ROUGE_DEPASSEMENT = 'CC0000'

// ─── Helpers texte ────────────────────────────────────────────────────────────

function txt(
  text: string,
  opts?: { bold?: boolean; size?: number; color?: string; italic?: boolean }
) {
  return new TextRun({
    text,
    bold: opts?.bold,
    size: opts?.size ?? 20,
    color: opts?.color,
    italics: opts?.italic,
    font: 'Calibri',
  })
}

function para(
  children: TextRun[],
  opts?: { alignment?: typeof AlignmentType[keyof typeof AlignmentType]; spacing?: number }
) {
  return new Paragraph({
    children,
    alignment: opts?.alignment,
    spacing: { after: opts?.spacing ?? 120 },
  })
}

function heading1(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 140 },
  })
}

function heading2(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
  })
}

function emptyLine() {
  return new Paragraph({ children: [], spacing: { after: 80 } })
}

function placeholder(text: string) {
  return para([txt(`[${text}]`, { italic: true, color: '999999' })])
}

// ─── Helpers tableau ──────────────────────────────────────────────────────────

/** Bordures fines uniformes pour toutes les cellules */
const CELL_BORDERS = {
  top:    { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
  left:   { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
  right:  { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
}

function cell(
  text: string,
  opts?: {
    bold?: boolean
    shading?: string
    color?: string
    align?: typeof AlignmentType[keyof typeof AlignmentType]
    size?: number
  }
) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [txt(text, { bold: opts?.bold, color: opts?.color, size: opts?.size ?? 18 })],
        alignment: opts?.align ?? AlignmentType.CENTER,
        spacing: { after: 0 },
      }),
    ],
    shading: opts?.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    verticalAlign: 'center' as const,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    borders: CELL_BORDERS,
  })
}

// ─── Détection dépassement VLE ────────────────────────────────────────────────

function depasseVle(resultat: string, vleStr: string): boolean {
  if (!vleStr || !resultat || resultat === '—') return false
  const r = parseFloat(resultat.replace('<', '').replace(',', '.'))
  const v = parseFloat(vleStr.replace(',', '.'))
  if (isNaN(r) || isNaN(v)) return false
  if (resultat.startsWith('<')) return false
  return r > v
}

// ─── Tableau résultats ────────────────────────────────────────────────────────

function buildTableauResultats(
  diplabo: ParsedDiplabo,
  vle: Record<string, VleEntry>
): Table {
  const { points, lignes } = diplabo
  const hasVle = Object.keys(vle).length > 0

  // Largeurs : Paramètres large + Unité étroite + colonnes résultats égales + VLE
  const COL_PARAMS = 2500
  const COL_UNITE  = 900
  const remaining  = 9000 - COL_PARAMS - COL_UNITE
  const extraCols  = points.length + (hasVle ? 1 : 0)
  const COL_DATA   = Math.floor(remaining / extraCols)
  const colWidths  = [COL_PARAMS, COL_UNITE, ...Array(extraCols).fill(COL_DATA)]

  // En-tête
  const headerCells = [
    cell('Paramètres', { bold: true, shading: BLEU_LABOCEA, color: BLANC, align: AlignmentType.LEFT }),
    cell('Unité',      { bold: true, shading: BLEU_LABOCEA, color: BLANC }),
    ...points.map((p) => cell(p, { bold: true, shading: BLEU_LABOCEA, color: BLANC, size: 16 })),
    ...(hasVle ? [cell('VLE', { bold: true, shading: BLEU_LABOCEA, color: BLANC })] : []),
  ]
  const headerRow = new TableRow({ children: headerCells, tableHeader: true })

  // Lignes de données avec alternance de couleur
  const dataRows = lignes.map((ligne, idx) => {
    const vleEntry = vle[ligne.parametre]
    const vleStr   = vleEntry?.vle ?? ''
    const rowBg    = idx % 2 === 0 ? BLANC : BLEU_CLAIR

    const dataCells = [
      cell(ligne.parametre, { shading: rowBg, align: AlignmentType.LEFT }),
      cell(ligne.unite,     { shading: rowBg }),
      ...points.map((p) => {
        const r = ligne.resultats[p] ?? '—'
        const depasse = depasseVle(r, vleStr)
        return cell(r, {
          shading: rowBg,
          color:   depasse ? ROUGE_DEPASSEMENT : undefined,
          bold:    depasse,
        })
      }),
      ...(hasVle ? [cell(vleStr || '—', { shading: rowBg })] : []),
    ]

    return new TableRow({ children: dataCells })
  })

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: colWidths,
  })
}

// ─── En-tête / Pied de page (pages intérieures) ───────────────────────────────

function buildHeader(numRapport: string, client: string): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          txt('LABOCEA', { bold: true, color: BLEU_LABOCEA, size: 18 }),
          txt('   —   ', { color: '999999', size: 18 }),
          txt(`Rapport n° ${numRapport}`, { size: 18 }),
          txt('   |   ', { color: '999999', size: 18 }),
          txt(client, { size: 18, color: '555555' }),
        ],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
        },
        spacing: { after: 80 },
      }),
    ],
  })
}

function buildFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: 'Page ', size: 16, color: '888888', font: 'Calibri' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888', font: 'Calibri' }),
          new TextRun({ text: ' / ', size: 16, color: '888888', font: 'Calibri' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '888888', font: 'Calibri' }),
        ],
        alignment: AlignmentType.CENTER,
        border: {
          top: { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
        },
        spacing: { before: 80 },
      }),
    ],
  })
}

// ─── Section II — Description campagne ───────────────────────────────────────

function buildSectionII(intervention: Intervention): Paragraph[] {
  const typeFiche = intervention.fiche?.typeFiche
  const fiche = intervention.fiche?.data as Record<string, unknown> | undefined

  const paras: Paragraph[] = [heading1('II. Description de la campagne de mesure')]

  if (typeFiche === 'PAUTO') {
    const loc = fiche?.localisation as Record<string, unknown> | undefined
    const ech = fiche?.echantillonneur as Record<string, unknown> | undefined
    const vol = fiche?.volumeGlobal as Record<string, unknown> | undefined
    const met = fiche?.metrologie as Record<string, unknown> | undefined

    paras.push(heading2('II.1. Mesure de débit'))
    paras.push(para([
      txt('La mesure de débit a été réalisée'),
      ...(met?.codeDebitmetre ? [txt(` au moyen du débitmètre ${met.codeDebitmetre}`)] : []),
      ...(loc?.natureEffluent ? [txt(`. Nature de l'effluent : ${loc.natureEffluent}.`)] : [txt('.')]),
    ]))

    paras.push(heading2('II.2. Prélèvement automatique'))
    const asserv = ech?.asservissementParLitres as number | undefined
    const volMl  = ech?.asservissementVolumeMl  as number | undefined
    paras.push(para([txt('Les opérations de prélèvement ont respecté les préconisations de la norme FD T90-523-2.')]))
    if (asserv && volMl) {
      paras.push(para([txt(`Le préleveur a été programmé pour réaliser un prélèvement de ${volMl} mL tous les ${asserv} litres.`)]))
    }
    if (met?.codePreleveur) {
      paras.push(para([txt(`Équipement utilisé : ${met.codePreleveur}.`)]))
    }

    paras.push(heading2('II.3. Volume rejeté'))
    const volM3  = vol?.volumeRejeteM3             as number | undefined
    const nbPrel = vol?.nombrePrelevementsRealises  as number | undefined
    if (volM3)  paras.push(para([txt(`Le volume rejeté mesuré sur la période de bilan est de ${volM3} m³.`)]))
    if (nbPrel) paras.push(para([txt(`Nombre de prélèvements réalisés : ${nbPrel}.`)]))

  } else if (typeFiche === 'ESO' || typeFiche === 'ESO_SSP') {
    paras.push(heading2('II.1. Eaux souterraines'))
    paras.push(placeholder('Description de la campagne ESO — méthode de purge, paramètres mesurés in situ'))

  } else if (typeFiche === 'ESU') {
    paras.push(heading2('II.1. Eaux superficielles'))
    paras.push(placeholder('Description de la campagne ESU — mode de prélèvement, paramètres mesurés in situ'))

  } else {
    paras.push(placeholder('Description de la campagne de mesure'))
  }

  return paras
}

// ─── Calcul de charges de pollution ──────────────────────────────────────────

/**
 * Calcule la charge en kg pour un résultat en mg/L et un volume en m³.
 * charge (kg) = concentration (mg/L) × volume (m³) × 10⁻³
 * Retourne null si le résultat est non numérique.
 */
function calcCharge(resultat: string, volumeM3: number): string | null {
  if (!resultat || resultat === '—') return null
  if (resultat.startsWith('<')) {
    const v = parseFloat(resultat.replace('<', '').replace(',', '.'))
    if (isNaN(v)) return null
    const charge = v * volumeM3 * 0.001
    return `< ${charge.toFixed(3).replace('.', ',')}`
  }
  const v = parseFloat(resultat.replace(',', '.'))
  if (isNaN(v)) return null
  const charge = v * volumeM3 * 0.001
  // Arrondi intelligent : 3 décimales si < 1, sinon 2 décimales
  return charge < 1
    ? charge.toFixed(3).replace('.', ',')
    : charge.toFixed(2).replace('.', ',')
}

function buildTableauCharges(
  diplabo: ParsedDiplabo,
  vle: Record<string, VleEntry>,
  volumeM3: number
): Table {
  const { points, lignes } = diplabo
  const hasVleCharge = Object.values(vle).some((v) => v.vleCharge && v.vleCharge.trim() !== '')

  // En-tête : Paramètre | Unité | Point(s) résultat | Volume (m³) | Charge(s) (kg) | VLE charge (kg/j)
  const headerCells = [
    cell('Paramètres', { bold: true, shading: BLEU_LABOCEA, color: BLANC, align: AlignmentType.LEFT }),
    cell('Unité', { bold: true, shading: BLEU_LABOCEA, color: BLANC }),
    ...points.map((p) => cell(p, { bold: true, shading: BLEU_LABOCEA, color: BLANC, size: 16 })),
    cell(`Volume rejeté\n${volumeM3.toLocaleString('fr-FR')} m³`, { bold: true, shading: BLEU_LABOCEA, color: BLANC, size: 16 }),
    ...points.map((p) => cell(`Charge ${p}\n(kg)`, { bold: true, shading: BLEU_LABOCEA, color: BLANC, size: 16 })),
    ...(hasVleCharge ? [cell('Autorisée\n(kg/j)', { bold: true, shading: BLEU_LABOCEA, color: BLANC, size: 16 })] : []),
  ]
  const headerRow = new TableRow({ children: headerCells, tableHeader: true })

  // Calcul largeurs
  const COL_PARAMS = 2000
  const COL_UNITE  = 800
  const remaining  = 9000 - COL_PARAMS - COL_UNITE
  const totalCols  = points.length + 1 + points.length + (hasVleCharge ? 1 : 0)
  const COL_DATA   = Math.floor(remaining / totalCols)
  const colWidths  = [COL_PARAMS, COL_UNITE, ...Array(totalCols).fill(COL_DATA)]

  const dataRows = lignes.map((ligne, idx) => {
    const vleEntry    = vle[ligne.parametre]
    const vleStr      = vleEntry?.vle ?? ''
    const vleChargeStr = vleEntry?.vleCharge ?? ''
    const rowBg       = idx % 2 === 0 ? BLANC : BLEU_CLAIR

    const resultCells = points.map((p) => {
      const r = ligne.resultats[p] ?? '—'
      const dep = depasseVle(r, vleStr)
      return cell(r, { shading: rowBg, color: dep ? ROUGE_DEPASSEMENT : undefined, bold: dep })
    })

    const volCell = cell(volumeM3.toLocaleString('fr-FR'), { shading: rowBg })

    const chargeCells = points.map((p) => {
      const r = ligne.resultats[p] ?? '—'
      const charge = calcCharge(r, volumeM3)
      if (!charge) return cell('—', { shading: rowBg, color: '999999' })
      // Dépassement : comparer la charge à la VLE charge si disponible, sinon à la VLE concentration
      const depCharge = vleChargeStr
        ? depasseVle(charge.replace('< ', ''), vleChargeStr)
        : depasseVle(r, vleStr)
      return cell(charge, { shading: rowBg, color: depCharge ? ROUGE_DEPASSEMENT : undefined, bold: depCharge })
    })

    const vleChargeCell = hasVleCharge
      ? [cell(vleChargeStr || '—', { shading: rowBg })]
      : []

    return new TableRow({
      children: [
        cell(ligne.parametre, { shading: rowBg, align: AlignmentType.LEFT }),
        cell(ligne.unite,     { shading: rowBg }),
        ...resultCells,
        volCell,
        ...chargeCells,
        ...vleChargeCell,
      ],
    })
  })

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: colWidths,
  })
}

// ─── Section IV — Résultats ───────────────────────────────────────────────────

function buildSectionIV(
  diplabo: ParsedDiplabo,
  vle: Record<string, VleEntry>,
  intervention: Intervention,
  volumeM3?: number
): Paragraph[] {
  const paras: Paragraph[] = [heading1('IV. Résultats')]
  const isPauto = intervention.fiche?.typeFiche === 'PAUTO'

  if (isPauto) {
    paras.push(heading2('IV.1. Volume rejeté'))
    if (volumeM3) {
      paras.push(para([txt(`Le volume rejeté mesuré sur la période de bilan est de ${volumeM3.toLocaleString('fr-FR')} m³.`)]))
    } else {
      paras.push(placeholder('Volume rejeté (m³)'))
    }
    paras.push(heading2('IV.2. Caractérisation physicochimique'))
  } else {
    paras.push(heading2("IV.1. Résultats d'analyses"))
  }

  paras.push(new Paragraph({
    children: [txt('Le tableau ci-dessous synthétise les résultats des analyses réalisées.')],
    spacing: { after: 160 },
  }))
  paras.push(buildTableauResultats(diplabo, vle) as unknown as Paragraph)

  const anyExceedance = diplabo.lignes.some((l) =>
    diplabo.points.some((p) => depasseVle(l.resultats[p] ?? '', vle[l.parametre]?.vle ?? ''))
  )
  if (anyExceedance) {
    paras.push(emptyLine())
    paras.push(para([
      txt("⚠ Les valeurs en rouge dépassent les valeurs limites d'émission (VLE) réglementaires.",
        { color: ROUGE_DEPASSEMENT, bold: true, size: 18 }),
    ]))
  }

  // ── IV.3 Charges (PAUTO uniquement, si volume renseigné) ──
  if (isPauto && volumeM3 && volumeM3 > 0) {
    paras.push(emptyLine())
    paras.push(heading2('IV.3. Charges de pollution'))
    paras.push(new Paragraph({
      children: [txt(
        `Les charges de pollution sont calculées à partir des concentrations mesurées et du volume rejeté de ${volumeM3.toLocaleString('fr-FR')} m³ sur la période de bilan.`
      )],
      spacing: { after: 160 },
    }))
    paras.push(new Paragraph({
      children: [txt('Formule : Charge (kg) = Concentration (mg/L) × Volume rejeté (m³) × 10⁻³', { italic: true, color: '555555', size: 18 })],
      spacing: { after: 120 },
    }))
    paras.push(buildTableauCharges(diplabo, vle, volumeM3) as unknown as Paragraph)
  }

  return paras
}

// ─── Document principal ───────────────────────────────────────────────────────

export async function genererRapportDocx(opts: RapportOptions): Promise<void> {
  const { numRapport, intervention, diplabo, vle, redacteur, volumeM3 } = opts
  const { identification } = intervention
  const today           = new Date().toLocaleDateString('fr-FR')
  const datePrelevement = diplabo.meta.datePrelevement || identification.dateDebut || ''
  const clientNom       = identification.client ?? ''

  // ── Bandeau bleu pleine largeur (page de garde) ──
  const bandeauBleu = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [txt('LABOCEA', { bold: true, size: 36, color: BLANC })],
                alignment: AlignmentType.LEFT,
                spacing: { after: 0 },
              }),
              new Paragraph({
                children: [txt('Pôle Mesures Environnementales', { size: 20, color: 'C8DCF0' })],
                alignment: AlignmentType.LEFT,
                spacing: { after: 0 },
              }),
            ],
            shading: { fill: BLEU_LABOCEA, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 300, right: 300 },
            borders: {
              top:    { style: BorderStyle.NIL },
              bottom: { style: BorderStyle.NIL },
              left:   { style: BorderStyle.NIL },
              right:  { style: BorderStyle.NIL },
            },
          }),
        ],
      }),
    ],
    width: { size: 9638, type: WidthType.DXA },
    columnWidths: [9638],
  })

  const doc = new Document({
    creator: 'Labocea — App Rapports',
    title: `Rapport ${numRapport}`,
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 20 } },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          run: { bold: true, size: 26, color: BLEU_LABOCEA, font: 'Calibri' },
          paragraph: {
            spacing: { before: 320, after: 140 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLEU_LABOCEA } },
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          run: { bold: true, size: 22, color: '333333', font: 'Calibri' },
          paragraph: { spacing: { before: 200, after: 80 } },
        },
      ],
    },
    sections: [
      // ── Section 1 : page de garde (sans en-tête/pied de page) ──
      {
        properties: {
          page: {
            margin: { top: 0, left: 1080, right: 1080, bottom: 1440 },
          },
        },
        children: [
          // Bandeau bleu pleine largeur
          bandeauBleu,

          new Paragraph({ children: [], spacing: { after: 480 } }),

          // Client
          para(
            [txt(clientNom, { bold: true, size: 40, color: BLEU_LABOCEA })],
            { alignment: AlignmentType.CENTER }
          ),
          new Paragraph({ children: [], spacing: { after: 120 } }),
          para(
            [txt(identification.site ?? '', { size: 26, color: '555555' })],
            { alignment: AlignmentType.CENTER }
          ),

          new Paragraph({ children: [], spacing: { after: 480 } }),

          // Filet séparateur
          new Paragraph({
            children: [],
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLEU_LABOCEA } },
            spacing: { after: 240 },
          }),

          para(
            [txt("Suivi des impacts sur l'eau", { size: 32, bold: true, color: '222222' })],
            { alignment: AlignmentType.CENTER }
          ),
          new Paragraph({ children: [], spacing: { after: 160 } }),
          para(
            [txt(datePrelevement, { size: 24, color: '444444' })],
            { alignment: AlignmentType.CENTER }
          ),

          new Paragraph({ children: [], spacing: { after: 720 } }),

          // Tableau visa
          new Table({
            rows: [
              new TableRow({
                children: [
                  cell('Rév.',          { bold: true, shading: GRIS_EN_TETE }),
                  cell('Rédaction',     { bold: true, shading: GRIS_EN_TETE }),
                  cell('Date',          { bold: true, shading: GRIS_EN_TETE }),
                  cell('Vérification',  { bold: true, shading: GRIS_EN_TETE }),
                  cell('Date',          { bold: true, shading: GRIS_EN_TETE }),
                ],
              }),
              new TableRow({
                children: [
                  cell('0'),
                  cell(redacteur),
                  cell(today),
                  cell(''),
                  cell(''),
                ],
              }),
            ],
            width: { size: 9000, type: WidthType.DXA },
            columnWidths: [900, 2700, 1800, 2700, 900],
          }),

          new Paragraph({ children: [], spacing: { after: 200 } }),
          para([txt('Rapport : ', { bold: true }), txt(numRapport)]),
          ...(identification.numConventionDevis ? [
            para([txt('Devis : ', { bold: true }), txt(identification.numConventionDevis)]),
          ] : []),
          para([txt('Réalisé par : ', { bold: true }), txt(redacteur)]),

          // Saut de page → section suivante
          new Paragraph({ children: [new PageBreak()] }),
        ],
      },

      // ── Section 2 : corps du rapport (avec en-tête/pied de page) ──
      {
        properties: {
          page: {
            margin: { top: 1080, left: 1080, right: 1080, bottom: 1080 },
          },
        },
        headers: {
          default: buildHeader(numRapport, clientNom),
        },
        footers: {
          default: buildFooter(),
        },
        children: [
          // ── I. Contexte ──
          heading1("I. Contexte de l'intervention"),
          placeholder("Décrire le contexte réglementaire, l'arrêté préfectoral, la mission confiée à Labocea et la localisation des points de contrôle."),
          emptyLine(),

          // ── II. Description campagne ──
          ...buildSectionII(intervention),
          emptyLine(),

          // ── III. Analyses ──
          heading1('III. Analyses'),
          para([
            txt("Les analyses ont été réalisées dans les laboratoires de LABOCEA (B/Q/P) accrédités par le COFRAC (n°1-7014, 1-1828, 1-7015) et agréés par le Ministère en charge de l'Environnement."),
          ]),
          emptyLine(),

          // ── IV. Résultats ──
          ...buildSectionIV(diplabo, vle, intervention, volumeM3),
          emptyLine(),

          // ── Annexes ──
          new Paragraph({ children: [new PageBreak()] }),
          heading1('ANNEXES'),
          placeholder("Joindre les rapports d'essais DiPLABO et la courbe de débit (PAUTO)."),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const filename = `${numRapport} - ${clientNom || 'rapport'} - ${datePrelevement}.docx`
  saveAs(blob, filename)
}
