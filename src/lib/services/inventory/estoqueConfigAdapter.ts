/**
 * Estoque Configuration Service Adapter
 *
 * Adapter especializado para configuração de filtros de estoque.
 * Conectado ao endpoint real do backend para configurações condicionais.
 */

import { api } from "../core/apiClient";

// ==================== TYPES ====================

export interface TabsConfiguracao {
  disponivel: boolean;
  quarentena: boolean;
  aguardandoInspecao: boolean;
  semEstoque: boolean;
}

export interface EstoqueConfiguracao {
  permitirEstoqueNegativo: boolean;
  tabsDisponiveis: TabsConfiguracao;
}

export interface EstoqueConfiguracaoResponse {
  success: boolean;
  data: EstoqueConfiguracao;
}

export interface TabConfig {
  key: string;
  label: string;
  visible: boolean;
  color: 'green' | 'orange' | 'blue' | 'red';
  icon: string;
  statusFilter: string;
}

// ==================== ADAPTER ====================

class EstoqueConfigAdapter {
  private config: EstoqueConfiguracao | null = null;
  private configCache: {
    data: EstoqueConfiguracao | null;
    timestamp: number;
    ttl: number;
  } = {
    data: null,
    timestamp: 0,
    ttl: 5 * 60 * 1000 // 5 minutos
  };

  /**
   * ✅ BACKEND REAL: Carrega configuração de filtros do backend
   */
  async obterConfiguracaoFiltros(): Promise<EstoqueConfiguracao> {
    try {
      // Verificar cache
      const now = Date.now();
      if (
        this.configCache.data && 
        (now - this.configCache.timestamp) < this.configCache.ttl
      ) {
        console.log('📋 Usando configuração em cache');
        return this.configCache.data;
      }

      console.log('📋 Carregando configuração de filtros do backend...');
      
      const response = await api.get<EstoqueConfiguracaoResponse>('/estoque/configuracao-filtros') as any;
      
      if (response.success) {
        this.config = response.data;
        
        // Atualizar cache
        this.configCache = {
          data: response.data,
          timestamp: now,
          ttl: this.configCache.ttl
        };
        
        console.log('✅ Configuração carregada:', {
          permitirEstoqueNegativo: response.data.permitirEstoqueNegativo,
          tabsVisíveis: Object.entries(response.data.tabsDisponiveis)
            .filter(([_, visible]) => visible)
            .map(([tab, _]) => tab)
        });
        
        return response.data;
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar configuração de filtros:', error);
      
      // Fallback: configuração padrão
      const fallbackConfig: EstoqueConfiguracao = {
        permitirEstoqueNegativo: false,
        tabsDisponiveis: {
          disponivel: true,
          quarentena: true,
          aguardandoInspecao: true,
          semEstoque: true
        }
      };
      
      console.log('⚠️ Usando configuração padrão de fallback');
      return fallbackConfig;
    }
  }

  /**
   * ✅ Gera configuração de tabs baseada na configuração do backend
   */
  async obterTabsAtivas(): Promise<TabConfig[]> {
    const config = await this.obterConfiguracaoFiltros();
    
    // Definição completa das tabs (sem INSPEÇÃO conforme solicitado)
    const todasAsTabs: TabConfig[] = [
      {
        key: 'DISPONIVEL',
        label: 'Disponível',
        visible: config.tabsDisponiveis.disponivel,
        color: 'green',
        icon: 'check-circle',
        statusFilter: 'DISPONIVEL'
      },
      {
        key: 'QUARENTENA',
        label: 'Quarentena',
        visible: config.tabsDisponiveis.quarentena,
        color: 'orange',
        icon: 'alert-triangle',
        statusFilter: 'QUARENTENA'
      },
      {
        key: 'SEM_ESTOQUE',
        label: 'Sem Estoque',
        visible: config.tabsDisponiveis.semEstoque, // CONDICIONAL baseado em permitirEstoqueNegativo
        color: 'red',
        icon: 'x-circle',
        statusFilter: 'SEM_ESTOQUE'
      }
    ];
    
    // Filtrar apenas tabs visíveis
    const tabsAtivas = todasAsTabs.filter(tab => tab.visible);
    
    console.log('📋 Tabs ativas configuradas:', tabsAtivas.map(t => t.label));
    
    return tabsAtivas;
  }

  /**
   * ✅ Verifica se uma tab específica está ativa
   */
  async isTabAtiva(tabKey: string): Promise<boolean> {
    const config = await this.obterConfiguracaoFiltros();
    
    switch (tabKey) {
      case 'DISPONIVEL':
        return config.tabsDisponiveis.disponivel;
      case 'QUARENTENA':
        return config.tabsDisponiveis.quarentena;
      case 'AGUARDANDO_INSPECAO':
        return config.tabsDisponiveis.aguardandoInspecao;
      case 'SEM_ESTOQUE':
        return config.tabsDisponiveis.semEstoque;
      default:
        return false;
    }
  }

  /**
   * ✅ Limpa cache de configuração (útil quando admin altera configurações)
   */
  limparCache(): void {
    this.configCache = {
      data: null,
      timestamp: 0,
      ttl: this.configCache.ttl
    };
    this.config = null;
    console.log('🧹 Cache de configuração limpo');
  }

  /**
   * ✅ Obtém configuração atual (cache ou null)
   */
  obterConfiguracaoAtual(): EstoqueConfiguracao | null {
    return this.config;
  }
}

// Singleton para reutilização
export const estoqueConfigAdapter = new EstoqueConfigAdapter();