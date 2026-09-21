import { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from '../i18n/I18nProvider'
import { getFidyahItemsForRitual, FidyahItem, Ritual } from '../data/fidyah'
import { TIER_META } from '../data/fidyahTierMeta'
import { calculateFidyah, expandCounts, FidyahResult } from '../utils/fidyahCalculator'
import { obligationsFromResults } from '../utils/fidyahFulfillment'
import { addObligations } from '../services/fidyahFulfillmentStorage'
import {
  MinaInput, PebblesMissed, StoningDay, PEBBLE_LIMITS,
  minaStatus, minaFidyahIds, totalPebblesMissed, ramyFidyahIds, riteFidyahIds,
} from '../utils/hajjRites'
import { TranslationKey } from '../i18n/translations'

type T = ReturnType<typeof useTranslation>['t']

const PEBBLE_DAYS: { day: StoningDay; labelKey: TranslationKey }[] = [
  { day: 'nahr',      labelKey: 'fidyahRamyDayNahr' },
  { day: 'tashreeq1', labelKey: 'fidyahRamyDayTashreeq1' },
  { day: 'tashreeq2', labelKey: 'fidyahRamyDayTashreeq2' },
  { day: 'tashreeq3', labelKey: 'fidyahRamyDayTashreeq3' },
]

const DAM_IDS = ['mina_all_missed', 'ramy_dam']

function outcomeText(t: T, ids: string[]): string {
  if (ids.length === 0) return t('fidyahOutcomeNone')
  if (ids.some(id => DAM_IDS.includes(id))) return t('fidyahOutcomeDam')
  return t('fidyahOutcomeMudd', { count: ids.length })
}

function ToggleRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxDone]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.itemLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

function RoundButton({ icon, onPress, disabled }: { icon: 'add' | 'remove'; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.roundBtn, disabled && styles.roundBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name={icon} size={16} color={disabled ? '#ccc' : '#1a5f3f'} />
    </TouchableOpacity>
  )
}

function PebbleRow({ label, count, max, onChange }: {
  label: string
  count: number
  max: number
  onChange: (next: number) => void
}) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemLabel}>{label}</Text>
      <RoundButton icon="remove" disabled={count <= 0} onPress={() => onChange(count - 1)} />
      <Text style={styles.stepCount}>{count}/{max}</Text>
      <RoundButton icon="add" disabled={count >= max} onPress={() => onChange(count + 1)} />
    </View>
  )
}

function ItemRow({ item, count, onPress, onDecrement, onReset, t }: {
  item: FidyahItem
  count: number
  onPress: () => void
  onDecrement: () => void
  onReset: () => void
  t: T
}) {
  const checked = count > 0
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      onLongPress={checked ? onReset : undefined}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxDone]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.itemLabel}>{t(item.labelKey)}</Text>
      {checked && (
        <TouchableOpacity
          style={styles.minusBtn}
          onPress={(e) => { e.stopPropagation(); onDecrement() }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="remove" size={16} color="#1a5f3f" />
        </TouchableOpacity>
      )}
      {count > 1 && <Text style={styles.itemCount}>×{count}</Text>}
    </TouchableOpacity>
  )
}

function ResultCard({ result, t }: { result: FidyahResult; t: T }) {
  const meta = TIER_META[result.tier]
  return (
    <View style={[styles.resultCard, { borderLeftColor: meta.color }]}>
      <Text style={[styles.resultTitle, { color: meta.color }]}>
        {t(meta.titleKey)} {t('fidyahCountSuffix', { count: result.count })}
      </Text>
      <Text style={styles.resultExplanation}>{t(meta.explanationKey)}</Text>
    </View>
  )
}

function RitualChooser({ onChoose }: { onChoose: (ritual: Ritual) => void }) {
  const { t } = useTranslation()
  const options: { ritual: Ritual; icon: 'flag-outline' | 'walk-outline'; titleKey: TranslationKey; descKey: TranslationKey }[] = [
    { ritual: 'hajj',  icon: 'flag-outline', titleKey: 'fidyahRitualHajj',  descKey: 'fidyahChooserHajjDesc' },
    { ritual: 'umrah', icon: 'walk-outline', titleKey: 'fidyahRitualUmrah', descKey: 'fidyahChooserUmrahDesc' },
  ]
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('fidyahChooserTitle')}</Text>
        <Text style={styles.cardDescription}>{t('fidyahScreenIntro')}</Text>
      </View>
      {options.map(o => (
        <TouchableOpacity key={o.ritual} style={styles.chooserCard} onPress={() => onChoose(o.ritual)} activeOpacity={0.8}>
          <Ionicons name={o.icon} size={30} color="#1a5f3f" />
          <View style={styles.chooserText}>
            <Text style={styles.chooserTitle}>{t(o.titleKey)}</Text>
            <Text style={styles.cardDescription}>{t(o.descKey)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>
      ))}
      <Text style={styles.disclaimer}>{t('fidyahDisclaimer')}</Text>
    </ScrollView>
  )
}

