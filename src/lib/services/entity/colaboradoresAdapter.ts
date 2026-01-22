/**
 * Colaboradores Service Adapter
 *
 * Adapter especializado para gestão de colaboradores das empresas contratadas.
 * Conectado aos endpoints reais do backend quando disponíveis.
 */

import { api, createUrlWithParams } from "../core/apiClient";

// ==================== TYPES ====================

export interface ColaboradorDTO {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  cargo: string;
  contratadaId: string;
  contratada: string;
  status: "ativo" | "inativo";
  dataAdmissao: string;
  dataDemissao?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateColaboradorForm {
  nome: string;
  cpf: string;
  matricula: string;
  cargo: string;
  contratadaId: string;
  dataAdmissao: string;
}

export interface UpdateColaboradorForm extends Partial<CreateColaboradorForm> {
  status?: "ativo" | "inativo";
  dataDemissao?: string;
}

// ==================== ADAPTER ====================

class ColaboradoresAdapter {
  /**
   * ✅ PREPARADO PARA BACKEND: Lista colaboradores com paginação
   */
  async getColaboradores(params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    statusFilter?: string;
    contratadaFilter?: string;
  }): Promise<{
    colaboradores: ColaboradorDTO[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      console.log("👥 Carregando colaboradores...", params);

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

      if (params.contratadaFilter && params.contratadaFilter !== "todas") {
        queryParams.contratadaId = params.contratadaFilter;
      }

      // TODO: Conectar ao endpoint real quando disponível
      // const endpoint = createUrlWithParams('/colaboradores', queryParams);
      // const response = await api.get<{ data: ColaboradorDTO[]; pagination: any }>(endpoint);

      // Por enquanto, simular resposta com dados mockados
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockData: ColaboradorDTO[] = [
        {
          id: "1",
          nome: "João Silva Santos",
          cpf: "123.456.789-01",
          matricula: "ALPHA001",
          cargo: "Operador de Máquinas",
          contratadaId: "1",
          contratada: "Alpha Construções Ltda",
          status: "ativo",
          dataAdmissao: "2024-02-01",
          createdAt: "2024-02-01T08:00:00Z",
          updatedAt: "2024-02-01T08:00:00Z",
        },
        {
          id: "2",
          nome: "Maria Fernandes Costa",
          cpf: "987.654.321-09",
          matricula: "BETA001",
          cargo: "Engenheira Civil",
          contratadaId: "2",
          contratada: "Beta Engenharia S.A.",
          status: "ativo",
          dataAdmissao: "2024-04-15",
          createdAt: "2024-04-15T09:30:00Z",
          updatedAt: "2024-04-15T09:30:00Z",
        },
        {
          id: "3",
          nome: "Pedro Oliveira Lima",
          cpf: "456.789.123-45",
          matricula: "ALPHA002",
          cargo: "Soldador",
          contratadaId: "1",
          contratada: "Alpha Construções Ltda",
          status: "ativo",
          dataAdmissao: "2024-05-20",
          createdAt: "2024-05-20T10:15:00Z",
          updatedAt: "2024-05-20T10:15:00Z",
        },
        {
          id: "4",
          nome: "Ana Beatriz Souza",
          cpf: "321.654.987-10",
          matricula: "BETA002",
          cargo: "Técnica em Segurança",
          contratadaId: "2",
          contratada: "Beta Engenharia S.A.",
          status: "ativo",
          dataAdmissao: "2024-03-10",
          createdAt: "2024-03-10T11:20:00Z",
          updatedAt: "2024-03-10T11:20:00Z",
        },
        {
          id: "5",
          nome: "Carlos Eduardo Santos",
          cpf: "789.123.456-78",
          matricula: "GAMMA001",
          cargo: "Auxiliar Geral",
          contratadaId: "3",
          contratada: "Gamma Serviços",
          status: "inativo",
          dataAdmissao: "2023-11-15",
          dataDemissao: "2024-11-30",
          createdAt: "2023-11-15T14:00:00Z",
          updatedAt: "2024-11-30T17:30:00Z",
        },
      ];

      // Aplicar filtros
      let colaboradoresFiltrados = mockData;

      if (params.searchTerm) {
        const searchLower = params.searchTerm.toLowerCase();
        colaboradoresFiltrados = colaboradoresFiltrados.filter(
          (colaborador) =>
            colaborador.nome.toLowerCase().includes(searchLower) ||
            colaborador.cpf.includes(params.searchTerm!) ||
            colaborador.matricula.toLowerCase().includes(searchLower),
        );
      }

      if (params.statusFilter && params.statusFilter !== "todos") {
        colaboradoresFiltrados = colaboradoresFiltrados.filter(
          (colaborador) => colaborador.status === params.statusFilter,
        );
      }

      if (params.contratadaFilter && params.contratadaFilter !== "todas") {
        colaboradoresFiltrados = colaboradoresFiltrados.filter(
          (colaborador) => colaborador.contratadaId === params.contratadaFilter,
        );
      }

      console.log(
        "✅ Colaboradores carregados:",
        colaboradoresFiltrados.length,
      );

      return {
        colaboradores: colaboradoresFiltrados,
        total: colaboradoresFiltrados.length,
        page: params.page || 1,
        limit: params.limit || 10,
      };
    } catch (error: any) {
      console.error("❌ Erro ao carregar colaboradores:", error);
      throw error;
    }
  }

