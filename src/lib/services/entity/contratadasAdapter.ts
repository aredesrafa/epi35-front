/**
 * Contratadas Service Adapter
 * 
 * Adapter especializado para gestão de empresas contratadas.
 * Conectado aos endpoints reais do backend quando disponíveis.
 */

import { api, createUrlWithParams } from '../core/apiClient';

// ==================== TYPES ====================

export interface ContratadaDTO {
  id: string;
  nome: string;
  cnpj: string;
  endereco?: string;
  contato?: string;
  status: 'ativa' | 'inativa';
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
  status?: 'ativa' | 'inativa';
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
      console.log('🏢 Carregando contratadas...', params);
      
      const queryParams: Record<string, any> = {
        page: params.page || 1,
        limit: params.limit || 10
      };
      
      if (params.searchTerm) {
        queryParams.search = params.searchTerm;
      }
      
      if (params.statusFilter && params.statusFilter !== 'todos') {
        queryParams.status = params.statusFilter.toUpperCase();
      }
      
      // TODO: Conectar ao endpoint real quando disponível
      // const endpoint = createUrlWithParams('/contratadas', queryParams);
      // const response = await api.get<{ data: ContratadaDTO[]; pagination: any }>(endpoint);
      
      // Por enquanto, simular resposta com dados mockados
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockData: ContratadaDTO[] = [
        {
          id: '1',
          nome: 'Alpha Construções Ltda',
          cnpj: '12.345.678/0001-90',
          endereco: 'Rua das Construções, 123',
          contato: '(11) 99999-9999',
          status: 'ativa',
          colaboradores: 15,
          dataContrato: '2024-01-15',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          nome: 'Beta Engenharia S.A.',
          cnpj: '98.765.432/0001-10',
          endereco: 'Av. Engenharia, 456',
          contato: 'contato@betaeng.com.br',
          status: 'ativa',
          colaboradores: 8,
          dataContrato: '2024-03-22',
          createdAt: '2024-03-22T14:30:00Z',
          updatedAt: '2024-03-22T14:30:00Z'
        },
        {
          id: '3',
          nome: 'Gamma Serviços',
          cnpj: '11.222.333/0001-44',
          endereco: 'Rua dos Serviços, 789',
          contato: '(11) 88888-8888',
          status: 'inativa',
          colaboradores: 0,
          dataContrato: '2023-11-10',
          createdAt: '2023-11-10T09:15:00Z',
          updatedAt: '2024-12-01T16:45:00Z'
        }
      ];
      
      // Aplicar filtros
      let contratadasFiltradas = mockData;
      
      if (params.searchTerm) {
        const searchLower = params.searchTerm.toLowerCase();
        contratadasFiltradas = contratadasFiltradas.filter(contratada =>
          contratada.nome.toLowerCase().includes(searchLower) ||
          contratada.cnpj.includes(params.searchTerm!)
        );
      }
      
      if (params.statusFilter && params.statusFilter !== 'todos') {
        contratadasFiltradas = contratadasFiltradas.filter(contratada =>
          contratada.status === params.statusFilter
        );
      }
      
      console.log('✅ Contratadas carregadas:', contratadasFiltradas.length);
      
      return {
        contratadas: contratadasFiltradas,
        total: contratadasFiltradas.length,
        page: params.page || 1,
        limit: params.limit || 10
      };
      
    } catch (error) {
      console.error('❌ Erro ao carregar contratadas:', error);
      throw error;
    }
  }
  
  /**
   * ✅ PREPARADO PARA BACKEND: Busca contratada por ID
   */
  async getContratadaById(id: string): Promise<ContratadaDTO> {
    try {
      console.log('🏢 Buscando contratada:', id);
      
      // TODO: Conectar ao endpoint real
      // const response = await api.get<ContratadaDTO>(`/contratadas/${id}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock de resposta
      const mockContratada: ContratadaDTO = {
        id,
        nome: 'Alpha Construções Ltda',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua das Construções, 123',
        contato: '(11) 99999-9999',
        status: 'ativa',
        colaboradores: 15,
        dataContrato: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      };
      
      console.log('✅ Contratada encontrada:', mockContratada.nome);
      return mockContratada;
      
    } catch (error) {
      console.error('❌ Erro ao buscar contratada:', error);
      throw error;
    }
  }
  
  /**
   * ✅ PREPARADO PARA BACKEND: Criar nova contratada
   */
  async createContratada(data: CreateContratadaForm): Promise<ContratadaDTO> {
    try {
      console.log('💾 Criando contratada:', data);
      
      // TODO: Conectar ao endpoint real
      // const response = await api.post<ContratadaDTO>('/contratadas', data);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock de resposta
      const novaContratada: ContratadaDTO = {
        id: `contratada-${Date.now()}`,
        nome: data.nome,
        cnpj: data.cnpj,
        endereco: data.endereco,
        contato: data.contato,
        status: 'ativa',
        colaboradores: 0,
        dataContrato: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Contratada criada:', novaContratada.id);
      return novaContratada;
      
    } catch (error) {
      console.error('❌ Erro ao criar contratada:', error);
      throw error;
    }
  }
  
  /**
   * ✅ PREPARADO PARA BACKEND: Atualizar contratada
   */
  async updateContratada(id: string, data: UpdateContratadaForm): Promise<ContratadaDTO> {
    try {
      console.log('💾 Atualizando contratada:', id, data);
      
      // TODO: Conectar ao endpoint real
      // const response = await api.put<ContratadaDTO>(`/contratadas/${id}`, data);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock de resposta
      const contratadaAtualizada: ContratadaDTO = {
        id,
        nome: data.nome || 'Nome Atualizado',
        cnpj: data.cnpj || '12.345.678/0001-90',
        endereco: data.endereco,
        contato: data.contato,
        status: data.status || 'ativa',
        colaboradores: 15,
        dataContrato: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Contratada atualizada:', contratadaAtualizada.id);
      return contratadaAtualizada;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar contratada:', error);
      throw error;
    }
  }
  
  /**
   * ✅ PREPARADO PARA BACKEND: Deletar contratada
   */
  async deleteContratada(id: string): Promise<void> {
    try {
      console.log('🗑️ Deletando contratada:', id);
      
      // TODO: Conectar ao endpoint real
      // await api.delete(`/contratadas/${id}`);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      console.log('✅ Contratada deletada:', id);
      
    } catch (error) {
      console.error('❌ Erro ao deletar contratada:', error);
      throw error;
    }
  }
  
  /**
   * ✅ PREPARADO PARA BACKEND: Alterar status da contratada
   */
  async toggleStatusContratada(id: string, novoStatus: 'ativa' | 'inativa'): Promise<void> {
    try {
      console.log('🔄 Alterando status da contratada:', id, novoStatus);
      
      // TODO: Conectar ao endpoint real
      // await api.patch(`/contratadas/${id}/status`, { status: novoStatus });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ Status da contratada alterado:', id, novoStatus);
      
    } catch (error) {
      console.error('❌ Erro ao alterar status da contratada:', error);
      throw error;
    }
  }
}

// Singleton para reutilização
export const contratadasAdapter = new ContratadasAdapter();