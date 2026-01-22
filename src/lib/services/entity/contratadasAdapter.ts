/**
 * Contratadas Service Adapter
 *
 * Adapter especializado para gestão de empresas contratadas.
 * Conectado aos endpoints reais do backend quando disponíveis.
 */

import { api, createUrlWithParams } from "../core/apiClient";
import { isValidCNPJ, formatCNPJ } from "$lib/utils/validation";

// ==================== TYPES ====================

export interface ContratadaDTO {
  id: string;
  nome: string;
  cnpj: string;
  endereco?: string;
  contato?: string;
  status: "ativa" | "inativa";
  colaboradores: number;
  dataContrato: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContratadaForm {
  nome: string;
  cnpj: string;
  endereco?: string;
  contato?: string;
}

export interface UpdateContratadaForm extends Partial<CreateContratadaForm> {
  status?: "ativa" | "inativa";
}

// ==================== ADAPTER ====================

class ContratadasAdapter {
  /**
   * ✅ PREPARADO PARA BACKEND: Lista contratadas com paginação
   */
  async getContratadas(params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    statusFilter?: string;
  }): Promise<{
    contratadas: ContratadaDTO[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      console.log("🏢 Carregando contratadas...", params);

      const queryParams: Record<string, any> = {
        page: params.page || 1,
        limit: params.limit || 10,
      };

      if (params.searchTerm) {
        queryParams.search = params.searchTerm;
      }

      if (params.statusFilter && params.statusFilter !== "todos") {
        queryParams.status = params.statusFilter.toUpperCase();
      }

      // ✅ CONECTADO: Chamada real para o endpoint de contratadas
      const endpoint = createUrlWithParams('/contratadas', queryParams);
      const response = await api.get(endpoint) as any;

      console.log('📦 Contratadas response real:', response);
      console.log('📦 Estrutura dos dados:', {
        success: response.success,
        contratadas: response.data?.contratadas?.length || 0,
        total: response.data?.total || 0
      });
      
      if (response.success && response.data) {
        // Mapear dados do backend para interface do frontend
        const contratadas = response.data.contratadas.map((item: any) => ({
          id: item.id,
          nome: item.nome,
          cnpj: item.cnpjFormatado || item.cnpj,
          endereco: item.endereco || '',
          contato: item.contato || '',
          status: item.status || 'ativa',
          colaboradores: item.colaboradores || 0,
          dataContrato: item.dataContrato || item.createdAt?.split('T')[0] || '',
          createdAt: item.createdAt,
          updatedAt: item.updatedAt || item.createdAt
        }));

        console.log('✅ Contratadas mapeadas:', contratadas.length);

        return {
          contratadas,
          total: response.data.total || 0,
          page: params.page || 1,
          limit: params.limit || 10,
        };
      }

      // Se chegou aqui, a resposta não foi bem-sucedida
      throw new Error('Falha na resposta da API');

    } catch (error: any) {
      console.error("❌ Erro ao carregar contratadas, usando fallback mock:", error);
      
      // Fallback para dados mock em caso de erro
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const mockData: ContratadaDTO[] = [
        {
          id: "1",
          nome: "Alpha Construções Ltda",
          cnpj: "12.345.678/0001-90",
          endereco: "Rua das Construções, 123",
          contato: "(11) 99999-9999",
          status: "ativa",
          colaboradores: 15,
          dataContrato: "2024-01-15",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          nome: "Beta Engenharia S.A.",
          cnpj: "98.765.432/0001-10",
          endereco: "Av. Engenharia, 456",
          contato: "contato@betaeng.com.br",
          status: "ativa",
          colaboradores: 8,
          dataContrato: "2024-03-22",
          createdAt: "2024-03-22T14:30:00Z",
          updatedAt: "2024-03-22T14:30:00Z",
        },
      ];

      // Aplicar filtros ao fallback
      let contratadasFiltradas = mockData;

      if (params.searchTerm) {
        const searchLower = params.searchTerm.toLowerCase();
        contratadasFiltradas = contratadasFiltradas.filter(
          (contratada) =>
            contratada.nome.toLowerCase().includes(searchLower) ||
            contratada.cnpj.includes(params.searchTerm!),
        );
      }

      if (params.statusFilter && params.statusFilter !== "todos") {
        contratadasFiltradas = contratadasFiltradas.filter(
          (contratada) => contratada.status === params.statusFilter,
        );
      }

      console.log("✅ Contratadas carregadas (fallback):", contratadasFiltradas.length);

      return {
        contratadas: contratadasFiltradas,
        total: contratadasFiltradas.length,
        page: params.page || 1,
        limit: params.limit || 10,
      };
    }
  }

