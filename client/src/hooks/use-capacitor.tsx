
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Storage } from '@capacitor/storage';
import { StatusBar } from '@capacitor/status-bar';

export function useCapacitor() {
  const [isNative, setIsNative] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    
    // Set status bar style for mobile
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: 'LIGHT' });
    }

    // Network status monitoring
    const checkNetworkStatus = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };

    checkNetworkStatus();

    const networkListener = Network.addListener('networkStatusChange', (status) => {
      setIsOnline(status.connected);
    });

    return () => {
      networkListener.remove();
    };
  }, []);

  return {
    isNative,
    isOnline,
    platform: Capacitor.getPlatform()
  };
}

// Offline storage utility
export const offlineStorage = {
  async set(key: string, value: any) {
    await Storage.set({
      key,
      value: JSON.stringify(value)
    });
  },

  async get(key: string) {
    const { value } = await Storage.get({ key });
    return value ? JSON.parse(value) : null;
  },

  async remove(key: string) {
    await Storage.remove({ key });
  },

  async clear() {
    await Storage.clear();
  }
};
