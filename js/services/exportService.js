/**
 * @file exportService.js
 * @description Serviço para exportação de dados para CSV, agora refatorado e com notificações modernas.
 * @project Dashboard de Tarefas - SUNO
 */

import { showSuccess, showWarning, showError } from '../modernNotifications.js';

export function exportarParaCSV(dados, headers, formatarLinha, nomeArquivo = 'dados') {
  if (!dados || dados.length === 0) {
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
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    // ✅ CORREÇÃO: Usando window.moment
    link.setAttribute('download', `${nomeArquivo}_${window.moment().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // ✅ Usa o sistema de notificação moderno
    showSuccess("Exportação Concluída!", "Seu arquivo CSV foi gerado com sucesso.");

  } catch (error) {
    console.error("Erro ao gerar CSV:", error);
    // ✅ Usa o sistema de notificação moderno
    showError("Erro na Exportação", "Ocorreu um erro inesperado ao tentar gerar o arquivo.");
  }
}

function createCsvFormatter(headers, formatarLinha) {
    return { headers, formatarLinha };
}

export function formatarTarefasParaCSV() {
  const headers = [
    "Cliente", "Projeto", "Tarefa", "Tipo", "Data Início", "Data Fim", 
    "Responsável", "Equipe", "Subgrupo", "Prioridade", "Status"
  ];

  const formatarLinha = (item) => {
    const partesPath = item.TaskOwnerFullPath ? item.TaskOwnerFullPath.split(' / ') : [];
    const subgrupo = item.TaskOwnerSubGroup 
        ? item.TaskOwnerSubGroup 
        : (partesPath.length > 0 && partesPath[0] !== item.TaskOwnerGroup ? item.TaskOwnerFullPath : "N/A");

    return [
      item.client || "N/A",
      item.project || "N/A",
      item.name || "Sem título",
      item.tipo || "Tarefa",
      // ✅ CORREÇÃO: Usando window.moment
      item.start ? window.moment(item.start).format("DD/MM/YYYY") : "N/A",
      item.end ? window.moment(item.end).format("DD/MM/YYYY") : "N/A",
      item.responsible || "N/A",
      item.TaskOwnerGroup || "N/A",
      subgrupo,
      item.Priority || "N/A",
      item.PipelineStepTitle || "N/A",
    ];
  };

  return createCsvFormatter(headers, formatarLinha);
}

export function formatarProjetosParaCSV() {
  const headers = [
    "Cliente", "Projeto", "Data Início", "Data Fim", "Responsáveis", 
    "Equipes", "Status", "Progresso", "Prioridade", "Qtd. Tarefas"
  ];

  const formatarLinha = (item) => [
    item.client || "N/A",
    item.name || "Sem título",
    // ✅ CORREÇÃO: Usando window.moment
    item.start ? window.moment(item.start).format("DD/MM/YYYY") : "N/A",
    item.end ? window.moment(item.end).format("DD/MM/YYYY") : "N/A",
    item.responsibles ? [...item.responsibles].join(", ") : "N/A",
    item.groups ? [...item.groups].join(", ") : "N/A",
    item.status || "N/A",
    item.progress || 0,
    item.priority || "N/A",
    item.tasks ? item.tasks.length : 0,
  ];
  
  return createCsvFormatter(headers, formatarLinha);
}