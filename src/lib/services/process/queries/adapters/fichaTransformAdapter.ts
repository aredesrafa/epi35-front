/**
 * Ficha Transform Adapter - Transformações de Dados
 * Responsabilidade: Transformar dados da API para formato frontend
 */

import type { 
  FichaBasica, 
  PaginatedFichaResponse,
  FichaCompleteResponse 
} from '../types';
import type { FichaEPIDTO } from '$lib/types/serviceTypes';

export class FichaTransformAdapter {
  /**
   * Transforma lista de fichas do backend para frontend
   */
  transformFichasList(rawData: any): PaginatedFichaResponse {
    // ✅ CORREÇÃO: API v3.5 retorna { success: true, data: { items: [...], pagination: {...} } }
    if (!rawData?.success || !rawData?.data?.items || !Array.isArray(rawData.data.items)) {
      console.log('❌ Transform: Invalid data structure');
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
      };
    }

    const transformedItems = rawData.data.items.map(this.transformFichaBasica);

    return {
      items: transformedItems,
      total: rawData.data.pagination?.total || rawData.data.items.length,
      page: rawData.data.pagination?.page || 1,
      pageSize: rawData.data.pagination?.limit || 10,
      totalPages: rawData.data.pagination?.totalPages || Math.ceil((rawData.data.pagination?.total || rawData.data.items.length) / (rawData.data.pagination?.limit || 10))
    };
  }

  /**
   * Transforma resultados de busca
   */
  transformSearchResults(rawData: any): FichaBasica[] {
    if (!rawData?.data?.items) {
      return [];
    }

    return rawData.data.items.map(this.transformFichaBasica);
  }

  /**
   * Transforma uma ficha individual para formato básico
   */
  public transformFichaBasica = (rawFicha: any): FichaBasica => {
    return {
      id: rawFicha.id || '',
      status: rawFicha.status || 'inativa',
      statusDisplay: this.transformStatusDisplay(rawFicha.status),
      colaborador: {
        nome: rawFicha.colaborador?.nome || '',
        cpf: rawFicha.colaborador?.cpf || '',
        cpfDisplay: this.formatCPF(rawFicha.colaborador?.cpf || ''),
        matricula: rawFicha.colaborador?.matricula || '',
        cargo: rawFicha.colaborador?.cargo || '',
        empresa: rawFicha.contratada?.nome || rawFicha.colaborador?.empresa || '',
        iniciais: this.extractInitials(rawFicha.colaborador?.nome || '')
      },
      estatisticas: {
        totalEntregas: rawFicha.estatisticas?.totalEntregas || 0,
        itensAtivos: rawFicha.totalEpisAtivos || rawFicha.estatisticas?.itensAtivos || 0,
        devolucoesPendentes: rawFicha.estatisticas?.devolucoesPendentes || 0
      },
      // 🔧 CORREÇÃO: Adicionar totalEpisAtivos na raiz para compatibilidade com FichaEPIDTO
      totalEpisAtivos: rawFicha.totalEpisAtivos || rawFicha.estatisticas?.itensAtivos || 0,
      dataAtualizacao: rawFicha.dataAtualizacao || rawFicha.createdAt || new Date().toISOString()
    };
  };

  /**
   * Transforma status para display
   */
  private transformStatusDisplay(status: string): { cor: string; label: string } {
    const statusMap = {
      'ativa': { cor: 'green', label: 'Ativa' },
      'inativa': { cor: 'gray', label: 'Inativa' },
      'vencida': { cor: 'red', label: 'Vencida' },
      'pendente_devolucao': { cor: 'yellow', label: 'Pendente Devolução' }
    };

    return statusMap[status as keyof typeof statusMap] || { cor: 'gray', label: 'Indefinido' };
  }

  /**
   * Formata CPF para exibição
   */
  private formatCPF(cpf: string): string {
    if (!cpf) return '';
    
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return cpf;
    
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Extrai iniciais do nome
   */
  private extractInitials(nome: string): string {
    if (!nome) return '';
    
    return nome
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0].toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /**
   * Transforma resposta completa de ficha
   */
  transformFichaComplete(rawData: any): FichaCompleteResponse {
    if (!rawData?.success || !rawData?.data) {
      throw new Error('Dados de ficha completa inválidos');
    }

    // 🔧 CORREÇÃO: O endpoint /complete retorna dados já processados
    // A estrutura é: { data: { ficha: {...}, equipamentosEmPosse: [...], ... } }
    const processedData = rawData.data;

    return {
      success: true,
      data: {
        // ✅ CORRIGIDO: Usar dados da ficha já processados pelo backend
        ficha: processedData.ficha || {},
        // ✅ NOVO: Transformar entregas para incluir campos esperados pelo frontend
        entregas: this.transformEntregas(processedData.entregas || []),
        // ✅ CORREÇÃO: Extrair devoluções do histórico já que o backend não está populando corretamente
        devolucoes: this.extractDevolucoes(processedData.historico || []),
        equipamentosEmPosse: processedData.equipamentosEmPosse || [],
        // ✅ NOVO: Transformar histórico para incluir campos esperados pelo frontend
        historico: this.transformHistorico(processedData.historico || []),
        estatisticas: processedData.estatisticas || {}
      }
    };
  }

  /**
   * Transforma dados de entregas da API para o formato esperado pelo frontend
   */
  private transformEntregas(entregas: any[]): any[] {
    return entregas.map(entrega => ({
      ...entrega,
      // Adicionar campos esperados pelo frontend
      numero: entrega.id || '',
      dataEntrega: this.formatDate(entrega.dataEntrega),
      statusDisplay: this.transformStatusEntrega(entrega.status),
      acoes: this.getAcoesEntrega(entrega.status),
      itens: entrega.itens?.map((item: any) => ({
        ...item,
        quantidade: item.quantidadeEntregue || 1,
        nomeEquipamento: entrega.tipoEpi?.nome || 'EPI não identificado',
        numeroCA: entrega.tipoEpi?.codigo || '',
        registroCA: entrega.tipoEpi?.codigo || ''
      })) || []
    }));
  }

  /**
   * Transforma dados de histórico da API para o formato esperado pelo frontend
   */
  private transformHistorico(historico: any[]): any[] {
    return historico.map(evento => ({
      ...evento,
      dataFormatada: this.formatDate(evento.dataAcao),
      tipoDisplay: {
        tipo: evento.tipoAcao,
        label: this.getTipoEventoLabel(evento.tipoAcao),
        cor: this.getTipoEventoCor(evento.tipoAcao)
      },
      acao: evento.descricao || '',
      responsavel: evento.responsavel?.nome || 'Sistema',
      detalhes: {
        resumo: evento.descricao || ''
      }
    }));
  }

  /**
   * Transforma status de entrega para display
   */
  private transformStatusEntrega(status: string): { cor: string; label: string } {
    const statusMap = {
      'PENDENTE_ASSINATURA': { cor: 'yellow', label: 'Pendente Assinatura' },
      'ASSINADA': { cor: 'green', label: 'Assinada' },
      'CANCELADA': { cor: 'red', label: 'Cancelada' },
      'RASCUNHO': { cor: 'gray', label: 'Rascunho' }
    };

    return statusMap[status as keyof typeof statusMap] || { cor: 'gray', label: status };
  }

  /**
   * Determina ações disponíveis para uma entrega baseado no status
   */
  private getAcoesEntrega(status: string): string[] {
    switch (status) {
      case 'PENDENTE_ASSINATURA':
        return ['assinar', 'editar', 'imprimir'];
      case 'ASSINADA':
        return ['imprimir'];
      case 'RASCUNHO':
        return ['editar'];
      default:
        return ['imprimir'];
    }
  }

  /**
   * Formata data para exibição
   */
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  }

  /**
   * Obtém label do tipo de evento
   */
  private getTipoEventoLabel(tipoAcao: string): string {
    const labelMap = {
      'CRIACAO': 'Criação',
      'ENTREGA': 'Entrega',
      'DEVOLUCAO': 'Devolução',
      'EDICAO': 'Edição',
      'CANCELAMENTO': 'Cancelamento',
      'ALTERACAO_STATUS': 'Alteração de Status',
      'ITEM_VENCIDO': 'Item Vencido'
    };

    return labelMap[tipoAcao as keyof typeof labelMap] || tipoAcao;
  }

  /**
   * Obtém cor do tipo de evento
   */
  private getTipoEventoCor(tipoAcao: string): string {
    const corMap = {
      'CRIACAO': 'blue',
      'ENTREGA': 'green',
      'DEVOLUCAO': 'orange',
      'EDICAO': 'yellow',
      'CANCELAMENTO': 'red',
      'ALTERACAO_STATUS': 'purple',
      'ITEM_VENCIDO': 'red'
    };

    return corMap[tipoAcao as keyof typeof corMap] || 'gray';
  }

  /**
   * Extrai devoluções do histórico para popular a tab "Devoluções"
   * 🔧 CORREÇÃO: O backend não está populando o array devolucoes, mas as devoluções estão no histórico
   */
  private extractDevolucoes(historico: any[]): any[] {
    const devolucoes = historico.filter(evento => evento.tipoAcao === 'DEVOLUCAO');
    
    return devolucoes.map(devolucao => ({
      id: devolucao.id,
      nomeEquipamento: devolucao.detalhes?.tipoEpiNome || 'EPI não identificado',
      numeroCA: 'N/A', // Não disponível no histórico atual
      categoria: 'N/A', // Não disponível no histórico atual
      dataDevolucao: this.formatDate(devolucao.dataAcao),
      motivoDisplay: this.getMotivoDevolucao(devolucao.descricao),
      status: 'processada', // Devoluções no histórico já foram processadas
      condicaoItem: 'BOM', // Não especificado no histórico
      observacoes: devolucao.descricao || '',
      entregaId: devolucao.detalhes?.entregaId || '',
      responsavel: devolucao.responsavel?.nome || 'Sistema'
    }));
  }

  /**
   * Extrai motivo da devolução da descrição
   */
  private getMotivoDevolucao(descricao: string): string {
    // Tentar extrair motivo da descrição
    if (descricao?.includes('danificado')) return 'Item danificado';
    if (descricao?.includes('troca')) return 'Troca de equipamento';
    if (descricao?.includes('vencido')) return 'Item vencido';
    return 'Devolução padrão';
  }
}

export const fichaTransformAdapter = new FichaTransformAdapter();