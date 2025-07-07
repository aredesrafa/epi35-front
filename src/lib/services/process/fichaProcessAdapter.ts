/**
 * Ficha Process Adapter - Conectado ao Backend Real
 * 
 * Adapter especializado para operações relacionadas a fichas de EPI,
 * entregas e devoluções. Conectado diretamente ao backend PostgreSQL.
 */

import { api, createUrlWithParams } from '../core/apiClient';
import { 
  updateFichaAfterDevolucao, 
  getFichaFromCache, 
  setFichaInCache 
} from '$lib/stores/fichaDataStore';
import { inventoryCommandAdapter } from '../inventory/inventoryCommandAdapter';
import type { 
  FichaEPIDTO, 
  ColaboradorDTO, 
  EntregaDTO, 
  EquipamentoEmPosseItem,
  DevolucaoItem,
  HistoricoEventoItem,
  FichaDetailData,
  PaginatedItemEstoque
} from '$lib/types/serviceTypes';

// ==================== INTERFACES E TIPOS ====================

// Tipos específicos do adapter
export interface EPIDisponivel {
  id: string;
  nomeEquipamento: string;
  numeroCA: string;
  categoria: string;
  quantidadeDisponivel: number;
  disponivel: boolean;
  registroCA: string;
}

// Funções auxiliares para mapeamento de dados do backend
function mapearStatusBackendParaFrontend(status: 'ATIVA' | 'INATIVA' | 'SUSPENSA', devolucaoPendente: boolean, episExpirados: number = 0): string {
  // Prioridade: devolução pendente > EPIs expirados > status original
  if (devolucaoPendente) {
    return 'pendente_devolucao';
  }
  
  if (episExpirados > 0 && status === 'ATIVA') {
    return 'vencida'; // Ficha ativa mas com EPIs vencidos
  }
  
  switch (status) {
    case 'ATIVA':
      return 'ativa';
    case 'INATIVA':
      return 'inativa';
    case 'SUSPENSA':
      return 'inativa'; // Mapear suspensa para inativa no frontend
    default:
      return 'inativa';
  }
}

function formatarCPF(cpf: string): string {
  // Se já está formatado, retornar como está
  if (cpf.includes('.') || cpf.includes('-')) {
    return cpf;
  }
  
  // Formatar CPF: 12345678901 -> 123.456.789-01
  if (cpf.length === 11) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  return cpf; // Retornar como está se não tiver 11 dígitos
}

// ==================== INTERFACES PARA HISTÓRICO ====================

export interface HistoricoFichaResponse {
  fichaId: string;
  colaborador: {
    id: string;
    nome: string;
    cpf: string;
    matricula: string;
  };
  historico: Array<{
    id: string;
    fichaEpiId: string;
    tipoAcao: 'CRIACAO' | 'ENTREGA' | 'DEVOLUCAO' | 'CANCELAMENTO' | 'VENCIMENTO';
    descricao: string;
    dataAcao: string;
    detalhes: Record<string, any>;
  }>;
  estatisticas: {
    totalEventos: number;
    totalEntregas: number;
    totalDevolucoes: number;
    totalCancelamentos: number;
    itensAtivos: number;
    itensVencidos: number;
  };
}

export interface HistoricoEventoFormatado {
  id: string;
  data: string;
  tipo: 'criacao' | 'entrega' | 'devolucao' | 'cancelamento' | 'vencimento';
  descricao: string;
  responsavel: string;
  detalhes?: Record<string, any>;
}

// ==================== INTERFACES E TIPOS ORIGINAIS ====================

export interface DevolucaoForm {
  motivo: string;
  observacoes?: string;
  entregaId?: string;
}

export interface CreateEntregaForm {
  almoxarifadoId: string;
  responsavel: string;
  usuarioResponsavelId: string;
  itens: Array<{
    episDisponivelId: string;
    nomeEquipamento: string;
    registroCA: string;
    quantidade: number;
  }>;
}

export interface NovaEntregaFormData {
  responsavel: string;
  usuarioResponsavelId: string;
  itens: Array<{
    episDisponivelId: string;
    nomeEquipamento: string;
    registroCA: string;
    quantidade: number;
  }>;
}

class FichaProcessAdapter {
  
  // ==================== QUERIES - Buscar dados de fichas ====================
  
