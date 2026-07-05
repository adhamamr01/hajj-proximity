import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { Text } from 'react-native'
import MapScreen from './src/screens/MapScreen'
import AlertsScreen from './src/screens/AlertsScreen'
import ChecklistScreen from './src/screens/ChecklistScreen'

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1a5f3f' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          tabBarActiveTintColor: '#1a5f3f',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: { borderTopColor: '#e5e5e5' },
        }}
      >
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            title: 'Hajj Proximity',
            tabBarLabel: 'Map',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🗺️</Text>,
          }}
        />
        <Tab.Screen
          name="Alerts"
          component={AlertsScreen}
          options={{
            title: 'Alert Settings',
            tabBarLabel: 'Alerts',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔔</Text>,
          }}
        />
        <Tab.Screen
          name="Checklist"
          component={ChecklistScreen}
          options={{
            title: 'Ihram Checklist',
            tabBarLabel: 'Checklist',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✅</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
