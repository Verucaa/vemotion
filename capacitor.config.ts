import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vemotion.editor',
  appName: 'VeMotion',
  webDir: 'dist',
  backgroundColor: '#12141a',
  server: { androidScheme: 'https' },
  android: { webContentsDebuggingEnabled: false },
};

export default config;
