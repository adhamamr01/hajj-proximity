import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from '../i18n/I18nProvider'
import { FIDYAH_ITEMS } from '../data/fidyah'
import { TIER_META } from '../data/fidyahTierMeta'
import {
  FulfilObligation, FulfilOption, FulfilTier, FULFIL_OPTIONS, MANUAL_TIERS, ORDERED_TIERS, MAX_MANUAL_COUNT,
  chooseOption, canChangeOption, resetOption, tick, untick, isComplete, progressSummary, obligationsFromManual,
} from '../utils/fidyahFulfilment'
import { loadObligations, saveObligations } from '../services/fidyahFulfilmentStorage'

type T = ReturnType<typeof useTranslation>['t']

function RoundButton({ icon, onPress, disabled }: { icon: 'add' | 'remove'; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.roundBtn, disabled && styles.roundBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name={icon} size={18} color={disabled ? '#ccc' : '#1a5f3f'} />
    </TouchableOpacity>
  )
}

function OptionPicker({ ob, onChoose, t }: {
  ob: FulfilObligation
  onChoose: (optionId: string, customUnits?: number) => void
  t: T
}) {
  const [pending, setPending] = useState<FulfilOption | null>(null)
  const [amount, setAmount] = useState('')
  const ordered = ORDERED_TIERS.includes(ob.tier)

  const pick = (option: FulfilOption) => {
    if (option.units === null) {
      setPending(option)
      setAmount('')
    } else {
      onChoose(option.id)
    }
  }

  return (
    <View>
      <Text style={styles.note}>{t('fulfilChooseMethod')}</Text>
      <Text style={styles.note}>{t(ordered ? 'fulfilOrderedHint' : 'fulfilChoiceHint')}</Text>
      {FULFIL_OPTIONS[ob.tier].map((option, index) => (
        <View key={option.id}>
          <TouchableOpacity style={styles.option} onPress={() => pick(option)} activeOpacity={0.7}>
            <Text style={styles.optionIndex}>{ordered ? `${index + 1}.` : '•'}</Text>
            <Text style={styles.optionLabel}>{t(option.labelKey)}</Text>
          </TouchableOpacity>
          {pending?.id === option.id && option.promptKey && (
            <View style={styles.promptRow}>
              <Text style={styles.promptLabel}>{t(option.promptKey)}</Text>
              <TextInput
                style={styles.promptInput}
                value={amount}
                onChangeText={text => setAmount(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.startBtn, !(Number(amount) >= 1) && styles.startBtnDisabled]}
                disabled={!(Number(amount) >= 1)}
                onPress={() => onChoose(option.id, Number(amount))}
              >
                <Text style={styles.startBtnText}>{t('fulfilStart')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </View>
  )
}

function ObligationCard({ ob, onChange, onRemove, t }: {
  ob: FulfilObligation
  onChange: (next: FulfilObligation) => void
  onRemove: () => void
  t: T
}) {
  const meta = TIER_META[ob.tier]
  const source = ob.sourceId ? FIDYAH_ITEMS.find(item => item.id === ob.sourceId) : undefined
  const option = FULFIL_OPTIONS[ob.tier].find(o => o.id === ob.optionId)
  const done = isComplete(ob)

  return (
    <View style={[styles.card, { borderLeftColor: meta.color }, done && styles.cardDone]}>
      <View style={styles.headerRow}>
        <Text style={[styles.cardTitle, { color: meta.color }]}>{t(meta.titleKey)}</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel={t('fulfilRemove')}>
          <Ionicons name="trash-outline" size={18} color="#999" />
        </TouchableOpacity>
      </View>
      {source && <Text style={styles.source}>{t(source.labelKey)}</Text>}

      {!option ? (
        <OptionPicker ob={ob} onChoose={(id, custom) => onChange(chooseOption(ob, id, custom))} t={t} />
      ) : (
        <View>
          <Text style={styles.method}>{t(option.labelKey)}</Text>
          {done ? (
            <View style={styles.doneRow}>
              <Ionicons name="checkmark-circle" size={20} color="#1a5f3f" />
              <Text style={styles.doneText}>{t('fulfilCompleted')}</Text>
              <RoundButton icon="add" onPress={() => onChange(untick(ob))} />
            </View>
          ) : (
            <View style={styles.progressRow}>
              <Text style={styles.remaining}>{t('fulfilRemaining', { remaining: ob.remaining, total: ob.total })}</Text>
              <RoundButton icon="add" disabled={ob.remaining >= ob.total} onPress={() => onChange(untick(ob))} />
              <RoundButton icon="remove" onPress={() => onChange(tick(ob))} />
            </View>
          )}
          {canChangeOption(ob) && (
            <TouchableOpacity onPress={() => onChange(resetOption(ob))}>
              <Text style={styles.link}>{t('fulfilChangeMethod')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

function AddForm({ onAdd, onCancel, t }: {
  onAdd: (tier: FulfilTier, count: number) => void
  onCancel: () => void
  t: T
}) {
  const [tier, setTier] = useState<FulfilTier>('choice')
  const [count, setCount] = useState(1)
  const meta = TIER_META[tier]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.plainCard}>
        <Text style={styles.plainTitle}>{t('fulfilAddTitle')}</Text>
        <Text style={styles.note}>{t('fulfilAddType')}</Text>
        {MANUAL_TIERS.map(key => (
          <TouchableOpacity key={key} style={styles.option} onPress={() => setTier(key)} activeOpacity={0.7}>
            <View style={[styles.radio, tier === key && { borderColor: TIER_META[key].color }]}>
              {tier === key && <View style={[styles.radioDot, { backgroundColor: TIER_META[key].color }]} />}
            </View>
            <Text style={styles.optionLabel}>{t(TIER_META[key].titleKey)}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.note}>{t(meta.explanationKey)}</Text>
      </View>

      <View style={styles.plainCard}>
        <Text style={styles.plainTitle}>{t(tier === 'partial' ? 'fulfilAddCountMudd' : 'fulfilAddCount')}</Text>
        <View style={styles.progressRow}>
          <View style={styles.flex} />
          <RoundButton icon="remove" disabled={count <= 1} onPress={() => setCount(count - 1)} />
          <Text style={styles.count}>{count}</Text>
          <RoundButton icon="add" disabled={count >= MAX_MANUAL_COUNT} onPress={() => setCount(count + 1)} />
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.secondaryBtn, styles.flex]} onPress={onCancel}>
          <Text style={styles.secondaryBtnText}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, styles.flex]} onPress={() => onAdd(tier, count)}>
          <Text style={styles.primaryBtnText}>{t('fulfilAddConfirm')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

export default function FidyahFulfilScreen() {
  const { t } = useTranslation()
  const [obligations, setObligations] = useState<FulfilObligation[]>([])
  const [adding, setAdding] = useState(false)

  // The calculator can add to the list while this tab is in the background.
  useFocusEffect(useCallback(() => {
    let active = true
    loadObligations().then(loaded => { if (active) setObligations(loaded) })
    return () => { active = false }
  }, []))

  const update = (next: FulfilObligation[]) => {
    setObligations(next)
    saveObligations(next).catch(() => {})
  }
  const change = (next: FulfilObligation) => update(obligations.map(o => (o.id === next.id ? next : o)))
  const confirmRemove = (ob: FulfilObligation) =>
    Alert.alert(t('fulfilRemoveTitle'), t('fulfilRemoveMessage'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('fulfilRemove'), style: 'destructive', onPress: () => update(obligations.filter(o => o.id !== ob.id)) },
    ])

  if (adding) {
    return (
      <AddForm
        t={t}
        onCancel={() => setAdding(false)}
        onAdd={(tier, count) => {
          update([...obligations, ...obligationsFromManual(tier, count)])
          setAdding(false)
        }}
      />
    )
  }

  const { done, total } = progressSummary(obligations)
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.plainCard}>
        <Text style={styles.note}>{t('fulfilIntro')}</Text>
        {total > 0 && <Text style={styles.summary}>{t('fulfilSummary', { done, total })}</Text>}
      </View>

      {total === 0 && <Text style={styles.empty}>{t('fulfilEmpty')}</Text>}
      {obligations.map(ob => (
        <ObligationCard key={ob.id} ob={ob} t={t} onChange={change} onRemove={() => confirmRemove(ob)} />
      ))}

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setAdding(true)}>
        <Text style={styles.secondaryBtnText}>{t('fulfilAddManual')}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  content: { padding: 16, gap: 16 },
  flex: { flex: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardDone: { opacity: 0.7 },
  plainCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  plainTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  source: { fontSize: 12, color: '#777', marginTop: 4, lineHeight: 17 },
  note: { fontSize: 12, color: '#777', lineHeight: 17, marginTop: 6, marginBottom: 4 },
  summary: { marginTop: 8, fontSize: 13, fontWeight: '700', color: '#1a5f3f' },
  empty: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },
  method: { marginTop: 10, fontSize: 13, color: '#1a1a1a', lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  remaining: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  doneText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1a5f3f' },
  link: { marginTop: 10, fontSize: 12, fontWeight: '600', color: '#1a5f3f' },
  count: { minWidth: 32, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  optionIndex: { width: 18, fontSize: 13, fontWeight: '700', color: '#1a5f3f' },
  optionLabel: { flex: 1, fontSize: 13, color: '#1a1a1a', lineHeight: 18 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  promptRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8 },
  promptLabel: { fontSize: 13, color: '#1a1a1a' },
  promptInput: {
    minWidth: 64,
    borderWidth: 1.5,
    borderColor: '#1a5f3f',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  startBtn: { backgroundColor: '#1a5f3f', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  startBtnDisabled: { backgroundColor: '#ccc' },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  roundBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#1a5f3f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnDisabled: { borderColor: '#ddd' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  primaryBtn: { backgroundColor: '#1a5f3f', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#1a5f3f',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#1a5f3f', fontWeight: '700', fontSize: 14 },
})
