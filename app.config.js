// Sentry's Gradle plugin uploads source maps at build time and fails hard
// if it runs without an org/project — so only include the plugin once
// those are actually configured (see README's Sentry setup section).
const sentryConfigured = Boolean(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT)

module.exports = {
  expo: {
    name: 'Hajj Proximity',
    slug: 'hajj-proximity',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1a5f3f',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.hajjproximity.app',
      infoPlist: {
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Hajj Proximity needs your location at all times to alert you when you approach a Meeqat boundary or enter the Haram, even when the app is in the background.',
        NSLocationWhenInUseUsageDescription:
          'Hajj Proximity uses your location to show your position on the map and calculate distances to Meeqat points.',
        UIBackgroundModes: ['location', 'fetch'],
      },
    },
    android: {
      package: 'com.hajjproximity.app',
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_LOCATION',
      ],
    },
    plugins: [
      'expo-localization',
      'expo-font',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Hajj Proximity needs your location at all times to alert you when you approach a Meeqat boundary or enter the Haram.',
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#1a5f3f',
        },
      ],
      ...(sentryConfigured
        ? [
            [
              '@sentry/react-native/expo',
              {
                organization: process.env.SENTRY_ORG,
                project: process.env.SENTRY_PROJECT,
              },
            ],
          ]
        : []),
    ],
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: 'c65399d7-3ae2-43f5-bdf2-8b0dbd572ba0',
      },
    },
  },
}