function FidyahCalculator({ ritual, onChangeRitual }: { ritual: Ritual; onChangeRitual: () => void }) {
  const { t } = useTranslation()
  const isHajj = ritual === 'hajj'

  const [counts, setCounts] = useState<Record<string, number>>({})
  const [meeqatCrossed, setMeeqatCrossed] = useState(false)
  const [muzdalifahMissed, setMuzdalifahMissed] = useState(false)
  const [mina, setMina] = useState<MinaInput>({
    missedNight1: false, missedNight2: false, missedNight3: false, leftEarly: false,
  })
  const [pebbles, setPebbles] = useState<PebblesMissed>({ nahr: 0, tashreeq1: 0, tashreeq2: 0, tashreeq3: 0 })

  const items = useMemo(() => getFidyahItemsForRitual(ritual), [ritual])
  const acts = items.filter(i => i.category === 'act')
  const special = items.filter(i => i.category === 'special')

  const status = minaStatus(mina)
  const minaIds = minaFidyahIds(mina)
  const ramyIds = ramyFidyahIds(totalPebblesMissed(pebbles, mina))

  const results = useMemo(
    () => calculateFidyah([
      ...riteFidyahIds({ ritual, meeqatCrossed, muzdalifahMissed, mina, pebbles }),
      ...expandCounts(counts),
    ]),
    [ritual, meeqatCrossed, muzdalifahMissed, mina, pebbles, counts],
  )

  const navigation = useNavigation()
  const [tracked, setTracked] = useState(false)
  // Changing any answer makes the last add out of date.
  useEffect(() => setTracked(false), [results])
  const track = async () => {
    if (tracked) {
      navigation.navigate('Fulfill' as never)
      return
    }
    await addObligations(obligationsFromResults(results))
    setTracked(true)
  }

  const increment = (id: string) => setCounts(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  const toggleOnce = (id: string) => setCounts(prev => ({ ...prev, [id]: (prev[id] ?? 0) > 0 ? 0 : 1 }))
  const decrement = (id: string) => setCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) - 1) }))
  const reset = (id: string) => setCounts(prev => ({ ...prev, [id]: 0 }))
  const setPebble = (day: StoningDay, next: number) =>
    setPebbles(prev => ({ ...prev, [day]: Math.min(Math.max(0, next), PEBBLE_LIMITS[day]) }))
  const toggleMina = (key: 'missedNight1' | 'missedNight2' | 'missedNight3') =>
    setMina(prev => ({ ...prev, [key]: !prev[key] }))

  const renderSection = (titleKey: TranslationKey, sectionItems: FidyahItem[], noteKey?: TranslationKey) => {
    if (sectionItems.length === 0) return null
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t(titleKey)}</Text>
        {noteKey && <Text style={styles.note}>{t(noteKey)}</Text>}
        {sectionItems.map(item => item.once ? (
          <ToggleRow
            key={item.id}
            label={t(item.labelKey)}
            checked={(counts[item.id] ?? 0) > 0}
            onToggle={() => toggleOnce(item.id)}
          />
        ) : (
          <ItemRow
            key={item.id}
            item={item}
            count={counts[item.id] ?? 0}
            onPress={() => increment(item.id)}
            onDecrement={() => decrement(item.id)}
            onReset={() => reset(item.id)}
            t={t}
          />
        ))}
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.ritualName}>{t(isHajj ? 'fidyahRitualHajj' : 'fidyahRitualUmrah')}</Text>
          <TouchableOpacity style={styles.changeBtn} onPress={onChangeRitual}>
            <Ionicons name="swap-horizontal-outline" size={16} color="#1a5f3f" />
            <Text style={styles.changeBtnText}>{t('fidyahChangeRitual')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardDescription}>{t('fidyahScreenIntro')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('fidyahRitesTitle')}</Text>
        <ToggleRow label={t('fidyahMeeqatCrossed')} checked={meeqatCrossed} onToggle={() => setMeeqatCrossed(v => !v)} />
        <Text style={styles.note}>{t('fidyahMeeqatNote')}</Text>
        {isHajj && (
          <>
            <ToggleRow label={t('fidyahMuzdalifahMissed')} checked={muzdalifahMissed} onToggle={() => setMuzdalifahMissed(v => !v)} />
            <Text style={styles.note}>{t('fidyahMuzdalifahNote')}</Text>
          </>
        )}
      </View>

      {isHajj && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('fidyahMinaTitle')}</Text>
            <Text style={styles.note}>{t('fidyahMinaNote')}</Text>
            <View style={styles.item}>
              <Text style={styles.itemLabel}>{t('fidyahMinaLeftEarly')}</Text>
              <Switch
                value={mina.leftEarly}
                onValueChange={v => setMina(prev => ({ ...prev, leftEarly: v }))}
                trackColor={{ true: '#1a5f3f' }}
              />
            </View>
            <ToggleRow label={t('fidyahMinaNight1')} checked={mina.missedNight1} onToggle={() => toggleMina('missedNight1')} />
            <ToggleRow label={t('fidyahMinaNight2')} checked={mina.missedNight2} onToggle={() => toggleMina('missedNight2')} />
            {!mina.leftEarly && (
              <ToggleRow label={t('fidyahMinaNight3')} checked={mina.missedNight3} onToggle={() => toggleMina('missedNight3')} />
            )}
            {mina.leftEarly && (
              <Text style={[styles.note, styles.noteGood]}>{t('fidyahMinaEarlyValid')}</Text>
            )}
            <Text style={styles.outcome}>{outcomeText(t, minaIds)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('fidyahRamyTitle')}</Text>
            <Text style={styles.note}>{t('fidyahRamyNote')}</Text>
            {PEBBLE_DAYS.map(({ day, labelKey }) => {
              if (day === 'tashreeq3' && !status.thirdDayStoningRequired) return null
              return (
                <PebbleRow
                  key={day}
                  label={t(labelKey)}
                  count={pebbles[day]}
                  max={PEBBLE_LIMITS[day]}
                  onChange={next => setPebble(day, next)}
                />
              )
            })}
            <Text style={styles.outcome}>{outcomeText(t, ramyIds)}</Text>
          </View>
        </>
      )}

      {renderSection('fidyahActsTitle', acts, 'fidyahActsNote')}
      {renderSection('fidyahSpecialTitle', special)}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('fidyahResultsTitle')}</Text>
        {results.length === 0 ? (
          <Text style={styles.cardDescription}>{t('fidyahNoneSelected')}</Text>
        ) : (
          results.map(result => <ResultCard key={result.tier} result={result} t={t} />)
        )}
        {results.some(r => r.tier !== 'marriage') && (
          <TouchableOpacity style={[styles.trackBtn, tracked && styles.trackBtnDone]} onPress={track} activeOpacity={0.8}>
            <Ionicons name="checkmark-done-outline" size={18} color={tracked ? '#1a5f3f' : '#fff'} />
            <Text style={[styles.trackBtnText, tracked && styles.trackBtnTextDone]}>
              {t(tracked ? 'fidyahTrackedButton' : 'fidyahTrackButton')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.disclaimer}>{t('fidyahDisclaimer')}</Text>
    </ScrollView>
  )
}

