import { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '../i18n/I18nProvider'
import { usePremium } from '../premium/PremiumProvider'
import { getFidyahItemsForRitual, FidyahItem, FidyahTier, Ritual } from '../data/fidyah'
import { calculateFidyah, FidyahResult } from '../utils/fidyahCalculator'
import { TranslationKey } from '../i18n/translations'

const TIER_META: Record<FidyahTier, { titleKey: TranslationKey; explanationKey: TranslationKey; color: string }> = {
  full:     { titleKey: 'fidyahTierFullTitle',     explanationKey: 'fidyahTierFullExplanation',     color: '#1a5f3f' },
  partial:  { titleKey: 'fidyahTierPartialTitle',  explanationKey: 'fidyahTierPartialExplanation',  color: '#b8860b' },
  severe:   { titleKey: 'fidyahTierSevereTitle',   explanationKey: 'fidyahTierSevereExplanation',   color: '#dc2626' },
  hunting:  { titleKey: 'fidyahTierHuntingTitle',  explanationKey: 'fidyahTierHuntingExplanation',  color: '#0f766e' },
  marriage: { titleKey: 'fidyahTierMarriageTitle', explanationKey: 'fidyahTierMarriageExplanation', color: '#6b7280' },
  ihsar:    { titleKey: 'fidyahTierIhsarTitle',    explanationKey: 'fidyahTierIhsarExplanation',    color: '#7c3aed' },
}

function ItemRow({ item, count, onPress, onDecrement, onReset, t }: {
  item: FidyahItem
  count: number
  onPress: () => void
  onDecrement: () => void
  onReset: () => void
  t: (key: TranslationKey) => string
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

function ResultCard({ result, t }: { result: FidyahResult; t: (key: TranslationKey, params?: Record<string, string | number>) => string }) {
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

function FidyahCalculator() {
  const { t } = useTranslation()
  const [ritual, setRitual] = useState<Ritual>('hajj')
  const [counts, setCounts] = useState<Record<string, number>>({})

  const items = useMemo(() => getFidyahItemsForRitual(ritual), [ritual])
  const rites = items.filter(i => i.category === 'rite')
  const acts = items.filter(i => i.category === 'act')
  const special = items.filter(i => i.category === 'special')

  const selectedItemIds = useMemo(
    () => Object.entries(counts).flatMap(([id, n]) => Array(n).fill(id)),
    [counts],
  )
  const results = useMemo(() => calculateFidyah(selectedItemIds), [selectedItemIds])

  const increment = (id: string) => setCounts(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  const decrement = (id: string) => setCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) - 1) }))
  const reset = (id: string) => setCounts(prev => ({ ...prev, [id]: 0 }))

  const switchRitual = (next: Ritual) => {
    if (next === ritual) return
    setRitual(next)
    setCounts({})
  }

  const renderSection = (titleKey: TranslationKey, sectionItems: FidyahItem[]) => {
    if (sectionItems.length === 0) return null
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t(titleKey)}</Text>
        {sectionItems.map(item => (
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
        <Text style={styles.cardDescription}>{t('fidyahScreenIntro')}</Text>
        <View style={styles.ritualRow}>
          <TouchableOpacity
            style={[styles.ritualBtn, ritual === 'hajj' && styles.ritualBtnActive]}
            onPress={() => switchRitual('hajj')}
          >
            <Text style={[styles.ritualBtnText, ritual === 'hajj' && styles.ritualBtnTextActive]}>
              {t('fidyahRitualHajj')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ritualBtn, ritual === 'umrah' && styles.ritualBtnActive]}
            onPress={() => switchRitual('umrah')}
          >
            <Text style={[styles.ritualBtnText, ritual === 'umrah' && styles.ritualBtnTextActive]}>
              {t('fidyahRitualUmrah')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderSection('fidyahRitesTitle', rites)}
      {renderSection('fidyahActsTitle', acts)}
      {renderSection('fidyahSpecialTitle', special)}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('fidyahResultsTitle')}</Text>
        {results.length === 0 ? (
          <Text style={styles.cardDescription}>{t('fidyahNoneSelected')}</Text>
        ) : (
          results.map(result => <ResultCard key={result.tier} result={result} t={t} />)
        )}
      </View>

      <Text style={styles.disclaimer}>{t('fidyahDisclaimer')}</Text>
    </ScrollView>
  )
}

function PremiumLocked() {
  const { t } = useTranslation()
  return (
    <View style={styles.locked}>
      <Ionicons name="lock-closed-outline" size={48} color="#ccc" />
      <Text style={styles.lockedTitle}>{t('premiumLockedTitle')}</Text>
      <Text style={styles.lockedBody}>{t('premiumLockedBody')}</Text>
    </View>
  )
}

export default function FidyahScreen() {
  const { isPremium } = usePremium()
  return isPremium ? <FidyahCalculator /> : <PremiumLocked />
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
  ritualRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  ritualBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ritualBtnActive: { borderColor: '#1a5f3f', backgroundColor: '#1a5f3f' },
  ritualBtnText: { fontSize: 14, fontWeight: '600', color: '#888' },
  ritualBtnTextActive: { color: '#fff' },
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
  locked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: '#f5f5f0' },
  lockedTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },
  lockedBody: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
})
