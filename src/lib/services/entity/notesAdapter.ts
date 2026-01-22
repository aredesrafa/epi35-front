/**
 * Notes Adapter - Service Adapter para Notas de Movimentação
 *
 * Responsável por:
 * - CRUD de notas de entrada e saída
 * - Filtros e busca
 * - Paginação server-side
 * - Cache otimizado
 */

import { apiClient, createUrlWithParams } from "../core/apiClient";
import type { PaginatedResponse } from "../../types/serviceTypes";

interface FilterParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ==================== TIPOS ====================

export interface NotaItem {
  id: string;
  tipoEPIId: string;
  quantidade: number;
  custoUnitario?: number;
}

export interface NotaBase {
  id: string;
  numeroNota: string;
  data: string;
  responsavel: string;
  status: "pendente" | "processada" | "cancelada";
  motivo: string;
  observacoes?: string;
  itens: NotaItem[];
}

export interface NotaEntrada extends NotaBase {
  tipo: "entrada";
  fornecedor?: string;
  notaFiscal?: string;
  valorTotal?: number;
}

export interface NotaSaida extends NotaBase {
  tipo: "saida";
  destinatario?: string;
  solicitante?: string;
}

export type Nota = NotaEntrada | NotaSaida;

export interface NotesFilterParams extends FilterParams {
  tipo?: "entrada" | "saida";
  status?: "pendente" | "processada" | "cancelada";
  dataInicio?: string;
  dataFim?: string;
  responsavel?: string;
  // Propriedade faltante identificada nos erros TS
  pageSize?: number;
}

export interface CreateNotaEntradaData {
  numeroNota: string;
  data: string;
  responsavel: string;
  motivo: string;
  fornecedor?: string;
  notaFiscal?: string;
  valorTotal?: number;
  observacoes?: string;
  itens: Omit<NotaItem, "id">[];
}

export interface CreateNotaSaidaData {
  numeroNota: string;
  data: string;
  responsavel: string;
  motivo: string;
  destinatario?: string;
  solicitante?: string;
  observacoes?: string;
  itens: Omit<NotaItem, "id">[];
}

export type CreateNotaData = CreateNotaEntradaData | CreateNotaSaidaData;

export interface UpdateNotaData {
  numeroNota?: string;
  data?: string;
  responsavel?: string;
  motivo?: string;
  observacoes?: string;
  status?: "pendente" | "processada" | "cancelada";
  itens?: Omit<NotaItem, "id">[];
}

// ==================== CACHE ====================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class NotesCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 3 * 60 * 1000; // 3 minutos

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// ==================== NOTES ADAPTER ====================

class NotesAdapter {
  private cache = new NotesCache();
  private baseUrl = "/api/v1/notas";

  // ==================== CONSULTAS ====================

  /**
   * Lista notas com paginação e filtros
   */
  async getNotas(
    params: NotesFilterParams = {},
  ): Promise<PaginatedResponse<Nota>> {
    console.log("📋 NotesAdapter: Carregando notas", params);

    const cacheKey = `notas-${JSON.stringify(params)}`;
    const cached = this.cache.get<PaginatedResponse<Nota>>(cacheKey);

    if (cached) {
      console.log("💾 Cache hit para notas");
      return cached;
    }

    try {
      // Por enquanto, mock data - substituir por API real
      const mockResponse = this.getMockNotas(params);

      this.cache.set(cacheKey, mockResponse);
      console.log("✅ Notas carregadas com sucesso");

      return mockResponse;
    } catch (error: any) {
      console.error("❌ Erro ao carregar notas:", error);
      throw new Error("Não foi possível carregar as notas de movimentação");
    }
  }

