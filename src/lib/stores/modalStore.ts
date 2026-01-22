import { writable, get } from "svelte/store";
import type { ModalState } from "$lib/types";

// Store genérico para controle de modais
export function createModalStore<T = any>() {
  const { subscribe, set, update } = writable<ModalState & { data?: T }>({
    isOpen: false,
    mode: "create",
    data: undefined,
  });

  return {
    subscribe,

    // Abrir modal
    open: (
      mode: "create" | "edit" | "view" | "delete" = "create",
      data?: T,
    ) => {
      set({ isOpen: true, mode, data });
    },

    // Fechar modal
    close: () => {
      set({ isOpen: false, mode: "create", data: undefined });
    },

    // Atualizar dados do modal
    setData: (data: T) => {
      update((state) => ({ ...state, data }));
    },

    // Alterar modo do modal
    setMode: (mode: "create" | "edit" | "view" | "delete") => {
      update((state) => ({ ...state, mode }));
    },

    // Verificadores de estado - FIXED: usando get() do Svelte
    isOpen: () => get({ subscribe }).isOpen,
    isMode: (mode: "create" | "edit" | "view" | "delete") =>
      get({ subscribe }).mode === mode,
    getData: () => get({ subscribe }).data,
  };
}

// Stores de modais específicos
export const epiModal = createModalStore();
export const colaboradorModal = createModalStore();
export const fichaModal = createModalStore();
export const entregaModal = createModalStore();
export const estoqueModal = createModalStore();
export const movimentacaoModal = createModalStore();
export const assinaturaModal = createModalStore();
export const devolucaoModal = createModalStore();

// Store para controle de confirmação (delete, etc)
interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "red" | "blue" | "green" | "yellow";
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

function createConfirmationStore() {
  const { subscribe, set, update } = writable<ConfirmationState>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    confirmColor: "red",
  });

  return {
    subscribe,

    confirm: (options: {
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      confirmColor?: "red" | "blue" | "green" | "yellow";
      onConfirm?: () => void | Promise<void>;
      onCancel?: () => void;
    }) => {
      set({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || "Confirmar",
        cancelText: options.cancelText || "Cancelar",
        confirmColor: options.confirmColor || "red",
        onConfirm: options.onConfirm,
        onCancel: options.onCancel,
      });
    },

    close: () => {
      set({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "Confirmar",
        cancelText: "Cancelar",
        confirmColor: "red",
      });
    },

    handleConfirm: async () => {
      const state = get({ subscribe });
      if (state.onConfirm) {
        await state.onConfirm();
      }
      set({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "Confirmar",
        cancelText: "Cancelar",
        confirmColor: "red",
      });
    },

    handleCancel: () => {
      const state = get({ subscribe });
      if (state.onCancel) {
        state.onCancel();
      }
      set({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "Confirmar",
        cancelText: "Cancelar",
        confirmColor: "red",
      });
    },
  };
}

export const confirmationModal = createConfirmationStore();

// Helpers para confirmações comuns
export const confirmActions = {
  delete: (itemName: string, onConfirm: () => void | Promise<void>) => {
    confirmationModal.confirm({
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      confirmColor: "red",
      onConfirm,
    });
  },

  save: (onConfirm: () => void | Promise<void>) => {
    confirmationModal.confirm({
      title: "Confirmar Alterações",
      message: "Tem certeza que deseja salvar as alterações?",
      confirmText: "Salvar",
      cancelText: "Cancelar",
      confirmColor: "blue",
      onConfirm,
    });
  },

  discard: (onConfirm: () => void | Promise<void>) => {
    confirmationModal.confirm({
      title: "Descartar Alterações",
      message:
        "Tem certeza que deseja descartar as alterações? Todas as modificações serão perdidas.",
      confirmText: "Descartar",
      cancelText: "Continuar Editando",
      confirmColor: "red",
      onConfirm,
    });
  },

  custom: (
    title: string,
    message: string,
    options?: {
      confirmText?: string;
      cancelText?: string;
      confirmColor?: "red" | "blue" | "green" | "yellow";
      onConfirm?: () => void | Promise<void>;
      onCancel?: () => void;
    },
  ) => {
    confirmationModal.confirm({
      title,
      message,
      ...options,
    });
  },
};

// Store para controle de loading em operações de modal
export const modalLoading = writable(false);

// Helper para executar operações com loading
export async function withModalLoading<T>(
  operation: () => Promise<T>,
): Promise<T> {
  modalLoading.set(true);
  try {
    const result = await operation();
    return result;
  } finally {
    modalLoading.set(false);
  }
}
