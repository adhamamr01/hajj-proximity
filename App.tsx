import { useEffect } from 'react'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import { Ionicons } from '@expo/vector-icons'
import * as Sentry from '@sentry/react-native'
import MapScreen from './src/screens/MapScreen'
import HaramScreen from './src/screens/HaramScreen'
import AlertsScreen from './src/screens/AlertsScreen'
import ChecklistScreen from './src/screens/ChecklistScreen'

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

function App() {
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
              Alerts:    'notifications-outline',
              Checklist: 'checkbox-outline',
            }
            return <Ionicons name={icons[route.name]} size={size} color={color} />
          },
        })}
      >
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{ title: 'Meeqat Points', tabBarLabel: 'Map' }}
        />
        <Tab.Screen
          name="Haram"
          component={HaramScreen}
          options={{ title: 'Haram Boundary', tabBarLabel: 'Haram' }}
        />
        <Tab.Screen
          name="Alerts"
          component={AlertsScreen}
          options={{ title: 'Alert Settings', tabBarLabel: 'Alerts' }}
        />
        <Tab.Screen
          name="Checklist"
          component={ChecklistScreen}
          options={{ title: 'Ihram Checklist', tabBarLabel: 'Checklist' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}

export default Sentry.wrap(App)
