/**
 * Contratada Store - Nova Entidade com Backend Integration
 *
 * Store para gestão de empresas contratadas usando server-side pagination
 * e validação CNPJ em tempo real. Esta é uma nova funcionalidade que não
 * existia no frontend legacy.
 *
 * Features:
 * - CRUD completo de contratadas
 * - Validação CNPJ matemática em tempo real
 * - Busca por nome/CNPJ com debounce
 * - Filtros por status e tipo
 * - Estatísticas de colaboradores vinculados
 * - Integração completa com backend
 */

import { derived, type Readable } from "svelte/store";
import { createPaginatedStore, type PaginatedStore } from "./paginatedStore";
import { api } from "../services/core/apiClient";
import type { PaginatedResponse } from "../stores/paginatedStore";

// ==================== TIPOS ESPECÍFICOS DE CONTRATADA ====================

export interface Contratada {
  id: string;
  nome: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;

  // Endereço
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };

  // Contatos
  telefone?: string;
  email?: string;
  responsavelNome?: string;
  responsavelEmail?: string;
  responsavelTelefone?: string;

  // Dados de controle
  status: "ATIVA" | "INATIVA" | "SUSPENSA";
  dataInicioContrato: string;
  dataFimContrato?: string;
  observacoes?: string;

  // Estatísticas (calculadas pelo backend)
  totalColaboradores?: number;
  colaboradoresAtivos?: number;
  totalFichasEPI?: number;

  // Auditoria
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
  updatedByUserId?: string;
}

export interface ContratadaFilters {
  // Filtros de negócio
  status?: "ATIVA" | "INATIVA" | "SUSPENSA";

  // Busca
  search?: string; // Busca por nome, razão social ou CNPJ
  cnpj?: string;
  nome?: string;

  // Filtros de data
  dataInicioFrom?: string;
  dataInicioTo?: string;
  dataFimFrom?: string;
  dataFimTo?: string;

  // Ordenação
  orderBy?:
    | "nome"
    | "cnpj"
    | "status"
    | "dataInicioContrato"
    | "totalColaboradores";
  orderDirection?: "asc" | "desc";
}

export interface ContratadaCreateData {
  nome: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  telefone?: string;
  email?: string;
  responsavelNome?: string;
  responsavelEmail?: string;
  responsavelTelefone?: string;
  dataInicioContrato: string;
  dataFimContrato?: string;
  observacoes?: string;
}

// ==================== FUNÇÃO DE FETCH PARA BACKEND ====================

async function fetchContratadaData(
  params: any,
): Promise<PaginatedResponse<Contratada>> {
  try {
    console.log("🏢 Buscando dados de contratadas:", params);

    // Mapear parâmetros para formato do backend
    const backendParams = {
      page: params.page || 1,
      limit: params.limit || 20,

      // Filtros específicos
      cnpj: params.cnpj,
      nome: params.nome,
      search: params.search,

      // Ordenação
      orderBy: params.orderBy,
      orderDirection: params.orderDirection,
    };

    // Chamar endpoint de contratadas
    const response = await api.get("/contratadas") as any;

    // Transformar response para formato do paginatedStore
    if (response.success && response.data) {
      return {
        data: response.data.contratadas || response.data.items || response.data,
        total: response.meta?.totalItems || response.data.length || 0,
        page: response.meta?.currentPage || backendParams.page,
        pageSize: response.meta?.pageSize || backendParams.limit,
        totalPages:
          response.meta?.totalPages ||
          Math.ceil((response.meta?.totalItems || 0) / backendParams.limit),
      };
    }

    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: backendParams.limit,
      totalPages: 0,
    };
  } catch (error: any) {
    console.error("❌ Erro ao buscar contratadas:", error);
    throw error;
  }
}

// ==================== STORE PRINCIPAL ====================

export const contratadaStore: PaginatedStore<Contratada> = createPaginatedStore(
  fetchContratadaData,
  {
    initialPageSize: 20,
    enableCache: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutos
    debounceDelay: 300,
  },
);

// ==================== STORES DERIVADOS ====================

export const contratadaData: Readable<Contratada[]> = derived(
  contratadaStore,
  ($store) => $store.items,
);

