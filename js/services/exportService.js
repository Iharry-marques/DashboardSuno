/**
 * @file exportService.js
 * @description Serviço para exportação de dados para CSV, agora refatorado e com notificações modernas.
 * @project Dashboard de Tarefas - SUNO
 */

// Importa o sistema de notificação moderno
import { showSuccess, showWarning } from './modernNotifications.js';

/**
 * Exporta dados para um arquivo CSV.
 * @param {Array} dados - Os dados a serem exportados.
 * @param {Array} headers - Os cabeçalhos do CSV.
 * @param {Function} formatarLinha - Função que formata um item de dado em um array de strings.
 * @param {string} nomeArquivo - O nome base para o arquivo CSV.
 */
export function exportarParaCSV(dados, headers, formatarLinha, nomeArquivo = 'dados') {
  if (!dados || dados.length === 0) {
    // ✅ Usa o sistema de notificação moderno
    showWarning("Nenhum dado para exportar", "Ajuste os filtros para gerar o arquivo.");
    return;
  }

  try {
    const linhas = dados.map(formatarLinha);

    const csvContent = [
      headers.join(','),
      ...linhas.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${nomeArquivo}_${moment().format('YYYY-MM-DD')}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // ✅ Usa o sistema de notificação moderno
    showSuccess("Exportação Concluída", "Seu arquivo CSV foi gerado com sucesso!");

  } catch (error) {
    console.error("Erro ao gerar CSV:", error);
    showError("Erro na Exportação", `Ocorreu um erro inesperado: ${error.message}`);
  }
}

/**
 * Cria uma configuração de formatação para o CSV.
 * @param {Array<string>} headers - Os cabeçalhos das colunas.
 * @param {Function} formatarLinha - A função que mapeia um item para uma linha.
 * @returns {{headers: Array<string>, formatarLinha: Function}}
 */
function createCsvFormatter(headers, formatarLinha) {
    return { headers, formatarLinha };
}

/**
 * Retorna a configuração para formatar TAREFAS para CSV.
 * @returns {{headers: Array<string>, formatarLinha: Function}}
 */
export function formatarTarefasParaCSV() {
  const headers = [
    "Cliente", "Projeto", "Tarefa", "Tipo", "Data Início", "Data Fim",
    "Responsável", "Grupo", "Subgrupo", "Prioridade", "Status"
  ];

  const formatarLinha = (item) => {
    const partesPath = item.TaskOwnerFullPath ? item.TaskOwnerFullPath.split('/').map(p => p.trim()) : [];
    const subgrupo = partesPath.length > 1 && partesPath[0] === item.TaskOwnerGroup 
        ? partesPath.slice(1).join(' / ') 
        : (partesPath.length > 0 && partesPath[0] !== item.TaskOwnerGroup ? item.TaskOwnerFullPath : "N/A");

    return [
      item.client || "N/A",
      item.project || "N/A",
      item.name || "Sem título",
      item.tipo || "Tarefa",
      item.start ? moment(item.start).format("DD/MM/YYYY") : "N/A",
      item.end ? moment(item.end).format("DD/MM/YYYY") : "N/A",
      item.responsible || "N/A",
      item.TaskOwnerGroup || "N/A",
      subgrupo,
      item.Priority || "N/A",
      item.PipelineStepTitle || "N/A",
    ];
  };

  return createCsvFormatter(headers, formatarLinha);
}

/**
 * Retorna a configuração para formatar PROJETOS para CSV.
 * @returns {{headers: Array<string>, formatarLinha: Function}}
 */
export function formatarProjetosParaCSV() {
  const headers = [
    "Cliente", "Projeto", "Data Início", "Data Fim", "Responsáveis", 
    "Equipes", "Status", "Progresso", "Prioridade", "Qtd. Tarefas"
  ];

  const formatarLinha = (item) => [
    item.client || "N/A",
    item.name || "Sem título",
    item.start ? moment(item.start).format("DD/MM/YYYY") : "N/A",
    item.end ? moment(item.end).format("DD/MM/YYYY") : "N/A",
    item.responsibles ? item.responsibles.join(", ") : "N/A",
    item.groups ? item.groups.join(", ") : "N/A",
    item.status || "N/A",
    `${item.progress || 0}%`,
    item.priority || "N/A",
    item.tasks ? item.tasks.length : 0,
  ];

  return createCsvFormatter(headers, formatarLinha);
}