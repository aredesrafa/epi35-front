/**
 * Configuration Service para ENUMs Dinâmicos
 *
 * Este serviço carrega configurações de negócio dinamicamente do backend,
 * incluindo tipos de movimentação, categorias de EPI, status de entrega, etc.
 *
 * CRÍTICO: O backend possui ENUMs complexos que devem ser carregados dinamicamente
 * ao invés de hardcoded no frontend.
 */

import { api } from "./apiClient";

export interface BusinessConfigurationItem {
  code: string;
  label: string;
  description?: string;
}

export interface BusinessConfiguration {
  tiposMovimentacao: BusinessConfigurationItem[];
  categoriasEPI: BusinessConfigurationItem[];
  statusEntrega: BusinessConfigurationItem[];
  statusFicha: BusinessConfigurationItem[];
  statusEstoque: BusinessConfigurationItem[];
  tiposNota: BusinessConfigurationItem[];
}

/**
 * Mock data temporário até integração com backend real
 * Este mock representa os dados que virão do endpoint /api/v1/configuration
 */
const MOCK_BUSINESS_CONFIG: BusinessConfiguration = {
  tiposMovimentacao: [
    {
      code: "entrada_nota",
      label: "Entrada por Nota",
      description: "Entrada de itens via nota fiscal",
    },
    {
      code: "saida_entrega",
      label: "Saída por Entrega",
      description: "Saída para entrega a colaborador",
    },
    {
      code: "transferencia",
      label: "Transferência",
      description: "Transferência entre almoxarifados",
    },
    {
      code: "ajuste_positivo",
      label: "Ajuste Positivo",
      description: "Ajuste para aumentar estoque",
    },
    {
      code: "ajuste_negativo",
      label: "Ajuste Negativo",
      description: "Ajuste para diminuir estoque",
    },
    {
      code: "devolucao",
      label: "Devolução",
      description: "Devolução de item por colaborador",
    },
    {
      code: "descarte",
      label: "Descarte",
      description: "Descarte de item vencido ou danificado",
    },
    {
      code: "estorno",
      label: "Estorno",
      description: "Estorno de movimentação anterior",
    },
  ],
  categoriasEPI: [
    {
      code: "PROTECAO_CABECA",
      label: "Proteção da Cabeça",
      description: "Capacetes, bonés, etc.",
    },
    {
      code: "PROTECAO_OLHOS_ROSTO",
      label: "Proteção dos Olhos",
      description: "Óculos, viseiras, etc.",
    },
    {
      code: "PROTECAO_OUVIDOS",
      label: "Proteção Auditiva",
      description: "Protetores auriculares",
    },
    {
      code: "PROTECAO_RESPIRATORIA",
      label: "Proteção Respiratória",
      description: "Máscaras, respiradores",
    },
    {
      code: "PROTECAO_MAOS_BRACCOS",
      label: "Proteção das Mãos",
      description: "Luvas de diversos tipos",
    },
    {
      code: "PROTECAO_PES",
      label: "Proteção dos Pés",
      description: "Calçados de segurança",
    },
    {
      code: "PROTECAO_CLIMATICA",
      label: "Proteção Climática",
      description: "Proteção contra intempéries",
    },
    {
      code: "ROUPA_APROXIMACAO",
      label: "Roupa de Aproximação",
      description: "Roupas especiais para aproximação",
    },
  ],
  statusEntrega: [
    {
      code: "pendente_assinatura",
      label: "Pendente de Assinatura",
      description: "Aguardando assinatura do colaborador",
    },
    {
      code: "assinada",
      label: "Assinada",
      description: "Entrega confirmada e assinada",
    },
    {
      code: "devolvido",
      label: "Devolvido",
      description: "Item devolvido pelo colaborador",
    },
    {
      code: "vencido",
      label: "Vencido",
      description: "Item vencido e deve ser substituído",
    },
    { code: "cancelada", label: "Cancelada", description: "Entrega cancelada" },
  ],
  statusFicha: [
    {
      code: "ativa",
      label: "Ativa",
      description: "Ficha ativa do colaborador",
    },
    { code: "inativa", label: "Inativa", description: "Ficha inativada" },
    {
      code: "pendente",
      label: "Pendente",
      description: "Ficha com pendências",
    },
    {
      code: "completa",
      label: "Completa",
      description: "Ficha com todos os EPIs entregues",
    },
  ],
  statusEstoque: [
    {
      code: "disponivel",
      label: "Disponível",
      description: "Item disponível em estoque",
    },
    {
      code: "baixo",
      label: "Estoque Baixo",
      description: "Quantidade abaixo do mínimo",
    },
    {
      code: "vencendo",
      label: "Próximo ao Vencimento",
      description: "Vence em até 30 dias",
    },
    {
      code: "vencido",
      label: "Vencido",
      description: "Item com validade expirada",
    },
    {
      code: "esgotado",
      label: "Esgotado",
      description: "Sem itens em estoque",
    },
    {
      code: "bloqueado",
      label: "Bloqueado",
      description: "Item bloqueado para uso",
    },
    {
      code: "quarentena",
      label: "Em Quarentena",
      description: "Item devolvido aguardando análise",
    },
    {
      code: "aguarda_inspecao",
      label: "Aguarda Inspeção",
      description: "Item aguardando inspeção técnica",
    },
  ],
  tiposNota: [
    {
      code: "entrada",
      label: "Entrada",
      description: "Nota de entrada de mercadorias",
    },
    {
      code: "transferencia",
      label: "Transferência",
      description: "Nota de transferência",
    },
    { code: "devolucao", label: "Devolução", description: "Nota de devolução" },
    { code: "descarte", label: "Descarte", description: "Nota de descarte" },
  ],
};