export default function FidyahCalculatorScreen() {
  const [ritual, setRitual] = useState<Ritual | null>(null)
  // Going back to the chooser unmounts the calculator, so a new ritual
  // always starts from a clean slate.
  return ritual
    ? <FidyahCalculator ritual={ritual} onChangeRitual={() => setRitual(null)} />
    : <RitualChooser onChoose={setRitual} />
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  content: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 10 },
  cardDescription: { fontSize: 13, color: '#666', lineHeight: 18 },
  chooserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#e2ece6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  chooserText: { flex: 1, gap: 2 },
  chooserTitle: { fontSize: 18, fontWeight: '700', color: '#1a5f3f' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  ritualName: { fontSize: 18, fontWeight: '700', color: '#1a5f3f' },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#1a5f3f',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  changeBtnText: { color: '#1a5f3f', fontWeight: '600', fontSize: 13 },
  note: { fontSize: 12, color: '#777', lineHeight: 17, marginTop: 6, marginBottom: 4 },
  noteGood: { color: '#1a5f3f' },
  trackBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a5f3f',
    borderRadius: 8,
    paddingVertical: 11,
  },
  trackBtnDone: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#1a5f3f' },
  trackBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  trackBtnTextDone: { color: '#1a5f3f' },
  outcome: { marginTop: 10, fontSize: 13, fontWeight: '700', color: '#1a5f3f' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: { backgroundColor: '#1a5f3f', borderColor: '#1a5f3f' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  itemLabel: { flex: 1, fontSize: 13, color: '#1a1a1a', lineHeight: 18 },
  minusBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1a5f3f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCount: { fontSize: 12, fontWeight: '700', color: '#1a5f3f' },
  roundBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1a5f3f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnDisabled: { borderColor: '#ddd' },
  stepCount: { minWidth: 40, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  resultCard: {
    borderLeftWidth: 3,
    borderRadius: 6,
    backgroundColor: '#fafafa',
    padding: 10,
    marginTop: 8,
  },
  resultTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  resultExplanation: { fontSize: 12, color: '#555', lineHeight: 17 },
  disclaimer: { fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 16, paddingHorizontal: 8 },
})
