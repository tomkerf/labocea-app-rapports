import { useFormContext, Controller, useWatch, useFieldArray } from 'react-hook-form'
import { Section, FieldGrid } from '../../components/ui/Section'
import { Field, TextInput, NumberInput, Select, TextArea } from '../../components/ui/Field'
import { RadioGroup, CheckboxRow } from '../../components/ui/Radio'
import MesuresPurgeTable from '../../components/ui/MesuresPurgeTable'
import EquipementPicker from '../../components/ui/EquipementPicker'
import type { Intervention } from '../../schemas/intervention'
import { fillStateOf } from '../../lib/fillState'

/**
 * Formulaire PENV-SU-0114 — Sites et sols pollués (NF X 31-615).
 */
export default function EsoSspForm() {
  const { register, control } = useFormContext<Intervention>()
  const all = useWatch<Intervention>({ control })
  const fiche = all?.fiche?.typeFiche === 'ESO_SSP' ? all.fiche.data : undefined

  const gestionAutre = fiche?.purge?.gestionEauxPurge === 'autre'

  const { fields: mesures, append: appendMesure, remove: removeMesure } = useFieldArray({
    control,
    name: 'fiche.data.suiviPhysicoChimique.mesures' as never,
  })

  const fs = {
    identification: fillStateOf(all?.identification),
    metrologie: fillStateOf(fiche?.metrologie),
    ouvrage: fillStateOf(fiche?.descriptionOuvrage),
    purge: fillStateOf(fiche?.purge),
    suivi: fillStateOf(fiche?.suiviPhysicoChimique?.mesures),
    params: fillStateOf(fiche?.paramsFinPompage),
    prelevement: fillStateOf(fiche?.prelevement),
    observations: fillStateOf(fiche?.observations),
    receptionLabo: fillStateOf(all?.receptionLabo),
  }

  return (
    <div className="space-y-3">
      {/* ─────── 1. Identification ─────── */}
      <Section title="Identification" fillState={fs.identification}>
        <FieldGrid cols={2}>
          <Field label="Client" required>
            <TextInput {...register('identification.client')} placeholder="Nom du client" autoCapitalize="words" />
          </Field>
          <Field label="N° convention / devis">
            <TextInput {...register('identification.numConventionDevis')} placeholder="Ex : DEV-2025-042" />
          </Field>
          <Field label="Nom de l'ouvrage">
            <TextInput {...register('fiche.data.nomOuvrage')} placeholder="Ex : Pz-03 SSP" autoCapitalize="words" />
          </Field>
          <Field label="Lieu / site" required>
            <TextInput {...register('identification.site')} placeholder="Nom ou code du site" autoCapitalize="words" />
          </Field>
          <Field label="Identité préleveur" required>
            <TextInput {...register('identification.operateur')} placeholder="Prénom NOM" autoCapitalize="words" />
          </Field>
          <Field label="Date de prélèvement" required>
            <TextInput type="date" {...register('identification.dateDebut')} />
          </Field>
          <Field label="Heure début purge">
            <TextInput type="time" {...register('fiche.data.heureDebutPurge')} />
          </Field>
          <Field label="Heure fin purge">
            <TextInput type="time" {...register('fiche.data.heureFinPurge')} />
          </Field>
          <Field label="Heure début prélèvement">
            <TextInput type="time" {...register('fiche.data.heureDebutPrelevement')} />
          </Field>
          <Field label="Heure fin prélèvement">
            <TextInput type="time" {...register('fiche.data.heureFinPrelevement')} />
          </Field>
          <Field label="Conditions climatiques" className="md:col-span-2">
            <Controller
              control={control}
              name="observations.meteo"
              render={({ field }) => (
                <Select value={field.value ?? ''} onChange={field.onChange}>
                  <option value="">— Choisir —</option>
                  <option value="sec_ensoleille">Sec ensoleillé</option>
                  <option value="sec_couvert">Sec couvert</option>
                  <option value="humide">Humide</option>
                  <option value="pluie_fine">Pluie</option>
                  <option value="orage">Orage</option>
                  <option value="neige">Neige</option>
                  <option value="gel">Gel</option>
                </Select>
              )}
            />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 2. Métrologie ─────── */}
      <Section title="Métrologie" description="Références des équipements" fillState={fs.metrologie}>
        <FieldGrid cols={2}>
          <Field label="Référence pompe">
            <Controller control={control} name="fiche.data.metrologie.referencePompe"
              render={({ field }) => (
                <EquipementPicker categories={['pompe_pz']} value={field.value} onChange={field.onChange} placeholder="Ex : POM-012" />
              )} />
          </Field>
          <Field label="Référence tuyau">
            <TextInput {...register('fiche.data.metrologie.referenceTuyau')} placeholder="Ex : TUY-034" />
          </Field>
          <Field label="Référence sonde">
            <Controller control={control} name="fiche.data.metrologie.referenceSonde"
              render={({ field }) => (
                <EquipementPicker categories={['sonde_niveau', 'multiparametre']} value={field.value} onChange={field.onChange} placeholder="Ex : SON-056" />
              )} />
          </Field>
          <Field label="Référence chronomètre">
            <Controller control={control} name="fiche.data.metrologie.referenceChronometreSonde"
              render={({ field }) => (
                <EquipementPicker categories={['chronometre']} value={field.value} onChange={field.onChange} placeholder="Ex : CHR-078" />
              )} />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 3. Description de l'ouvrage ─────── */}
      <Section title="Description de l'ouvrage" fillState={fs.ouvrage}>
        <FieldGrid cols={2}>
          <Field label="État margelle / capot / tête">
            <Controller
              control={control}
              name="fiche.data.descriptionOuvrage.etatMargelle"
              render={({ field }) => (
                <RadioGroup name="etatMargelleSSP" value={field.value} onChange={field.onChange}
                  options={[
                    { value: 'bon', label: 'Bon' },
                    { value: 'degrade', label: 'Dégradé' },
                    { value: 'absent', label: 'Absent' },
                    { value: 'nc', label: 'NC' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Diamètre intérieur (mm)">
            <NumberInput {...register('fiche.data.descriptionOuvrage.diametreInterieurMm', { valueAsNumber: true })} placeholder="Ex : 100" />
          </Field>
          <Field label="Hauteur zone crépinée (m)">
            <NumberInput {...register('fiche.data.descriptionOuvrage.hauteurZoneCrepineeM', { valueAsNumber: true })} step="0.1" />
          </Field>
          <div>
            <Controller
              control={control}
              name="fiche.data.descriptionOuvrage.crepineNC"
              render={({ field }) => (
                <CheckboxRow checked={field.value} onChange={field.onChange} label="NC (zone crépinée non connue)" />
              )}
            />
          </div>
          <Field label="Tube crépiné — de (m)">
            <NumberInput {...register('fiche.data.descriptionOuvrage.crepinemDeM', { valueAsNumber: true })} step="0.1" placeholder="Prof. haut" />
          </Field>
          <Field label="Tube crépiné — à (m)">
            <NumberInput {...register('fiche.data.descriptionOuvrage.crepinemAM', { valueAsNumber: true })} step="0.1" placeholder="Prof. bas" />
          </Field>
          <Field label="Type de repère">
            <Controller
              control={control}
              name="fiche.data.descriptionOuvrage.typeRepere"
              render={({ field }) => (
                <RadioGroup name="typeRepereSSP" value={field.value} onChange={field.onChange}
                  options={[
                    { value: 'haut_tube', label: 'Haut du tube' },
                    { value: 'fourreau', label: 'Fourreau' },
                    { value: 'margelle', label: 'Margelle' },
                    { value: 'autre', label: 'Autre' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Hauteur du repère / sol (m)">
            <NumberInput {...register('fiche.data.descriptionOuvrage.hauteurRepere_solM', { valueAsNumber: true })} step="0.01" />
          </Field>
          <Field label="Profondeur mesurée P (m)">
            <NumberInput {...register('fiche.data.descriptionOuvrage.profondeurMesureeP_M', { valueAsNumber: true })} step="0.01" placeholder="Fond de l'ouvrage" />
          </Field>
          <Field label="Toit piézo avant purge N (m/repère)">
            <NumberInput {...register('fiche.data.descriptionOuvrage.toitPiezoAvantPurgeN_M', { valueAsNumber: true })} step="0.01" />
          </Field>
          <Field label="Hauteur colonne d'eau H (m)" hint="H = P − N">
            <NumberInput {...register('fiche.data.descriptionOuvrage.hauteurColonneEauH_M', { valueAsNumber: true })} step="0.01" />
          </Field>
          <Field label="Rabattement max R (m)">
            <NumberInput {...register('fiche.data.descriptionOuvrage.rabattementMaxR_M', { valueAsNumber: true })} step="0.01" />
          </Field>
          <Field label="Volume colonne d'eau Vc (L)">
            <NumberInput {...register('fiche.data.descriptionOuvrage.volumeColonneEauVc_L', { valueAsNumber: true })} step="0.1" />
          </Field>

          {/* ── Champs spécifiques SSP ── */}
          <Field label="Volume massif filtrant Vm (L)">
            <NumberInput
              {...register('fiche.data.descriptionOuvrage.volumeMassifFiltrantVm_L' as never, { valueAsNumber: true })}
              step="0.1"
            />
          </Field>
          <Field label="Volume eau ouvrage Vp = Vc + Vm (L)">
            <NumberInput
              {...register('fiche.data.descriptionOuvrage.volumeEauOuvrageVp_L' as never, { valueAsNumber: true })}
              step="0.1"
            />
          </Field>

          <Field label="Volume min à purger (3 à 5 × Vp) (L)" className="md:col-span-2">
            <NumberInput {...register('fiche.data.volumeMinPurger_L', { valueAsNumber: true })} step="0.1" />
          </Field>

          {/* Phase flottante */}
          <Field label="Phase flottante">
            <Controller
              control={control}
              name={'fiche.data.descriptionOuvrage.phaseFlottante' as never}
              render={({ field }) => (
                <RadioGroup name="phaseFlottante" value={field.value === true ? 'oui' : field.value === false ? 'non' : undefined}
                  onChange={(v) => field.onChange(v === 'oui')}
                  options={[{ value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }]}
                />
              )}
            />
          </Field>
          {(fiche?.descriptionOuvrage as any)?.phaseFlottante === true && (
            <Field label="Épaisseur phase flottante (m)">
              <NumberInput
                {...register('fiche.data.descriptionOuvrage.phaseFlottanteEpaisseurM' as never, { valueAsNumber: true })}
                step="0.01"
              />
            </Field>
          )}

          {/* Phase plongeante */}
          <Field label="Phase plongeante">
            <Controller
              control={control}
              name={'fiche.data.descriptionOuvrage.phasePlongeante' as never}
              render={({ field }) => (
                <RadioGroup name="phasePlongeante" value={field.value === true ? 'oui' : field.value === false ? 'non' : undefined}
                  onChange={(v) => field.onChange(v === 'oui')}
                  options={[{ value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }]}
                />
              )}
            />
          </Field>
          {(fiche?.descriptionOuvrage as any)?.phasePlongeante === true && (
            <Field label="Épaisseur phase plongeante (m)">
              <NumberInput
                {...register('fiche.data.descriptionOuvrage.phasePlongeanteEpaisseurM' as never, { valueAsNumber: true })}
                step="0.01"
              />
            </Field>
          )}
        </FieldGrid>
      </Section>

      {/* ─────── 4. Purge ─────── */}
      <Section title="Purge" fillState={fs.purge}>
        <FieldGrid cols={2}>
          <Field label="Matériel utilisé" className="md:col-span-2">
            <Controller
              control={control}
              name="fiche.data.purge.materielUtilise"
              render={({ field }) => (
                <RadioGroup name="materielPurgeSsp" value={field.value} onChange={field.onChange}
                  options={[
                    { value: 'pompe_immergee_12v', label: 'Pompe immergée 12V' },
                    { value: 'preleveur_jetable', label: 'Préleveur jetable' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Position de la pompe (m)">
            <NumberInput {...register('fiche.data.purge.positionPompeM', { valueAsNumber: true })} step="0.1" />
          </Field>
          <Field label="Débit de purge (L/min)">
            <NumberInput {...register('fiche.data.purge.debitLMin', { valueAsNumber: true })} step="0.1" />
          </Field>
          <Field label="Toit piézo fin de purge (m)">
            <NumberInput {...register('fiche.data.purge.toitPiezoFinPurgeM', { valueAsNumber: true })} step="0.01" />
          </Field>
          <Field label="Rabattement début/fin (m)">
            <NumberInput {...register('fiche.data.purge.rabattementDebutFinM', { valueAsNumber: true })} step="0.01" />
          </Field>
          <Field label="Volume purgé (L)">
            <NumberInput {...register('fiche.data.purge.volumePurgeL', { valueAsNumber: true })} step="0.1" />
          </Field>
          <Field label="Volume purgé / Vp">
            <NumberInput {...register('fiche.data.purge.volumePurge_Vp', { valueAsNumber: true })} step="0.01" />
          </Field>
          <Field label="Critère fin de purge" className="md:col-span-2">
            <Controller
              control={control}
              name="fiche.data.purge.critereFinPurge"
              render={({ field }) => (
                <RadioGroup name="critereFinPurgeSsp" value={field.value} onChange={field.onChange} vertical
                  options={[
                    { value: 'stabilisation_params_in_situ', label: 'Stabilisation des paramètres in situ' },
                    { value: 'volume_3_5_vp', label: 'Volume 3 à 5 × Vp' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Gestion des eaux de purge" className="md:col-span-2">
            <Controller
              control={control}
              name="fiche.data.purge.gestionEauxPurge"
              render={({ field }) => (
                <RadioGroup name="gestionEauxPurgeSsp" value={field.value} onChange={field.onChange} vertical
                  options={[
                    { value: 'sol', label: 'Sol' },
                    { value: 'reseau_eu_ep', label: 'Réseau EU/EP' },
                    { value: 'stockage', label: 'Stockage' },
                    { value: 'autre', label: 'Autre' },
                  ]}
                />
              )}
            />
          </Field>
          {gestionAutre && (
            <Field label="Préciser la gestion" className="md:col-span-2">
              <TextInput {...register('fiche.data.purge.gestionEauxPurgeAutre')} placeholder="Préciser…" />
            </Field>
          )}
          <Field label="Si purge non réalisée — motif" className="md:col-span-2">
            <TextInput {...register('fiche.data.purge.motifPurgeNonRealisee')} placeholder="Ex : ouvrage non accessible" />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 5. Prélèvement ─────── */}
      <Section title="Prélèvement et conditionnement" fillState={fs.prelevement}>
        <FieldGrid cols={2}>
          <Field label="Matériel utilisé" className="md:col-span-2">
            <Controller
              control={control}
              name="fiche.data.prelevement.materielUtilise"
              render={({ field }) => (
                <RadioGroup name="materielPrelSsp" value={field.value} onChange={field.onChange}
                  options={[
                    { value: 'pompe_immergee_12v', label: 'Pompe immergée 12V' },
                    { value: 'preleveur_jetable', label: 'Préleveur jetable' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Position de la pompe (m)">
            <NumberInput {...register('fiche.data.prelevement.positionPompeM', { valueAsNumber: true })} step="0.1" />
          </Field>
          <Field label="Débit de prélèvement (L/min)">
            <NumberInput {...register('fiche.data.prelevement.debitLMin', { valueAsNumber: true })} step="0.1" />
          </Field>
          <Field label="Filtration sur site" className="md:col-span-2">
            <Controller
              control={control}
              name="fiche.data.prelevement.filtrationSurSite"
              render={({ field }) => (
                <RadioGroup name="filtrationSsp" value={field.value} onChange={field.onChange}
                  options={[
                    { value: 'oui', label: 'Oui' },
                    { value: 'non', label: 'Non' },
                    { value: 'sans_objet', label: 'Sans objet' },
                  ]}
                />
              )}
            />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 6. Suivi physico-chimique ─────── */}
      <Section
        title="Suivi physico-chimique"
        description="Mesures pendant la purge · stabilité : T ±0,2°C · pH ±0,1 upH · cond. 5 %/<500 ou 2 %/≥500 µS/cm sur 10 min"
        fillState={fs.suivi}
       
      >
        <MesuresPurgeTable
          mesures={mesures}
          appendMesure={appendMesure}
          removeMesure={removeMesure}
          basePath="fiche.data.suiviPhysicoChimique.mesures"
        />
      </Section>

      {/* ─────── 7. Paramètres fin de pompage ─────── */}
      <Section title="Paramètres physico-chimiques fin de pompage" fillState={fs.params}>
        <FieldGrid cols={2}>
          <Field label="T (°C)">
            <NumberInput {...register('fiche.data.paramsFinPompage.tempC', { valueAsNumber: true })} step="0.1" />
          </Field>
          <Field label="pH">
            <NumberInput {...register('fiche.data.paramsFinPompage.pH', { valueAsNumber: true })} step="0.01" />
          </Field>
          <Field label="Cond25 (µS/cm)">
            <NumberInput {...register('fiche.data.paramsFinPompage.conductivite25UsCm', { valueAsNumber: true })} step="1" />
          </Field>
          <Field label="Code appareil pH / T°">
            <TextInput {...register('fiche.data.paramsFinPompage.codeAppPareilPH')} placeholder="Ex : SON-056" />
          </Field>
          <Field label="Code appareil cond.">
            <TextInput {...register('fiche.data.paramsFinPompage.codeAppPareilCond')} placeholder="Ex : CON-012" />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 8. Observations ─────── */}
      <Section title="Observations" fillState={fs.observations}>
        <FieldGrid cols={2}>
          <Field label="Réalimentation de l'ouvrage" className="md:col-span-2">
            <Controller
              control={control}
              name="fiche.data.observations.realimentation"
              render={({ field }) => (
                <RadioGroup name="realimentationSsp" value={field.value} onChange={field.onChange}
                  options={[
                    { value: 'bonne', label: 'Bonne' },
                    { value: 'moyenne', label: 'Moyenne' },
                    { value: 'mauvaise', label: 'Mauvaise' },
                    { value: 'assechement', label: 'Assèchement' },
                  ]}
                />
              )}
            />
          </Field>
          <div className="md:col-span-2">
            <p className="text-xs font-medium text-slate-600 mb-2">Indices organoleptiques — pendant la purge</p>
            <FieldGrid cols={3}>
              <Field label="Couleur">
                <TextInput {...register('fiche.data.observations.indicesPurge.couleur')} placeholder="Incolore, jaunâtre…" />
              </Field>
              <Field label="Limpidité">
                <TextInput {...register('fiche.data.observations.indicesPurge.limpidite')} placeholder="Limpide, trouble…" />
              </Field>
              <Field label="Odeur">
                <TextInput {...register('fiche.data.observations.indicesPurge.odeur')} placeholder="Aucune, septique…" />
              </Field>
            </FieldGrid>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-medium text-slate-600 mb-2">Indices organoleptiques — prélèvement</p>
            <FieldGrid cols={3}>
              <Field label="Couleur">
                <TextInput {...register('fiche.data.observations.indicesPrelevement.couleur')} placeholder="Incolore…" />
              </Field>
              <Field label="Limpidité">
                <TextInput {...register('fiche.data.observations.indicesPrelevement.limpidite')} placeholder="Limpide…" />
              </Field>
              <Field label="Odeur">
                <TextInput {...register('fiche.data.observations.indicesPrelevement.odeur')} placeholder="Aucune…" />
              </Field>
            </FieldGrid>
          </div>
          <Field label="Autres observations" className="md:col-span-2">
            <TextArea {...register('fiche.data.observations.autresObservations')} rows={3}
              placeholder="Difficultés rencontrées, anomalies…" />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 9. Réception labo ─────── */}
      <Section title="Réception laboratoire" fillState={fs.receptionLabo}>
        <FieldGrid cols={2}>
          <Field label="Date de réception">
            <TextInput type="date" {...register('receptionLabo.dateReception')} />
          </Field>
          <Field label="Heure de réception">
            <TextInput type="time" {...register('receptionLabo.heureReception')} />
          </Field>
          <Field label="Température à réception (°C)">
            <NumberInput {...register('receptionLabo.tempReception', { valueAsNumber: true })} step="0.1" />
          </Field>
          <Field label="Température enceinte (°C)">
            <NumberInput {...register('receptionLabo.tempEnceinte', { valueAsNumber: true })} step="0.1" />
          </Field>
          <Field label="Conformité enceinte" className="md:col-span-2">
            <Controller
              control={control}
              name="receptionLabo.tempEnceinteConformite"
              render={({ field }) => (
                <RadioGroup name="tempEnceinteConformiteSsp" value={field.value} onChange={field.onChange}
                  options={[
                    { value: 'conforme', label: 'Conforme' },
                    { value: 'non_conforme', label: 'Non conforme' },
                    { value: 'sans_objet', label: 'Sans objet' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Remarques" className="md:col-span-2">
            <TextArea {...register('receptionLabo.remarques')} rows={2} />
          </Field>
        </FieldGrid>
      </Section>
    </div>
  )
}
