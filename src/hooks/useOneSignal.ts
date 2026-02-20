import { useEffect, useRef, useState } from 'react';
import { OneSignal, NotificationClickEvent, NotificationWillDisplayEvent } from 'react-native-onesignal';

const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? '';

export interface OneSignalHook {
  login: (userId: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  getOneSignalId: () => Promise<string | null>;
  requestPermission: () => Promise<boolean>;
  lastNotificationData: Record<string, unknown> | null;
}

export function useOneSignal(): OneSignalHook {
  const initialized = useRef(false);
  const [lastNotificationData, setLastNotificationData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    OneSignal.initialize(ONESIGNAL_APP_ID);

    // Solicita permissão automaticamente no iOS
    OneSignal.Notifications.requestPermission(true);

    // Listener para notificações recebidas em foreground
    const foregroundListener = (event: NotificationWillDisplayEvent) => {
      const data = event.getNotification().additionalData as Record<string, unknown> | null;
      if (data) setLastNotificationData(data);
      // Exibe a notificação mesmo em foreground
      event.getNotification().display();
    };

    // Listener para clique em notificação
    const clickListener = (event: NotificationClickEvent) => {
      const data = event.notification.additionalData as Record<string, unknown> | null;
      if (data) setLastNotificationData(data);
    };

    OneSignal.Notifications.addEventListener('foregroundWillDisplay', foregroundListener);
    OneSignal.Notifications.addEventListener('click', clickListener);

    return () => {
      OneSignal.Notifications.removeEventListener('foregroundWillDisplay', foregroundListener);
      OneSignal.Notifications.removeEventListener('click', clickListener);
    };
  }, []);

  const login = async (userId: string, email?: string): Promise<void> => {
    await OneSignal.login(userId);
    if (email) {
      OneSignal.User.addEmail(email);
    }
  };

  const logout = async (): Promise<void> => {
    await OneSignal.logout();
  };

  const getOneSignalId = async (): Promise<string | null> => {
    return OneSignal.User.pushSubscription.id ?? null;
  };

  const requestPermission = async (): Promise<boolean> => {
    return OneSignal.Notifications.requestPermission(true);
  };

  return {
    login,
    logout,
    getOneSignalId,
    requestPermission,
    lastNotificationData,
  };
}
