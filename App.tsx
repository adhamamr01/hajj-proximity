import { useEffect } from 'react'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import { Ionicons } from '@expo/vector-icons'
import * as Sentry from '@sentry/react-native'
import { I18nProvider, useTranslation } from './src/i18n/I18nProvider'
import AppErrorBoundary from './src/components/AppErrorBoundary'
import MapScreen from './src/screens/MapScreen'
import HaramScreen from './src/screens/HaramScreen'
import AlertsScreen from './src/screens/AlertsScreen'
import ChecklistScreen from './src/screens/ChecklistScreen'
import { log, logError } from './src/utils/log'

log('app', 'App.tsx module evaluated')

// Surface fatal JS errors in logcat (`adb logcat -s ReactNativeJS`) even in
// release builds, where React Native's red box doesn't exist and a fatal
// error otherwise dies silently.
const defaultHandler = ErrorUtils.getGlobalHandler()
ErrorUtils.setGlobalHandler((error, isFatal) => {
  logError('fatal', `unhandled JS error (fatal=${String(isFatal)})`, error)
  defaultHandler(error, isFatal)
})

const Tab = createBottomTabNavigator()
const navigationRef = createNavigationContainerRef()

// DSN is a public identifier by Sentry's own design, safe to inline via EXPO_PUBLIC_.
// Left unset in dev — Sentry.init() is a no-op without a dsn.
if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
  })
}

function AppNavigator() {
  const { t } = useTranslation()

  useEffect(() => {
    log('app', 'AppNavigator mounted')
  }, [])

  // Navigate to the relevant tab when user taps a notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const type = response.notification.request.content.data?.type
      if (!navigationRef.isReady()) return
      if (type === 'meeqat') navigationRef.navigate('Map' as never)
      if (type === 'haram_entry' || type === 'haram_exit') navigationRef.navigate('Haram' as never)
    })
    return () => sub.remove()
  }, [])

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: '#1a5f3f' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          tabBarActiveTintColor: '#1a5f3f',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: { borderTopColor: '#e5e5e5' },
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
              Map:       'map-outline',
              Haram:     'globe-outline',
              Alerts:    'settings-outline',
              Checklist: 'checkbox-outline',
            }
            return <Ionicons name={icons[route.name]} size={size} color={color} />
          },
        })}
      >
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{ title: t('tabMapTitle'), tabBarLabel: t('tabMapLabel') }}
        />
        <Tab.Screen
          name="Haram"
          component={HaramScreen}
          options={{ title: t('tabHaramTitle'), tabBarLabel: t('tabHaramLabel') }}
        />
        <Tab.Screen
          name="Alerts"
          component={AlertsScreen}
          options={{ title: t('tabAlertsTitle'), tabBarLabel: t('tabAlertsLabel') }}
        />
        <Tab.Screen
          name="Checklist"
          component={ChecklistScreen}
          options={{ title: t('tabChecklistTitle'), tabBarLabel: t('tabChecklistLabel') }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}

function App() {
  return (
    <AppErrorBoundary>
      <I18nProvider>
        <AppNavigator />
      </I18nProvider>
    </AppErrorBoundary>
  )
}

export default Sentry.wrap(App)