  /**
   * ✅ PREPARADO PARA BACKEND: Busca colaborador por ID
   */
  async getColaboradorById(id: string): Promise<ColaboradorDTO> {
    try {
      console.log("👤 Buscando colaborador:", id);

      // TODO: Conectar ao endpoint real
      // const response = await api.get<ColaboradorDTO>(`/colaboradores/${id}`) as any;

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock de resposta
      const mockColaborador: ColaboradorDTO = {
        id,
        nome: "João Silva Santos",
        cpf: "123.456.789-01",
        matricula: "ALPHA001",
        cargo: "Operador de Máquinas",
        contratadaId: "1",
        contratada: "Alpha Construções Ltda",
        status: "ativo",
        dataAdmissao: "2024-02-01",
        createdAt: "2024-02-01T08:00:00Z",
        updatedAt: "2024-02-01T08:00:00Z",
      };

      console.log("✅ Colaborador encontrado:", mockColaborador.nome);
      return mockColaborador;
    } catch (error: any) {
      console.error("❌ Erro ao buscar colaborador:", error);
      throw error;
    }
  }

  /**
   * ✅ PREPARADO PARA BACKEND: Criar novo colaborador
   */
  async createColaborador(
    data: CreateColaboradorForm,
  ): Promise<ColaboradorDTO> {
    try {
      console.log("💾 Criando colaborador:", data);

      // TODO: Conectar ao endpoint real
      // const response = await api.post<ColaboradorDTO>('/colaboradores', data) as any;

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock de resposta
      const novoColaborador: ColaboradorDTO = {
        id: `colaborador-${Date.now()}`,
        nome: data.nome,
        cpf: data.cpf,
        matricula: data.matricula,
        cargo: data.cargo,
        contratadaId: data.contratadaId,
        contratada: "Alpha Construções Ltda", // Mock - viria do join com contratadas
        status: "ativo",
        dataAdmissao: data.dataAdmissao,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("✅ Colaborador criado:", novoColaborador.id);
      return novoColaborador;
    } catch (error: any) {
      console.error("❌ Erro ao criar colaborador:", error);
      throw error;
    }
  }

  /**
   * ✅ PREPARADO PARA BACKEND: Atualizar colaborador
   */
  async updateColaborador(
    id: string,
    data: UpdateColaboradorForm,
  ): Promise<ColaboradorDTO> {
    try {
      console.log("💾 Atualizando colaborador:", id, data);

      // TODO: Conectar ao endpoint real
      // const response = await api.put<ColaboradorDTO>(`/colaboradores/${id}`, data) as any;

      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock de resposta
      const colaboradorAtualizado: ColaboradorDTO = {
        id,
        nome: data.nome || "Nome Atualizado",
        cpf: data.cpf || "123.456.789-01",
        matricula: data.matricula || "MAT001",
        cargo: data.cargo || "Cargo Atualizado",
        contratadaId: data.contratadaId || "1",
        contratada: "Alpha Construções Ltda",
        status: data.status || "ativo",
        dataAdmissao: data.dataAdmissao || "2024-01-01",
        dataDemissao: data.dataDemissao,
        createdAt: "2024-01-01T10:00:00Z",
        updatedAt: new Date().toISOString(),
      };

      console.log("✅ Colaborador atualizado:", colaboradorAtualizado.id);
      return colaboradorAtualizado;
    } catch (error: any) {
      console.error("❌ Erro ao atualizar colaborador:", error);
      throw error;
    }
  }

  /**
   * ✅ PREPARADO PARA BACKEND: Deletar colaborador
   */
  async deleteColaborador(id: string): Promise<void> {
    try {
      console.log("🗑️ Deletando colaborador:", id);

      // TODO: Conectar ao endpoint real
      // await api.delete(`/colaboradores/${id}`);

      await new Promise((resolve) => setTimeout(resolve, 600));

      console.log("✅ Colaborador deletado:", id);
    } catch (error: any) {
      console.error("❌ Erro ao deletar colaborador:", error);
      throw error;
    }
  }

  /**
   * ✅ PREPARADO PARA BACKEND: Alterar status do colaborador
   */
  async toggleStatusColaborador(
    id: string,
    novoStatus: "ativo" | "inativo",
  ): Promise<void> {
    try {
      console.log("🔄 Alterando status do colaborador:", id, novoStatus);

      // TODO: Conectar ao endpoint real
      // await api.patch(`/colaboradores/${id}/status`, { status: novoStatus });

      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("✅ Status do colaborador alterado:", id, novoStatus);
    } catch (error: any) {
      console.error("❌ Erro ao alterar status do colaborador:", error);
      throw error;
    }
  }

  /**
   * ✅ PREPARADO PARA BACKEND: Demitir colaborador
   */
  async demitirColaborador(id: string, dataDemissao: string): Promise<void> {
    try {
      console.log("🚪 Demitindo colaborador:", id, dataDemissao);

      // TODO: Conectar ao endpoint real
      // await api.patch(`/colaboradores/${id}/demitir`, { dataDemissao });

      await new Promise((resolve) => setTimeout(resolve, 800));

      console.log("✅ Colaborador demitido:", id);
    } catch (error: any) {
      console.error("❌ Erro ao demitir colaborador:", error);
      throw error;
    }
  }

  /**
   * ✅ PREPARADO PARA BACKEND: Busca colaboradores por contratada
   */
  async getColaboradoresByContratada(
    contratadaId: string,
  ): Promise<ColaboradorDTO[]> {
    try {
      console.log("👥 Buscando colaboradores da contratada:", contratadaId);

      // TODO: Conectar ao endpoint real
      // const response = await api.get<ColaboradorDTO[]>(`/contratadas/${contratadaId}/colaboradores`) as any;

      await new Promise((resolve) => setTimeout(resolve, 600));

      // Mock de resposta filtrada
      const result = await this.getColaboradores({
        contratadaFilter: contratadaId,
      });

      console.log(
        "✅ Colaboradores da contratada carregados:",
        result.colaboradores.length,
      );
      return result.colaboradores;
    } catch (error: any) {
      console.error("❌ Erro ao buscar colaboradores da contratada:", error);
      throw error;
    }
  }
}

// Singleton para reutilização
export const colaboradoresAdapter = new ColaboradoresAdapter();
