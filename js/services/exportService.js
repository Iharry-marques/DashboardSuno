/**
 * @file exportService.js
 * @description Serviço para exportação de dados para CSV
 * @project Dashboard de Tarefas - SUNO
 */

// Importar a função de notificação do componente de UI
import { mostrarNotificacao } from '../components/uiComponents.js';

/**
 * Exporta dados para CSV
 * @param {Array} dados - Dados a serem exportados
 * @param {Array} headers - Cabeçalhos do CSV
 * @param {Function} formatarLinha - Função para formatar cada linha
 * @param {string} nomeArquivo - Nome do arquivo a ser gerado
 */
export function exportarParaCSV(dados, headers, formatarLinha, nomeArquivo = 'dados') {
  if (!dados || dados.length === 0) {
    mostrarNotificacao("Exportação", "Não há dados para exportar.", "warning");
    return;
  }

  const linhas = dados.map(formatarLinha);

  const csvContent = [
    headers.join(","),
    ...linhas.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  // Garantir que moment() esteja disponível globalmente ou importado se necessário
  // Assumindo que moment está globalmente disponível conforme outros arquivos
  link.setAttribute("download", `${nomeArquivo}_${moment().format("YYYY-MM-DD")}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  mostrarNotificacao(
    "Exportação",
    "Arquivo CSV gerado com sucesso!",
    "success"
  );
}

/**
 * Formata dados de tarefas para exportação CSV
 * @param {Array} dados - Dados de tarefas
 * @returns {{headers: Array<string>, formatarLinha: Function}} - Objeto com cabeçalhos e função de formatação
 */
export function formatarTarefasParaCSV(dados) {
  const headers = [
    "Cliente",
    "Projeto",
    "Tarefa",
    "Tipo",
    "Data Início",
    "Data Fim",
    "Responsável",
    "Grupo",
    "Subgrupo",
    "Prioridade",
    "Status",
  ];

  const formatarLinha = (item) => {
    // Extrair subgrupo do caminho completo
    let subgrupo = "";
    if (item.TaskOwnerFullPath) {
      const partes = item.TaskOwnerFullPath.split("/").map((p) => p.trim());
      if (partes.length > 1) {
        // Verifica se a primeira parte é o grupo principal para evitar incluí-la no subgrupo
        if (partes[0] === item.TaskOwnerGroup) {
            subgrupo = partes.slice(1).join(" / ");
        } else {
            // Se não começar com o grupo principal (casos especiais como Bruno Prosperi), considera todo o path como subgrupo?
            // Ajustar conforme a lógica de negócio exata. Por ora, mantém a lógica anterior.
            subgrupo = partes.slice(1).join(" / "); // Pode precisar de ajuste
        }
      }
    }

    return [
      item.client || "N/A",
      item.project || "N/A",
      item.name || "Sem título",
      item.tipo || "Tarefa",
      item.start ? moment(item.start).format("DD/MM/YYYY") : "N/A",
      item.end ? moment(item.end).format("DD/MM/YYYY") : "N/A",
      item.responsible || "N/A",
      item.TaskOwnerGroup || "N/A",
      subgrupo || "N/A", // Usar o subgrupo extraído
      item.Priority || "N/A",
      item.PipelineStepTitle || "N/A",
    ];
  };

  return {
    headers,
    formatarLinha,
  };
}

/**
 * Formata dados de projetos para exportação CSV
 * @param {Array} dados - Dados de projetos
 * @returns {{headers: Array<string>, formatarLinha: Function}} - Objeto com cabeçalhos e função de formatação
 */
export function formatarProjetosParaCSV(dados) {
  const headers = [
    "Cliente",
    "Projeto",
    "Data Início",
    "Data Fim",
    "Responsáveis",
    "Equipes",
    "Status",
    "Progresso",
    "Prioridade",
    "Qtd. Tarefas",
  ];

  const formatarLinha = (item) => {
    return [
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
  };

  return {
    headers,
    formatarLinha,
  };
}

// A função duplicada mostrarNotificacao foi removida daqui.
// Ela agora é importada de ../components/uiComponents.js