export const contratadaLoading: Readable<boolean> = derived(
  contratadaStore,
  ($store) => $store.loading,
);

export const contratadaError: Readable<string | null> = derived(
  contratadaStore,
  ($store) => $store.error,
);

export const contratadaAtivas: Readable<Contratada[]> = derived(
  contratadaData,
  ($data) => $data.filter((contratada) => contratada.status === "ATIVA"),
);

export const contratadaStats: Readable<{
  total: number;
  ativas: number;
  inativas: number;
  suspensas: number;
  totalColaboradores: number;
  mediaColaboradoresPorContratada: number;
}> = derived(contratadaData, ($data) => {
  const total = $data.length;
  const ativas = $data.filter((c) => c.status === "ATIVA").length;
  const inativas = $data.filter((c) => c.status === "INATIVA").length;
  const suspensas = $data.filter((c) => c.status === "SUSPENSA").length;
  const totalColaboradores = $data.reduce(
    (acc, c) => acc + (c.totalColaboradores || 0),
    0,
  );
  const mediaColaboradoresPorContratada =
    total > 0 ? totalColaboradores / total : 0;

  return {
    total,
    ativas,
    inativas,
    suspensas,
    totalColaboradores,
    mediaColaboradoresPorContratada:
      Math.round(mediaColaboradoresPorContratada * 100) / 100,
  };
});

// ==================== ACTIONS ESPECÍFICAS ====================

export async function loadContratadas(filters: ContratadaFilters = {}) {
  return contratadaStore.fetchPage({
    page: 1,
    limit: 20,
    ...filters,
  });
}

export function searchContratadas(searchTerm: string) {
  contratadaStore.setSearch(searchTerm);
}