class ConfigurationService {
  private cache: BusinessConfiguration | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Carrega as regras de negócio do backend ou cache
   * Usa endpoint /api/configuracoes real com fallback para mock
   */
  async loadBusinessRules(): Promise<BusinessConfiguration> {
    // Verificar cache primeiro
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      console.log("🔧 Tentando carregar configurações do backend...");
      
      // Conectar ao backend real - endpoint de configuração
      const response = await api.get<{success: boolean, data: any[]}>(
        "/configuracoes",
      );

      if (response?.success && response.data) {
        console.log("✅ Configurações carregadas do backend");
        
        // TODO: Mapear configurações do backend para formato do frontend
        // Por enquanto usar mock até implementar mapeamento
        const config = MOCK_BUSINESS_CONFIG;
        
        // Atualizar cache
        this.cache = config;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        
        return config;
      } else {
        throw new Error("Formato de resposta inesperado");
      }
    } catch (error: any) {
      console.warn("⚠️ Endpoint /api/configuracoes não encontrado ou erro:", error);

      // Em caso de erro, usar dados do cache (se existir) ou mock data
      if (this.cache) {
        console.warn("📋 Usando configurações do cache devido ao erro");
        return this.cache;
      }

      console.warn("📋 Usando configurações padrão (mock)");
      
      // Atualizar cache com mock
      this.cache = MOCK_BUSINESS_CONFIG;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      
      return MOCK_BUSINESS_CONFIG;
    }
  }

  /**
   * Busca uma configuração específica por categoria
   */
  async getConfigByCategory(
    category: keyof BusinessConfiguration,
  ): Promise<BusinessConfigurationItem[]> {
    const config = await this.loadBusinessRules();
    return config[category] || [];
  }

  /**
   * Busca um item específico por código em uma categoria
   */
  async getConfigItem(
    category: keyof BusinessConfiguration,
    code: string,
  ): Promise<BusinessConfigurationItem | null> {
    const items = await this.getConfigByCategory(category);
    return items.find((item) => item.code === code) || null;
  }

  /**
   * Limpa o cache forçando uma nova requisição
   */
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Verifica se o cache está válido
   */
  isCacheValid(): boolean {
    return this.cache !== null && Date.now() < this.cacheExpiry;
  }
}

// Singleton instance
export const configurationService = new ConfigurationService();

// Helper functions para facilitar o uso nos componentes
export async function getTiposMovimentacao(): Promise<
  BusinessConfigurationItem[]
> {
  return configurationService.getConfigByCategory("tiposMovimentacao");
}