  /**
   * Busca uma nota específica
   */
  async getNotaById(id: string): Promise<Nota> {
    console.log("🔍 NotesAdapter: Buscando nota", id);

    const cacheKey = `nota-${id}`;
    const cached = this.cache.get<Nota>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // Mock data - substituir por API real
      const mockData = this.getMockNotas();
      const nota = mockData.items.find((item: any) => item.id === id);

      if (!nota) {
        throw new Error("Nota não encontrada");
      }

      this.cache.set(cacheKey, nota);
      return nota;
    } catch (error: any) {
      console.error("❌ Erro ao buscar nota:", error);
      throw error;
    }
  }

  // ==================== COMANDOS ====================

  /**
   * Cria uma nova nota
   */
  async createNota(
    data: CreateNotaData,
    tipo: "entrada" | "saida",
  ): Promise<Nota> {
    console.log("➕ NotesAdapter: Criando nota", tipo, data);

    try {
      // Mock implementation - substituir por API real
      const newNota: Nota = {
        id: `nota-${Date.now()}`,
        tipo,
        ...data,
        status: "pendente",
        itens: data.itens.map((item, index) => ({
          ...item,
          id: `item-${Date.now()}-${index}`,
        })),
      } as Nota;

      // Limpar cache relacionado
      this.cache.clear();

      console.log("✅ Nota criada com sucesso:", newNota.id);
      return newNota;
    } catch (error: any) {
      console.error("❌ Erro ao criar nota:", error);
      throw new Error("Não foi possível criar a nota");
    }
  }

  /**
   * Atualiza uma nota
   */
  async updateNota(id: string, data: UpdateNotaData): Promise<Nota> {
    console.log("📝 NotesAdapter: Atualizando nota", id, data);

    try {
      // Mock implementation - substituir por API real
      const existing = await this.getNotaById(id);

      const updatedNota: Nota = {
        ...existing,
        ...data,
        itens: data.itens
          ? data.itens.map((item: any, index: number) => ({
              ...item,
              id: item.id || `item-${Date.now()}-${index}`,
            }))
          : existing.itens,
      };

      // Limpar cache relacionado
      this.cache.delete(`nota-${id}`);
      this.cache.clear(); // Limpar lista também

      console.log("✅ Nota atualizada com sucesso");
      return updatedNota;
    } catch (error: any) {
      console.error("❌ Erro ao atualizar nota:", error);
      throw new Error("Não foi possível atualizar a nota");
    }
  }

  /**
   * Remove uma nota (soft delete)
   */
  async deleteNota(id: string): Promise<void> {
    console.log("🗑️ NotesAdapter: Removendo nota", id);

    try {
      // Mock implementation - substituir por API real
      await this.updateNota(id, { status: "cancelada" });

      console.log("✅ Nota removida com sucesso");
    } catch (error: any) {
      console.error("❌ Erro ao remover nota:", error);
      throw new Error("Não foi possível remover a nota");
    }
  }

  /**
   * Processa uma nota (marca como processada)
   */
  async processarNota(id: string): Promise<Nota> {
    console.log("⚡ NotesAdapter: Processando nota", id);

    try {
      const nota = await this.updateNota(id, { status: "processada" });
      console.log("✅ Nota processada com sucesso");
      return nota;
    } catch (error: any) {
      console.error("❌ Erro ao processar nota:", error);
      throw new Error("Não foi possível processar a nota");
    }
  }

  // ==================== UTILITIES ====================

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log("🗑️ Cache das notas limpo");
  }

  /**
   * Obtém opções únicas para filtros
   */
  async getFilterOptions(): Promise<{
    responsaveis: Array<{ value: string; label: string }>;
    fornecedores: Array<{ value: string; label: string }>;
    status: Array<{ value: string; label: string }>;
  }> {
    const data = await this.getNotas({ pageSize: 1000 }); // Buscar todos para extrair opções

    const responsaveis = [
      ...new Set(data.items.map((item: Nota) => item.responsavel)),
    ]
      .filter(Boolean)
      .sort()
      .map((resp) => ({ value: resp, label: resp }));

    const fornecedores = [
      ...new Set(
        data.items
          .filter((item): item is NotaEntrada => item.tipo === "entrada")
          .map((item: NotaEntrada) => item.fornecedor)
          .filter(Boolean),
      ),
    ]
      .sort()
      .map((forn) => ({ value: forn!, label: forn! }));

    const status = [
      { value: "pendente", label: "Pendente" },
      { value: "processada", label: "Processada" },
      { value: "cancelada", label: "Cancelada" },
    ];

    return { responsaveis, fornecedores, status };
  }

  // ==================== MOCK DATA ====================

  private getMockNotas(
    params: NotesFilterParams = {},
  ): PaginatedResponse<Nota> {
    const mockNotasEntrada: NotaEntrada[] = [
      {
        id: "1",
        tipo: "entrada",
        numeroNota: "NE-2025-001",
        data: "2025-01-03",
        responsavel: "João Silva",
        status: "processada",
        motivo: "Compra de EPIs",
        fornecedor: "EPI Tech Ltda",
        notaFiscal: "NF-12345",
        valorTotal: 2500.0,
        itens: [
          { id: "1", tipoEPIId: "1", quantidade: 10, custoUnitario: 50.0 },
          { id: "2", tipoEPIId: "2", quantidade: 20, custoUnitario: 75.0 },
        ],
      },
      {
        id: "2",
        tipo: "entrada",
        numeroNota: "NE-2025-002",
        data: "2025-01-02",
        responsavel: "Maria Santos",
        status: "pendente",
        motivo: "Reposição de estoque",
        fornecedor: "Segurança Industrial",
        valorTotal: 1800.0,
        itens: [
          { id: "3", tipoEPIId: "3", quantidade: 15, custoUnitario: 120.0 },
        ],
      },
      {
        id: "3",
        tipo: "entrada",
        numeroNota: "NE-2025-003",
        data: "2025-01-01",
        responsavel: "Pedro Oliveira",
        status: "processada",
        motivo: "Compra emergencial",
        fornecedor: "ProSafe Equipamentos",
        valorTotal: 3200.0,
        itens: [
          { id: "4", tipoEPIId: "1", quantidade: 25, custoUnitario: 48.0 },
        ],
      },
    ];

    const mockNotasSaida: NotaSaida[] = [
      {
        id: "4",
        tipo: "saida",
        numeroNota: "NS-2025-001",
        data: "2025-01-03",
        responsavel: "Ana Pereira",
        status: "processada",
        motivo: "Distribuição para obra",
        destinatario: "Obra São Paulo",
        solicitante: "Carlos Mendes",
        itens: [
          { id: "5", tipoEPIId: "1", quantidade: 5 },
          { id: "6", tipoEPIId: "2", quantidade: 8 },
        ],
      },
      {
        id: "5",
        tipo: "saida",
        numeroNota: "NS-2025-002",
        data: "2025-01-02",
        responsavel: "Roberto Santos",
        status: "pendente",
        motivo: "Transferência entre depósitos",
        destinatario: "Depósito Central",
        itens: [{ id: "7", tipoEPIId: "3", quantidade: 10 }],
      },
    ];

    // Combinar dados
    let allNotas: Nota[] = [...mockNotasEntrada, ...mockNotasSaida];

    // Aplicar filtros
    if (params.tipo) {
      allNotas = allNotas.filter((nota) => nota.tipo === params.tipo);
    }

    if (params.status) {
      allNotas = allNotas.filter((nota) => nota.status === params.status);
    }

    if (params.responsavel) {
      allNotas = allNotas.filter(
        (nota) => nota.responsavel === params.responsavel,
      );
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      allNotas = allNotas.filter(
        (nota) =>
          nota.numeroNota.toLowerCase().includes(searchLower) ||
          nota.motivo.toLowerCase().includes(searchLower) ||
          nota.responsavel.toLowerCase().includes(searchLower) ||
          (nota.tipo === "entrada" &&
            nota.fornecedor?.toLowerCase().includes(searchLower)) ||
          (nota.tipo === "saida" &&
            nota.destinatario?.toLowerCase().includes(searchLower)),
      );
    }

    if (params.dataInicio) {
      allNotas = allNotas.filter((nota) => nota.data >= params.dataInicio!);
    }

    if (params.dataFim) {
      allNotas = allNotas.filter((nota) => nota.data <= params.dataFim!);
    }

    // Ordenar por data (mais recente primeiro)
    allNotas.sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    );

    // Paginação
    const pageSize = params.pageSize || 10;
    const page = params.page || 1;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = allNotas.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      total: allNotas.length,
      page,
      pageSize,
      totalPages: Math.ceil(allNotas.length / pageSize),
      hasNext: endIndex < allNotas.length,
      hasPrev: page > 1,
    };
  }
}

// ==================== EXPORT ====================

export const notesAdapter = new NotesAdapter();
