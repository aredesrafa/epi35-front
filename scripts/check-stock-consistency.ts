#!/usr/bin/env node

/**
 * Script CLI para Verificação e Correção de Inconsistências de Estoque
 * 
 * Uso:
 * - npm run check-stock (apenas verificar)
 * - npm run check-stock --fix (verificar e corrigir automaticamente)
 * - npm run check-stock --item="avental" (verificar item específico)
 */

import { runFullConsistencyCheck, stockConsistencyFixer } from '../src/lib/utils/stockConsistencyFixer';
import { inventoryCommandAdapter } from '../src/lib/services/inventory/inventoryCommandAdapter';

interface CLIOptions {
  fix: boolean;
  item?: string;
  verbose: boolean;
  help: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  
  return {
    fix: args.includes('--fix') || args.includes('-f'),
    item: args.find(arg => arg.startsWith('--item='))?.split('=')[1],
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h')
  };
}

function showHelp(): void {
  console.log(`
🔧 Script de Verificação de Consistência de Estoque
==================================================

PROBLEMA:
Seeds scripts que inserem dados diretamente no Read Model sem gerar 
eventos correspondentes, causando desincronização entre estoque atual 
e histórico de movimentações (kardex).

SOLUÇÃO:
Este script detecta essas inconsistências comparando estoque vs kardex
e oferece correção automática usando o endpoint /api/estoque/ajuste-direto.

USO:
----
npm run check-stock                    # Apenas verificar
npm run check-stock --fix              # Verificar e corrigir automaticamente  
npm run check-stock --item="avental"   # Verificar item específico
npm run check-stock --verbose          # Logs detalhados
npm run check-stock --help             # Mostrar esta ajuda

OPÇÕES:
-------
--fix, -f           Aplicar correções automaticamente
--item=<nome>       Verificar apenas itens que contenham o nome
--verbose, -v       Logs detalhados do processo
--help, -h          Mostrar esta ajuda

EXEMPLOS:
---------
# Verificar apenas o "Avental de Raspa de Couro CA 32890"
npm run check-stock --item="avental"

# Verificar tudo e corrigir automaticamente 
npm run check-stock --fix

# Verificar com logs detalhados
npm run check-stock --verbose

IMPORTANTE:
-----------
- Inconsistências CRÍTICAS não são corrigidas automaticamente
- O script usa o kardex como "source of truth" 
- Sempre faça backup antes de executar correções
- Execute primeiro sem --fix para ver o relatório
`);
}

async function checkSpecificItem(itemName: string): Promise<void> {
  console.log(`🔍 Buscando inconsistências para itens contendo: "${itemName}"`);
  
  try {
    // Buscar itens que contenham o nome
    const response = await inventoryCommandAdapter.getInventoryItems({
      search: itemName,
      pageSize: 100,
      includeExpanded: true
    });
    
    if (response.data.length === 0) {
      console.log(`❌ Nenhum item encontrado com o nome "${itemName}"`);
      return;
    }
    
    console.log(`📦 ${response.data.length} item(s) encontrado(s):`);
    
    // Verificar cada item individualmente
    for (const item of response.data) {
      console.log(`\n🔍 Verificando: ${item.tipoEPI?.nomeEquipamento || item.id}`);
      console.log(`   CA: ${item.tipoEPI?.numeroCA || 'N/A'}`);
      console.log(`   Estoque Atual: ${item.quantidade}`);
      
      // Buscar inconsistências apenas para este item
      const inconsistencies = await stockConsistencyFixer.detectInconsistencies();
      const itemInconsistency = inconsistencies.find(inc => inc.item.id === item.id);
      
      if (itemInconsistency) {
        console.log(`🚨 INCONSISTÊNCIA DETECTADA:`);
        console.log(`   Estoque Atual: ${itemInconsistency.estoqueAtual}`);
        console.log(`   Saldo Kardex: ${itemInconsistency.saldoKardex}`);
        console.log(`   Diferença: ${itemInconsistency.diferenca}`);
        console.log(`   Severidade: ${itemInconsistency.severidade.toUpperCase()}`);
        console.log(`   Tipo: ${itemInconsistency.tipo}`);
        console.log(`   Recomendação: ${itemInconsistency.recomendacao}`);
      } else {
        console.log(`✅ Item consistente - sem inconsistências detectadas`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Erro ao verificar item "${itemName}":`, error);
  }
}

async function main(): Promise<void> {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }
  
  console.log('🚀 VERIFICADOR DE CONSISTÊNCIA DE ESTOQUE');
  console.log('=========================================');
  console.log(`Modo: ${options.fix ? 'VERIFICAR + CORRIGIR' : 'APENAS VERIFICAR'}`);
  console.log(`Verbose: ${options.verbose ? 'SIM' : 'NÃO'}`);
  
  if (options.item) {
    console.log(`Filtro: Itens contendo "${options.item}"`);
  }
  
  console.log('');
  
  try {
    // Verificar item específico se fornecido
    if (options.item) {
      await checkSpecificItem(options.item);
      return;
    }
    
    // Executar verificação completa
    const result = await runFullConsistencyCheck(options.fix);
    
    // Mostrar resumo final
    console.log('\n📊 RESUMO FINAL:');
    console.log('================');
    console.log(`Inconsistências detectadas: ${result.inconsistencies.length}`);
    
    if (result.fixes) {
      const sucessos = result.fixes.filter(f => f.success).length;
      const falhas = result.fixes.filter(f => !f.success).length;
      console.log(`Correções aplicadas: ${sucessos}`);
      console.log(`Falhas na correção: ${falhas}`);
      
      if (falhas > 0) {
        console.log('\n❌ FALHAS:');
        result.fixes.filter(f => !f.success).forEach(fail => {
          console.log(`   - ${fail.nomeEquipamento}: ${fail.error}`);
        });
      }
    }
    
    if (result.inconsistencies.length === 0) {
      console.log('✅ Sistema íntegro - nenhuma inconsistência detectada!');
    } else if (!options.fix) {
      console.log(`\n💡 Para corrigir automaticamente, execute:`);
      console.log(`   npm run check-stock --fix`);
    }
    
  } catch (error) {
    console.error('❌ ERRO FATAL:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro não tratado:', error);
    process.exit(1);
  });
}

export { main };