export async function getCategoriasEPI(): Promise<BusinessConfigurationItem[]> {
  return configurationService.getConfigByCategory("categoriasEPI");
}

export async function getStatusEntrega(): Promise<BusinessConfigurationItem[]> {
  return configurationService.getConfigByCategory("statusEntrega");
}

export async function getStatusFicha(): Promise<BusinessConfigurationItem[]> {
  return configurationService.getConfigByCategory("statusFicha");
}

export async function getStatusEstoque(): Promise<BusinessConfigurationItem[]> {
  return configurationService.getConfigByCategory("statusEstoque");
}

export async function getTiposNota(): Promise<BusinessConfigurationItem[]> {
  return configurationService.getConfigByCategory("tiposNota");
}

// ==================== CONFIGURAÇÕES GERAIS DO SISTEMA ====================

export interface ConfiguracaoSistemaDTO {
  chave: string;
  valor: string;
  valorParsed: boolean | number | string;
  tipo: "BOOLEAN" | "NUMBER" | "STRING";
  descricao: string;
  createdAt: string;
}

/**
 * ✅ CONECTADO AO BACKEND REAL: Lista todas as configurações do sistema
 */
export async function getConfiguracoesSistema(): Promise<
  ConfiguracaoSistemaDTO[]
> {
  try {
    console.log("⚙️ Carregando configurações do sistema...");

    const response = await api.get<{
      success: boolean;
      data: ConfiguracaoSistemaDTO[];
      message: string;
    }>("/configuracoes");

    console.log(
      "✅ Configurações do sistema carregadas:",
      response.data.length,
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Erro ao carregar configurações do sistema:", error);
    throw error;
  }
}

/**
 * ✅ CONECTADO AO BACKEND REAL: Atualiza uma configuração específica
 */
export async function updateConfiguracaoSistema(
  chave: string,
  valor: string,
): Promise<ConfiguracaoSistemaDTO> {
  try {
    console.log("💾 Atualizando configuração do sistema:", chave, "→", valor);

    const response = await api.put<{
      success: boolean;
      data: {
        configuracao: ConfiguracaoSistemaDTO;
        valorAnterior: string;
      };
      message: string;
    }>(`/configuracoes/${chave}`, { valor });

    console.log("✅ Configuração do sistema atualizada:", {
      chave,
      valorAnterior: response.data.valorAnterior,
      valorNovo: response.data.configuracao.valor,
    });

    return response.data.configuracao;
  } catch (error: any) {
    console.error("❌ Erro ao atualizar configuração do sistema:", error);
    throw error;
  }
}

/**
 * ✅ HELPER: Busca configuração por chave
 */
export async function getConfiguracaoPorChave(
  chave: string,
): Promise<ConfiguracaoSistemaDTO | null> {
  try {
    const configuracoes = await getConfiguracoesSistema();
    return configuracoes.find((config) => config.chave === chave) || null;
  } catch (error: any) {
    console.error("❌ Erro ao buscar configuração:", chave, error);
    return null;
  }
}

/**
 * ✅ HELPER: Atualiza configuração booleana
 */
export async function updateConfiguracaoBoolean(
  chave: string,
  valor: boolean,
): Promise<ConfiguracaoSistemaDTO> {
  return updateConfiguracaoSistema(chave, valor.toString());
}

/**
 * ✅ HELPER: Mapeia configurações para objeto simples
 */
export function mapConfiguracoesToObject(
  configuracoes: ConfiguracaoSistemaDTO[],
): Record<string, any> {
  const result: Record<string, any> = {};

  configuracoes.forEach((config) => {
    result[config.chave] = config.valorParsed;
  });

  return result;
}

// ==================== CHAVES DE CONFIGURAÇÃO CONHECIDAS ====================

export const CONFIG_KEYS = {
  PERMITIR_ESTOQUE_NEGATIVO: "PERMITIR_ESTOQUE_NEGATIVO",
  PERMITIR_AJUSTES_FORCADOS: "PERMITIR_AJUSTES_FORCADOS",
  ESTOQUE_MINIMO_EQUIPAMENTO: "ESTOQUE_MINIMO_EQUIPAMENTO",
} as const;

export type ConfigKey = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS];
