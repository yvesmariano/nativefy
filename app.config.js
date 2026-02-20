module.exports = {
  expo: {
    name: 'nativefy',
    slug: 'nativefy',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.APP_BUNDLE_ID || 'com.empresa.nativefy',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
      package: process.env.APP_BUNDLE_ID || 'com.empresa.nativefy',
    },
    plugins: [
      [
        'onesignal-expo-plugin',
        {
          mode: 'development',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#FFFFFF',
          image: './assets/splash-icon.png',
          imageWidth: 200,
        },
      ],
    ],
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
  },
};
