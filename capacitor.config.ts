import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dirole.app',
  appName: 'Dirole',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: true,
    allowNavigation: [
      '192.168.*',
      'localhost',
      '*.app.dirole.com',
      '*.dirole.app'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f0518',
      androidScaleType: 'CENTER_CROP',
      iosSpinnerStyle: 'small',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    Camera: {
      iosUsageDescription: 'O Dirole precisa acessar a câmera para tirar fotos dos rolês'
    },
    Geolocation: {
      iosUsageDescription: 'O Dirole usa sua localização para mostrar rolês próximos'
    }
  }
};

export default config;
