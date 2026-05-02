import { useFormContext, Controller, useWatch } from 'react-hook-form'
import { Section, FieldGrid } from '../../components/ui/Section'
import { Field, TextInput, NumberInput, Select, TextArea } from '../../components/ui/Field'
import { RadioGroup, CheckboxRow } from '../../components/ui/Radio'
import { ConformityBadge } from '../../components/ui/ConformityBadge'
import type { Intervention } from '../../schemas/intervention'
import { fillStateOf } from '../../lib/fillState'
import {
  conformiteVerifVenturi,
  conformiteEcart3mm,
  conformiteVitesseAspiration,
  statsVolumeUnitaire,
  conformiteVolumeGlobal,
  conformiteTempEnceinteGlobal,
  conformiteRatioPrelevements,
  conformitePositionnementVenturi,
  conformitePositionnementDeversoir,
} from '../../lib/conformity'

/**
 * Formulaire pour fiche PENV-SU-0120 (prélèvement automatique avec asservissement au débit).
 * Le composant suppose un FormProvider parent fournissant `Intervention` typé.
 */
export default function PautoForm() {
  const { register, control } = useFormContext<Intervention>()

  // Observation globale pour calculer les indicateurs de remplissage par section.
  // Un seul useWatch racine évite N abonnements et garde tout en sync.
  const all = useWatch<Intervention>({ control })

  // Narrowing vers FichePauto — le composant n'est monté que si typeFiche === 'PAUTO'
  const fiche = all?.fiche?.typeFiche === 'PAUTO' ? all.fiche.data : undefined

  const dispositifType = fiche?.dispositifJaugeur?.type
  const debitmetreType = fiche?.debitmetre?.type

  // Calculs dérivés de conformité (COFRAC) — recalculés à chaque saisie
  const verifVenturiDebut = conformiteVerifVenturi(fiche?.debitmetre?.verifVenturi?.debut)
  const verifVenturiFin = conformiteVerifVenturi(fiche?.debitmetre?.verifVenturi?.fin)
  const lectureDirecteDebut = conformiteEcart3mm(
    fiche?.debitmetre?.lectureDirecte?.debutHauteurReglet,
    fiche?.debitmetre?.lectureDirecte?.debutHauteurLue,
  )
  const lectureDirecteFin = conformiteEcart3mm(
    fiche?.debitmetre?.lectureDirecte?.finHauteurReglet,
    fiche?.debitmetre?.lectureDirecte?.finHauteurLue,
  )
  const verifHVDebut = conformiteEcart3mm(
    fiche?.debitmetre?.verifHV?.debutHauteurReglet,
    fiche?.debitmetre?.verifHV?.debutHauteurLue,
  )
  const verifHVFin = conformiteEcart3mm(
    fiche?.debitmetre?.verifHV?.finHauteurReglet,
    fiche?.debitmetre?.verifHV?.finHauteurLue,
  )
  const positionnementVenturi = conformitePositionnementVenturi(
    fiche?.debitmetre?.positionnementDistanceCm,
    fiche?.dispositifJaugeur?.venturiHmaxCm,
  )
  const positionnementDeversoir = conformitePositionnementDeversoir(
    fiche?.debitmetre?.positionnementDistanceCm,
    fiche?.dispositifJaugeur?.venturiHmaxCm,
  )
  const vitesseDebut = conformiteVitesseAspiration(fiche?.verifVitesseAspiration?.debut)
  const vitesseFin = conformiteVitesseAspiration(fiche?.verifVitesseAspiration?.fin)
  const volUniDebut = statsVolumeUnitaire(fiche?.verifVolumeUnitaire?.debut, fiche?.verifVolumeUnitaire?.volumeDemandeMl)
  const volUniFin = statsVolumeUnitaire(fiche?.verifVolumeUnitaire?.fin, fiche?.verifVolumeUnitaire?.volumeDemandeMl)
  const volumeGlobal = conformiteVolumeGlobal(fiche?.volumeGlobal)
  const tempEnceinte = conformiteTempEnceinteGlobal(fiche?.tempEnceinte)
  const ratioPrelevements = conformiteRatioPrelevements(
    fiche?.volumeGlobal?.nombrePrelevementsRealises,
    fiche?.volumeGlobal?.nombrePrelevementsAttendus,
  )

  const fs = {
    identification: fillStateOf({
      ...all?.identification,
      natureEffluent: fiche?.localisation?.natureEffluent,
    }),
    localisation: fillStateOf(fiche?.localisation),
    dispositifJaugeur: fillStateOf(fiche?.dispositifJaugeur),
    debitmetre: fillStateOf(fiche?.debitmetre),
    metrologie: fillStateOf(fiche?.metrologie),
    echantillonneur: fillStateOf(fiche?.echantillonneur),
    verifications: fillStateOf({
      v: fiche?.verifVitesseAspiration,
      vu: fiche?.verifVolumeUnitaire,
      vg: fiche?.volumeGlobal,
      te: fiche?.tempEnceinte,
    }),
    mesuresInSitu: fillStateOf(fiche?.mesuresInSitu),
    constitution: fillStateOf(fiche?.constitution),
    receptionLabo: fillStateOf(all?.receptionLabo),
    observations: fillStateOf(all?.observations),
  }

  return (
    <div className="space-y-3">
      {/* ─────── 1. Identification ─────── */}
      <Section title="Identification" description="Client, site, opérateur, dates de bilan" fillState={fs.identification}>
        <FieldGrid cols={2}>
          <Field label="Client" required>
            <TextInput {...register('identification.client')} placeholder="Nom du client" />
          </Field>
          <Field label="N° convention / devis">
            <TextInput {...register('identification.numConventionDevis')} />
          </Field>
          <Field label="Site" required>
            <TextInput {...register('identification.site')} placeholder="Lieu de l'intervention" />
          </Field>
          <Field label="Opérateur LABOCEA" required>
            <TextInput {...register('identification.operateur')} />
          </Field>
          <Field label="Date / heure début de bilan" required>
            <TextInput type="datetime-local" {...register('identification.dateDebut')} />
          </Field>
          <Field label="Date / heure fin de bilan">
            <TextInput type="datetime-local" {...register('identification.dateFin')} />
          </Field>
        </FieldGrid>
        <FieldGrid cols={1}>
          <Field label="Nature de l'échantillon" hint="Effluent brut ou prétraité">
            <Controller
              control={control}
              name="fiche.data.localisation.natureEffluent"
              render={({ field }) => (
                <RadioGroup
                  name="natureEffluent"
                  value={field.value as 'brut' | 'pretraite' | undefined}
                  onChange={field.onChange}
                  options={[
                    { value: 'brut', label: 'Effluent brut' },
                    { value: 'pretraite', label: 'Effluent prétraité' },
                  ]}
                />
              )}
            />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 2. Localisation ─────── */}
      <Section title="Localisation du point d'échantillonnage" defaultOpen={false} fillState={fs.localisation}>
        <Field label="Identification exacte">
          <TextArea {...register('fiche.data.localisation.identificationExacte')} placeholder="Description précise du point (regard, point de rejet, n° ouvrage…)" />
        </Field>
      </Section>

      {/* ─────── 3. Dispositif de mesure de débit ─────── */}
      <Section title="Dispositif de mesure de débit" description="Canal Venturi, seuil ou manchon déversoir" fillState={fs.dispositifJaugeur}>
        <Field label="Type de dispositif">
          <Controller
            control={control}
            name="fiche.data.dispositifJaugeur.type"
            render={({ field }) => (
              <RadioGroup
                name="dispJaugeur"
                value={field.value as 'canal_venturi' | 'seuil_deversoir' | 'manchon_deversoir' | 'aucun' | undefined}
                onChange={field.onChange}
                options={[
                  { value: 'canal_venturi', label: 'Canal Venturi' },
                  { value: 'seuil_deversoir', label: 'Seuil déversoir' },
                  { value: 'manchon_deversoir', label: 'Manchon déversoir' },
                  { value: 'aucun', label: 'Aucun' },
                ]}
              />
            )}
          />
        </Field>

        {dispositifType === 'canal_venturi' && (
          <FieldGrid cols={2}>
            <Field label="Modèle">
              <TextInput {...register('fiche.data.dispositifJaugeur.venturiModele')} />
            </Field>
            <Field label="Hmax (cm)">
              <NumberInput {...register('fiche.data.dispositifJaugeur.venturiHmaxCm', { valueAsNumber: true })} />
            </Field>
          </FieldGrid>
        )}

        {dispositifType === 'seuil_deversoir' && (
          <FieldGrid cols={2}>
            <Field label="Type de seuil">
              <Controller
                control={control}
                name="fiche.data.dispositifJaugeur.seuilType"
                render={({ field }) => (
                  <RadioGroup
                    name="seuilType"
                    value={field.value as 'rectangulaire' | 'triangulaire' | undefined}
                    onChange={field.onChange}
                    options={[
                      { value: 'rectangulaire', label: 'Rectangulaire' },
                      { value: 'triangulaire', label: 'Triangulaire' },
                    ]}
                  />
                )}
              />
            </Field>
            <Field label="Propriétaire">
              <Controller
                control={control}
                name="fiche.data.dispositifJaugeur.seuilProprietaire"
                render={({ field }) => (
                  <RadioGroup
                    name="seuilProp"
                    value={field.value as 'client' | 'labocea' | undefined}
                    onChange={field.onChange}
                    options={[
                      { value: 'client', label: 'Client' },
                      { value: 'labocea', label: 'Labocea' },
                    ]}
                  />
                )}
              />
            </Field>
            <Field label="Caractéristiques (cm)" className="md:col-span-2">
              <TextInput {...register('fiche.data.dispositifJaugeur.seuilCaracteristiquesCm')} placeholder="Hauteur, largeur, angle…" />
            </Field>
          </FieldGrid>
        )}

        {dispositifType === 'manchon_deversoir' && (
          <FieldGrid cols={2}>
            <Field label="Forme">
              <Controller
                control={control}
                name="fiche.data.dispositifJaugeur.manchonForme"
                render={({ field }) => (
                  <RadioGroup
                    name="manchonForme"
                    value={field.value as 'circulaire' | 'triangulaire' | undefined}
                    onChange={field.onChange}
                    options={[
                      { value: 'circulaire', label: 'Circulaire' },
                      { value: 'triangulaire', label: 'Triangulaire' },
                    ]}
                  />
                )}
              />
            </Field>
            <Field label="Diamètre (mm)">
              <NumberInput {...register('fiche.data.dispositifJaugeur.manchonDiametreMm', { valueAsNumber: true })} />
            </Field>
          </FieldGrid>
        )}
      </Section>

      {/* ─────── 4. Débitmètre ─────── */}
      <Section title="Débitmètre" defaultOpen={false} fillState={fs.debitmetre}>
        <FieldGrid cols={2}>
          <Field label="Type de débitmètre">
            <Controller
              control={control}
              name="fiche.data.debitmetre.type"
              render={({ field }) => (
                <Select value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || undefined)}>
                  <option value="">— Choisir —</option>
                  <option value="bulle_a_bulle">Bulle à bulle</option>
                  <option value="sonde_us">Sonde US</option>
                  <option value="h_v">H/V</option>
                  <option value="electromagnetique">Électromagnétique</option>
                  <option value="autre">Autre</option>
                </Select>
              )}
            />
          </Field>
          <Field label="Propriétaire">
            <Controller
              control={control}
              name="fiche.data.debitmetre.proprietaire"
              render={({ field }) => (
                <RadioGroup
                  name="debitProp"
                  value={field.value as 'client' | 'labocea' | undefined}
                  onChange={field.onChange}
                  options={[
                    { value: 'client', label: 'Client' },
                    { value: 'labocea', label: 'Labocea' },
                  ]}
                />
              )}
            />
          </Field>
          {debitmetreType === 'autre' && (
            <Field label="Préciser le type" className="md:col-span-2">
              <TextInput {...register('fiche.data.debitmetre.typeAutre')} />
            </Field>
          )}
        </FieldGrid>

        <h3 className="text-sm font-semibold text-slate-700 mt-5 mb-2">Positionnement</h3>
        <FieldGrid cols={2}>
          <Field label="Distance sonde / ouvrage (cm)" hint="Venturi : 3 à 4 × Hmax · Déversoir : ≈ 4 × Hmax">
            <NumberInput {...register('fiche.data.debitmetre.positionnementDistanceCm', { valueAsNumber: true })} />
          </Field>
          <ConformityBadge
            label="Conformité positionnement (calculée)"
            result={dispositifType === 'seuil_deversoir' ? positionnementDeversoir : positionnementVenturi}
          />
        </FieldGrid>

        {debitmetreType === 'bulle_a_bulle' && (
          <>
            <h3 className="text-sm font-semibold text-slate-700 mt-5 mb-2">Étalonnage bulle à bulle</h3>
            <FieldGrid cols={3}>
              <Field label="D / repère (cm)">
                <NumberInput {...register('fiche.data.debitmetre.etalonnageDRepereCm', { valueAsNumber: true })} />
              </Field>
              <Field label="H / règle étalon (cm)">
                <NumberInput {...register('fiche.data.debitmetre.etalonnageHRegleCm', { valueAsNumber: true })} />
              </Field>
              <Field label="D − H (cm)">
                <NumberInput {...register('fiche.data.debitmetre.etalonnageDmoinsHCm', { valueAsNumber: true })} />
              </Field>
            </FieldGrid>
          </>
        )}

        {debitmetreType === 'electromagnetique' && (
          <>
            <h3 className="text-sm font-semibold text-slate-700 mt-5 mb-2">Débitmètre électromagnétique</h3>
            <FieldGrid cols={3}>
              <Field label="Fext (mm)">
                <NumberInput {...register('fiche.data.debitmetre.electromagnetique.fextMm', { valueAsNumber: true })} />
              </Field>
              <Field label="L amont (cm)">
                <NumberInput {...register('fiche.data.debitmetre.electromagnetique.lAmontCm', { valueAsNumber: true })} />
              </Field>
              <Field label="L aval (cm)">
                <NumberInput {...register('fiche.data.debitmetre.electromagnetique.lAvalCm', { valueAsNumber: true })} />
              </Field>
              <Field label="Nature conduite">
                <TextInput {...register('fiche.data.debitmetre.electromagnetique.natureConduite')} />
              </Field>
              <Field label="Épaisseur conduite (mm)">
                <NumberInput {...register('fiche.data.debitmetre.electromagnetique.epaisseurConduiteMm', { valueAsNumber: true })} />
              </Field>
              <Field label="Distance entre capteurs (cm)">
                <NumberInput {...register('fiche.data.debitmetre.electromagnetique.distanceCapteursCm', { valueAsNumber: true })} />
              </Field>
              <Field label="Orientation canalisation">
                <Controller
                  control={control}
                  name="fiche.data.debitmetre.electromagnetique.orientation"
                  render={({ field }) => (
                    <RadioGroup
                      name="orient"
                      value={field.value as 'horizontale' | 'verticale' | 'oblique' | undefined}
                      onChange={field.onChange}
                      options={[
                        { value: 'horizontale', label: 'Horizontale' },
                        { value: 'verticale', label: 'Verticale' },
                        { value: 'oblique', label: 'Oblique' },
                      ]}
                    />
                  )}
                />
              </Field>
              <Field label="Conformité positionnement" hint="5 F amont · 3 F aval">
                <Controller
                  control={control}
                  name="fiche.data.debitmetre.electromagnetique.positionnementConformite"
                  render={({ field }) => (
                    <RadioGroup
                      name="posElmConf"
                      value={field.value as 'conforme' | 'non_conforme' | undefined}
                      onChange={field.onChange}
                      options={[
                        { value: 'conforme', label: 'Conforme' },
                        { value: 'non_conforme', label: 'Non conforme' },
                      ]}
                    />
                  )}
                />
              </Field>
            </FieldGrid>
          </>
        )}

        {/* Vérification hauteurs Venturi / Déversoir (±2 mm) */}
        {(dispositifType === 'canal_venturi' || dispositifType === 'seuil_deversoir') && (
          <>
            <h3 className="text-sm font-semibold text-slate-700 mt-6 mb-3">
              Vérification hauteurs (Venturi / Déversoir, ±2 mm)
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {(['debut', 'fin'] as const).map((phase) => (
                <div key={phase} className="border border-slate-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-slate-700 mb-3">
                    {phase === 'debut' ? 'Début bilan' : 'Fin bilan'}
                  </div>
                  <div className="space-y-3">
                    {([
                      ['Zéro', 'Zero'],
                      ['50 % Hmax', '50pc'],
                      ['Hmax', 'Hmax'],
                    ] as const).map(([label, key]) => (
                      <div key={key} className="grid grid-cols-2 gap-2">
                        <Field label={`H éprouvette ${label} (cm)`}>
                          <NumberInput
                            {...register(
                              `fiche.data.debitmetre.verifVenturi.${phase}.hauteurEprouvette${key}Cm` as const,
                              { valueAsNumber: true },
                            )}
                          />
                        </Field>
                        <Field label={`H lue ${label} (cm)`}>
                          <NumberInput
                            {...register(
                              `fiche.data.debitmetre.verifVenturi.${phase}.hauteurLue${key}Cm` as const,
                              { valueAsNumber: true },
                            )}
                          />
                        </Field>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <ConformityBadge
                      result={phase === 'debut' ? verifVenturiDebut : verifVenturiFin}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Lecture directe alternative (±3 mm) */}
        <h3 className="text-sm font-semibold text-slate-700 mt-6 mb-3">
          Lecture directe — alternative en cas d'impossibilité (±3 mm)
        </h3>
        <Field label="Motif">
          <TextInput {...register('fiche.data.debitmetre.lectureDirecteMotif')} />
        </Field>
        <div className="grid md:grid-cols-2 gap-4 mt-3">
          {(['debut', 'fin'] as const).map((phase) => {
            const result = phase === 'debut' ? lectureDirecteDebut : lectureDirecteFin
            const regletKey = `${phase}HauteurReglet` as const
            const lueKey = `${phase}HauteurLue` as const
            return (
              <div key={phase} className="border border-slate-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-700 mb-3">
                  {phase === 'debut' ? 'Début bilan' : 'Fin bilan'}
                </div>
                <FieldGrid cols={2}>
                  <Field label="H mesurée au réglet (cm)">
                    <NumberInput
                      {...register(`fiche.data.debitmetre.lectureDirecte.${regletKey}` as const, { valueAsNumber: true })}
                    />
                  </Field>
                  <Field label="H lue (cm)">
                    <NumberInput
                      {...register(`fiche.data.debitmetre.lectureDirecte.${lueKey}` as const, { valueAsNumber: true })}
                    />
                  </Field>
                </FieldGrid>
                <div className="mt-3">
                  <ConformityBadge result={result} size="sm" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Vérification H/V (±3 mm) */}
        {debitmetreType === 'h_v' && (
          <>
            <h3 className="text-sm font-semibold text-slate-700 mt-6 mb-3">
              Vérification hauteurs — Débitmètre H/V (±3 mm)
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {(['debut', 'fin'] as const).map((phase) => {
                const result = phase === 'debut' ? verifHVDebut : verifHVFin
                const regletKey = `${phase}HauteurReglet` as const
                const lueKey = `${phase}HauteurLue` as const
                return (
                  <div key={phase} className="border border-slate-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-slate-700 mb-3">
                      {phase === 'debut' ? 'Début bilan' : 'Fin bilan'}
                    </div>
                    <FieldGrid cols={2}>
                      <Field label="H mesurée au réglet (cm)">
                        <NumberInput
                          {...register(`fiche.data.debitmetre.verifHV.${regletKey}` as const, { valueAsNumber: true })}
                        />
                      </Field>
                      <Field label="H lue (cm)">
                        <NumberInput
                          {...register(`fiche.data.debitmetre.verifHV.${lueKey}` as const, { valueAsNumber: true })}
                        />
                      </Field>
                    </FieldGrid>
                    <div className="mt-3">
                      <ConformityBadge result={result} size="sm" />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Manchon déversoir : zéro dans l'air */}
        {dispositifType === 'manchon_deversoir' && (
          <div className="mt-6">
            <Controller
              control={control}
              name="fiche.data.debitmetre.zeroDansAirManchon"
              render={({ field }) => (
                <CheckboxRow
                  checked={field.value}
                  onChange={field.onChange}
                  label="Zéro dans l'air effectué (manchon déversoir)"
                />
              )}
            />
          </div>
        )}
      </Section>

      {/* ─────── 5. Métrologie ─────── */}
      <Section title="Métrologie — codes équipements" defaultOpen={false} description="Identification des appareils utilisés sur le terrain" fillState={fs.metrologie}>
        <FieldGrid cols={3}>
          <Field label="Débitmètre"><TextInput {...register('fiche.data.metrologie.codeDebitmetre')} /></Field>
          <Field label="Préleveur"><TextInput {...register('fiche.data.metrologie.codePreleveur')} /></Field>
          <Field label="Éprouvette"><TextInput {...register('fiche.data.metrologie.codeEprouvette')} /></Field>
          <Field label="Réglet"><TextInput {...register('fiche.data.metrologie.codeReglet')} /></Field>
          <Field label="Réglet éprouvette"><TextInput {...register('fiche.data.metrologie.codeRegletEprouvette')} /></Field>
          <Field label="Tuyau pompe"><TextInput {...register('fiche.data.metrologie.codeTuyauPompe')} /></Field>
          <Field label="Tuyau prélèvement"><TextInput {...register('fiche.data.metrologie.codeTuyauPrelevement')} /></Field>
          <Field label="Chronomètre"><TextInput {...register('fiche.data.metrologie.codeChronometre')} /></Field>
          <Field label="Balance"><TextInput {...register('fiche.data.metrologie.codeBalance')} /></Field>
          <Field label="Flacon"><TextInput {...register('fiche.data.metrologie.codeFlacon')} /></Field>
          <Field label="Tomkey"><TextInput {...register('fiche.data.metrologie.codeTomkey')} /></Field>
        </FieldGrid>
      </Section>

      {/* ─────── 6. Échantillonneur automatique ─────── */}
      <Section title="Échantillonneur automatique" fillState={fs.echantillonneur}>
        <FieldGrid cols={2}>
          <Field label="Type de préleveur">
            <Controller
              control={control}
              name="fiche.data.echantillonneur.typePreleveur"
              render={({ field }) => (
                <RadioGroup
                  name="typePrel"
                  value={field.value as 'monoflacon' | 'multiflacon' | undefined}
                  onChange={field.onChange}
                  options={[
                    { value: 'monoflacon', label: 'Monoflacon' },
                    { value: 'multiflacon', label: 'Multiflacon' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Réfrigéré ?">
            <Controller
              control={control}
              name="fiche.data.echantillonneur.refrigere"
              render={({ field }) => (
                <RadioGroup
                  name="refrig"
                  value={field.value === true ? 'oui' : field.value === false ? 'non' : undefined}
                  onChange={(v) => field.onChange(v === 'oui')}
                  options={[
                    { value: 'oui', label: 'Oui' },
                    { value: 'non', label: 'Non' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Alimentation">
            <Controller
              control={control}
              name="fiche.data.echantillonneur.alimentation"
              render={({ field }) => (
                <RadioGroup
                  name="alim"
                  value={field.value as 'secteur' | 'batterie' | undefined}
                  onChange={field.onChange}
                  options={[
                    { value: 'secteur', label: 'Secteur' },
                    { value: 'batterie', label: 'Batterie' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Tuyau (matériau)">
            <Controller
              control={control}
              name="fiche.data.echantillonneur.tuyauMateriau"
              render={({ field }) => (
                <RadioGroup
                  name="tuyMat"
                  value={field.value as 'pvc' | 'teflon' | undefined}
                  onChange={field.onChange}
                  options={[
                    { value: 'pvc', label: 'PVC' },
                    { value: 'teflon', label: 'Téflon' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Diamètre tuyau (mm)">
            <NumberInput {...register('fiche.data.echantillonneur.tuyauDiametreMm', { valueAsNumber: true })} />
          </Field>
          <Field label="Longueur tuyau (m)">
            <NumberInput {...register('fiche.data.echantillonneur.tuyauLongueurM', { valueAsNumber: true })} />
          </Field>
          <Field label="Flacon (matériau)">
            <Controller
              control={control}
              name="fiche.data.echantillonneur.flaconMateriau"
              render={({ field }) => (
                <RadioGroup
                  name="flacMat"
                  value={field.value as 'pe' | 'verre' | undefined}
                  onChange={field.onChange}
                  options={[
                    { value: 'pe', label: 'PE' },
                    { value: 'verre', label: 'Verre' },
                  ]}
                />
              )}
            />
          </Field>
        </FieldGrid>

        <FieldGrid cols={3}>
          <Controller
            control={control}
            name="fiche.data.echantillonneur.nettoyageAvant"
            render={({ field }) => (
              <CheckboxRow
                checked={field.value}
                onChange={field.onChange}
                label="Nettoyage du matériel avant utilisation"
              />
            )}
          />
          <Controller
            control={control}
            name="fiche.data.echantillonneur.purgeAvant"
            render={({ field }) => (
              <CheckboxRow
                checked={field.value}
                onChange={field.onChange}
                label="Purge des tuyaux avant utilisation"
              />
            )}
          />
          <Controller
            control={control}
            name="fiche.data.echantillonneur.utilisationCrepine"
            render={({ field }) => (
              <CheckboxRow
                checked={field.value}
                onChange={field.onChange}
                label="Utilisation d'une crépine"
              />
            )}
          />
        </FieldGrid>

        <h3 className="text-sm font-semibold text-slate-700 mt-5 mb-2">Prise d'eau</h3>
        <FieldGrid cols={2}>
          <Field label="Positionnement">
            <Controller
              control={control}
              name="fiche.data.echantillonneur.positionnementPriseEau"
              render={({ field }) => (
                <RadioGroup
                  name="posPrise"
                  value={field.value as 'amont_dispositif_jaugeur' | 'autre' | undefined}
                  onChange={field.onChange}
                  options={[
                    { value: 'amont_dispositif_jaugeur', label: 'Amont dispositif jaugeur' },
                    { value: 'autre', label: 'Autre' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Si autre, préciser">
            <TextInput {...register('fiche.data.echantillonneur.positionnementAutre')} />
          </Field>
          <Field label="Profondeur prise d'eau">
            <Controller
              control={control}
              name="fiche.data.echantillonneur.profondeurPriseEau"
              render={({ field }) => (
                <RadioGroup
                  name="profPrise"
                  value={field.value as 'un_tiers_sous_surface' | 'autre' | undefined}
                  onChange={field.onChange}
                  options={[
                    { value: 'un_tiers_sous_surface', label: '1/3 sous la surface' },
                    { value: 'autre', label: 'Autre' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Si autre, préciser">
            <TextInput {...register('fiche.data.echantillonneur.profondeurAutre')} />
          </Field>
        </FieldGrid>

        <h3 className="text-sm font-semibold text-slate-700 mt-5 mb-2">Asservissement</h3>
        <FieldGrid cols={2}>
          <Field label="Volume unitaire (mL)">
            <NumberInput {...register('fiche.data.echantillonneur.asservissementVolumeMl', { valueAsNumber: true })} />
          </Field>
          <Field label="Tous les … (litres)">
            <NumberInput {...register('fiche.data.echantillonneur.asservissementParLitres', { valueAsNumber: true })} />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 7. Vérifications ─────── */}
      <Section title="Vérifications de l'échantillonneur" defaultOpen={false} fillState={fs.verifications}>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Vitesse d'aspiration (≥ 0,5 m/s)</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {(['debut', 'fin'] as const).map((phase) => (
            <div key={phase} className="border border-slate-200 rounded-lg p-3">
              <div className="text-xs font-semibold text-slate-700 mb-3">
                {phase === 'debut' ? 'Début bilan' : 'Fin bilan'}
              </div>
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="grid grid-cols-[auto_1fr_1fr] gap-2 items-end">
                    <div className="text-xs text-slate-500 pb-3">Essai {i + 1}</div>
                    <Field label={i === 0 ? 'Temps (s)' : ''}>
                      <NumberInput
                        {...register(`fiche.data.verifVitesseAspiration.${phase}.${i}.tempsS` as const, { valueAsNumber: true })}
                      />
                    </Field>
                    <Field label={i === 0 ? 'Vitesse (m/s)' : ''}>
                      <NumberInput
                        {...register(`fiche.data.verifVitesseAspiration.${phase}.${i}.vitesseMs` as const, { valueAsNumber: true })}
                      />
                    </Field>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <ConformityBadge result={phase === 'debut' ? vitesseDebut : vitesseFin} size="sm" />
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-slate-700 mt-5 mb-2">Volume unitaire prélevé (≥ 50 mL)</h3>
        <FieldGrid cols={1}>
          <Field label="Volume demandé (mL)">
            <NumberInput {...register('fiche.data.verifVolumeUnitaire.volumeDemandeMl', { valueAsNumber: true })} />
          </Field>
        </FieldGrid>
        <div className="grid md:grid-cols-2 gap-4 mt-3">
          {(['debut', 'fin'] as const).map((phase) => {
            const stats = phase === 'debut' ? volUniDebut : volUniFin
            return (
              <div key={phase} className="border border-slate-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-700 mb-2">{phase === 'debut' ? 'Début bilan' : 'Fin bilan'}</div>
                <FieldGrid cols={1}>
                  <Field label="Essai 1 (mL)"><NumberInput {...register(`fiche.data.verifVolumeUnitaire.${phase}.essai1Ml` as const, { valueAsNumber: true })} /></Field>
                  <Field label="Essai 2 (mL)"><NumberInput {...register(`fiche.data.verifVolumeUnitaire.${phase}.essai2Ml` as const, { valueAsNumber: true })} /></Field>
                  <Field label="Essai 3 (mL)"><NumberInput {...register(`fiche.data.verifVolumeUnitaire.${phase}.essai3Ml` as const, { valueAsNumber: true })} /></Field>
                </FieldGrid>
                {/* Stats calculées */}
                <div className="mt-3 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between"><span>Moyenne</span><span className="font-medium">{stats.moyenne !== undefined ? `${stats.moyenne.toFixed(1)} mL` : '—'}</span></div>
                  <div className="flex justify-between"><span>Fidélité (max−min)/moy</span><span className="font-medium">{stats.fidelite !== undefined ? `${stats.fidelite.toFixed(1)} %` : '—'}</span></div>
                  <div className="flex justify-between"><span>Justesse vs demandé</span><span className="font-medium">{stats.justesse !== undefined ? `${stats.justesse.toFixed(1)} %` : '—'}</span></div>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <ConformityBadge label="Fidélité (≤ 5 %)" result={{ status: stats.fideliteOk }} size="sm" />
                  <ConformityBadge label="Justesse (≤ 10 %)" result={{ status: stats.justesseOk }} size="sm" />
                </div>
              </div>
            )
          })}
        </div>

        <h3 className="text-sm font-semibold text-slate-700 mt-5 mb-2">Volume global collecté</h3>
        <FieldGrid cols={2}>
          <Field label="Volume unitaire moyen début/fin (mL)">
            <NumberInput {...register('fiche.data.volumeGlobal.volumeUnitaireMoyenMl', { valueAsNumber: true })} />
          </Field>
          <Field label="Nombre de prélèvements réalisés">
            <NumberInput {...register('fiche.data.volumeGlobal.nombrePrelevementsRealises', { valueAsNumber: true })} />
          </Field>
          <Field label="Volume global théorique (L)">
            <NumberInput {...register('fiche.data.volumeGlobal.volumeGlobalTheoriqueL', { valueAsNumber: true })} />
          </Field>
          <Field label="Poids flacon début (kg)">
            <NumberInput {...register('fiche.data.volumeGlobal.poidsFlaconDebutKg', { valueAsNumber: true })} />
          </Field>
          <Field label="Poids flacon fin (kg)">
            <NumberInput {...register('fiche.data.volumeGlobal.poidsFlaconFinKg', { valueAsNumber: true })} />
          </Field>
          <Field label="Poids échantillon fin (kg)">
            <NumberInput {...register('fiche.data.volumeGlobal.poidsEchantillonFinKg', { valueAsNumber: true })} />
          </Field>
          <div className="md:col-span-2">
            <ConformityBadge label="Conformité volume global (calculée)" result={volumeGlobal} />
          </div>
          <Field label="Volume rejeté (m³)">
            <NumberInput {...register('fiche.data.volumeGlobal.volumeRejeteM3', { valueAsNumber: true })} />
          </Field>
          <Field label="Nombre prélèvements attendus" hint="volume rejeté / asservissement">
            <NumberInput {...register('fiche.data.volumeGlobal.nombrePrelevementsAttendus', { valueAsNumber: true })} />
          </Field>
          <div className="md:col-span-2">
            <ConformityBadge label="Ratio prélèvements (calculé, seuil ≥ 95 %)" result={ratioPrelevements} />
          </div>
        </FieldGrid>

        <h3 className="text-sm font-semibold text-slate-700 mt-5 mb-2">Température de l'enceinte (5 ± 3 °C)</h3>
        <FieldGrid cols={2}>
          <Field label="Début bilan (°C)">
            <NumberInput {...register('fiche.data.tempEnceinte.debutC', { valueAsNumber: true })} />
          </Field>
          <Field label="Fin bilan (°C)">
            <NumberInput {...register('fiche.data.tempEnceinte.finC', { valueAsNumber: true })} />
          </Field>
        </FieldGrid>
        <div className="mt-3">
          <ConformityBadge label="Conformité température enceinte (calculée)" result={tempEnceinte} />
        </div>
      </Section>

      {/* ─────── 8. Mesures in situ ─────── */}
      <Section title="Mesures in situ" fillState={fs.mesuresInSitu}>
        <Field label="Type de mesure">
          <Controller
            control={control}
            name="fiche.data.mesuresInSitu.typeMesure"
            render={({ field }) => (
              <RadioGroup
                name="typeMes"
                value={field.value as 'ponctuelle_in_situ' | 'ponctuelle_sur_site' | 'sous_echantillon' | 'en_continu' | undefined}
                onChange={field.onChange}
                options={[
                  { value: 'ponctuelle_in_situ', label: 'Ponctuelle in situ' },
                  { value: 'ponctuelle_sur_site', label: 'Ponctuelle sur site' },
                  { value: 'sous_echantillon', label: 'Sous-échantillon' },
                  { value: 'en_continu', label: 'En continu' },
                ]}
              />
            )}
          />
        </Field>
        <FieldGrid cols={2}>
          <Field label="T°C échantillon">
            <NumberInput {...register('fiche.data.mesuresInSitu.tempEchantillonC', { valueAsNumber: true })} />
          </Field>
          <Field label="T°C effluent">
            <NumberInput {...register('fiche.data.mesuresInSitu.tempEffluentC', { valueAsNumber: true })} />
          </Field>
          <Field label="pH">
            <NumberInput step="0.01" {...register('fiche.data.mesuresInSitu.pH', { valueAsNumber: true })} />
          </Field>
          <Field label="T°C de mesure pH">
            <NumberInput {...register('fiche.data.mesuresInSitu.pHTempMesureC', { valueAsNumber: true })} />
          </Field>
          <Field label="Conductivité (µS/cm)">
            <NumberInput {...register('fiche.data.mesuresInSitu.conductiviteUsCm', { valueAsNumber: true })} />
          </Field>
          <Field label="Code appareil + sondes">
            <TextInput {...register('fiche.data.mesuresInSitu.codeAppareilSondes')} />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 9. Constitution ─────── */}
      <Section title="Constitution et transport de l'échantillon" defaultOpen={false} fillState={fs.constitution}>
        <Field label="Homogénéisation">
          <Controller
            control={control}
            name="fiche.data.constitution.homogenisation"
            render={({ field }) => (
              <RadioGroup
                name="homogen"
                value={field.value as 'mecanique' | 'manuelle' | undefined}
                onChange={field.onChange}
                options={[
                  { value: 'mecanique', label: 'Mécanique' },
                  { value: 'manuelle', label: 'Manuelle' },
                ]}
              />
            )}
          />
        </Field>
      </Section>

      {/* ─────── 10. Réception laboratoire ─────── */}
      <Section title="Réception au laboratoire" defaultOpen={false} fillState={fs.receptionLabo}>
        <FieldGrid cols={2}>
          <Field label="Date de réception">
            <TextInput type="date" {...register('receptionLabo.dateReception')} />
          </Field>
          <Field label="Heure de réception">
            <TextInput type="time" {...register('receptionLabo.heureReception')} />
          </Field>
          <Field label="T° à réception (°C)">
            <NumberInput {...register('receptionLabo.tempReception', { valueAsNumber: true })} />
          </Field>
          <Field label="T° enceinte (°C)" hint="5 ± 3 °C">
            <NumberInput {...register('receptionLabo.tempEnceinte', { valueAsNumber: true })} />
          </Field>
          <Field label="Conformité enceinte">
            <Controller
              control={control}
              name="receptionLabo.tempEnceinteConformite"
              render={({ field }) => (
                <RadioGroup
                  name="recConf"
                  value={field.value as 'conforme' | 'non_conforme' | undefined}
                  onChange={field.onChange}
                  options={[
                    { value: 'conforme', label: 'Conforme' },
                    { value: 'non_conforme', label: 'Non conforme (FAC)' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Remarques" className="md:col-span-2">
            <TextArea {...register('receptionLabo.remarques')} />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 11. Observations ─────── */}
      <Section title="Observations" fillState={fs.observations}>
        <FieldGrid cols={1}>
          <Field label="Conditions météo">
            <Controller
              control={control}
              name="observations.meteo"
              render={({ field }) => (
                <RadioGroup
                  name="meteo"
                  value={field.value as 'sec_ensoleille' | 'sec_couvert' | 'humide' | 'pluie_fine' | 'pluie_forte' | 'orage' | 'neige' | 'gel' | undefined}
                  onChange={field.onChange}
                  options={[
                    { value: 'sec_ensoleille', label: 'Sec ensoleillé' },
                    { value: 'sec_couvert', label: 'Sec couvert' },
                    { value: 'humide', label: 'Humide' },
                    { value: 'pluie_fine', label: 'Pluie fine' },
                    { value: 'pluie_forte', label: 'Pluie forte' },
                    { value: 'orage', label: 'Orage' },
                    { value: 'neige', label: 'Neige' },
                    { value: 'gel', label: 'Gel' },
                  ]}
                />
              )}
            />
          </Field>
        </FieldGrid>
        <FieldGrid cols={2}>
          <Field label="Changement du point d'échantillonnage — motif">
            <TextInput {...register('observations.changementPointMotif')} />
          </Field>
          <Field label="Client prévenu le">
            <TextInput type="datetime-local" {...register('observations.clientPrevenuLe')} />
          </Field>
          <Field label="Autres observations" className="md:col-span-2">
            <TextArea {...register('observations.observations')} placeholder="Couleur, limpidité, odeur, événements particuliers…" />
          </Field>
        </FieldGrid>
      </Section>
    </div>
  )
}
