import { writable, derived, get } from "svelte/store";
import type {
  TipoEPI,
  ItemEstoque,
  FichaEPI,
  Colaborador,
  Empresa,
  Entrega,
  Notificacao,
  EstoqueFilters,
  FichasFilters,
} from "$lib/types";

// Store para tipos de EPI
function createTiposEPIStore() {
  const { subscribe, set, update } = writable<TipoEPI[]>([]);

  return {
    subscribe,
    set,
    add: (tipoEPI: TipoEPI) => update((items) => [...items, tipoEPI]),
    update: (id: string, updates: Partial<TipoEPI>) =>
      update((items) =>
        items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      ),
    remove: (id: string) =>
      update((items) => items.filter((item) => item.id !== id)),
    getById: (id: string): TipoEPI | undefined => {
      return get({ subscribe }).find((item) => item.id === id);
    },
    clear: () => set([]),
  };
}

// Store para itens de estoque
function createEstoqueStore() {
  const { subscribe, set, update } = writable<ItemEstoque[]>([]);

  return {
    subscribe,
    set,
    add: (item: ItemEstoque) => update((items) => [...items, item]),
    update: (id: string, updates: Partial<ItemEstoque>) =>
      update((items) =>
        items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      ),
    remove: (id: string) =>
      update((items) => items.filter((item) => item.id !== id)),
    updateQuantidade: (id: string, novaQuantidade: number) =>
      update((items) =>
        items.map((item) =>
          item.id === id ? { ...item, quantidade: novaQuantidade } : item,
        ),
      ),
    getById: (id: string): ItemEstoque | undefined => {
      return get({ subscribe }).find((item) => item.id === id);
    },
    getByTipoEPI: (tipoEPIId: string): ItemEstoque[] => {
      return get({ subscribe }).filter((item) => item.tipoEPIId === tipoEPIId);
    },
    clear: () => set([]),
  };
}

// Store para fichas EPI
function createFichasStore() {
  const { subscribe, set, update } = writable<FichaEPI[]>([]);

  return {
    subscribe,
    set,
    add: (ficha: FichaEPI) => update((fichas) => [...fichas, ficha]),
    update: (id: string, updates: Partial<FichaEPI>) =>
      update((fichas) =>
        fichas.map((ficha) =>
          ficha.id === id ? { ...ficha, ...updates } : ficha,
        ),
      ),
    remove: (id: string) =>
      update((fichas) => fichas.filter((ficha) => ficha.id !== id)),
    getById: (id: string): FichaEPI | undefined => {
      return get({ subscribe }).find((ficha) => ficha.id === id);
    },
    getByColaborador: (colaboradorId: string): FichaEPI[] => {
      return get({ subscribe }).filter(
        (ficha) => ficha.colaboradorId === colaboradorId,
      );
    },
    getAtivas: (): FichaEPI[] => {
      return get({ subscribe }).filter((ficha) => ficha.status === "ativo");
    },
    getVencidas: (): FichaEPI[] => {
      return get({ subscribe }).filter((ficha) => ficha.status === "vencido");
    },
    clear: () => set([]),
  };
}

// Store para colaboradores
function createColaboradoresStore() {
  const { subscribe, set, update } = writable<Colaborador[]>([]);

  return {
    subscribe,
    set,
    add: (colaborador: Colaborador) =>
      update((colaboradores) => [...colaboradores, colaborador]),
    update: (id: string, updates: Partial<Colaborador>) =>
      update((colaboradores) =>
        colaboradores.map((col) =>
          col.id === id ? { ...col, ...updates } : col,
        ),
      ),
    remove: (id: string) =>
      update((colaboradores) => colaboradores.filter((col) => col.id !== id)),
    getById: (id: string): Colaborador | undefined => {
      return get({ subscribe }).find((col) => col.id === id);
    },
    getByEmpresa: (empresaId: string): Colaborador[] => {
      return get({ subscribe }).filter((col) => col.empresaId === empresaId);
    },
    getAtivos: (): Colaborador[] => {
      return get({ subscribe }).filter((col) => col.status === "ativo");
    },
    clear: () => set([]),
  };
}

// Store para empresas
function createEmpresasStore() {
  const { subscribe, set, update } = writable<Empresa[]>([]);

  return {
    subscribe,
    set,
    add: (empresa: Empresa) => update((empresas) => [...empresas, empresa]),
    update: (id: string, updates: Partial<Empresa>) =>
      update((empresas) =>
        empresas.map((emp) => (emp.id === id ? { ...emp, ...updates } : emp)),
      ),
    remove: (id: string) =>
      update((empresas) => empresas.filter((emp) => emp.id !== id)),
    getById: (id: string): Empresa | undefined => {
      return get({ subscribe }).find((emp) => emp.id === id);
    },
    getAtivas: (): Empresa[] => {
      return get({ subscribe }).filter((emp) => emp.status === "ativa");
    },
    clear: () => set([]),
  };
}