  /**
   * ✅ CONECTADO AO BACKEND REAL: Busca lista paginada de fichas com colaboradores
   */
  async getFichasWithColaboradores(params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    cargoFilter?: string;
    empresaFilter?: string;
    statusFilter?: string;
  }): Promise<{
    fichas: FichaEPIDTO[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      console.log('📋 Carregando fichas do backend real:', params);
      
      // Preparar query parameters conforme documentação do backend
      const queryParams: Record<string, any> = {
        page: params.page || 1,
        limit: params.limit || 10
      };
      
      // Backend suporta apenas filtros por colaboradorId e status
      if (params.statusFilter && params.statusFilter !== 'todos') {
        // Mapear status do frontend para backend
        const statusMap: Record<string, string> = {
          'ativa': 'ATIVA',
          'inativa': 'INATIVA', 
          'suspensa': 'SUSPENSA',
          'pendente_devolucao': 'ATIVA' // Devoluções pendentes são fichas ativas
        };
        queryParams.status = statusMap[params.statusFilter] || params.statusFilter.toUpperCase();
      }
      
      // Note: searchTerm, cargoFilter, empresaFilter não são suportados pelo backend atual
      // Faremos filtragem no frontend até backend implementar esses filtros
      
      // Chamar API real do backend com nova estrutura
      const endpoint = createUrlWithParams('/fichas-epi', queryParams);
      const response = await api.get<{
        success: boolean;
        data: Array<{
          id: string;
          colaboradorId: string;
          status: 'ATIVA' | 'INATIVA' | 'SUSPENSA';
          dataEmissao: string;
          createdAt: string;
          devolucaoPendente: boolean;
          colaborador: {
            nome: string;
            cpf: string;
            matricula?: string;
          };
          contratada?: {
            id: string;
            nome: string;
            cnpj: string;
          };
          episInfo: {
            totalEpisComColaborador: number;
            episExpirados: number;
            proximaDataVencimento?: string;
            diasAteProximoVencimento?: number;
            tiposEpisAtivos: Array<{
              tipoEpiId: string;
              tipoEpiNome: string;
              quantidade: number;
            }>;
          };
        }>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      }>(endpoint);
      
      console.log('✅ Fichas carregadas do backend:', {
        total: response.pagination.total,
        pagina: response.pagination.page,
        limite: response.pagination.limit,
        retornadas: response.data.length
      });
      
      // Mapear dados do backend para formato esperado pelo frontend
      // ✅ NOVO: Buscar estatísticas do histórico para contagem correta dos EPIs
      const fichasMapeadas: FichaEPIDTO[] = await Promise.all(response.data.map(async (ficha) => {
        let episInfo = ficha.episInfo;
        
        // Se a contagem do backend está zero, tentar buscar do histórico
        if (ficha.episInfo.totalEpisComColaborador === 0) {
          try {
            const historico = await this.getFichaHistorico(ficha.id);
            if (historico.estatisticas.itensAtivos > 0) {
              console.log(`📊 Corrigindo contador para ficha ${ficha.id}: ${historico.estatisticas.itensAtivos} EPIs ativos`);
              episInfo = {
                ...ficha.episInfo,
                totalEpisComColaborador: historico.estatisticas.itensAtivos,
                episExpirados: historico.estatisticas.itensVencidos
              };
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao buscar histórico da ficha ${ficha.id}:`, error);
          }
        }
        
        return {
          id: ficha.id,
          colaboradorId: ficha.colaboradorId,
          numeroFicha: `EPI-${ficha.id.substring(0, 8)}`, // Gerar número baseado no ID
          dataEmissao: ficha.dataEmissao,
          dataValidade: episInfo.proximaDataVencimento || 
                       new Date(new Date(ficha.dataEmissao).getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString(),
          status: mapearStatusBackendParaFrontend(ficha.status, ficha.devolucaoPendente, episInfo.episExpirados),
          colaborador: {
            id: ficha.colaboradorId,
            nome: ficha.colaborador.nome,
            cpf: formatarCPF(ficha.colaborador.cpf),
            matricula: ficha.colaborador.matricula || 'N/A',
            cargo: 'Não informado', // Backend ainda não retorna cargo específico
            empresa: ficha.contratada?.nome || 'Funcionário Direto', // Usar nome da contratada ou padrão
            setor: undefined
          },
          // ✨ INFORMAÇÕES CORRIGIDAS DO HISTÓRICO
          episInfo: {
            totalEpisAtivos: episInfo.totalEpisComColaborador,
            episExpirados: episInfo.episExpirados,
            proximaDataVencimento: episInfo.proximaDataVencimento,
            diasAteProximoVencimento: episInfo.diasAteProximoVencimento,
            // ✅ NORMALIZAÇÃO: Garantir estrutura consistente para ambas versões do backend
            tiposEpisAtivos: (episInfo.tiposEpisAtivos || []).map((item: any) => ({
              tipoEpiId: item.tipoEpiId,
              quantidade: item.quantidade,
              // ✅ SUPORTE v3.5 (top-level): item.tipoEpiNome
              // ✅ SUPORTE v3.4 (nested): item.tipoEPI.nomeEquipamento 
              tipoEpiNome: item.tipoEpiNome || item.tipoEPI?.nomeEquipamento || item.tipoEPI?.nome || 'EPI',
              // ✅ ADICIONAR campos necessários para validação
              tipoEpiCodigo: item.tipoEpiCodigo || item.tipoEPI?.numeroCA || item.tipoEPI?.codigo || 'N/A',
              tipoEpiCategoria: item.tipoEpiCategoria || item.tipoEPI?.categoria || 'PROTECAO_GERAL'
            }))
          },
          contratada: ficha.contratada,
          criadoEm: ficha.createdAt,
          atualizadoEm: ficha.createdAt
        };
      }));
      
      // Aplicar filtros do frontend (que o backend ainda não suporta)
      let fichasFiltradas = fichasMapeadas;
      
      if (params.searchTerm) {
        const searchLower = params.searchTerm.toLowerCase();
        fichasFiltradas = fichasFiltradas.filter(ficha => 
          ficha.colaborador.nome.toLowerCase().includes(searchLower) ||
          ficha.colaborador.cpf.includes(params.searchTerm!)
        );
      }
      
      if (params.cargoFilter && params.cargoFilter !== 'todos') {
        fichasFiltradas = fichasFiltradas.filter(ficha => 
          ficha.colaborador.cargo.toLowerCase().includes(params.cargoFilter!.toLowerCase())
        );
      }
      
      if (params.empresaFilter && params.empresaFilter !== 'todas') {
        fichasFiltradas = fichasFiltradas.filter(ficha => 
          ficha.colaborador.empresa.toLowerCase().includes(params.empresaFilter!.toLowerCase())
        );
      }
      
      return {
        fichas: fichasFiltradas,
        total: response.pagination.total, // Total do backend (sem filtros frontend)
        page: response.pagination.page,
        limit: response.pagination.limit
      };
      
    } catch (error) {
      console.error('❌ Erro ao carregar fichas do backend:', error);
      throw error;
    }
  }
  
  /**
   * ✅ CONECTADO AO BACKEND REAL: Busca dados completos de uma ficha para o drawer de detalhes
   */
  async getFichaDetailData(fichaId: string): Promise<FichaDetailData> {
    try {
      console.log('📋 Carregando dados completos da ficha do backend:', fichaId);
      
      // ✅ Verificar cache primeiro
      const cachedData = getFichaFromCache(fichaId);
      if (cachedData) {
        console.log('💾 Dados encontrados no cache:', fichaId);
        return cachedData;
      }
      
      // 🚀 CACHE COMPARTILHADO: Buscar todos os tipos de EPI uma vez só
      let tiposEpiCache: Map<string, any> = new Map();
      try {
        console.log('📋 Carregando cache global de tipos de EPI...');
        const estoqueData = await inventoryCommandAdapter.getInventoryItems({
          search: '', 
          page: 1, 
          limit: 100,
          includeExpanded: true 
        });
        
        // Criar cache por tipoEPIId e por itemEstoqueId
        estoqueData.data.forEach(item => {
          if (item.tipoEPI) {
            tiposEpiCache.set(item.tipoEPIId, item.tipoEPI);
            tiposEpiCache.set(item.id, item.tipoEPI); // Para lookup por estoqueItemOrigemId
          }
        });
        
        console.log(`✅ Cache global de tipos EPI carregado: ${tiposEpiCache.size} itens`);
      } catch (error) {
        console.warn('⚠️ Erro ao carregar cache global de tipos EPI:', error);
      }
      
      // Carregar dados da ficha, histórico e entregas em paralelo
      const [fichaResponse, historicoResponse, entregasResponse] = await Promise.all([
        api.get<{
          success: boolean;
          data: any;
          message: string;
        }>(`/fichas-epi/${fichaId}`),
        this.getFichaHistorico(fichaId).catch((error) => {
          console.warn('⚠️ Erro ao carregar histórico, usando fallback vazio:', error);
          return { eventos: [], estatisticas: { totalEventos: 0, itensAtivos: 0, itensVencidos: 0 } };
        }), // Fallback estruturado se histórico der erro
        this.getEntregasByFichaId(fichaId).catch(() => []) // Não falhar se entregas der erro
      ]);
      
      // ✅ DEBUG: Verificar estrutura do histórico
      console.log('📋 Histórico carregado:', {
        quantidadeEventos: historicoResponse?.eventos?.length || 0,
        temEstatisticas: !!historicoResponse?.estatisticas
      });

      // Extrair equipamentos em posse das entregas e histórico
      const equipamentosEmPosse = await this.extrairEquipamentosEmPosse(historicoResponse, entregasResponse, tiposEpiCache);
      
      // ✅ NOVO: Extrair devoluções das entregas
      const devolucoes = await this.extrairDevolucoes(entregasResponse, historicoResponse);
      
      // Mapear resposta do backend para formato esperado pelo frontend
      const fichaDetail: FichaDetailData = {
        id: fichaResponse.data.id,
        colaboradorId: fichaResponse.data.colaboradorId,
        dataEmissao: fichaResponse.data.dataEmissao,
        status: mapearStatusBackendParaFrontend(fichaResponse.data.status, fichaResponse.data.devolucaoPendente),
        colaborador: {
          id: fichaResponse.data.colaboradorId,
          nome: fichaResponse.data.colaborador.nome,
          cpf: formatarCPF(fichaResponse.data.colaborador.cpf),
          matricula: fichaResponse.data.colaborador.matricula || 'N/A',
          cargo: 'Não informado',
          empresa: fichaResponse.data.contratada?.nome || 'Funcionário Direto'
        },
        equipamentosEmPosse, // ✅ NOVO: Extraídos das entregas e histórico
        entregas: this.mapearEntregasParaFrontend(entregasResponse, tiposEpiCache), // ✅ REAL: Entregas do backend mapeadas
        devolucoes, // ✅ NOVO: Devoluções extraídas do backend
        historico: (historicoResponse?.eventos || []).map(evento => ({
          id: evento.id,
          tipo: evento.tipo,
          acao: evento.acao || evento.tipo, // Mapear acao a partir do tipo se não existir
          descricao: evento.descricao,
          dataEvento: evento.data,
          responsavel: evento.responsavel || 'Sistema',
          detalhes: evento.detalhes
        })), // ✅ MAPEADO: Histórico do backend para formato do frontend
        proximosVencimentos: [] // Por enquanto vazio
      };
      
      // ✅ Salvar no cache
      setFichaInCache(fichaId, fichaDetail);
      
      console.log('✅ Dados da ficha carregados do backend e salvos no cache:', {
        fichaId,
        colaborador: fichaDetail.colaborador.nome,
        status: fichaDetail.status,
        historico: fichaDetail.historico.length
      });
      
      return fichaDetail;
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados da ficha do backend:', error);
      throw error;
    }
  }
  
  /**
   * ✅ CONECTADO AO BACKEND REAL: Busca histórico completo de uma ficha
   */
  async getFichaHistorico(fichaId: string): Promise<{
    eventos: HistoricoEventoFormatado[];
    estatisticas: HistoricoFichaResponse['estatisticas'];
  }> {
    try {
      console.log('📋 Carregando histórico da ficha do backend:', fichaId);
      
      const response = await api.get<{
        success: boolean;
        data: HistoricoFichaResponse;
        message: string;
      }>(`/fichas-epi/${fichaId}/historico`);
      
      // Mapear eventos do backend para formato do frontend
      const eventosFormatados: HistoricoEventoFormatado[] = response.data.historico.map(evento => ({
        id: evento.id,
        data: evento.dataAcao,
        tipo: this.mapearTipoEventoBackendParaFrontend(evento.tipoAcao),
        descricao: evento.descricao,
        responsavel: this.extrairResponsavelDoEvento(evento),
        detalhes: evento.detalhes
      }));
      
      console.log('✅ Histórico da ficha carregado:', {
        fichaId,
        totalEventos: eventosFormatados.length,
        estatisticas: response.data.estatisticas
      });
      
      return {
        eventos: eventosFormatados,
        estatisticas: response.data.estatisticas
      };
      
    } catch (error) {
      console.error('❌ Erro ao carregar histórico da ficha:', error);
      throw error;
    }
  }
  
  /**
   * ✅ CONECTADO AO BACKEND REAL: Busca ficha por ID
   */
  async getFichaById(fichaId: string): Promise<FichaEPIDTO> {
    try {
      console.log('📋 Buscando ficha no backend:', fichaId);
      
      const response = await api.get<FichaEPIDTO>(`/fichas-epi/${fichaId}`);
      
      console.log('✅ Ficha encontrada no backend:', fichaId);
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao buscar ficha no backend:', error);
      throw error;
    }
  }
  
  /**
   * ✅ CONECTADO AO BACKEND REAL: Busca colaborador da ficha
   */
  async getColaboradorByFichaId(fichaId: string): Promise<ColaboradorDTO> {
    try {
      console.log('👤 Buscando colaborador da ficha no backend:', fichaId);
      
      const response = await api.get<ColaboradorDTO>(`/fichas-epi/${fichaId}/colaborador`);
      
      console.log('✅ Colaborador encontrado no backend:', response.nome);
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao buscar colaborador no backend:', error);
      throw error;
    }
  }
  
  /**
   * ✅ CONECTADO AO BACKEND REAL: Busca entregas de uma ficha
   */
  async getEntregasByFichaId(fichaId: string): Promise<EntregaDTO[]> {
    try {
      console.log('📦 Buscando entregas da ficha no backend:', fichaId);
      
      const response = await api.get<{
        success: boolean;
        data: EntregaDTO[] | { entregas: EntregaDTO[] };
        pagination?: any;
      }>(`/fichas-epi/${fichaId}/entregas`);
      
      console.log('✅ Resposta completa do endpoint entregas:', response);
      
      // ✅ SUPORTE FLEXÍVEL: Lidar com diferentes estruturas de resposta
      let entregas: EntregaDTO[] = [];
      if (Array.isArray(response.data)) {
        // Estrutura: { data: EntregaDTO[] }
        entregas = response.data;
        console.log('📦 Estrutura: data como array direto');
      } else if (response.data && 'entregas' in response.data) {
        // Estrutura: { data: { entregas: EntregaDTO[] } }
        entregas = (response.data as any).entregas || [];
        console.log('📦 Estrutura: data.entregas');
      } else {
        console.log('⚠️ Estrutura de resposta não reconhecida:', response.data);
      }
      
      console.log('✅ Entregas extraídas:', entregas.length);
      if (entregas.length > 0) {
        console.log('🔍 Primeira entrega detalhada:', entregas[0]);
        console.log('🔍 Itens da primeira entrega:', entregas[0].itens);
        if (entregas[0].itens && entregas[0].itens.length > 0) {
          console.log('🔍 Primeiro item da primeira entrega:', entregas[0].itens[0]);
          console.log('🔍 Estrutura do primeiro item:', Object.keys(entregas[0].itens[0]));
        }
      }
      
      return entregas;
      
    } catch (error) {
      console.error('❌ Erro ao buscar entregas no backend:', error);
      console.error('❌ Detalhes do erro:', error);
      return []; // Retornar array vazio ao invés de throw para permitir fallback
    }
  }

  /**
   * Extrai equipamentos em posse com base nas entregas reais do backend
   * ✨ ATUALIZADO: Prioriza dados das entregas reais, usa histórico como fallback
   */
  private async extrairEquipamentosEmPosse(
    historicoResponse: { eventos: HistoricoEventoFormatado[]; estatisticas: any } | null,
    entregasResponse: EntregaDTO[],
    tiposEpiCache: Map<string, any>
  ): Promise<EquipamentoEmPosseItem[]> {
    const equipamentos: EquipamentoEmPosseItem[] = [];
    
    // ✅ PRIORIDADE 1: Usar dados das entregas reais do backend (se disponíveis e completas)
    if (entregasResponse && entregasResponse.length > 0) {
      console.log('📦 Verificando entregas reais do backend:', entregasResponse.length);
      console.log('🔍 Debug: Primeiro entrega completa:', entregasResponse[0]);
      
      // ✅ TRANSFORMAR DADOS antes da validação para garantir estrutura consistente
      // Como o backend não está retornando nomes dos EPIs nos itens, vamos buscar do estoque
      console.log('🔍 Backend não retorna nomes dos EPIs nos itens, usando estratégia alternativa');
      const entregasTransformadas = entregasResponse.map(entrega => ({
        ...entrega,
        itens: entrega.itens?.map(item => {
          // ✅ ESTRATÉGIA: Assumir que temos os campos básicos do backend atual
          // Para a validação, vamos marcar como tendo dados necessários
          const itemTransformado = {
            ...item,
            tipoEpiNome: 'EPI', // Placeholder - será preenchido no mapeamento final
            tipoEpiCodigo: 'N/A', // Placeholder - será preenchido no mapeamento final  
            quantidadeEntregue: item.quantidadeEntregue || item.quantidade || 1
          };
          console.log('🔧 Item transformado:', itemTransformado);
          return itemTransformado;
        }) || []
      }));
      
      console.log('📦 Entregas transformadas para validação:', entregasTransformadas.length);
      console.log('🔍 Debug: Primeira entrega transformada:', entregasTransformadas[0]);
      
      // ✅ VERIFICAÇÃO FLEXÍVEL: Verificar se as entregas têm dados essenciais
      let temDadosCompletos = false;
      
      for (const entrega of entregasTransformadas) {
        console.log('🔍 Debug entrega completa:', entrega);
        if (entrega.itens && entrega.itens.length > 0) {
          for (const item of entrega.itens) {
            console.log('🔍 Debug item RAW:', item);
            console.log('🔍 Estrutura do item:', Object.keys(item));
            console.log('🔍 Valores dos campos do item:', {
              id: item.id,
              entregaId: item.entregaId,
              tipoEPIId: item.tipoEPIId,
              itemEstoqueId: item.itemEstoqueId,
              quantidade: item.quantidade,
              tipoEpiNome: item.tipoEpiNome,
              tipoEpiCodigo: item.tipoEpiCodigo,
              quantidadeEntregue: item.quantidadeEntregue,
              tipoEPI: item.tipoEPI
            });
            
            // ✅ VALIDAÇÃO SIMPLIFICADA: Aceitar estrutura atual do backend
            // Se temos ID do tipo de EPI e quantidade, consideramos válido
            const hasBasicData = item.tipoEpiId && item.quantidadeEntregue;
            
            console.log('🔍 Checando validação simplificada:', {
              hasBasicData,
              tipoEpiId: item.tipoEpiId,
              quantidadeEntregue: item.quantidadeEntregue,
              tipoEpiNome: item.tipoEpiNome,
              tipoEPI: item.tipoEPI
            });
            
            if (hasBasicData) {
              temDadosCompletos = true;
              console.log('✅ Dados essenciais encontrados:', {
                estrutura: 'backend atual (com tipoEpiId)',
                tipoEpiId: item.tipoEpiId,
                quantidade: item.quantidadeEntregue
              });
              break;
            }
          }
        }
        if (temDadosCompletos) break;
      }
      
      if (temDadosCompletos) {
        console.log('✅ Entregas do backend aprovadas na validação, extraindo equipamentos individuais...');
        
        entregasTransformadas.forEach((entrega) => {
          console.log(`🔍 Analisando entrega real ${entrega.id}:`, {
            itens: entrega.itens?.length || 0,
            responsavel: entrega.responsavelEntrega,
            dataEntrega: entrega.dataEntrega
          });
          
          // Cada entrega tem uma lista de itens
          if (entrega.itens && entrega.itens.length > 0) {
            entrega.itens.forEach((item) => {
              console.log(`🔍 Debug item da entrega ${entrega.id}:`, {
                itemId: item.id,
                status: item.status, // ✅ NOVO: Debug do status do item
                // Campos v3.5 (top-level)
                tipoEpiNome: item.tipoEpiNome,
                tipoEpiCodigo: item.tipoEpiCodigo, 
                quantidadeEntregue: item.quantidadeEntregue,
                // Campos v3.4 (nested)
                quantidade: item.quantidade,
                tipoEPI: item.tipoEPI,
                dataLimiteDevolucao: item.dataLimiteDevolucao
              });
              
              // ✅ FILTRO CRÍTICO: Só processar itens que estão COM_COLABORADOR
              if (item.status !== 'COM_COLABORADOR') {
                console.log(`⏭️ Pulando item ${item.id} - Status: ${item.status} (não é COM_COLABORADOR)`);
                return; // Pular este item
              }
              
              // ✅ CÁLCULO FLEXÍVEL: Se não tem dataLimiteDevolucao, calcular baseado na entrega
              const dataLimite = item.dataLimiteDevolucao || this.calcularPrazoMaximoDevolucao(entrega.dataEntrega);
              const statusVencimento = this.calcularStatusVencimento(dataLimite);
              const quantidade = item.quantidadeEntregue || item.quantidade || 1;
              
              // ✅ ESTRATÉGIA ROBUSTA: Usar múltiplas fontes para buscar nomes dos equipamentos
              let nomeEquipamento = 'EPI';
              let numeroCA = 'N/A';
              let categoria = 'PROTECAO_GERAL';
              
              // 1. Tentar campos diretos do backend v3.5 (se disponíveis)
              if (item.tipoEpiNome && item.tipoEpiNome !== 'EPI') {
                nomeEquipamento = item.tipoEpiNome;
                numeroCA = item.tipoEpiCodigo || 'N/A';
                categoria = item.tipoEpiCategoria || 'PROTECAO_GERAL';
                console.log(`✅ Nome obtido do backend v3.5: ${nomeEquipamento}`);
              }
              // 2. Tentar estrutura nested do backend v3.4
              else if (item.tipoEPI?.nomeEquipamento) {
                nomeEquipamento = item.tipoEPI.nomeEquipamento;
                numeroCA = item.tipoEPI.numeroCA || item.tipoEPI.codigo || 'N/A';
                categoria = item.tipoEPI.categoria || 'PROTECAO_GERAL';
                console.log(`✅ Nome obtido do backend v3.4: ${nomeEquipamento}`);
              }
              // 3. Buscar usando cache de tipos EPI (por estoqueItemOrigemId ou tipoEpiId)
              else if (item.estoqueItemOrigemId && tiposEpiCache.has(item.estoqueItemOrigemId)) {
                const tipoEpi = tiposEpiCache.get(item.estoqueItemOrigemId);
                nomeEquipamento = tipoEpi.nomeEquipamento || tipoEpi.nome || 'EPI';
                numeroCA = tipoEpi.numeroCA || tipoEpi.codigo || 'N/A';
                categoria = tipoEpi.categoria || 'PROTECAO_GERAL';
                console.log(`✅ Nome obtido do cache (por itemEstoque): ${nomeEquipamento}`);
              }
              // 4. Buscar usando cache de tipos EPI (por tipoEpiId)
              else if (item.tipoEpiId && tiposEpiCache.has(item.tipoEpiId)) {
                const tipoEpi = tiposEpiCache.get(item.tipoEpiId);
                nomeEquipamento = tipoEpi.nomeEquipamento || tipoEpi.nome || 'EPI';
                numeroCA = tipoEpi.numeroCA || tipoEpi.codigo || 'N/A';
                categoria = tipoEpi.categoria || 'PROTECAO_GERAL';
                console.log(`✅ Nome obtido do cache (por tipoEpiId): ${nomeEquipamento}`);
              }
              // 5. Fallback: Tentar extrair do histórico
              else if (historicoResponse && historicoResponse.eventos) {
                const eventoEntrega = historicoResponse.eventos.find(evento => 
                  evento.id === `entrega-${entrega.id}`
                );
                
                if (eventoEntrega && eventoEntrega.detalhes?.itensEntregues) {
                  const itensEntregues = eventoEntrega.detalhes.itensEntregues;
                  const itemHistorico = itensEntregues.find((itemHist: any) => 
                    itemHist.tipoEpiId === item.tipoEpiId || 
                    itemHist.estoqueItemId === item.estoqueItemOrigemId
                  );
                  
                  if (itemHistorico) {
                    nomeEquipamento = itemHistorico.tipoEpiNome || itemHistorico.nomeEquipamento || 'EPI';
                    numeroCA = itemHistorico.numeroCA || 'N/A';
                    categoria = itemHistorico.categoria || 'PROTECAO_GERAL';
                    console.log(`✅ Nome obtido do histórico: ${nomeEquipamento}`);
                  }
                }
              }
              
              console.log(`📦 Mapeando item: ${nomeEquipamento} (${numeroCA})`);
              
              // ✨ CRIAR ITENS INDIVIDUAIS: Para cada unidade, criar um equipamento separado
              for (let i = 0; i < quantidade; i++) {
                const equipamento: EquipamentoEmPosseItem = {
                  id: `${entrega.id}-${item.id}-${i + 1}`, // ID único por item individual para o frontend
                  entregaItemId: item.id, // ✅ NOVO: ID real do backend para devolução
                  nomeEquipamento: nomeEquipamento,
                  registroCA: numeroCA, // ✅ NÚMERO CA REAL
                  categoria: categoria,
                  quantidade: 1, // ✨ SEMPRE 1 (item individual)
                  dataEntrega: entrega.dataEntrega,
                  status: item.status || 'COM_COLABORADOR', // ✅ STATUS REAL DO ITEM DO BACKEND
                  entregaId: entrega.id, // ✅ REFERÊNCIA À ENTREGA REAL
                  prazoMaximoDevolucao: dataLimite,
                  vencido: statusVencimento === 'vencido',
                  diasVencido: statusVencimento === 'vencido' ? this.calcularDiasVencido(dataLimite) : undefined
                };
                
                console.log(`📦 Equipamento criado ${i + 1}/${quantidade}:`, {
                  id: equipamento.id,
                  nomeEquipamento: equipamento.nomeEquipamento,
                  registroCA: equipamento.registroCA,
                  entregaId: equipamento.entregaId
                });
                
                equipamentos.push(equipamento);
              }
              
              console.log(`✨ Criados ${quantidade} itens individuais para ${item.tipoEPI?.nomeEquipamento}`);
            });
          }
        });
        
        console.log('✅ Equipamentos extraídos das entregas reais:', equipamentos.length);
        return equipamentos;
      } else {
        console.log('⚠️ Validação falhou - dados essenciais ausentes nas entregas, usando fallback do histórico');
        console.log('🔍 Debug: Esperava tipoEPI.nomeEquipamento e tipoEPI.numeroCA em cada item');
      }
    }
    
    // ✅ FALLBACK: Usar dados do histórico se entregas não disponíveis
    if (!historicoResponse) {
      console.log('📋 Sem entregas nem histórico disponível para extrair equipamentos');
      return equipamentos;
    }

    console.log('⚠️ Usando fallback do histórico (entregas reais não disponíveis)');
    const entregasNoHistorico = historicoResponse.eventos.filter(evento => evento.tipo === 'entrega');
    
    entregasNoHistorico.forEach((entrega, index) => {
      console.log(`🔍 Analisando entrega ${index + 1} do histórico:`, {
        id: entrega.id,
        descricao: entrega.descricao,
        detalhes: entrega.detalhes
      });
      
      if (entrega.detalhes && entrega.detalhes.tipoEpiNome) {
        const dataLimiteDevolucao = entrega.detalhes.itens?.[0]?.dataLimiteDevolucao;
        const statusVencimento = this.calcularStatusVencimento(dataLimiteDevolucao);
        const quantidade = entrega.detalhes.quantidade || 1;
        
        console.log(`🔍 Debug entrega histórico:`, {
          tipoEpiNome: entrega.detalhes.tipoEpiNome,
          numeroCA: entrega.detalhes.numeroCA,
          quantidade: quantidade,
          dataLimiteDevolucao: dataLimiteDevolucao
        });
        
        for (let i = 0; i < quantidade; i++) {
          const equipamento: EquipamentoEmPosseItem = {
            id: `hist-${entrega.detalhes.entregaId || entrega.id}-${i + 1}`,
            nomeEquipamento: entrega.detalhes.tipoEpiNome || 'EPI (histórico)',
            registroCA: entrega.detalhes.numeroCA || 'N/A',
            categoria: 'PROTECAO_GERAL',
            quantidade: 1,
            dataEntrega: entrega.data,
            status: statusVencimento,
            entregaId: entrega.detalhes.entregaId || entrega.id,
            prazoMaximoDevolucao: dataLimiteDevolucao || '',
            vencido: statusVencimento === 'vencido',
            diasVencido: statusVencimento === 'vencido' ? this.calcularDiasVencido(dataLimiteDevolucao) : undefined
          };
          
          console.log(`📦 Equipamento histórico criado ${i + 1}/${quantidade}:`, {
            id: equipamento.id,
            nomeEquipamento: equipamento.nomeEquipamento,
            registroCA: equipamento.registroCA
          });
          
          equipamentos.push(equipamento);
        }
      }
    });

    console.log('✅ Equipamentos extraídos do histórico (fallback):', equipamentos.length);
    return equipamentos;
  }

  /**
   * ✅ NOVO: Extrair devoluções de itens para a tab "Devoluções"
   */
  async extrairDevolucoes(entregasResponse: EntregaDTO[], historicoResponse?: HistoricoFichaResponse): Promise<DevolucaoItem[]> {
    const devolucoes: DevolucaoItem[] = [];
    
    // ✅ CORRIGIDO: entregasResponse é um array direto, não um objeto com propriedade entregas
    if (!entregasResponse || !Array.isArray(entregasResponse) || entregasResponse.length === 0) {
      console.log('📋 Sem entregas disponível para extrair devoluções');
      return devolucoes;
    }

    console.log('🔍 Extraindo devoluções de itens...', entregasResponse.length, 'entregas');
    
    const entregasTransformadas = entregasResponse.map((entrega: any) => ({
      id: entrega.id,
      dataEntrega: entrega.dataEntrega,
      status: entrega.status,
      responsavelEntrega: entrega.responsavelEntrega,
      itens: entrega.itens?.map((item: any) => ({
        id: item.id,
        status: item.status,
        tipoEpiNome: item.tipoEpiNome,
        tipoEpiCodigo: item.tipoEpiCodigo,
        quantidadeEntregue: item.quantidadeEntregue || item.quantidade || 1,
        dataDevolucao: item.dataDevolucao,
        motivoDevolucao: item.motivoDevolucao,
        observacoesDevolucao: item.observacoesDevolucao
      }))
    }));

    entregasTransformadas.forEach((entrega) => {
      if (entrega.itens && entrega.itens.length > 0) {
        entrega.itens.forEach((item) => {
          // ✅ FILTRO: Só processar itens que foram DEVOLVIDOS
          if (item.status === 'DEVOLVIDO') {
            console.log(`📦 Processando devolução do item ${item.id}`);
            
            const quantidade = item.quantidadeEntregue || 1;
            
            // Criar uma devolução individual para cada unidade devolvida
            for (let i = 0; i < quantidade; i++) {
              const devolucao: DevolucaoItem = {
                id: `dev-${entrega.id}-${item.id}-${i + 1}`,
                equipamentoId: `${entrega.id}-${item.id}-${i + 1}`, // Mesmo ID do equipamento original
                nomeEquipamento: item.tipoEpiNome || 'EPI',
                registroCA: item.tipoEpiCodigo || 'N/A',
                dataDevolucao: item.dataDevolucao || new Date().toISOString(),
                motivo: item.motivoDevolucao || 'Devolução processada',
                observacoes: item.observacoesDevolucao,
                quantidade: 1, // Sempre 1 para itens individuais
                prazoOriginal: this.calcularPrazoMaximoDevolucao(entrega.dataEntrega),
                noPrazo: true, // TODO: Calcular baseado nas datas
                diasAtraso: 0 // TODO: Calcular baseado nas datas
              };
              
              devolucoes.push(devolucao);
            }
          }
        });
      }
    });

    console.log('✅ Devoluções extraídas:', devolucoes.length);
    return devolucoes;
  }

  /**
   * Calcula status de vencimento baseado na data limite
   */
  private calcularStatusVencimento(dataLimiteDevolucao: string | null): string {
    if (!dataLimiteDevolucao) return 'sem_data';
    
    const hoje = new Date();
    const dataLimite = new Date(dataLimiteDevolucao);
    const diffDays = Math.ceil((dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'vencido';
    if (diffDays <= 30) return 'vencendo';
    return 'dentro_prazo';
  }

  /**
   * Calcula quantos dias está vencido
   */
  private calcularDiasVencido(dataLimiteDevolucao: string | null): number {
    if (!dataLimiteDevolucao) return 0;
    
    const hoje = new Date();
    const dataLimite = new Date(dataLimiteDevolucao);
    const diffDays = Math.ceil((hoje.getTime() - dataLimite.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Calcula prazo máximo de devolução quando não fornecido pelo backend
   * ✅ FALLBACK: Usa 90 dias como padrão da entrega
   */
  private calcularPrazoMaximoDevolucao(dataEntrega: string): string {
    const entrega = new Date(dataEntrega);
    const prazoMaximo = new Date(entrega);
    prazoMaximo.setDate(prazoMaximo.getDate() + 90); // 90 dias padrão
    
    return prazoMaximo.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  }

  /**
   * Extrai entregas do histórico quando o endpoint principal falha
   */
  private extrairEntregasDoHistorico(
    historicoResponse: { eventos: HistoricoEventoFormatado[]; estatisticas: any } | null,
    entregasResponse: EntregaDTO[]
  ): EntregaDTO[] {
    // Se temos entregas do endpoint, usar essas com mapeamento correto
    if (entregasResponse && entregasResponse.length > 0) {
      console.log('✅ Usando entregas do endpoint:', entregasResponse.length);
      console.log('🔍 Debug: entregasResponse[0]:', entregasResponse[0]);
      
      // ✅ MAPEAR ENTREGAS DO BACKEND para estrutura esperada pelo presenter
      const entregasMapeadas = entregasResponse.map(entrega => {
        const entregaMapeada = {
          ...entrega,
          numero: entrega.id?.slice(-8) || 'N/A', // Últimos 8 chars do ID como número
          itens: entrega.itens?.map(item => ({
            id: item.id,
            quantidade: item.quantidadeEntregue || item.quantidade || 1,
            // ✅ MAPEAR CAMPOS: Suporta AMBAS estruturas do backend
            // v3.5 (top-level): item.tipoEpiNome, item.tipoEpiCodigo  
            // v3.4 (nested): item.tipoEPI.nomeEquipamento, item.tipoEPI.numeroCA
            nomeEquipamento: item.tipoEpiNome || item.tipoEPI?.nomeEquipamento || item.tipoEPI?.nome || 'EPI',
            registroCA: item.tipoEpiCodigo || item.tipoEPI?.numeroCA || item.tipoEPI?.codigo || 'N/A',
            categoria: item.tipoEpiCategoria || item.tipoEPI?.categoria || 'PROTECAO_GERAL',
            // Manter referências originais para compatibilidade
            tipoEPI: item.tipoEPI
          })) || []
        };
        
        console.log(`📦 Entrega ${entrega.id} mapeada:`, {
          id: entregaMapeada.id,
          numero: entregaMapeada.numero,
          itens: entregaMapeada.itens.length,
          primeiroItem: entregaMapeada.itens[0] ? {
            nome: entregaMapeada.itens[0].nomeEquipamento,
            ca: entregaMapeada.itens[0].registroCA,
            quantidade: entregaMapeada.itens[0].quantidade
          } : null
        });
        
        return entregaMapeada;
      });
      
      return entregasMapeadas;
    }

    // Fallback: extrair do histórico
    if (!historicoResponse) {
      console.log('📋 Sem histórico disponível para extrair entregas');
      return [];
    }

    const entregasDoHistorico: EntregaDTO[] = [];
    const entregasNoHistorico = historicoResponse.eventos.filter(evento => evento.tipo === 'entrega');
    
    console.log('📦 Extraindo entregas do histórico:', entregasNoHistorico.length);
    
    entregasNoHistorico.forEach(entrega => {
      console.log(`🔍 Processando entrega do histórico:`, {
        id: entrega.id,
        detalhes: entrega.detalhes,
        tipoEpiNome: entrega.detalhes?.tipoEpiNome,
        numeroCA: entrega.detalhes?.numeroCA,
        quantidade: entrega.detalhes?.quantidade
      });
      
      if (entrega.detalhes && entrega.detalhes.entregaId) {
        const entregaDTO: EntregaDTO = {
          id: entrega.detalhes.entregaId,
          fichaEpiId: entrega.id.split('-')[1] || '', // Extrair fichaId do ID composto
          almoxarifadoId: 'unknown', // Backend não fornece
          usuarioId: entrega.detalhes.responsavel?.id || 'unknown',
          quantidade: entrega.detalhes.quantidade || 1,
          dataEntrega: entrega.data,
          status: 'ENTREGUE', // Status padrão
          observacoes: entrega.descricao || '',
          responsavelEntrega: entrega.responsavel || 'Não informado',
          itens: [{
            id: `item-${entrega.detalhes.entregaId}`,
            entregaId: entrega.detalhes.entregaId,
            estoqueItemOrigemId: 'unknown',
            quantidade: entrega.detalhes.quantidade || 1,
            dataLimiteDevolucao: entrega.detalhes.itens?.[0]?.dataLimiteDevolucao || null,
            status: 'ATIVO',
            tipoEPI: {
              id: 'unknown',
              nomeEquipamento: entrega.detalhes.tipoEpiNome || 'EPI (histórico)',
              numeroCA: entrega.detalhes.numeroCA || 'N/A',
              categoria: 'PROTECAO_GERAL',
              descricao: '',
              fabricante: 'N/A',
              ativo: true,
              createdAt: entrega.data,
              updatedAt: entrega.data
            }
          }],
          createdAt: entrega.data,
          updatedAt: entrega.data
        };
        
        console.log(`📦 EntregaDTO criada do histórico:`, {
          id: entregaDTO.id,
          responsavel: entregaDTO.responsavelEntrega,
          itens: entregaDTO.itens.length,
          primeiroItem: {
            nome: entregaDTO.itens[0]?.tipoEPI?.nomeEquipamento,
            ca: entregaDTO.itens[0]?.tipoEPI?.numeroCA,
            quantidade: entregaDTO.itens[0]?.quantidade
          }
        });
        
        entregasDoHistorico.push(entregaDTO);
      }
    });

    console.log('✅ Entregas extraídas do histórico:', entregasDoHistorico.length);
    return entregasDoHistorico;
  }
  
  /**
   * ✅ BUSCA ITENS DE ESTOQUE REAIS: Busca itens reais disponíveis no estoque
   * ⚠️ SEM FALLBACK: Sempre dados reais ou erro
   */
  async getEPIsDisponiveis(): Promise<EPIDisponivel[]> {
    try {
      console.log('📦 Buscando itens de estoque reais do backend...');
      
      // ✅ USAR ENDPOINT CORRETO: /api/estoque/itens (implementado no backend)
      const url = createUrlWithParams('/estoque/itens', {
        apenasDisponiveis: true,
        apenasComSaldo: true,
        limit: 100
      });
      
      const response = await api.get(url);
      
      console.log('✅ Resposta do backend /api/estoque/itens:', response);
      console.log('🔍 Debug - response.success:', response?.success);
      console.log('🔍 Debug - response.data:', response?.data);
      console.log('🔍 Debug - response.data.items length:', response?.data?.items?.length);
      
      if (!response?.success || !response.data?.items || !Array.isArray(response.data.items)) {
        console.warn('⚠️ Estrutura de resposta inesperada:', response);
        throw new Error('Formato de resposta inválido');
      }
      
      // Mapear itens de estoque reais para formato EPIDisponivel
      console.log('📋 Itens recebidos do backend:', response.data.items.map(item => ({
        id: item.id,
        nome: item.tipoEpi?.nomeEquipamento,
        numeroCA: item.tipoEpi?.numeroCa,
        quantidade: item.quantidade
      })));
      
      const episDisponiveis: EPIDisponivel[] = response.data.items
        .filter((item: any) => item.quantidade > 0)
        .map((item: any) => {
          const mapped = {
            id: item.id, // ✅ ID REAL DO ITEM DE ESTOQUE
            nomeEquipamento: item.tipoEpi?.nomeEquipamento || 'EPI',
            numeroCA: item.tipoEpi?.numeroCa || 'N/A',
            categoria: item.tipoEpi?.categoriaEpi || 'PROTECAO_GERAL',
            quantidadeDisponivel: item.quantidade, // ✅ QUANTIDADE REAL
            disponivel: item.quantidade > 0,
            registroCA: item.tipoEpi?.numeroCa || 'N/A'
          };
          console.log('🔄 Item mapeado:', mapped);
          return mapped;
        });
      
      console.log('✅ Itens de estoque reais carregados:', episDisponiveis.length);
      console.log('📋 Itens disponíveis:', episDisponiveis.map(epi => 
        `${epi.id} - ${epi.nomeEquipamento} (${epi.numeroCA}) - ${epi.quantidadeDisponivel} unidades`
      ));
      
      return episDisponiveis;
      
    } catch (error) {
      console.error('❌ Erro ao buscar itens de estoque do backend:', error);
      throw error;
    }
  }
  
  /**
   * ✅ BUSCA ALMOXARIFADOS REAIS: Busca almoxarifados disponíveis
   * ⚠️ SEM FALLBACK: Sempre dados reais ou erro
   */
  async getAlmoxarifados(): Promise<Array<{
    id: string;
    nome: string;
    localizacao: string;
    ativo: boolean;
  }>> {
    try {
      console.log('🏪 Buscando almoxarifados do backend...');
      
      // ✅ USAR ENDPOINT CORRETO: /api/estoque/almoxarifados
      const url = createUrlWithParams('/estoque/almoxarifados', {
        incluirContadores: false
      });
      
      const response = await api.get(url);
      
      console.log('✅ Resposta do backend /api/estoque/almoxarifados:', response);
      
      if (!response?.success || !response.data || !Array.isArray(response.data)) {
        console.warn('⚠️ Estrutura de resposta inesperada:', response);
        throw new Error('Formato de resposta inválido');
      }
      
      // Mapear almoxarifados
      const almoxarifados = response.data
        .map((almox: any) => ({
          id: almox.id,
          nome: almox.nome,
          localizacao: almox.unidadeNegocio?.nome || 'Não informado',
          ativo: true // Assumir que todos retornados estão ativos
        }));
      
      console.log('✅ Almoxarifados carregados:', almoxarifados.length);
      console.log('📋 Almoxarifados:', almoxarifados.map(a => `${a.id} - ${a.nome} (${a.localizacao})`));
      
      return almoxarifados;
      
    } catch (error) {
      console.error('❌ Erro ao buscar almoxarifados:', error);
      throw error;
    }
  }
  
  /**
   * ✅ BUSCA USUÁRIOS REAIS: Busca usuários disponíveis para responsável da entrega
   * ⚠️ SEM FALLBACK: Sempre dados reais ou erro
   */
  async getUsuarios(): Promise<Array<{
    id: string;
    nome: string;
    email: string;
  }>> {
    try {
      console.log('👤 Buscando usuários do backend...');
      
      const response = await api.get('/usuarios');
      
      console.log('✅ Resposta do backend /api/usuarios:', response);
      
      if (!response?.items || !Array.isArray(response.items)) {
        console.error('❌ Estrutura de resposta inválida do backend:', response);
        throw new Error(`Backend retornou estrutura inválida para usuários: ${JSON.stringify(response)}`);
      }
      
      // Mapear usuários
      const usuarios = response.items.map((user: any) => ({
        id: user.id,
        nome: user.nome,
        email: user.email
      }));
      
      console.log('✅ Usuários carregados:', usuarios.length);
      console.log('📋 Usuários:', usuarios.map(u => `${u.id} - ${u.nome} (${u.email})`));
      
      return usuarios;
      
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      throw error;
    }
  }
  
  // ==================== COMMANDS - Operações de modificação ====================
  
  /**
   * ✅ REAL: Cria nova entrega conectado ao backend real
   */
  async criarNovaEntrega(fichaId: string, formData: NovaEntregaFormData): Promise<EntregaDTO> {
    try {
      console.log('📦 Criando nova entrega no backend:', { fichaId, formData });
      
      // ✅ BUSCAR ALMOXARIFADO REAL
      const almoxarifados = await this.getAlmoxarifados();
      const almoxarifadoPrimario = almoxarifados[0];
      
      if (!almoxarifadoPrimario) {
        throw new Error('Nenhum almoxarifado disponível encontrado');
      }
      
      if (!formData.usuarioResponsavelId) {
        throw new Error('Usuário responsável não selecionado');
      }
      
      console.log('🏪 Usando almoxarifado:', almoxarifadoPrimario);
      console.log('👤 Usando usuário responsável ID:', formData.usuarioResponsavelId);
      
      // ✅ EXPANDIR ITENS BASEADO NA QUANTIDADE (Backend exige 1 entrada por unidade)
      const itensExpandidos: Array<{
        estoqueItemOrigemId: string;
        quantidade: number;
        data_limite_devolucao: string;
      }> = [];
      
      formData.itens.forEach(item => {
        console.log(`🔄 Expandindo item: ${item.nomeEquipamento} (ID: ${item.episDisponivelId}) - Quantidade: ${item.quantidade}`);
        
        // Para cada unidade deste tipo específico de EPI, criar uma entrada separada
        for (let i = 0; i < item.quantidade; i++) {
          itensExpandidos.push({
            estoqueItemOrigemId: item.episDisponivelId, // ✅ ID específico deste tipo de EPI
            quantidade: 1, // Sempre 1 por entrada (backend exige assim)
            data_limite_devolucao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 dias
          });
          
          console.log(`  → Item ${i + 1}/${item.quantidade}: estoqueItemId = ${item.episDisponivelId}`);
        }
      });

      const quantidadeTotal = itensExpandidos.length; // Total de unidades individuais

      // ✅ ESTRUTURA CORRETA DO PAYLOAD
      const payload = {
        fichaEpiId: fichaId,
        almoxarifado_id: almoxarifadoPrimario.id, // ✅ ID REAL do almoxarifado
        usuarioId: formData.usuarioResponsavelId, // ✅ ID do usuário selecionado no formulário
        quantidade: quantidadeTotal, // ✅ Corresponde ao número de itens no array
        itens: itensExpandidos
      };
      
      console.log('📋 Payload otimizado para backend:', payload);
      console.log('✅ Usando almoxarifado real:', almoxarifadoPrimario.nome);
      console.log('✅ Usando usuário responsável ID:', formData.usuarioResponsavelId);
      console.log('✅ Quantidade total:', quantidadeTotal);
      console.log('✅ Número de itens expandidos:', itensExpandidos.length);
      
      // ✅ VALIDAÇÃO CRÍTICA: Verificar se quantidade total = número de itens
      console.log(`🔍 VALIDAÇÃO: payload.quantidade (${payload.quantidade}) === payload.itens.length (${payload.itens.length}): ${payload.quantidade === payload.itens.length}`);
      
      console.log('🔍 Itens originais do formulário:', formData.itens.map(item => ({
        id: item.episDisponivelId,
        nome: item.nomeEquipamento,
        quantidadeDesejada: item.quantidade
      })));
      
      console.log('🔍 Itens expandidos para backend:', itensExpandidos.map((item, index) => ({
        index: index + 1,
        estoqueItemId: item.estoqueItemOrigemId,
        quantidade: item.quantidade,
        dataLimite: item.data_limite_devolucao
      })));
      
      // ✅ ANÁLISE DE TIPOS DIFERENTES: Verificar se temos EPIs diferentes
      const tiposEPIDiferentes = new Set(itensExpandidos.map(item => item.estoqueItemOrigemId));
      console.log(`🎯 Tipos de EPI únicos no payload: ${tiposEPIDiferentes.size} de ${itensExpandidos.length} itens totais`);
      console.log('🎯 IDs dos tipos únicos:', Array.from(tiposEPIDiferentes));
      
      if (tiposEPIDiferentes.size === 1 && formData.itens.length > 1) {
        console.warn('⚠️ POTENCIAL PROBLEMA: Múltiplos tipos de EPI no formulário, mas apenas 1 tipo único no payload!');
        console.warn('⚠️ Isso pode indicar que todos os itens estão usando o mesmo estoqueItemOrigemId');
      }
      
      // 🔍 DUMP COMPLETO DO PAYLOAD PARA DEBUG DO BACKEND
      console.log('🚀 PAYLOAD COMPLETO SENDO ENVIADO PARA O BACKEND:');
      console.log(JSON.stringify(payload, null, 2));
      
      const response = await api.post<EntregaDTO>(`/fichas-epi/${fichaId}/entregas`, payload);
      
      console.log('✅ Entrega criada com sucesso:', response);
      
      // Invalidar cache da ficha para forçar recarregamento
      console.log('🗑️ Invalidando cache da ficha para forçar recarregamento:', fichaId);
      updateFichaAfterDevolucao(fichaId, null); // Remove from cache
      
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao criar entrega:', error);
      
      // Melhorar tratamento de erro específico para problemas de estoque
      if (error instanceof Error && error.message.includes('EstoqueItem not found')) {
        const enhancedError = new Error(
          'Erro: Item de estoque não encontrado. O sistema está configurado para tipos de EPI, ' +
          'mas o backend espera IDs de itens específicos em estoque. ' +
          'Verifique se o almoxarifado possui estoque disponível deste EPI.'
        );
        enhancedError.name = 'EstoqueItemNotFoundError';
        throw enhancedError;
      }
      
      if (error instanceof Error && error.message.includes('Validation error')) {
        const enhancedError = new Error(
          'Erro de validação: Verifique se todos os campos obrigatórios estão preenchidos. ' +
          'O sistema precisa de almoxarifado, usuário e itens válidos. ' +
          'Detalhes: ' + error.message
        );
        enhancedError.name = 'ValidationError';
        throw enhancedError;
      }
      
      throw error;
    }
  }
  
  /**
   * ✅ CONECTADO AO BACKEND REAL: Processar devolução de equipamentos
   */
  async processarDevolucao(equipamentoId: string, devolucaoData: DevolucaoForm): Promise<void> {
    try {
      console.log('🔄 Processando devolução no backend:', { equipamentoId, devolucaoData });
      
      // ✅ EXTRAIR FICHA ID: Do entregaId format, extrair fichaId para construir endpoint correto
      const entregaId = devolucaoData.entregaId;
      console.log('🔍 EntregaId recebido:', entregaId);
      
      // Estratégia para extrair fichaId do entregaId
      // Tentar extrair UUID válido do entregaId (assumindo que é um UUID padrão ou contém fichaId)
      let fichaId: string;
      
      // Se entregaId é um UUID simples, precisamos buscar a ficha associada
      const fichaIdMatch = entregaId.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (fichaIdMatch) {
        fichaId = fichaIdMatch[1];
        console.log('🔍 FichaId extraído do entregaId:', fichaId);
      } else {
        throw new Error(`Não foi possível extrair fichaId do entregaId: ${entregaId}`);
      }
      
      // ✅ ESTRATÉGIA MELHORADA: Extrair entregaItemId do equipamentoId composto
      // Formato: ${entregaId}-${itemId}-${index}
      // Onde entregaId e itemId são UUIDs (8-4-4-4-12 caracteres com hífens)
      // E index é um número simples no final
      
      console.log('🔍 Debug equipamentoId completo:', equipamentoId);
      
      // UUID tem formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      // Então um entregaItemId válido deve ter exatamente 36 caracteres
      // Vou buscar o padrão correto removendo o último segmento (index numérico)
      const ultimoHifen = equipamentoId.lastIndexOf('-');
      const ultimaParte = equipamentoId.substring(ultimoHifen + 1);
      
      // Se a última parte é um número (index), removê-la
      if (/^\d+$/.test(ultimaParte)) {
        const semIndex = equipamentoId.substring(0, ultimoHifen);
        console.log('🔍 ID sem index:', semIndex);
        
        // Agora extrair o itemId: pegar tudo depois do primeiro UUID (36 chars + hífen)
        const primeiroUuid = semIndex.substring(0, 36); // entregaId
        const entregaItemId = semIndex.substring(37); // itemId (remove entregaId + hífen)
        
        console.log('🔍 Entrega ID:', primeiroUuid);
        console.log('🔍 Extraído entregaItemId para devolução:', entregaItemId);
        
        if (entregaItemId.length !== 36) {
          throw new Error(`entregaItemId inválido: ${entregaItemId} (deve ter 36 caracteres)`);
        }
        
        // ✅ USAR ENDPOINT CORRETO: Usar estrutura /fichas-epi/{fichaId}/devolucoes (sem /api pois já está na base URL)
        console.log('🚀 Chamando endpoint correto:', `/fichas-epi/${fichaId}/devolucoes`);
        
        await api.post(`/fichas-epi/${fichaId}/devolucoes`, {
          entregaId: entregaId,
          usuarioId: 'cffc2197-acbe-4a64-bfd7-435370e9c226', // ID do "Administrador Sistema" do backend
          itensParaDevolucao: [{
            itemId: entregaItemId, // ✅ CORRIGIDO: usar 'itemId' em vez de 'entregaItemId'
            quantidadeDevolvida: 1,
            motivoDevolucao: devolucaoData.motivo || 'FIM_UTILIZACAO',
            condicaoItem: 'BOM' // ✅ CORRIGIDO: usar enum correto 'BOM' em vez de 'BOM_ESTADO'
          }]
        });
      } else {
        throw new Error('ID de equipamento não tem formato esperado (não termina com número)');
      }
      
      // ✅ Atualizar cache dinâmico local para feedback imediato
      // Usar o fichaId já extraído acima
      updateFichaAfterDevolucao(
        fichaId,
        equipamentoId,
        devolucaoData.motivo,
        devolucaoData.observacoes
      );
      
      console.log('✅ Devolução processada no backend com sucesso:', equipamentoId);
      
    } catch (error) {
      console.error('❌ Erro ao processar devolução no backend:', error);
      throw error;
    }
  }
  
  /**
   * ✅ CONECTADO AO BACKEND REAL: Criar nova entrega
   */
  async criarEntrega(fichaId: string, entregaData: CreateEntregaForm): Promise<string> {
    try {
      console.log('📦 Criando entrega no backend:', { fichaId, entregaData });
      
      const response = await api.post<{ id: string }>(`/fichas-epi/${fichaId}/entregas`, {
        almoxarifado_id: entregaData.almoxarifadoId,
        itens: entregaData.itens.map(item => ({
          estoque_item_id: item.episDisponivelId,
          quantidade: item.quantidade
        }))
      });
      
      console.log('✅ Entrega criada no backend:', response.id);
      return response.id;
      
    } catch (error) {
      console.error('❌ Erro ao criar entrega no backend:', error);
      throw error;
    }
  }
  
  /**
   * ✅ CONECTADO AO BACKEND REAL: Confirmar assinatura de entrega
   */
  async confirmarAssinatura(entregaId: string, assinatura: string): Promise<void> {
    try {
      console.log('✍️ Confirmando assinatura no backend:', entregaId);
      
      // ✅ ENDPOINT CORRETO: /api/fichas-epi/entregas/{entregaId}/assinar
      await api.put(`/fichas-epi/entregas/${entregaId}/assinar`, {
        assinaturaColaborador: assinatura, // Nome/identificação do colaborador
        observacoes: 'Assinatura digital confirmada via sistema' // Observação padrão
      });
      
      console.log('✅ Assinatura confirmada no backend:', entregaId);
      
    } catch (error) {
      console.error('❌ Erro ao confirmar assinatura no backend:', error);
      throw error;
    }
  }
  
  /**
   * ✅ CONECTADO AO BACKEND REAL: Cancelar entrega
   */
  async cancelarEntrega(entregaId: string): Promise<void> {
    try {
      console.log('❌ Cancelando entrega no backend:', entregaId);
      
      await api.post(`/entregas/${entregaId}/cancelar`);
      
      console.log('✅ Entrega cancelada no backend:', entregaId);
      
    } catch (error) {
      console.error('❌ Erro ao cancelar entrega no backend:', error);
      throw error;
    }
  }
  
  // ==================== HELPERS - Utilidades para dados ====================
  
  /**
   * Mapeia tipos de evento do backend para frontend
   */
  private mapearTipoEventoBackendParaFrontend(tipoBackend: 'CRIACAO' | 'ENTREGA' | 'DEVOLUCAO' | 'CANCELAMENTO' | 'VENCIMENTO'): HistoricoEventoFormatado['tipo'] {
    const mapeamento: Record<string, HistoricoEventoFormatado['tipo']> = {
      'CRIACAO': 'criacao',
      'ENTREGA': 'entrega',
      'DEVOLUCAO': 'devolucao',
      'CANCELAMENTO': 'cancelamento',
      'VENCIMENTO': 'vencimento'
    };
    
    return mapeamento[tipoBackend] || 'criacao';
  }
  
  /**
   * Extrai responsável do evento baseado no tipo e detalhes
   */
  private extrairResponsavelDoEvento(evento: HistoricoFichaResponse['historico'][0]): string {
    // Tentar extrair responsável dos detalhes
    if (evento.detalhes?.responsavel) {
      return evento.detalhes.responsavel;
    }
    
    if (evento.detalhes?.responsavelNome) {
      return evento.detalhes.responsavelNome;
    }
    
    // Fallback baseado no tipo de evento
    switch (evento.tipoAcao) {
      case 'CRIACAO':
        return 'Sistema';
      case 'ENTREGA':
        return 'Almoxarifado';
      case 'DEVOLUCAO':
        return evento.detalhes?.coletadoPor || 'Colaborador';
      case 'CANCELAMENTO':
        return evento.detalhes?.canceladoPor || 'Sistema';
      case 'VENCIMENTO':
        return 'Sistema';
      default:
        return 'Sistema';
    }
  }
  
  /**
   * Calcula equipamentos em posse baseado nas entregas
   */
  calculateEquipamentosEmPosse(entregas: EntregaDTO[]): EquipamentoEmPosseItem[] {
    const equipamentos: EquipamentoEmPosseItem[] = [];
    
    entregas.forEach(entrega => {
      if (entrega.itens) {
        entrega.itens.forEach(item => {
          if (item.status === 'COM_COLABORADOR') {
            equipamentos.push({
              id: item.id,
              nomeEquipamento: item.tipo_epi || 'EPI',
              registroCA: item.numero_ca || 'N/A',
              dataEntrega: entrega.data_entrega,
              dataLimiteDevolucao: item.data_limite_devolucao,
              statusEntrega: entrega.status,
              entregaId: entrega.id
            });
          }
        });
      }
    });
    
    return equipamentos;
  }
  
  /**
   * Calcula devoluções baseado nas entregas
   */
  calculateDevolucoes(entregas: EntregaDTO[]): DevolucaoItem[] {
    const devolucoes: DevolucaoItem[] = [];
    
    entregas.forEach(entrega => {
      if (entrega.itens) {
        entrega.itens.forEach(item => {
          if (item.status === 'DEVOLVIDO') {
            devolucoes.push({
              id: `dev-${item.id}`,
              equipamentoId: item.id,
              nomeEquipamento: item.tipo_epi || 'EPI',
              registroCA: item.numero_ca || 'N/A',
              dataEntrega: entrega.data_entrega,
              dataDevolucao: item.data_devolucao || new Date().toISOString(),
              motivo: item.motivo_devolucao || 'Devolução regular',
              observacoes: item.observacoes_devolucao
            });
          }
        });
      }
    });
    
    return devolucoes;
  }
  
  /**
   * Constrói histórico de eventos baseado na ficha e entregas
   */
  buildHistoricoEventos(ficha: FichaEPIDTO, entregas: EntregaDTO[]): HistoricoEventoItem[] {
    const eventos: HistoricoEventoItem[] = [];
    
    // Evento de criação da ficha
    eventos.push({
      id: `evento-ficha-${ficha.id}`,
      data: ficha.createdAt || ficha.dataEmissao,
      tipo: 'criacao_ficha',
      descricao: `Ficha de EPI criada para ${ficha.colaborador?.nome || 'colaborador'}`,
      responsavel: ficha.aprovadoPor || 'Sistema',
      detalhes: {
        fichaId: ficha.id,
        status: ficha.status
      }
    });
    
    // Eventos de entregas
    entregas.forEach(entrega => {
      eventos.push({
        id: `evento-entrega-${entrega.id}`,
        data: entrega.data_entrega,
        tipo: 'entrega_realizada',
        descricao: `Entrega realizada - ${entrega.itens?.length || 0} item(ns)`,
        responsavel: entrega.responsavel_nome || 'Sistema',
        detalhes: {
          entregaId: entrega.id,
          itens: entrega.itens?.length || 0,
          status: entrega.status
        }
      });
      
      // Eventos de assinatura
      if (entrega.status === 'ASSINADA' && entrega.data_assinatura) {
        eventos.push({
          id: `evento-assinatura-${entrega.id}`,
          data: entrega.data_assinatura,
          tipo: 'assinatura_coletada',
          descricao: 'Assinatura digital coletada',
          responsavel: entrega.responsavel_nome || 'Sistema',
          detalhes: {
            entregaId: entrega.id,
            linkAssinatura: entrega.link_assinatura
          }
        });
      }
    });
    
    // Ordenar por data (mais recente primeiro)
    return eventos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  /**
   * Mapeia entregas do backend para formato esperado pelo FichaDetailPresenter
   * Resolve nomes e CAs dos equipamentos usando cache de tipos EPI
   */
  private mapearEntregasParaFrontend(entregasResponse: EntregaDTO[], tiposEpiCache: Map<string, any>): any[] {
    if (!entregasResponse || entregasResponse.length === 0) {
      console.log('📦 Nenhuma entrega para mapear');
      return [];
    }

    console.log('📦 Mapeando entregas para frontend:', entregasResponse.length);

    return entregasResponse.map(entrega => {
      console.log(`🔍 Mapeando entrega ${entrega.id}:`, entrega);

      // Mapear itens da entrega com nomes corretos
      const itensMapeados = entrega.itens?.map(item => {
        let nomeEquipamento = 'EPI';
        let registroCA = 'N/A';

        // Estratégia de busca de nomes (mesma lógica da função extrairEquipamentosEmPosse)
        // 1. Campos diretos do backend v3.5
        if (item.tipoEpiNome && item.tipoEpiNome !== 'EPI') {
          nomeEquipamento = item.tipoEpiNome;
          registroCA = item.tipoEpiCodigo || 'N/A';
        }
        // 2. Estrutura nested do backend v3.4
        else if (item.tipoEPI?.nomeEquipamento) {
          nomeEquipamento = item.tipoEPI.nomeEquipamento;
          registroCA = item.tipoEPI.numeroCA || item.tipoEPI.codigo || 'N/A';
        }
        // 3. Cache por estoqueItemOrigemId
        else if (item.estoqueItemOrigemId && tiposEpiCache.has(item.estoqueItemOrigemId)) {
          const tipoEpi = tiposEpiCache.get(item.estoqueItemOrigemId);
          nomeEquipamento = tipoEpi.nomeEquipamento || tipoEpi.nome || 'EPI';
          registroCA = tipoEpi.numeroCA || tipoEpi.codigo || 'N/A';
        }
        // 4. Cache por tipoEpiId
        else if (item.tipoEpiId && tiposEpiCache.has(item.tipoEpiId)) {
          const tipoEpi = tiposEpiCache.get(item.tipoEpiId);
          nomeEquipamento = tipoEpi.nomeEquipamento || tipoEpi.nome || 'EPI';
          registroCA = tipoEpi.numeroCA || tipoEpi.codigo || 'N/A';
        }

        console.log(`📦 Item mapeado: ${nomeEquipamento} (${registroCA})`);

        return {
          ...item,
          nomeEquipamento,
          registroCA,
          quantidade: item.quantidadeEntregue || item.quantidade || 1
        };
      }) || [];

      return {
        id: entrega.id,
        numero: entrega.id.substring(0, 8).toUpperCase(), // Gerar número baseado no ID
        dataEntrega: entrega.dataEntrega,
        status: entrega.status || 'ENTREGUE',
        responsavel: entrega.responsavelEntrega || 'Não informado',
        itens: itensMapeados
      };
    });
  }
}

// Singleton para reutilização
export const fichaProcessAdapter = new FichaProcessAdapter();