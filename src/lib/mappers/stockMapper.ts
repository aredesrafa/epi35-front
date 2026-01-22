/**
 * Stock/Inventory Response Mapper
 * 
 * Responsável por mapear respostas da API de estoque para compatibilidade frontend
 * Resolve inconsistências entre nomes de campos do backend e frontend
 */

// ==================== INTERFACES ====================

export interface BackendStockResponse {
  success: boolean;
  data: {
    itens: Array<any>; // Backend retorna 'itens'
    resumo: {
      totalItens: number;
      valorTotalEstoque: number; // Backend retorna 'valorTotalEstoque'
      itensAbaixoMinimo: number;
    };
    dataGeracao: string;
  };
}

export interface FrontendStockResponse {
  success: boolean;
  data: {
    posicao: Array<any>; // Frontend espera 'posicao'
    resumo: {
      totalItens: number;
      valorTotal: number; // Frontend espera 'valorTotal'
      itensAbaixoMinimo: number;
    };
    dataGeracao: string;
  };
}

// ==================== MAPPERS ====================

/**
 * Mapeia resposta do endpoint /estoque/posicao
 * Backend: { data: { itens: [...], resumo: { valorTotalEstoque: number } } }
 * Frontend: { data: { posicao: [...], resumo: { valorTotal: number } } }
 */
export function mapStockPositionResponse(backendResponse: BackendStockResponse): FrontendStockResponse {
  return {
    success: backendResponse.success,
    data: {
      posicao: backendResponse.data.itens, // Backend itens → Frontend posicao
      resumo: {
        totalItens: backendResponse.data.resumo.totalItens,
        valorTotal: backendResponse.data.resumo.valorTotalEstoque, // Backend valorTotalEstoque → Frontend valorTotal
        itensAbaixoMinimo: backendResponse.data.resumo.itensAbaixoMinimo,
      },
      dataGeracao: backendResponse.data.dataGeracao,
    },
  };
}

/**
 * Mapeia resposta do endpoint /estoque/resumo
 * Backend: { data: { valorTotalEstoque: number } }
 * Frontend: { data: { valorTotal: number } }
 */
export function mapStockSummaryResponse(backendResponse: any): any {
  if (!backendResponse.data) {
    return backendResponse;
  }

  return {
    ...backendResponse,
    data: {
      ...backendResponse.data,
      // Se backend retorna valorTotalEstoque, mapear para valorTotal
      valorTotal: backendResponse.data.valorTotalEstoque || backendResponse.data.valorTotal,
    },
  };
}

/**
 * Mapeia resposta do endpoint /estoque/itens (estrutura já correta)
 * Backend: { data: { items: [...] } }
 * Frontend: { data: { items: [...] } }
 */
export function mapStockItemsResponse(backendResponse: any): any {
  // Estrutura já está correta para /estoque/itens
  return backendResponse;
}

/**
 * Mapeia qualquer resposta de estoque para garantir compatibilidade
 */
export function mapStockResponse(backendResponse: any, endpoint: string): any {
  switch (endpoint) {
    case '/estoque/posicao':
      return mapStockPositionResponse(backendResponse);
    case '/estoque/resumo':
      return mapStockSummaryResponse(backendResponse);
    case '/estoque/itens':
      return mapStockItemsResponse(backendResponse);
    default:
      console.warn(`⚠️ Endpoint não mapeado: ${endpoint}`);
      return backendResponse;
  }
}

// ==================== VALIDATION HELPERS ====================

/**
 * Valida se a resposta tem a estrutura esperada
 */
export function validateStockResponse(response: any, expectedFields: string[]): boolean {
  if (!response || !response.data) {
    return false;
  }

  return expectedFields.every(field => {
    const fieldPath = field.split('.');
    let current = response.data;
    
    for (const segment of fieldPath) {
      if (!current || typeof current !== 'object' || !(segment in current)) {
        return false;
      }
      current = current[segment];
    }
    
    return true;
  });
}

/**
 * Normaliza valores numéricos para evitar erros de tipagem
 */
export function normalizeStockValues(data: any): any {
  const normalized = { ...data };
  
  if (normalized.resumo) {
    normalized.resumo = {
      ...normalized.resumo,
      totalItens: Number(normalized.resumo.totalItens) || 0,
      valorTotal: Number(normalized.resumo.valorTotal) || 0,
      itensAbaixoMinimo: Number(normalized.resumo.itensAbaixoMinimo) || 0,
    };
  }
  
  return normalized;
}