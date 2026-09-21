import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '../i18n/I18nProvider'
import { PREMIUM_PLAY_STORE_URL } from '../config/appVariant'

/** What the free build shows on the Fidyah tab instead of the calculator. */
export default function FidyahUpsellScreen() {
  const { t } = useTranslation()
  return (
    <View style={styles.container}>
      <Ionicons name="calculator-outline" size={48} color="#1a5f3f" />
      <Text style={styles.title}>{t('premiumUpsellTitle')}</Text>
      <Text style={styles.body}>{t('premiumUpsellBody')}</Text>
      <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(PREMIUM_PLAY_STORE_URL)}>
        <Text style={styles.buttonText}>{t('premiumUpsellButton')}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: '#f5f5f0' },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },
  body: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  button: { marginTop: 8, backgroundColor: '#1a5f3f', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 28 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
