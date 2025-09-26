// Limpa todo o histórico de sorteios (tarefas e almoço)
function limparHistoricoTarefas() {
  if (confirm("Tem certeza que deseja limpar todo o histórico de sorteios?")) {
    historico = [];
    salvarDados();
    atualizarHistorico();
  }
}
function toggleLista(listaId, btnId) {
  const ul = document.getElementById(listaId);
  const btn = document.getElementById(btnId);
  if (!ul || !btn) return;
  if (ul.style.display === "none") {
    ul.style.display = "";
    btn.textContent = "Minimizar";
  } else {
    ul.style.display = "none";
    btn.textContent = "Maximizar";
  }
}
// --- CONFIGURAÇÕES GLOBAIS ---

// Nomes das tarefas especiais (sensível a maiúsculas/minúsculas)
const TAREFA_ALMOCO = "Fazer Almoço";

// Grupos para tarefas específicas
const GRUPO_QUARTO_GRANDE = ["Cleverson", "Vicente", "Marcelo", "André", "Artur"];
const GRUPO_QUARTO_PEQUENO = ["Rafael", "Anderson", "Henrique", "Junior"];

// "Missionários" que devem ser alocados em tarefas distintas.
const MISSIONARIOS = ["Leia", "Laura", "Marcio", "Alaor", "Talita", "Ueslei", "Fernanda", "Felipe", "Karina"];

// --- DADOS PADRÃO ---
const participantesPadrao = [
  "Cleverson","Laura","Leia", "Ueslei", "Alaor", "Marcio", "Karina", "Talita", "Artur", "Vicente", "André", "Marcelo", "Rafael", "Anderson", "Henrique", "Fernanda", "Felipe","Junior"
];

const tarefasPadrao = [
  { nome: "Limpar Sala", qtd: 3 },
  { nome: "Limpar cozinha", qtd: 3 },
  { nome: "Limpeza Quarto Grande", qtd: 1 },
  { nome: "Limpeza Quarto Pequeno", qtd: 1 },
  { nome: "Limpar quintal", qtd: 2 },
  { nome: "Piso superior", qtd: 2 },
  { nome: "Dispensa de cima ", qtd: 2 },
  { nome: "Dispensa de baixo", qtd: 2 },
  { nome: "Fazer Almoço", qtd: 1 }
];

// --- ESTADO DA APLICAÇÃO (CARREGADO DO LOCALSTORAGE) ---

let participantes = JSON.parse(localStorage.getItem("participantes")) || [...participantesPadrao];
let tarefas = JSON.parse(localStorage.getItem("tarefas")) || [...tarefasPadrao];
let historico = JSON.parse(localStorage.getItem("historicoSorteios")) || [];

function salvarDados() {
  localStorage.setItem("participantes", JSON.stringify(participantes));
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
  localStorage.setItem("historicoSorteios", JSON.stringify(historico));
}

// --- FUNÇÕES DE MANIPULAÇÃO DE PARTICIPANTES E TAREFAS ---

function adicionarParticipante() {
  const nome = document.getElementById("novoParticipante").value.trim();
  if (nome && !participantes.includes(nome)) {
    participantes.push(nome);
    salvarDados();
    atualizarListaParticipantes();
  }
  document.getElementById("novoParticipante").value = "";
}

function removerParticipante(index) {
  participantes.splice(index, 1);
  salvarDados();
  atualizarListaParticipantes();
}

function atualizarListaParticipantes() {
  const ul = document.getElementById("listaParticipantes");
  ul.innerHTML = "";
  participantes.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${p} <button onclick="removerParticipante(${i})">Remover</button>`;
    ul.appendChild(li);
  });
  atualizarResponsavelAlmoco();
}

function atualizarResponsavelAlmoco() {
  const select = document.getElementById("responsavelAlmoco");
  if (!select) return;
  const valorAtual = select.value;
  select.innerHTML = '<option value="">(Ninguém)</option>';
  participantes.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  });
  // Mantém seleção se possível
  if ([...select.options].some(o => o.value === valorAtual)) {
    select.value = valorAtual;
  }
}

function adicionarTarefa() {
  const nome = document.getElementById("novaTarefa").value.trim();
  const qtd = parseInt(document.getElementById("qtdPessoas").value);
  if (nome && qtd > 0) {
    tarefas.push({ nome, qtd });
    salvarDados();
    atualizarListaTarefas();
  }
  document.getElementById("novaTarefa").value = "";
  document.getElementById("qtdPessoas").value = "";
}

function removerTarefa(index) {
  tarefas.splice(index, 1);
  salvarDados();
  atualizarListaTarefas();
}

function atualizarListaTarefas() {
  const ul = document.getElementById("listaTarefas");
  ul.innerHTML = "";
  tarefas.forEach((t, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${t.nome} (${t.qtd}) <button onclick="removerTarefa(${i})">Remover</button>`;
    ul.appendChild(li);
  });
}

