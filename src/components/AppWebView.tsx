import { useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { withJavascriptInterface } from 'react-native-webview-comlink';
import { NativefyInterface } from '../types/bridge';
import { OneSignalHook } from '../hooks/useOneSignal';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? '';

// Referência mutável para a implementação atual — permite criar o componente
// uma única vez no nível do módulo sem recriar a cada render.
const implRef: { current: NativefyInterface | null } = { current: null };

// Proxy estável que delega para implRef.current em tempo de execução.
// Criado uma vez fora do componente para evitar remounts do WebView.
const nativefyProxy: NativefyInterface = {
  login: (userId, email) => implRef.current!.login(userId, email),
  logout: () => implRef.current!.logout(),
  getOneSignalId: () => implRef.current!.getOneSignalId(),
  requestNotificationPermission: () => implRef.current!.requestNotificationPermission(),
};

// Componente WebView com a interface 'nativefy' injetada — criado uma única vez.
const NativefyWebView = withJavascriptInterface<NativefyInterface>(
  nativefyProxy,
  'nativefy',
  {
    log: __DEV__,
    whitelistURLs: WEB_URL ? [WEB_URL] : [],
  }
)(WebView);

interface AppWebViewProps {
  uri: string;
  oneSignalHook: OneSignalHook;
  onWebViewReady?: () => void;
}

export function AppWebView({ uri, oneSignalHook, onWebViewReady }: AppWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const hasCalledReady = useRef(false);

  // Atualiza o proxy com a implementação atual do hook
  implRef.current = {
    login: (userId, email) => oneSignalHook.login(userId, email),
    logout: () => oneSignalHook.logout(),
    getOneSignalId: () => oneSignalHook.getOneSignalId(),
    requestNotificationPermission: () => oneSignalHook.requestPermission(),
  };

  const handleLoadEnd = useCallback(() => {
    if (!hasCalledReady.current) {
      hasCalledReady.current = true;
      onWebViewReady?.();
    }
  }, [onWebViewReady]);

  const handleError = useCallback(() => {
    // Garante que a splash screen não trave em caso de erro de rede
    if (!hasCalledReady.current) {
      hasCalledReady.current = true;
      onWebViewReady?.();
    }
  }, [onWebViewReady]);

  const handleReload = useCallback(() => {
    hasCalledReady.current = false;
    webViewRef.current?.reload();
  }, []);

  return (
    <View style={styles.container}>
      <NativefyWebView
        ref={webViewRef}
        source={{ uri }}
        style={styles.webView}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleError}
        originWhitelist={['https://*', 'http://*']}
        renderError={() => (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Não foi possível carregar</Text>
            <Text style={styles.errorMessage}>
              Verifique sua conexão com a internet e tente novamente.
            </Text>
            <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
              <Text style={styles.reloadButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        )}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  reloadButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
