import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { useOneSignal } from './src/hooks/useOneSignal';
import { AppWebView } from './src/components/AppWebView';

// Previne a splash screen de sumir automaticamente antes do WebView estar pronto
SplashScreen.preventAutoHideAsync();

export default function App() {
  const onesignal = useOneSignal();
  const [webViewReady, setWebViewReady] = useState(false);

  useEffect(() => {
    if (webViewReady) {
      SplashScreen.hideAsync();
    }
  }, [webViewReady]);

  return (
    <>
      <StatusBar style="auto" />
      <AppWebView
        uri={process.env.EXPO_PUBLIC_WEB_URL!}
        oneSignalHook={onesignal}
        onWebViewReady={() => setWebViewReady(true)}
      />
    </>
  );
}