// Store para entregas
function createEntregasStore() {
  const { subscribe, set, update } = writable<Entrega[]>([]);

  return {
    subscribe,
    set,
    add: (entrega: Entrega) => update((entregas) => [...entregas, entrega]),
    update: (id: string, updates: Partial<Entrega>) =>
      update((entregas) =>
        entregas.map((ent) => (ent.id === id ? { ...ent, ...updates } : ent)),
      ),
    remove: (id: string) =>
      update((entregas) => entregas.filter((ent) => ent.id !== id)),
    getById: (id: string): Entrega | undefined => {
      return get({ subscribe }).find((ent) => ent.id === id);
    },
    getByFicha: (fichaId: string): Entrega[] => {
      return get({ subscribe }).filter((ent) => ent.fichaEPIId === fichaId);
    },
    getPendentes: (): Entrega[] => {
      return get({ subscribe }).filter(
        (ent) => ent.status === "nao_assinado" || ent.status === "pendente",
      );
    },
    clear: () => set([]),
  };
}

// Store para notificações
function createNotificacoesStore() {
  const { subscribe, set, update } = writable<Notificacao[]>([]);

  return {
    subscribe,
    set,
    add: (notificacao: Notificacao) =>
      update((notifs) => [notificacao, ...notifs]),
    update: (id: string, updates: Partial<Notificacao>) =>
      update((notifs) =>
        notifs.map((notif) =>
          notif.id === id ? { ...notif, ...updates } : notif,
        ),
      ),
    remove: (id: string) =>
      update((notifs) => notifs.filter((notif) => notif.id !== id)),
    markAsRead: (id: string) =>
      update((notifs) =>
        notifs.map((notif) =>
          notif.id === id ? { ...notif, lida: true } : notif,
        ),
      ),
    markAllAsRead: () =>
      update((notifs) => notifs.map((notif) => ({ ...notif, lida: true }))),
    getNaoLidas: (): Notificacao[] => {
      return get({ subscribe }).filter((notif) => !notif.lida);
    },
    getByTipo: (tipo: Notificacao["tipo"]): Notificacao[] => {
      return get({ subscribe }).filter((notif) => notif.tipo === tipo);
    },
    clear: () => set([]),
  };
}

// Instâncias dos stores
export const tiposEPIStore = createTiposEPIStore();
export const estoqueStore = createEstoqueStore();
export const fichasStore = createFichasStore();
export const colaboradoresStore = createColaboradoresStore();
export const empresasStore = createEmpresasStore();
export const entregasStore = createEntregasStore();
export const notificacoesStore = createNotificacoesStore();

// Stores derivados úteis
export const estoqueDisponivel = derived(estoqueStore, ($estoque) =>
  $estoque.filter(
    (item) => item.quantidade > 0 && item.status === "disponivel",
  ),
);

export const estoqueComBaixoEstoque = derived(estoqueStore, ($estoque) =>
  $estoque.filter(
    (item) => item.quantidadeMinima && item.quantidade <= item.quantidadeMinima,
  ),
);

export const fichasVencidas = derived(fichasStore, ($fichas) =>
  $fichas.filter((ficha) => ficha.status === "vencido"),
);

export const colaboradoresAtivos = derived(
  colaboradoresStore,
  ($colaboradores) => $colaboradores.filter((col) => col.status === "ativo"),
);

export const notificacoesNaoLidas = derived(
  notificacoesStore,
  ($notificacoes) => $notificacoes.filter((notif) => !notif.lida),
);

export const countNotificacoesNaoLidas = derived(
  notificacoesNaoLidas,
  ($notificacoes) => $notificacoes.length,
);

// Store combinado para estatísticas do dashboard
export const dashboardStats = derived(
  [estoqueStore, fichasStore, colaboradoresStore, notificacoesNaoLidas],
  ([$estoque, $fichas, $colaboradores, $notificacoesNaoLidas]) => ({
    totalEstoque: $estoque.reduce((total, item) => total + item.quantidade, 0),
    fichasAtivas: $fichas.filter((f) => f.status === "ativo").length,
    fichasVencidas: $fichas.filter((f) => f.status === "vencido").length,
    colaboradoresAtivos: $colaboradores.filter((c) => c.status === "ativo")
      .length,
    notificacoesPendentes: $notificacoesNaoLidas.length,
    estoqueComProblemas: $estoque.filter(
      (item) =>
        item.status === "baixo_estoque" ||
        item.status === "vencido" ||
        item.status === "esgotado",
    ).length,
  }),
);
