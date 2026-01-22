#!/usr/bin/env node

/**
 * Script rápido para verificar a inconsistência do Avental de Raspa
 * Não precisa de dependências TypeScript, roda direto no Node.js
 */

import https from 'https';

const API_BASE = 'https://epi-backend-s14g.onrender.com/api';

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function checkAventalConsistency() {
  console.log('🔍 VERIFICANDO: Inconsistência do Avental de Raspa de Couro CA 32890');
  console.log('================================================================');
  
  try {
    // 1. Buscar itens de estoque contendo "avental"
    console.log('📦 1. Buscando itens de estoque com "avental"...');
    const estoqueUrl = `${API_BASE}/estoque/itens?search=avental&includeExpanded=true`;
    console.log(`   URL: ${estoqueUrl}`);
    
    const estoqueResponse = await makeRequest(estoqueUrl);
    console.log('   Resposta do estoque:', JSON.stringify(estoqueResponse, null, 2));
    
    const items = estoqueResponse?.data?.items || estoqueResponse?.items || [];
    console.log(`   ✅ ${items.length} item(s) encontrado(s)`);
    
    if (items.length === 0) {
      console.log('❌ Nenhum item encontrado com "avental". Verifique se os dados estão no backend.');
      return;
    }
    
    // 2. Encontrar o avental específico
    const avental = items.find(item => 
      item.tipoEPI?.numeroCA === '32890' || 
      item.tipoEpi?.numeroCa === '32890' ||
      item.tipoEPI?.nomeEquipamento?.toLowerCase().includes('avental de raspa') ||
      item.tipoEpi?.nomeEquipamento?.toLowerCase().includes('avental de raspa')
    );
    
    if (!avental) {
      console.log('❌ Avental de Raspa de Couro CA 32890 não encontrado especificamente');
      console.log('📋 Itens encontrados:');
      items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.tipoEPI?.nomeEquipamento || item.tipoEpi?.nomeEquipamento || 'N/A'}`);
        console.log(`      CA: ${item.tipoEPI?.numeroCA || item.tipoEpi?.numeroCa || 'N/A'}`);
        console.log(`      Estoque: ${item.quantidade}`);
      });
      return;
    }
    
    console.log(`✅ Avental encontrado: ${avental.tipoEPI?.nomeEquipamento || avental.tipoEpi?.nomeEquipamento}`);
    console.log(`   📋 ID do Item: ${avental.id}`);
    console.log(`   🏢 Almoxarifado ID: ${almoxarifadoId}`);
    console.log(`   📦 Tipo EPI ID: ${tipoEpiId}`);
    console.log(`   🏷️ CA: ${avental.tipoEPI?.numeroCA || avental.tipoEpi?.numeroCa}`);
    console.log(`   📊 Estoque Atual: ${avental.quantidade}`);
    
    // 3. Buscar kardex do avental
    console.log('\n📊 2. Buscando kardex (histórico)...');
    
    const almoxarifadoId = avental.almoxarifadoId || avental.almoxarifado?.id;
    const tipoEpiId = avental.tipoEPIId || avental.tipoEpiId || avental.tipoEPI?.id || avental.tipoEpi?.id;
    
    if (!almoxarifadoId || !tipoEpiId) {
      console.log('❌ IDs necessários não encontrados:');
      console.log(`   almoxarifadoId: ${almoxarifadoId}`);
      console.log(`   tipoEpiId: ${tipoEpiId}`);
      console.log('   Estrutura do item:', JSON.stringify(avental, null, 2));
      return;
    }
    
    const kardexUrl = `${API_BASE}/estoque/kardex/${almoxarifadoId}/${tipoEpiId}`;
    console.log(`   URL: ${kardexUrl}`);
    
    const kardexResponse = await makeRequest(kardexUrl);
    console.log('   Resposta do kardex:', JSON.stringify(kardexResponse, null, 2));
    
    const saldoFinal = kardexResponse?.saldoFinal ?? kardexResponse?.data?.saldoFinal;
    
    if (saldoFinal === undefined) {
      console.log('❌ Saldo final não encontrado na resposta do kardex');
      return;
    }
    
    console.log(`   ✅ Saldo Final Kardex: ${saldoFinal}`);
    
    // 4. Comparar e detectar inconsistência
    console.log('\n🚨 3. ANÁLISE DE INCONSISTÊNCIA:');
    console.log('============================');
    
    const estoqueAtual = avental.quantidade;
    const saldoKardex = saldoFinal;
    const diferenca = estoqueAtual - saldoKardex;
    
    console.log(`📦 Estoque Atual: ${estoqueAtual}`);
    console.log(`📊 Saldo Kardex: ${saldoKardex}`);
    console.log(`🔍 Diferença: ${diferenca}`);
    
    if (diferenca === 0) {
      console.log('✅ SISTEMA CONSISTENTE - Não há inconsistência!');
    } else {
      console.log('🚨 INCONSISTÊNCIA DETECTADA!');
      console.log(`   Tipo: ${diferenca > 0 ? 'Read Model Maior' : 'Event Log Maior'}`);
      console.log(`   Severidade: ${Math.abs(diferenca) >= estoqueAtual ? 'CRÍTICA' : 'Alta'}`);
      console.log('   Causa provável: Seed script inseriu dados sem gerar eventos');
      
      console.log('\n💡 SOLUÇÃO RECOMENDADA:');
      console.log(`   Corrigir estoque de ${estoqueAtual} para ${saldoKardex} unidades`);
      console.log(`   Endpoint: POST ${API_BASE}/estoque/ajuste-direto`);
      console.log('   Payload:');
      console.log(JSON.stringify({
        almoxarifadoId: almoxarifadoId,
        tipoEpiId: tipoEpiId,
        novaQuantidade: saldoKardex,
        motivo: `Correção automática: estoque estava ${estoqueAtual}, kardex indica ${saldoKardex}. Causa: seed sem eventos.`,
        validarPermissao: true
      }, null, 2));
      
      console.log('\\n🔍 IDs PARA REFERÊNCIA:');
      console.log(`   📋 Item de Estoque ID: ${avental.id}`);
      console.log(`   🏢 Almoxarifado ID: ${almoxarifadoId}`);
      console.log(`   📦 Tipo EPI ID: ${tipoEpiId}`);
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.log('\n🔧 VERIFICAÇÕES:');
    console.log('1. Backend está rodando? https://epi-backend-s14g.onrender.com/health');
    console.log('2. Dados foram importados corretamente?');
    console.log('3. Proxy está configurado? (npm run dev)');
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAventalConsistency();
}

export { checkAventalConsistency };