export default {
  name: 'TAV Communication',
  slug: 'tav-communication',
  owner: 'automation2',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'tavcommunication',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: 'com.texasautovalue.communication',
    googleServicesFile: './GoogleService-Info.plist',
    supportsTablet: false,
    infoPlist: {
      NSMicrophoneUsageDescription:
        'Allow TAV Communication to use your microphone for voice calls with customers.',
      UIBackgroundModes: ['audio', 'voip'],
    },
    entitlements: {
      'aps-environment': 'development',
    },
  },
  android: {
    package: 'com.texasautovalue.communication',
    googleServicesFile: './google-services.json',
    permissions: ['RECORD_AUDIO', 'MODIFY_AUDIO_SETTINGS', 'BLUETOOTH', 'BLUETOOTH_CONNECT'],
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-image-picker',
      {
        photosPermission:
          'Allow TAV Communication to access your photos so you can attach images and videos to messages.',
        cameraPermission:
          'Allow TAV Communication to use your camera so you can take photos and videos for messages.',
      },
    ],
    [
      'expo-audio',
      {
        microphonePermission:
          'Allow TAV Communication to use your microphone for voice calls with customers.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/android-icon-monochrome.png',
        color: '#2563EB',
        defaultChannel: 'inbound-sms',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#09090b',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: '372f91c4-28b4-47af-b1ed-bd902a89127a',
    },
  },
};
