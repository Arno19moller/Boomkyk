import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'IndentiTree',
  webDir: 'www',
  server: {
    androidScheme: 'http',
  },
  plugins: {
    LiveUpdates: {
      appId: '21f3c39b',
      channel: 'Production',
      autoUpdateMethod: 'background',
      maxVersions: 2,
    },
    CapacitorGoogleMaps: {
      apiKey: 'AIzaSyA6ju_iOEfLWsgZu2mf6cz-It1fDzTeVc8',
    },
  },
};

export default config;