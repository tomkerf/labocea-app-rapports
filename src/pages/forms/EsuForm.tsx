import { useFormContext, Controller, useWatch } from 'react-hook-form'
import { Section, FieldGrid } from '../../components/ui/Section'
import { Field, TextInput, NumberInput, Select, TextArea } from '../../components/ui/Field'
import { RadioGroup, CheckboxRow } from '../../components/ui/Radio'
import type { Intervention } from '../../schemas/intervention'
import { fillStateOf } from '../../lib/fillState'

/**
 * Formulaire pour fiche PENV-SU-0117 (eaux superficielles).
 * Le composant suppose un FormProvider parent fournissant `Intervention` typé.
 */
export default function EsuForm() {
  const { register, control } = useFormContext<Intervention>()

  const all = useWatch<Intervention>({ control })
  const fiche = all?.fiche?.typeFiche === 'ESU' ? all.fiche.data : undefined

  const typeMilieu = fiche?.localisation?.typeMilieu
  const modePrel = fiche?.modePrelevement?.mode
  const estCotier = typeMilieu === 'estuaire' || typeMilieu === 'eau_cotiere'

  const fs = {
    identification: fillStateOf(all?.identification),
    localisation: fillStateOf(fiche?.localisation),
    materiel: fillStateOf(fiche?.materiel),
    modePrelevement: fillStateOf(fiche?.modePrelevement),
    mesuresInSitu: fillStateOf(fiche?.mesuresInSitu),
    metrologie: fillStateOf(fiche?.metrologie),
    observations: fillStateOf(all?.observations),
    receptionLabo: fillStateOf(all?.receptionLabo),
  }

  return (
    <div className="space-y-3">
      {/* ─────── 1. Identification ─────── */}
      <Section
        title="Identification"
        description="Client, site, opérateur, dates"
        fillState={fs.identification}
      >
        <FieldGrid cols={2}>
          <Field label="Client" required>
            <TextInput
              {...register('identification.client')}
              placeholder="Nom du client"
              autoCapitalize="words"
            />
          </Field>
          <Field label="N° convention / devis">
            <TextInput
              {...register('identification.numConventionDevis')}
              placeholder="Ex : DEV-2025-042"
            />
          </Field>
          <Field label="Site" required>
            <TextInput
              {...register('identification.site')}
              placeholder="Nom ou code du site"
              autoCapitalize="words"
            />
          </Field>
          <Field label="Opérateur" required>
            <TextInput
              {...register('identification.operateur')}
              placeholder="Prénom NOM"
              autoCapitalize="words"
            />
          </Field>
          <Field label="Date / heure prélèvement" required>
            <TextInput
              type="datetime-local"
              {...register('identification.dateDebut')}
            />
          </Field>
          <Field label="Date / heure fin (si composite)">
            <TextInput
              type="datetime-local"
              {...register('identification.dateFin')}
            />
          </Field>
          <Field label="Nature de l'échantillon" className="md:col-span-2">
            <TextInput
              {...register('identification.natureEchantillon')}
              placeholder="Ex : eau de rivière, eau superficielle côtière…"
            />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 2. Localisation et description du milieu ─────── */}
      <Section
        title="Localisation et milieu"
        description="Type de milieu aquatique, conditions hydrologiques"
        fillState={fs.localisation}
       
      >
        <FieldGrid cols={2}>
          <Field label="Identification exacte du point" className="md:col-span-2">
            <TextInput
              {...register('fiche.data.localisation.identificationExacte')}
              placeholder="Code point, nom du cours d'eau, station…"
            />
          </Field>

          <Field label="Type de milieu" className="md:col-span-2">
            <Controller
              control={control}
              name="fiche.data.localisation.typeMilieu"
              render={({ field }) => (
                <RadioGroup
                  name="typeMilieu"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'cours_eau', label: 'Cours d\'eau' },
                    { value: 'plan_eau', label: 'Plan d\'eau' },
                    { value: 'estuaire', label: 'Estuaire' },
                    { value: 'eau_cotiere', label: 'Eau côtière' },
                    { value: 'eau_residuaire_urb', label: 'Eau résiduaire urb.' },
                    { value: 'eau_residuaire_ind', label: 'Eau résiduaire ind.' },
                    { value: 'autre', label: 'Autre' },
                  ]}
                />
              )}
            />
          </Field>
          {typeMilieu === 'autre' && (
            <Field label="Préciser le type">
              <TextInput {...register('fiche.data.localisation.typeMilieuAutre')} />
            </Field>
          )}

          <Field label="Conditions hydrologiques">
            <Controller
              control={control}
              name="fiche.data.localisation.conditionsHydro"
              render={({ field }) => (
                <RadioGroup
                  name="conditionsHydro"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'etiage', label: 'Étiage' },
                    { value: 'hautes_eaux', label: 'Hautes eaux' },
                    { value: 'crue', label: 'Crue' },
                    { value: 'conditions_normales', label: 'Normales' },
                    { value: 'inconnues', label: 'Inconnues' },
                  ]}
                />
              )}
            />
          </Field>

          {(typeMilieu === 'cours_eau') && (
            <>
              <Field label="Largeur du milieu (m)">
                <NumberInput
                  {...register('fiche.data.localisation.largeurMilieuM', { valueAsNumber: true })}
                  placeholder="Ex : 8"
                />
              </Field>
              <Field label="Vitesse d'écoulement estimée (m/s)">
                <NumberInput
                  {...register('fiche.data.localisation.vitesseEcoulementMs', { valueAsNumber: true })}
                  step="0.01"
                  placeholder="Ex : 0.35"
                />
              </Field>
            </>
          )}

          <Field label="Profondeur au point de prélèvement (m)">
            <NumberInput
              {...register('fiche.data.localisation.profondeurMilieuM', { valueAsNumber: true })}
              step="0.1"
              placeholder="Ex : 1.5"
            />
          </Field>
          <Field label="Profondeur effective de prise d'eau (m)">
            <NumberInput
              {...register('fiche.data.localisation.profondeurPrelevementM', { valueAsNumber: true })}
              step="0.1"
              placeholder="Ex : 0.5"
            />
          </Field>

          <Field label="Aspect visuel" className="md:col-span-2">
            <TextInput
              {...register('fiche.data.localisation.aspectVisuel')}
              placeholder="Couleur, mousse, turbidité visuelle, présence de matières en suspension…"
            />
          </Field>
          <Field label="Odeur">
            <TextInput
              {...register('fiche.data.localisation.odeur')}
              placeholder="Aucune, septique, hydrocarbures…"
            />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 3. Matériel de prélèvement ─────── */}
      <Section
        title="Matériel de prélèvement"
        description="Type et matériau de l'équipement utilisé"
        fillState={fs.materiel}
       
      >
        <FieldGrid cols={2}>
          <Field label="Type de matériel" className="md:col-span-2">
            <Controller
              control={control}
              name="fiche.data.materiel.type"
              render={({ field }) => (
                <RadioGroup
                  name="typeMaterielEsu"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'seau', label: 'Seau' },
                    { value: 'flacon_direct', label: 'Flacon direct' },
                    { value: 'pompe_peristaltique', label: 'Pompe péristaltique' },
                    { value: 'pompe_immergee', label: 'Pompe immergée' },
                    { value: 'kumba', label: 'Kumba' },
                    { value: 'preleveur_automatique', label: 'Préleveur auto' },
                    { value: 'autre', label: 'Autre' },
                  ]}
                />
              )}
            />
          </Field>
          {fiche?.materiel?.type === 'autre' && (
            <Field label="Préciser le matériel">
              <TextInput {...register('fiche.data.materiel.typeAutre')} />
            </Field>
          )}

          <Field label="Matériau du matériel">
            <Controller
              control={control}
              name="fiche.data.materiel.materiau"
              render={({ field }) => (
                <RadioGroup
                  name="materiauMaterielEsu"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'inox', label: 'Inox' },
                    { value: 'pvc', label: 'PVC' },
                    { value: 'pehd', label: 'PEHD' },
                    { value: 'verre', label: 'Verre' },
                    { value: 'autre', label: 'Autre' },
                  ]}
                />
              )}
            />
          </Field>

          <div className="md:col-span-2 space-y-1">
            <Controller
              control={control}
              name="fiche.data.materiel.nettoyageAvant"
              render={({ field }) => (
                <CheckboxRow
                  checked={field.value}
                  onChange={field.onChange}
                  label="Nettoyage du matériel avant prélèvement"
                />
              )}
            />
            <Controller
              control={control}
              name="fiche.data.materiel.rinçageAvant"
              render={({ field }) => (
                <CheckboxRow
                  checked={field.value}
                  onChange={field.onChange}
                  label="Rinçage avec l'eau du milieu avant prélèvement"
                />
              )}
            />
          </div>
        </FieldGrid>
      </Section>

      {/* ─────── 4. Mode de prélèvement ─────── */}
      <Section
        title="Mode de prélèvement"
        description="Ponctuel, composite manuel ou asservi"
        fillState={fs.modePrelevement}
       
      >
        <FieldGrid cols={2}>
          <Field label="Mode" className="md:col-span-2">
            <Controller
              control={control}
              name="fiche.data.modePrelevement.mode"
              render={({ field }) => (
                <RadioGroup
                  name="modePrelEsu"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'ponctuel', label: 'Ponctuel' },
                    { value: 'composite_manuel', label: 'Composite manuel' },
                    { value: 'composite_asservi', label: 'Composite asservi' },
                  ]}
                />
              )}
            />
          </Field>

          {modePrel === 'composite_manuel' && (
            <>
              <Field label="Nombre de prises élémentaires">
                <NumberInput
                  {...register('fiche.data.modePrelevement.nombrePrises', { valueAsNumber: true })}
                  placeholder="Ex : 4"
                />
              </Field>
              <Field label="Intervalle entre prises (min)">
                <NumberInput
                  {...register('fiche.data.modePrelevement.intervalleMin', { valueAsNumber: true })}
                  placeholder="Ex : 30"
                />
              </Field>
              <Field label="Volume par prise (mL)">
                <NumberInput
                  {...register('fiche.data.modePrelevement.volumeParPriseML', { valueAsNumber: true })}
                  placeholder="Ex : 250"
                />
              </Field>
            </>
          )}

          {modePrel === 'composite_asservi' && (
            <>
              <Field label="Type d'asservissement">
                <Controller
                  control={control}
                  name="fiche.data.modePrelevement.asservissementType"
                  render={({ field }) => (
                    <RadioGroup
                      name="asservissementType"
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: 'volume', label: 'Volume' },
                        { value: 'debit', label: 'Débit' },
                        { value: 'temps', label: 'Temps' },
                      ]}
                    />
                  )}
                />
              </Field>
              <Field label="Valeur d'asservissement">
                <TextInput
                  {...register('fiche.data.modePrelevement.asservissementValeur')}
                  placeholder="Ex : 1 L / 100 m³"
                />
              </Field>
            </>
          )}

          <Field label="Volume total collecté (mL)">
            <NumberInput
              {...register('fiche.data.modePrelevement.volumeTotalMl', { valueAsNumber: true })}
              placeholder="Ex : 1000"
            />
          </Field>
          <Field label="Matériau du flacon">
            <Controller
              control={control}
              name="fiche.data.modePrelevement.flaconMateriau"
              render={({ field }) => (
                <RadioGroup
                  name="flaconMateriauEsu"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'pe', label: 'PE' },
                    { value: 'verre', label: 'Verre' },
                    { value: 'autre', label: 'Autre' },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Homogénéisation">
            <Controller
              control={control}
              name="fiche.data.modePrelevement.homogenisation"
              render={({ field }) => (
                <RadioGroup
                  name="homogenisationEsu"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'mecanique', label: 'Mécanique' },
                    { value: 'manuelle', label: 'Manuelle' },
                  ]}
                />
              )}
            />
          </Field>
          <div className="md:col-span-2 space-y-1">
            <Controller
              control={control}
              name="fiche.data.modePrelevement.conservationAcide"
              render={({ field }) => (
                <CheckboxRow
                  checked={field.value}
                  onChange={field.onChange}
                  label="Conservation acide"
                />
              )}
            />
            <Controller
              control={control}
              name="fiche.data.modePrelevement.conservationFroid"
              render={({ field }) => (
                <CheckboxRow
                  checked={field.value}
                  onChange={field.onChange}
                  label="Conservation au froid (< 4 °C)"
                />
              )}
            />
          </div>
        </FieldGrid>
      </Section>

      {/* ─────── 5. Mesures in situ ─────── */}
      <Section
        title="Mesures in situ"
        description="Paramètres physico-chimiques mesurés sur le terrain"
        fillState={fs.mesuresInSitu}
       
      >
        <FieldGrid cols={2}>
          <Field label="Code appareil / sondes">
            <TextInput
              {...register('fiche.data.mesuresInSitu.codeAppareilSondes')}
              placeholder="Ex : SON-034"
            />
          </Field>
          <Field label="Température (°C)">
            <NumberInput
              {...register('fiche.data.mesuresInSitu.tempC', { valueAsNumber: true })}
              step="0.1"
              placeholder="Ex : 14.2"
            />
          </Field>
          <Field label="pH">
            <NumberInput
              {...register('fiche.data.mesuresInSitu.pH', { valueAsNumber: true })}
              step="0.01"
              placeholder="Ex : 7.85"
            />
          </Field>
          <Field label="Température de mesure pH (°C)">
            <NumberInput
              {...register('fiche.data.mesuresInSitu.pHTempMesureC', { valueAsNumber: true })}
              step="0.1"
              placeholder="Ex : 14.0"
            />
          </Field>
          <Field label="Conductivité (µS/cm)">
            <NumberInput
              {...register('fiche.data.mesuresInSitu.conductiviteUsCm', { valueAsNumber: true })}
              step="1"
              placeholder="Ex : 425"
            />
          </Field>
          <Field label="O₂ dissous (mg/L)">
            <NumberInput
              {...register('fiche.data.mesuresInSitu.o2DissousMgL', { valueAsNumber: true })}
              step="0.01"
              placeholder="Ex : 9.82"
            />
          </Field>
          <Field label="O₂ dissous (% sat.)">
            <NumberInput
              {...register('fiche.data.mesuresInSitu.o2DissouspPct', { valueAsNumber: true })}
              step="0.1"
              placeholder="Ex : 98.5"
            />
          </Field>
          <Field label="Potentiel Redox (mV)">
            <NumberInput
              {...register('fiche.data.mesuresInSitu.redoxMv', { valueAsNumber: true })}
              step="1"
              placeholder="Ex : +285"
            />
          </Field>
          <Field label="Turbidité (FTU)">
            <NumberInput
              {...register('fiche.data.mesuresInSitu.turbiditeFTU', { valueAsNumber: true })}
              step="0.1"
              placeholder="Ex : 12.4"
            />
          </Field>
          {estCotier && (
            <Field label="Salinité (‰ / PSU)">
              <NumberInput
                {...register('fiche.data.mesuresInSitu.salinitePpt', { valueAsNumber: true })}
                step="0.1"
                placeholder="Ex : 28.5"
              />
            </Field>
          )}
          {typeMilieu === 'cours_eau' && (
            <Field label="Débit mesuré (m³/s)">
              <NumberInput
                {...register('fiche.data.mesuresInSitu.debitM3S', { valueAsNumber: true })}
                step="0.001"
                placeholder="Ex : 2.340"
              />
            </Field>
          )}
        </FieldGrid>
      </Section>

      {/* ─────── 6. Métrologie ─────── */}
      <Section
        title="Métrologie"
        description="Codes des équipements utilisés"
        fillState={fs.metrologie}
       
      >
        <FieldGrid cols={2}>
          <Field label="Code sonde multiparamètre">
            <TextInput {...register('fiche.data.metrologie.codeSondeMultiparametre')} placeholder="Ex : SON-034" />
          </Field>
          <Field label="Code flacon(s)">
            <TextInput {...register('fiche.data.metrologie.codeFlacon')} placeholder="Ex : FLA-056" />
          </Field>
          <Field label="Code matériel de prélèvement">
            <TextInput {...register('fiche.data.metrologie.codeMaterielPrelevement')} placeholder="Ex : SEA-012" />
          </Field>
          <Field label="Code chronomètre">
            <TextInput {...register('fiche.data.metrologie.codeChronometre')} placeholder="Ex : CHR-090" />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 7. Observations ─────── */}
      <Section
        title="Observations"
        description="Météo, remarques terrain"
        fillState={fs.observations}
       
      >
        <FieldGrid cols={2}>
          <Field label="Conditions météo">
            <Controller
              control={control}
              name="observations.meteo"
              render={({ field }) => (
                <Select value={field.value ?? ''} onChange={field.onChange}>
                  <option value="">— Choisir —</option>
                  <option value="sec_ensoleille">Sec, ensoleillé</option>
                  <option value="sec_couvert">Sec, couvert</option>
                  <option value="humide">Humide</option>
                  <option value="pluie_fine">Pluie fine</option>
                  <option value="pluie_forte">Pluie forte</option>
                  <option value="orage">Orage</option>
                  <option value="neige">Neige</option>
                  <option value="gel">Gel</option>
                </Select>
              )}
            />
          </Field>
          <Field label="Client prévenu le">
            <TextInput type="date" {...register('observations.clientPrevenuLe')} />
          </Field>
          <Field label="Changement de point — motif" className="md:col-span-2">
            <TextInput
              {...register('observations.changementPointMotif')}
              placeholder="Laisser vide si point inchangé"
            />
          </Field>
          <Field label="Observations générales" className="md:col-span-2">
            <TextArea
              {...register('observations.observations')}
              placeholder="Remarques terrain, anomalies, conditions particulières…"
              rows={4}
            />
          </Field>
        </FieldGrid>
      </Section>

      {/* ─────── 8. Réception laboratoire ─────── */}
      <Section
        title="Réception laboratoire"
        description="À remplir à la réception des échantillons"
        fillState={fs.receptionLabo}
       
      >
        <FieldGrid cols={2}>
          <Field label="Date de réception">
            <TextInput type="date" {...register('receptionLabo.dateReception')} />
          </Field>
          <Field label="Heure de réception">
            <TextInput type="time" {...register('receptionLabo.heureReception')} />
          </Field>
          <Field label="Température à réception (°C)">
            <NumberInput
              {...register('receptionLabo.tempReception', { valueAsNumber: true })}
              step="0.1"
              placeholder="Ex : 4.5"
            />
          </Field>
          <Field label="Température enceinte (°C)">
            <NumberInput
              {...register('receptionLabo.tempEnceinte', { valueAsNumber: true })}
              step="0.1"
              placeholder="Ex : 4.8"
            />
          </Field>
          <Field label="Conformité température enceinte">
            <Controller
              control={control}
              name="receptionLabo.tempEnceinteConformite"
              render={({ field }) => (
                <RadioGroup
                  name="tempEnceinteConformiteEsu"
                  value={field.value}
                  onChange={field.onChange}
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
            <TextArea
              {...register('receptionLabo.remarques')}
              placeholder="Remarques à la réception…"
              rows={3}
            />
          </Field>
        </FieldGrid>
      </Section>
    </div>
  )
}