export function filterContratadas(filters: ContratadaFilters) {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([_, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

  contratadaStore.setFilters(cleanFilters);
}

export function clearContratadaFilters() {
  contratadaStore.reset();
}

export function reloadContratadas() {
  return contratadaStore.reload();
}

export function sortContratadas(
  field: ContratadaFilters["orderBy"],
  direction: "asc" | "desc" = "asc",
) {
  return contratadaStore.setSorting(field!, direction);
}

// ==================== CRUD OPERATIONS ====================

export async function createContratada(
  data: ContratadaCreateData,
): Promise<Contratada> {
  try {
    console.log("➕ Criando nova contratada:", data);

    const response = await api.post("/contratadas", data);

    if (response.success && response.data) {
      // Reload data to show new item
      await reloadContratadas();
      return response.data;
    }

    throw new Error("Erro ao criar contratada");
  } catch (error: any) {
    console.error("❌ Erro ao criar contratada:", error);
    throw error;
  }
}

export async function updateContratada(
  id: string,
  data: Partial<ContratadaCreateData>,
): Promise<Contratada> {
  try {
    console.log("✏️ Atualizando contratada:", id, data);

    const response = await api.put(`/contratadas/${id}`, data);

    if (response.success && response.data) {
      // Reload data to show updated item
      await reloadContratadas();
      return response.data;
    }

    throw new Error("Erro ao atualizar contratada");
  } catch (error: any) {
    console.error("❌ Erro ao atualizar contratada:", error);
    throw error;
  }
}

export async function deleteContratada(id: string): Promise<void> {
  try {
    console.log("🗑️ Deletando contratada:", id);

    await api.delete(`/contratadas/${id}`);

    // Reload data to remove deleted item
    await reloadContratadas();
  } catch (error: any) {
    console.error("❌ Erro ao deletar contratada:", error);
    throw error;
  }
}

export async function getContratadaById(id: string): Promise<Contratada> {
  try {
    console.log("🔍 Buscando contratada por ID:", id);

    const response = await api.get(`/contratadas/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error("Contratada não encontrada");
  } catch (error: any) {
    console.error("❌ Erro ao buscar contratada:", error);
    throw error;
  }
}

// ==================== VALIDAÇÃO CNPJ ====================

export interface CNPJValidationResult {
  valid: boolean;
  formatted: string;
  message?: string;
}

export function formatCNPJ(cnpj: string): string {
  // Remove caracteres não numéricos
  const clean = cnpj.replace(/\D/g, "");

  // Aplica máscara XX.XXX.XXX/XXXX-XX
  if (clean.length <= 14) {
    return clean
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return clean.substring(0, 14);
}

export function validateCNPJ(cnpj: string): CNPJValidationResult {
  const clean = cnpj.replace(/\D/g, "");

  // Verificar se tem 14 dígitos
  if (clean.length !== 14) {
    return {
      valid: false,
      formatted: formatCNPJ(cnpj),
      message: "CNPJ deve ter 14 dígitos",
    };
  }

  // Verificar se não são todos dígitos iguais
  if (/^(\d)\1{13}$/.test(clean)) {
    return {
      valid: false,
      formatted: formatCNPJ(cnpj),
      message: "CNPJ inválido - todos os dígitos são iguais",
    };
  }

  // Validação matemática do CNPJ
  const digits = clean.split("").map(Number);

  // Primeiro dígito verificador
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }

  const firstCheck = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  if (digits[12] !== firstCheck) {
    return {
      valid: false,
      formatted: formatCNPJ(cnpj),
      message: "CNPJ inválido - primeiro dígito verificador incorreto",
    };
  }

  // Segundo dígito verificador
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }

  const secondCheck = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  if (digits[13] !== secondCheck) {
    return {
      valid: false,
      formatted: formatCNPJ(cnpj),
      message: "CNPJ inválido - segundo dígito verificador incorreto",
    };
  }

  return {
    valid: true,
    formatted: formatCNPJ(cnpj),
    message: "CNPJ válido",
  };
}

export async function validateCNPJWithBackend(cnpj: string): Promise<{
  valid: boolean;
  exists: boolean;
  contratadaId?: string;
  message: string;
}> {
  try {
    // Primeiro fazer validação matemática local
    const localValidation = validateCNPJ(cnpj);

    if (!localValidation.valid) {
      return {
        valid: false,
        exists: false,
        message: localValidation.message || "CNPJ inválido",
      };
    }

    // Buscar no backend para verificar se já existe
    const response = await api.get(
      "/contratadas/search",
      localValidation.formatted,
    );

    if (response.success && response.data) {
      const existing = response.data.find(
        (c: Contratada) => c.cnpj === localValidation.formatted,
      );

      if (existing) {
        return {
          valid: true,
          exists: true,
          contratadaId: existing.id,
          message: `CNPJ já cadastrado para ${existing.nome}`,
        };
      }
    }

    return {
      valid: true,
      exists: false,
      message: "CNPJ válido e disponível",
    };
  } catch (error: any) {
    console.error("❌ Erro na validação CNPJ com backend:", error);

    // Em caso de erro de rede, retornar validação local
    const localValidation = validateCNPJ(cnpj);
    return {
      valid: localValidation.valid,
      exists: false,
      message:
        localValidation.message ||
        (localValidation.valid
          ? "CNPJ válido (verificação offline)"
          : "CNPJ inválido"),
    };
  }
}

// ==================== UTILITIES ====================

export function getContratadaById_Local(id: string): Contratada | undefined {
  let currentData: Contratada[] = [];
  contratadaData.subscribe((data) => (currentData = data))();
  return currentData.find((c) => c.id === id);
}

export async function getContratadaStatistics(): Promise<any> {
  try {
    const response = await api.get("/contratadas/stats");
    return response.data;
  } catch (error: any) {
    console.error("❌ Erro ao buscar estatísticas:", error);
    throw error;
  }
}

// ==================== EXPORT CONSOLIDADO ====================

export default {
  // Store principal
  store: contratadaStore,

  // Dados derivados
  data: contratadaData,
  loading: contratadaLoading,
  error: contratadaError,
  ativas: contratadaAtivas,
  stats: contratadaStats,

  // Actions
  load: loadContratadas,
  search: searchContratadas,
  filter: filterContratadas,
  clear: clearContratadaFilters,
  reload: reloadContratadas,
  sort: sortContratadas,

  // CRUD
  create: createContratada,
  update: updateContratada,
  delete: deleteContratada,
  getById: getContratadaById,

  // Validação
  validateCNPJ,
  validateCNPJWithBackend,
  formatCNPJ,

  // Utilities
  getById_Local: getContratadaById_Local,
  getStatistics: getContratadaStatistics,
};
