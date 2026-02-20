/**
 * Interface NativefyInterface — compartilhada entre native e web.
 *
 * Para usar no projeto web com TypeScript, copie este arquivo e declare:
 *
 *   import { JavascriptInterface } from 'react-native-webview-comlink';
 *   import { NativefyInterface } from './bridge';
 *
 *   declare global {
 *     interface Window {
 *       nativefy: JavascriptInterface<NativefyInterface>;
 *     }
 *   }
 *
 * Uso na webapp:
 *   await window.nativefy.login('user-123', 'user@email.com');
 *   const id = await window.nativefy.getOneSignalId();
 */
export interface NativefyInterface {
  /**
   * Vincula o usuário logado ao OneSignal via OneSignal.login().
   * Deve ser chamado após login bem-sucedido na webapp.
   */
  login(userId: string, email?: string): Promise<void>;

  /**
   * Desvincula o usuário do OneSignal via OneSignal.logout().
   * Deve ser chamado no logout da webapp.
   */
  logout(): Promise<void>;

  /**
   * Retorna o OneSignal Subscription ID do dispositivo.
   * Use para salvar no backend e enviar notificações direcionadas.
   */
  getOneSignalId(): Promise<string | null>;

  /**
   * Solicita permissão de notificação push ao usuário (principalmente iOS).
   * Retorna true se a permissão foi concedida.
   */
  requestNotificationPermission(): Promise<boolean>;
}
