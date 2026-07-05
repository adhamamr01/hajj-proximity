import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface ChecklistItem {
  id: string
  text: string
  detail?: string
}

const ITEMS: ChecklistItem[] = [
  { id: '1', text: 'Perform Ghusl (full bath)', detail: 'Cleanse yourself before entering the state of Ihram.' },
  { id: '2', text: 'Put on Ihram garments', detail: 'Men: two white unstitched cloths. Women: any modest clothing covering the body.' },
  { id: '3', text: 'Apply no perfume after Ihram', detail: 'Perfume is prohibited once Ihram is worn.' },
  { id: '4', text: 'Perform two Rakaat of prayer', detail: 'Pray two optional units of prayer, preferably with Surah Al-Kafirun and Al-Ikhlas.' },
  { id: '5', text: 'Make the Niyyah (intention)', detail: 'State your intention for Hajj or Umrah at the Meeqat.' },
  { id: '6', text: 'Recite the Talbiyah', detail: '"Labbayk Allahumma Labbayk…" — continue reciting until you reach Makkah.' },
  { id: '7', text: 'Avoid prohibited acts', detail: 'No cutting hair/nails, covering head (men), wearing sewn clothes (men), sexual relations, or hunting.' },
]

const STORAGE_KEY = 'ihram_checklist'

export default function ChecklistScreen() {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) setChecked(new Set(JSON.parse(val)))
    })
  }, [])

  const toggle = async (id: string) => {
    const next = new Set(checked)
    next.has(id) ? next.delete(id) : next.add(id)
    setChecked(next)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
  }

  const reset = () => {
    Alert.alert('Reset Checklist', 'Clear all checkmarks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          setChecked(new Set())
          await AsyncStorage.removeItem(STORAGE_KEY)
        },
      },
    ])
  }

  const allDone = checked.size === ITEMS.length

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Before Crossing the Meeqat</Text>
        <Text style={styles.headerSub}>Complete these steps before entering the state of Ihram.</Text>
      </View>

      {allDone && (
        <View style={styles.completeBanner}>
          <Text style={styles.completeText}>You are ready to cross the Meeqat. Labbayk Allahumma Labbayk!</Text>
        </View>
      )}

      {ITEMS.map(item => {
        const done = checked.has(item.id)
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.item, done && styles.itemDone]}
            onPress={() => toggle(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, done && styles.checkboxDone]}>
              {done && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.itemText}>
              <Text style={[styles.itemLabel, done && styles.itemLabelDone]}>{item.text}</Text>
              {item.detail && (
                <Text style={styles.itemDetail}>{item.detail}</Text>
              )}
            </View>
          </TouchableOpacity>
        )
      })}

      <TouchableOpacity style={styles.resetBtn} onPress={reset}>
        <Text style={styles.resetBtnText}>Reset Checklist</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  content: { padding: 16, gap: 10 },
  header: {
    backgroundColor: '#1a5f3f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 6,
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18 },
  completeBanner: {
    backgroundColor: '#d4af37',
    borderRadius: 10,
    padding: 14,
    marginBottom: 4,
  },
  completeText: { color: '#1a1a1a', fontWeight: '600', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  item: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  itemDone: { opacity: 0.7 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxDone: { backgroundColor: '#1a5f3f', borderColor: '#1a5f3f' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  itemText: { flex: 1 },
  itemLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 3 },
  itemLabelDone: { textDecorationLine: 'line-through', color: '#888' },
  itemDetail: { fontSize: 12, color: '#666', lineHeight: 17 },
  resetBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetBtnText: { color: '#888', fontWeight: '600', fontSize: 14 },
})
