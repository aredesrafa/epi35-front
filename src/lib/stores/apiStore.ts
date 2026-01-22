import { writable, derived, readable } from "svelte/store";
import type { ApiState } from "$lib/types";

// Store genérico para estado de API
export function createApiStore<T>(initialData: T | null = null) {
  const store = writable<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  return {
    subscribe: store.subscribe,
    set: (data: T) =>
      store.update((state) => ({ ...state, data, error: null })),
    setLoading: (loading: boolean) =>
      store.update((state) => ({ ...state, loading })),
    setError: (error: string | null) =>
      store.update((state) => ({ ...state, error, loading: false })),
    reset: () => store.set({ data: initialData, loading: false, error: null }),

    // Método para executar uma operação de API
    execute: async (apiCall: () => Promise<T>) => {
      store.update((state) => ({ ...state, loading: true, error: null }));
      try {
        const data = await apiCall();
        store.update((state) => ({ ...state, data, loading: false }));
        return data;
      } catch (error: any) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";
        store.update((state) => ({
          ...state,
          error: errorMessage,
          loading: false,
        }));
        throw error;
      }
    },
  };
}

// Cache simples para requisições
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function createCachedApiStore<T>(
  cacheKey: string,
  initialData: T | null = null,
) {
  const store = createApiStore<T>(initialData);

  return {
    ...store,
    executeWithCache: async (apiCall: () => Promise<T>, forceFresh = false) => {
      // Verificar cache
      if (!forceFresh) {
        const cached = apiCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          store.set(cached.data);
          return cached.data;
        }
      }

      // Executar API call
      const data = await store.execute(apiCall);

      // Salvar no cache
      apiCache.set(cacheKey, { data, timestamp: Date.now() });

      return data;
    },
    clearCache: () => apiCache.delete(cacheKey),
  };
}

// Store global para controle de loading da aplicação
export const globalLoading = writable(false);

// Store para notificações/toasts
interface ToastNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

function createNotificationStore() {
  const { subscribe, update } = writable<ToastNotification[]>([]);

  return {
    subscribe,
    add: (notification: Omit<ToastNotification, "id">) => {
      const id = Math.random().toString(36).substring(7);
      const newNotification = { id, ...notification };

      update((notifications) => [...notifications, newNotification]);

      // Auto-remove após duração especificada
      const duration = notification.duration || 5000;
      if (duration > 0) {
        setTimeout(() => {
          update((notifications) => notifications.filter((n) => n.id !== id));
        }, duration);
      }

      return id;
    },
    remove: (id: string) => {
      update((notifications) => notifications.filter((n) => n.id !== id));
    },
    clear: () => {
      update(() => []);
    },
  };
}

export const notifications = createNotificationStore();

// Helpers para notificações
export const notify = {
  success: (title: string, message?: string, duration?: number) =>
    notifications.add({ type: "success", title, message, duration }),
  error: (title: string, message?: string, duration?: number) =>
    notifications.add({ type: "error", title, message, duration }),
  warning: (title: string, message?: string, duration?: number) =>
    notifications.add({ type: "warning", title, message, duration }),
  info: (title: string, message?: string, duration?: number) =>
    notifications.add({ type: "info", title, message, duration }),
};
