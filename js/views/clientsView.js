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
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${nomeArquivo}_${window.moment().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Exportação Concluída", "Seu arquivo CSV foi gerado com sucesso!");
  } catch (error) {
    console.error("Erro ao gerar CSV:", error);
    showError("Erro na Exportação", `Ocorreu um erro inesperado: ${error.message}`);
  }
}

function createCsvFormatter(headers, formatarLinha) {
    return { headers, formatarLinha };
}

export function formatarTarefasParaCSV() {
  const headers = ["Cliente", "Projeto", "Tarefa", "Tipo", "Data Início", "Data Fim", "Responsável", "Grupo", "Prioridade", "Status"];
  const formatarLinha = (item) => [
      item.client || "N/A",
      item.project || "N/A",
      item.content || "Sem título",
      item.tipo || "Tarefa",
      item.start ? window.moment(item.start).format("DD/MM/YYYY") : "N/A",
      item.end ? window.moment(item.end).format("DD/MM/YYYY") : "N/A",
      item.responsible || "N/A",
      item.group || "N/A",
      item.priority || "N/A",
      item.status || "N/A",
    ];
  return createCsvFormatter(headers, formatarLinha);
}

export function formatarProjetosParaCSV() {
  const headers = ["Cliente", "Projeto", "Data Início", "Data Fim", "Equipes", "Status", "Prioridade", "Qtd. Tarefas"];
  const formatarLinha = (item) => [
    item.client || "N/A",
    item.name || "Sem título",
    item.start ? window.moment(item.start).format("DD/MM/YYYY") : "N/A",
    item.end ? window.moment(item.end).format("DD/MM/YYYY") : "N/A",
    item.groups ? [...item.groups].join(", ") : "N/A",
    item.status || "N/A",
    item.priority || "N/A",
    item.tasks ? item.tasks.length : 0,
  ];
  return createCsvFormatter(headers, formatarLinha);
}