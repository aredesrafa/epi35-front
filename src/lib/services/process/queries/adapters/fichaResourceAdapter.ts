/**
 * Ficha Resource Adapter - Recursos Auxiliares
 * Responsabilidade: Buscar EPIs, usuários e outros recursos necessários
 */

import { api } from "../../../core/apiClient";
import type { EPIDisponivel, Usuario } from '../types';

export class FichaResourceAdapter {
  /**
   * Busca EPIs disponíveis para entrega
   */
  async getEPIsDisponiveis(): Promise<EPIDisponivel[]> {
    try {
      const response = await api.get("/estoque/itens");
      
      if (!response.success || !response.data) {
        return [];
      }

      return this.transformEPIs(response.data);
    } catch (error) {
      console.error('Erro ao buscar EPIs disponíveis:', error);
      return [];
    }
  }

  /**
   * Busca usuários ativos do sistema
   */
  async getUsuarios(): Promise<Usuario[]> {
    try {
      const response = await api.get("/usuarios");
      
      if (!response.success || !response.data) {
        return [];
      }

      return response.data.map(this.transformUsuario);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  }

  /**
   * Busca empresas disponíveis para filtro
   */
  async getEmpresasOptions(): Promise<Array<{ id: string; nome: string }>> {
    try {
      const response = await api.get("/contratadas");
      
      if (!response.success || !response.data) {
        return [];
      }

      return response.data.map((empresa: any) => ({
        id: empresa.id,
        nome: empresa.nome
      }));
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      return [];
    }
  }

  /**
   * Busca cargos disponíveis para filtro
   */
  async getCargosOptions(): Promise<string[]> {
    try {
      const response = await api.get("/colaboradores/cargos");
      
      if (!response.success || !response.data) {
        return [];
      }

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar cargos:', error);
      return [];
    }
  }

  /**
   * Transforma dados de EPIs do backend para frontend
   */
  private transformEPIs(rawData: any[]): EPIDisponivel[] {
    if (!Array.isArray(rawData)) {
      return [];
    }

    return rawData
      .filter(item => item.quantidadeDisponivel > 0)
      .map(item => ({
        id: item.id || '',
        estoqueItemId: item.id || '',
        tipoEpiId: item.tipoEpiId || '',
        posicaoEstoqueId: item.id || '',
        nomeEquipamento: item.nomeEquipamento || item.nome || '',
        numeroCA: item.numeroCA || 'N/A',
        categoria: item.categoria || item.tipoEpi?.categoria || '',
        quantidadeDisponivel: item.quantidadeDisponivel || 0,
        disponivel: (item.quantidadeDisponivel || 0) > 0,
        registroCA: item.numeroCA || 'N/A'
      }));
  }

  /**
   * Transforma dados de usuário do backend para frontend
   */
  private transformUsuario = (rawUser: any): Usuario => ({
    id: rawUser.id || '',
    nome: rawUser.nome || '',
    email: rawUser.email || '',
    cargo: rawUser.cargo || '',
    ativo: rawUser.ativo !== false
  });
}

export const fichaResourceAdapter = new FichaResourceAdapter();