/**
 * Normaliza uma string, removendo acentos e convertendo para minúsculas.
 * @param {string} str A string para normalizar.
 * @returns {string} A string normalizada.
 */
function normalizarString(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
// --- LÓGICA PRINCIPAL DO SORTEIO ---

/**
 * Sorteia uma pessoa de um grupo específico para uma tarefa, usando um sistema de rodízio.
 * @param {string[]} grupo - O grupo de pessoas elegíveis.
 * @param {string} nomeTarefa - O nome da tarefa para verificar no histórico.
 * @returns {string} A pessoa sorteada.
 */
function sortearPessoaParaTarefaComRodizio(grupo, nomeTarefa) {
  const contagemTarefas = {};
  grupo.forEach(p => contagemTarefas[p] = 0);
  historico.forEach(sorteio => {
    if (sorteio.tarefas[nomeTarefa]) {
      sorteio.tarefas[nomeTarefa].forEach(pessoa => {
        if (pessoa in contagemTarefas) {
          contagemTarefas[pessoa]++;
        }
      });
    }
  });

  const minVezes = Math.min(...Object.values(contagemTarefas));
  const candidatos = grupo.filter(p => contagemTarefas[p] === minVezes);

  return candidatos[Math.floor(Math.random() * candidatos.length)];
}

/**
 * Obtém a lista de participantes disponíveis para o sorteio geral.
 * @param {string[]} pessoasJaAlocadas - Pessoas que já foram sorteadas para tarefas especiais.
 * @returns {{disponiveis: string[], responsavelAlmoco: string}}
 */
function obterParticipantesDisponiveis(pessoasJaAlocadas) {
  let disponiveis = [...participantes];
  
  let responsavelAlmoco = document.getElementById("responsavelAlmoco").value || "";
  // Apenas os missionários e o responsável pelo almoço são tratados separadamente.
  return { disponiveis, responsavelAlmoco };
}

/**
 * Distribui as tarefas normais entre os participantes disponíveis.
 * @param {string[]} disponiveis - Lista de pessoas disponíveis.
 * @param {object[]} tarefasNormais - Lista de tarefas a serem distribuídas.
 * @returns {object} - Mapeamento de tarefa para a lista de pessoas.
 */
function distribuirTarefasNormais(disponiveis, tarefasNormais) {
  const resultadoFinal = {};
  tarefasNormais.forEach(t => resultadoFinal[t.nome] = []);

  const disponiveisParaSorteio = [...disponiveis];

  // 1. Separar missionários dos outros participantes
  const missionariosNormalizados = MISSIONARIOS.map(normalizarString);
  const missionariosDisponiveis = disponiveisParaSorteio.filter(p => missionariosNormalizados.includes(normalizarString(p)));
  let outrosDisponiveis = disponiveisParaSorteio.filter(p => !missionariosNormalizados.includes(normalizarString(p)));

  // 2. Criar lista de vagas e histórico de tarefas por pessoa
  let vagas = [];
  tarefasNormais.forEach(tarefa => {
    for (let i = 0; i < tarefa.qtd; i++) {
      vagas.push(tarefa.nome);
    }
  });
  if (disponiveisParaSorteio.length < vagas.length) {
    alert("Alerta: Há mais vagas de tarefas do que pessoas disponíveis.");
  }

  const historicoTarefasPessoa = {};
  disponiveisParaSorteio.forEach(p => historicoTarefasPessoa[p] = []);
  historico.forEach(sorteio => {
    Object.entries(sorteio.tarefas).forEach(([tarefa, pessoas]) => {
      pessoas.forEach(pessoa => {
        if (historicoTarefasPessoa[pessoa] && !historicoTarefasPessoa[pessoa].includes(tarefa)) {
          historicoTarefasPessoa[pessoa].push(tarefa);
        }
      });
    });
  });

  // 3. Alocar missionários em tarefas distintas, evitando repetição
  const tarefasUnicas = [...new Set(vagas)];
  let missionariosEmbaralhados = [...missionariosDisponiveis].sort(() => Math.random() - 0.5);
  const tarefasAlocadasParaMissionarios = [];
  const missionariosAtribuidos = [];

  for (const missionario of missionariosEmbaralhados) {
    // Ordena tarefas: as que ele nunca fez primeiro, depois as que fez há mais tempo
    const tarefasOrdenadas = tarefasUnicas.sort((a, b) => {
      const fezA = historicoTarefasPessoa[missionario].includes(a);
      const fezB = historicoTarefasPessoa[missionario].includes(b);
      if (fezA === fezB) return 0;
      return fezA ? 1 : -1;
    });

    for (const tarefa of tarefasOrdenadas) {
      // Garante que a tarefa ainda não foi pega por outro missionário
      if (tarefasAlocadasParaMissionarios.includes(tarefa)) continue;

      const indexVaga = vagas.indexOf(tarefa);
      if (indexVaga !== -1) {
        resultadoFinal[tarefa].push(missionario);
        tarefasAlocadasParaMissionarios.push(tarefa); // Marca a tarefa como ocupada por um missionário
        missionariosAtribuidos.push(missionario);
        vagas.splice(indexVaga, 1); // Remove apenas UMA vaga preenchida
        break; // Próximo missionário
      }
    }
  }

  // 3.1. Alocar missionários restantes em tarefas de fallback (cozinha, sala)
  const missionariosNaoAtribuidos = missionariosDisponiveis.filter(m => !missionariosAtribuidos.includes(m));
  if (missionariosNaoAtribuidos.length > 0) {
    const tarefasFallback = ["Limpar cozinha", "Limpar Sala"];
    for (const missionario of missionariosNaoAtribuidos) {
      let alocado = false;
      for (const tarefaFallback of tarefasFallback) {
        const indexVaga = vagas.indexOf(tarefaFallback);
        if (indexVaga !== -1) {
          resultadoFinal[tarefaFallback].push(missionario);
          vagas.splice(indexVaga, 1); // Ocupa a vaga
          alocado = true;
          break; // Missionário alocado, vai para o próximo
        }
      }
    }
  }


  // 4. Alocar as pessoas restantes nas vagas que sobraram
  outrosDisponiveis = outrosDisponiveis.sort(() => Math.random() - 0.5);
  vagas = vagas.sort(() => Math.random() - 0.5);

  while (vagas.length > 0 && outrosDisponiveis.length > 0) {
    const vaga = vagas.shift();
    // Tenta encontrar alguém que não fez a tarefa
    let pessoaIndex = outrosDisponiveis.findIndex(p => !historicoTarefasPessoa[p].includes(vaga));
    
    // Se todos já fizeram, pega o primeiro da lista embaralhada
    if (pessoaIndex === -1) {
      pessoaIndex = 0;
    }
    
    const pessoa = outrosDisponiveis.splice(pessoaIndex, 1)[0];
    resultadoFinal[vaga].push(pessoa);
  }

  return resultadoFinal;
}

function sortear() {
  const resultadoSorteio = {};
  const pessoasAlocadas = [];

  // 1. Sorteio especial dos quartos com rodízio
  const tarefaQuartoGrande = tarefas.find(t => t.nome.toLowerCase() === "limpeza quarto grande");
  if (tarefaQuartoGrande) {
    const sorteado = sortearPessoaParaTarefaComRodizio(GRUPO_QUARTO_GRANDE, tarefaQuartoGrande.nome);
    resultadoSorteio[tarefaQuartoGrande.nome] = [sorteado];
    pessoasAlocadas.push(sorteado);
  }

  const tarefaQuartoPequeno = tarefas.find(t => t.nome.toLowerCase() === "limpeza quarto pequeno");
  if (tarefaQuartoPequeno) {
    const sorteado = sortearPessoaParaTarefaComRodizio(GRUPO_QUARTO_PEQUENO, tarefaQuartoPequeno.nome);
    resultadoSorteio[tarefaQuartoPequeno.nome] = [sorteado];
    pessoasAlocadas.push(sorteado);
  }

  // 2. Obter disponíveis. Pessoas dos quartos CONTINUAM disponíveis.
  const { disponiveis, responsavelAlmoco } = obterParticipantesDisponiveis(pessoasAlocadas);

  // 3. Filtrar tarefas normais (que não são especiais)
  const tarefasNormais = tarefas.filter(t =>
    t.nome !== TAREFA_ALMOCO &&
    t.nome.toLowerCase() !== "limpeza quarto grande" &&
    t.nome.toLowerCase() !== "limpeza quarto pequeno"
  );

  // 4. Preparar lista de pessoas para o sorteio geral
  // A função distribuirTarefasNormais já separa os missionários internamente.
  const disponiveisSorteio = disponiveis.filter(p => p !== responsavelAlmoco);

  // 5. Distribuir tarefas normais
  const resultadoTarefasNormais = distribuirTarefasNormais(disponiveisSorteio, tarefasNormais);
  if (!resultadoTarefasNormais) {
    return; // Para a execução se não houver pessoas suficientes
  }

  // 6. Unir todos os resultados e salvar
  Object.assign(resultadoSorteio, resultadoTarefasNormais);

  // 6.1 Adiciona o responsável do almoço ao resultado final, sobreescrevendo se necessário
  const tarefaAlmoco = tarefas.find(t => t.nome === TAREFA_ALMOCO);
  if (tarefaAlmoco) {
    resultadoSorteio[TAREFA_ALMOCO] = responsavelAlmoco ? [responsavelAlmoco] : [];
  }

  const dataHoje = new Date().toLocaleDateString("pt-BR");
  historico.push({ data: dataHoje, tarefas: resultadoSorteio });
  salvarDados();

  // 7. Exibir resultados e atualizar a UI
  mostrarResultado(resultadoSorteio, dataHoje);
  atualizarHistorico();
}

function mostrarResultado(resultado, data) {
  const div = document.getElementById("resultadoSorteio");
  div.innerHTML = `<h3>Resultado do Sorteio (${data})</h3>`;
  // Ordena as tarefas para exibição consistente
  const tarefasOrdenadas = Object.keys(resultado).sort();

  for (const tarefa of tarefasOrdenadas) {
    const pessoas = resultado[tarefa];
    if (pessoas && pessoas.length > 0) {
      const p = document.createElement("p");
      p.innerHTML = `<strong>${tarefa}:</strong> ${pessoas.join(", ")}`;
      div.appendChild(p);
    }
  }
}

function removerDataHistorico(indice) {
  // O histórico é exibido em ordem reversa, então precisamos converter o índice
  const realIndex = historico.length - 1 - indice;
  if (realIndex >= 0) {
    if (confirm('Remover este sorteio do histórico?')) {
      historico.splice(realIndex, 1);
      salvarDados();
      atualizarHistorico();
    }
  }
}

function atualizarHistorico() {
  const ul = document.getElementById("historicoSorteios");
  ul.innerHTML = "";
  historico.slice().reverse().forEach((sorteio, i) => {
    const li = document.createElement("li");
    let html = `<strong>${sorteio.data}</strong> <button onclick="removerDataHistorico(${i})" style="background:#eb3b5a;color:#fff;border:none;border-radius:4px;padding:2px 8px;font-size:0.9em;cursor:pointer;">Remover data</button><br>`;
    
    const tarefasOrdenadas = Object.keys(sorteio.tarefas).sort();
    const tarefasHtml = tarefasOrdenadas
      .filter(t => sorteio.tarefas[t] && sorteio.tarefas[t].length > 0)
      .map(t => `${t}: ${sorteio.tarefas[t].join(", ")}`)
      .join("<br>");

    li.innerHTML += tarefasHtml;
    ul.appendChild(li);
  });
}

function resetarSistema() {
  if (confirm("Tem certeza que deseja resetar os participantes e tarefas para o padrão? O histórico será mantido.")) {
    participantes = [...participantesPadrao];
    tarefas = [...tarefasPadrao];
    salvarDados();
    atualizarListaParticipantes();
    atualizarListaTarefas();
    document.getElementById("resultadoSorteio").innerHTML = "";
  }
}

// Inicialização
atualizarListaParticipantes();
atualizarListaTarefas();
atualizarHistorico();
atualizarResponsavelAlmoco();