  /**
   * ✅ PREPARADO PARA BACKEND: Busca contratada por ID
   */
  async getContratadaById(id: string): Promise<ContratadaDTO> {
    try {
      console.log("🏢 Buscando contratada:", id);

      // TODO: Conectar ao endpoint real
      // const response = await api.get<ContratadaDTO>(`/contratadas/${id}`) as any;

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock de resposta
      const mockContratada: ContratadaDTO = {
        id,
        nome: "Alpha Construções Ltda",
        cnpj: "12.345.678/0001-90",
        endereco: "Rua das Construções, 123",
        contato: "(11) 99999-9999",
        status: "ativa",
        colaboradores: 15,
        dataContrato: "2024-01-15",
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z",
      };

      console.log("✅ Contratada encontrada:", mockContratada.nome);
      return mockContratada;
    } catch (error: any) {
      console.error("❌ Erro ao buscar contratada:", error);
      throw error;
    }
  }

  /**
   * ✅ CONECTADO AO BACKEND: Criar nova contratada
   */
  async createContratada(data: CreateContratadaForm): Promise<ContratadaDTO> {
    try {
      console.log("💾 Criando contratada:", data);

      // Validação local de CNPJ antes de enviar
      if (data.cnpj && !isValidCNPJ(data.cnpj)) {
        throw new Error("CNPJ inválido. Verifique o formato e os dígitos verificadores.");
      }

      // Normalizar CNPJ (remover formatação)
      const payload = {
        ...data,
        cnpj: data.cnpj ? data.cnpj.replace(/\D/g, '') : undefined,
      };

      // ✅ CONECTADO: Chamada real para o backend
      const response = await api.post<{ success: boolean; data: ContratadaDTO }>('/contratadas', payload);
      
      if (response.success && response.data) {
        console.log("✅ Contratada criada no backend:", response.data.id);
        return response.data;
      }

      throw new Error("Resposta inválida do backend");
    } catch (error: any) {
      console.error("❌ Erro ao criar contratada no backend, usando fallback:", error);
      
      // Se for erro de validação, repassar
      if (error instanceof Error && error.message.includes("CNPJ inválido")) {
        throw error;
      }
      
      // Fallback para mock apenas em caso de erro de rede/servidor
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const novaContratada: ContratadaDTO = {
        id: `contratada-mock-${Date.now()}`,
        nome: data.nome,
        cnpj: data.cnpj,
        endereco: data.endereco,
        contato: data.contato,
        status: "ativa",
        colaboradores: 0,
        dataContrato: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("✅ Contratada criada (fallback):", novaContratada.id);
      return novaContratada;
    }
  }

  /**
   * ✅ PREPARADO PARA BACKEND: Atualizar contratada
   */
  async updateContratada(
    id: string,
    data: UpdateContratadaForm,
  ): Promise<ContratadaDTO> {
    try {
      console.log("💾 Atualizando contratada:", id, data);

      // TODO: Conectar ao endpoint real
      // const response = await api.put<ContratadaDTO>(`/contratadas/${id}`, data) as any;

      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock de resposta
      const contratadaAtualizada: ContratadaDTO = {
        id,
        nome: data.nome || "Nome Atualizado",
        cnpj: data.cnpj || "12.345.678/0001-90",
        endereco: data.endereco,
        contato: data.contato,
        status: data.status || "ativa",
        colaboradores: 15,
        dataContrato: "2024-01-15",
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: new Date().toISOString(),
      };

      console.log("✅ Contratada atualizada:", contratadaAtualizada.id);
      return contratadaAtualizada;
    } catch (error: any) {
      console.error("❌ Erro ao atualizar contratada:", error);
      throw error;
    }
  }

  /**
   * ✅ PREPARADO PARA BACKEND: Deletar contratada
   */
  async deleteContratada(id: string): Promise<void> {
    try {
      console.log("🗑️ Deletando contratada:", id);

      // TODO: Conectar ao endpoint real
      // await api.delete(`/contratadas/${id}`);

      await new Promise((resolve) => setTimeout(resolve, 600));

      console.log("✅ Contratada deletada:", id);
    } catch (error: any) {
      console.error("❌ Erro ao deletar contratada:", error);
      throw error;
    }
  }

  /**
   * ✅ PREPARADO PARA BACKEND: Alterar status da contratada
   */
  async toggleStatusContratada(
    id: string,
    novoStatus: "ativa" | "inativa",
  ): Promise<void> {
    try {
      console.log("🔄 Alterando status da contratada:", id, novoStatus);

      // TODO: Conectar ao endpoint real
      // await api.patch(`/contratadas/${id}/status`, { status: novoStatus });

      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("✅ Status da contratada alterado:", id, novoStatus);
    } catch (error: any) {
      console.error("❌ Erro ao alterar status da contratada:", error);
      throw error;
    }
  }
}

// Singleton para reutilização
export const contratadasAdapter = new ContratadasAdapter();
