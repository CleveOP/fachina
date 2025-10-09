document.addEventListener("DOMContentLoaded", () => {
  const tarefas = [
    "Banheiro",
    "Cozinha",
    "Varanda",
    "Quarto 1",
    "Quarto 2",
    "Louça",
    "Varrer Casa",
    "Lixo",
  ];

  let pessoas = [];
  let historico = JSON.parse(localStorage.getItem("historicoTarefas")) || [];
  let ultimaPessoaSorteada = null;

  // ========== Funções auxiliares ==========
  const salvarHistorico = () => {
    localStorage.setItem("historicoTarefas", JSON.stringify(historico));
  };

  const atualizarSelectPessoas = () => {
    const selects = document.querySelectorAll(
      "#responsavelAlmoco, #missionario1, #missionario2"
    );
    selects.forEach((select) => {
      const valorSelecionado = select.value;
      select.innerHTML = "<option value=''>-- Selecione --</option>";
      pessoas.forEach((pessoa) => {
        const option = document.createElement("option");
        option.value = pessoa;
        option.textContent = pessoa;
        if (pessoa === valorSelecionado) option.selected = true;
        select.appendChild(option);
      });
    });
  };

  const atualizarListaPessoas = () => {
    const lista = document.getElementById("listaPessoas");
    lista.innerHTML = "";
    pessoas.forEach((pessoa, index) => {
      const li = document.createElement("li");
      li.textContent = pessoa;
      const btn = document.createElement("button");
      btn.textContent = "❌";
      btn.onclick = () => {
        pessoas.splice(index, 1);
        atualizarListaPessoas();
        atualizarSelectPessoas();
      };
      li.appendChild(btn);
      lista.appendChild(li);
    });
  };

  const adicionarPessoa = () => {
    const nome = document.getElementById("nomePessoa").value.trim();
    if (nome && !pessoas.includes(nome)) {
      pessoas.push(nome);
      atualizarListaPessoas();
      atualizarSelectPessoas();
      document.getElementById("nomePessoa").value = "";
    }
  };

  const calcularDistribuicao = () => {
    const contagem = {};
    historico.forEach((registro) => {
      Object.values(registro.resultado).forEach((pessoa) => {
        contagem[pessoa] = (contagem[pessoa] || 0) + 1;
      });
    });
    return contagem;
  };

  const obterParticipantesDisponiveis = (pessoasAlocadas = []) => {
    const distribuicao = calcularDistribuicao();
    const disponiveis = pessoas.filter((p) => !pessoasAlocadas.includes(p));

    if (disponiveis.length === 0) return { disponiveis: [], distribuicao };

    const menorQtd = Math.min(...disponiveis.map((p) => distribuicao[p] || 0));
    const maisDisponiveis = disponiveis.filter(
      (p) => (distribuicao[p] || 0) === menorQtd
    );

    return { disponiveis: maisDisponiveis, distribuicao };
  };

  const obterParticipantesParaMissao = (missionariosAlocados = []) => {
    const { disponiveis } = obterParticipantesDisponiveis(missionariosAlocados);
    return disponiveis;
  };

  const atualizarHistorico = () => {
    const tabela = document
      .getElementById("tabelaHistorico")
      .getElementsByTagName("tbody")[0];
    tabela.innerHTML = "";
    historico
      .slice(-10)
      .reverse()
      .forEach((registro) => {
        const linha = tabela.insertRow();
        const celulaData = linha.insertCell(0);
        const celulaResultado = linha.insertCell(1);

        celulaData.textContent = registro.data;
        celulaResultado.textContent = Object.entries(registro.resultado)
          .map(([tarefa, pessoa]) => `${tarefa}: ${pessoa}`)
          .join(", ");
      });
  };

  const exibirResultado = (resultado) => {
    const div = document.getElementById("resultadoSorteio");
    div.innerHTML = "";
    Object.entries(resultado).forEach(([tarefa, pessoa]) => {
      const p = document.createElement("p");
      p.textContent = `${tarefa}: ${pessoa}`;
      div.appendChild(p);
    });
  };

  // ========== Função principal ==========
  const sortear = () => {
    if (pessoas.length < 3) {
      alert("Adicione pelo menos 3 pessoas para sortear.");
      return;
    }

    const resultado = {};
    let pessoasAlocadas = [];

    // PASSO 0: Identificar e alocar o responsável pelo almoço PRIMEIRO.
    const responsavelAlmoco =
      document.getElementById("responsavelAlmoco").value || "";
    if (responsavelAlmoco) {
      pessoasAlocadas.push(responsavelAlmoco);
      resultado["Fazer Almoço"] = responsavelAlmoco;
    }

    // PASSO 1: Definir missionários (caso existam)
    const missionario1 = document.getElementById("missionario1").value || "";
    const missionario2 = document.getElementById("missionario2").value || "";
    const missionariosAlocados = [missionario1, missionario2].filter(Boolean);
    pessoasAlocadas.push(...missionariosAlocados);

    // PASSO 2: Sortear quartos para missionários, se definidos
    ["Quarto 1", "Quarto 2"].forEach((quarto, i) => {
      if (missionariosAlocados[i]) {
        resultado[quarto] = missionariosAlocados[i];
      }
    });

    // PASSO 3: Agora preparamos a lista final de pessoas já alocadas
    let pessoasAlocadasFinal = [...new Set(pessoasAlocadas)];

    // PASSO 4: Sortear o restante das tarefas
    tarefas.forEach((tarefa) => {
      if (["Quarto 1", "Quarto 2"].includes(tarefa)) return; // já sorteadas

      const { disponiveis } = obterParticipantesDisponiveis(pessoasAlocadasFinal);

      if (disponiveis.length === 0) return;

      let sorteado;
      do {
        sorteado = disponiveis[Math.floor(Math.random() * disponiveis.length)];
      } while (sorteado === ultimaPessoaSorteada && disponiveis.length > 1);

      ultimaPessoaSorteada = sorteado;
      resultado[tarefa] = sorteado;
      pessoasAlocadasFinal.push(sorteado);
    });

    // PASSO 5: Registrar histórico e exibir resultado
    historico.push({ data: new Date().toLocaleString(), resultado });
    if (historico.length > 50) historico.shift();

    salvarHistorico();
    exibirResultado(resultado);
    atualizarHistorico();
  };

  // ========== Ligações dos botões ==========
  document.getElementById("btnAdicionarPessoa").onclick = adicionarPessoa;
  document.getElementById("btnSortear").onclick = sortear;
  document.getElementById("btnLimparHistorico").onclick = () => {
    if (confirm("Tem certeza que deseja limpar o histórico?")) {
      historico = [];
      salvarHistorico();
      atualizarHistorico();
    }
  };

  atualizarListaPessoas();
  atualizarSelectPessoas();
  atualizarHistorico();
});
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
const MISSIONARIOS = ["Leia", "Laura", "Marcio", "Alaor", "Talita", "Ueslei", "Fernanda", "Felipe"];


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
let missionarioOffset = parseInt(localStorage.getItem("missionarioOffset")) || 0;

function salvarDados() {
  localStorage.setItem("participantes", JSON.stringify(participantes));
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
  localStorage.setItem("historicoSorteios", JSON.stringify(historico));
  localStorage.setItem("missionarioOffset", missionarioOffset);
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
  if (!grupo || grupo.length === 0) {
    return null; // Retorna nulo se o grupo for inválido ou vazio
  }

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
 * Distribui tarefas para os missionários usando um sistema de rodízio circular.
 * Agora aceita um segundo parâmetro opcional `nomeExcluido` — usado para garantir que
 * o responsável pelo almoço (ou outro nome) não seja alocado como missionário.
 * @param {object[]} tarefasParaRodizio - A lista de tarefas que os missionários irão revezar.
 * @param {string} [nomeExcluido] - Nome a ser excluído do rodízio (ex: responsável pelo almoço).
 * @returns {{resultado: object, pessoasAlocadas: string[], tarefasAlocadas: string[]}}
 */
function distribuirTarefasMissionariosComRodizio(tarefasParaRodizio, nomeExcluido = null) {
  const resultado = {};
  const pessoasAlocadas = [];
  const tarefasAlocadas = [];

  // Filtra missionários que estão na lista de participantes atual e que não sejam o nomeExcluido
  const missionariosDisponiveis = MISSIONARIOS.filter(m => participantes.includes(m) && m !== nomeExcluido);
  const numMissionarios = missionariosDisponiveis.length;
  const numTarefas = tarefasParaRodizio.length;

  if (numMissionarios === 0 || numTarefas === 0) {
    return { resultado, pessoasAlocadas, tarefasAlocadas };
  }

  // 1. Executa o rodízio circular, atribuindo um missionário para cada tarefa possível.
  const iteracoes = Math.min(numMissionarios, numTarefas);
  for (let i = 0; i < iteracoes; i++) {
    const missionario = missionariosDisponiveis[i];
    const tarefa = tarefasParaRodizio[(i + missionarioOffset) % numTarefas].nome;

    // Garante que a tarefa existe na lista principal de tarefas
    if (tarefas.some(t => t.nome === tarefa)) {
      resultado[tarefa] = [missionario]; // Garante apenas um por tarefa do rodízio
      pessoasAlocadas.push(missionario);
      tarefasAlocadas.push(tarefa);
    }
  }

  return { resultado, pessoasAlocadas, tarefasAlocadas };
}
/**
 * Obtém a lista de participantes disponíveis para o sorteio geral.
 * @param {string[]} pessoasJaAlocadas - Pessoas que já foram sorteadas para tarefas especiais.
 * @returns {{disponiveis: string[], responsavelAlmoco: string}}
 */function obterParticipantesDisponiveis(pessoasJaAlocadas) {
  // Filtra os participantes, removendo quem já foi alocado em tarefas especiais.
  let disponiveis = participantes.filter(p => !pessoasJaAlocadas.includes(p));
  return { disponiveis };
}

/**
 * Distribui as tarefas normais entre os participantes disponíveis.
 * @param {string[]} disponiveis - Lista de pessoas disponíveis.
 * @param {object[]} tarefasNormais - Lista de tarefas a serem distribuídas.
 * @param {string[]} pessoasJaAlocadas - Lista de pessoas que não devem ser sorteadas novamente.
 * @param {object} resultadoParcial - O objeto de resultado do sorteio para ser completado.
 * @returns {object} - Mapeamento de tarefa para a lista de pessoas.
 */
function distribuirTarefasNormais(disponiveisParaSorteio, tarefas, resultadoParcial = {}) {
  // Começa com o resultado parcial (dos missionários) e o completa.
  const resultadoFinal = JSON.parse(JSON.stringify(resultadoParcial));

  // 2. Criar lista de vagas e histórico de tarefas por pessoa
  let vagas = [];
  tarefas.forEach(tarefa => {
    // Calcula quantas vagas ainda estão abertas para esta tarefa
    const vagasOcupadas = resultadoFinal[tarefa.nome] ? resultadoFinal[tarefa.nome].length : 0;
    const vagasAbertas = tarefa.qtd - vagasOcupadas;
    for (let i = 0; i < vagasAbertas; i++) {
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

  // 4. Alocar as pessoas restantes nas vagas que sobraram
  let pessoasParaAlocar = [...disponiveisParaSorteio].sort(() => Math.random() - 0.5);
  vagas = vagas.sort(() => Math.random() - 0.5);

  while (vagas.length > 0 && pessoasParaAlocar.length > 0) {
    const vaga = vagas.shift();
    // Tenta encontrar alguém que não fez a tarefa
    let pessoaIndex = pessoasParaAlocar.findIndex(p => !historicoTarefasPessoa[p].includes(vaga));
    
    // Se todos já fizeram, pega o primeiro da lista embaralhada
    if (pessoaIndex === -1) {
      pessoaIndex = 0;
    }
    
    const pessoa = pessoasParaAlocar.splice(pessoaIndex, 1)[0];
    if (!resultadoFinal[vaga]) {
      resultadoFinal[vaga] = [];
    }
    resultadoFinal[vaga].push(pessoa);
  }

  // 5. Alocar pessoas que sobraram em tarefas de fallback (cozinha, sala)
  if (pessoasParaAlocar.length > 0) {
    const tarefasFallback = ["Limpar cozinha", "Limpar Sala"];
    let fallbackIndex = 0;

    pessoasParaAlocar.forEach(pessoa => {
      const tarefaAlvo = tarefasFallback[fallbackIndex % tarefasFallback.length];
      if (resultadoFinal[tarefaAlvo]) {
        resultadoFinal[tarefaAlvo].push(pessoa);
      }
      fallbackIndex++;
    });
  }

  return resultadoFinal;
}

function sortear() {
  let resultadoSorteio = {};
  let pessoasAlocadas = [];

  // PASSO 0: Identificar e alocar o responsável pelo almoço PRIMEIRO.
  const responsavelAlmoco = document.getElementById("responsavelAlmoco").value || "";
  if (responsavelAlmoco) {
    pessoasAlocadas.push(responsavelAlmoco);
  }

  // 1. Sorteio especial dos quartos com rodízio
  const tarefaQuartoGrande = tarefas.find(t => t.nome.toLowerCase() === "limpeza quarto grande".toLowerCase());
  if (tarefaQuartoGrande) {
    const grupoValido = GRUPO_QUARTO_GRANDE.filter(p => participantes.includes(p));
    const sorteado = sortearPessoaParaTarefaComRodizio(grupoValido, tarefaQuartoGrande.nome);
    if (sorteado) {
      resultadoSorteio[tarefaQuartoGrande.nome] = [sorteado];
      pessoasAlocadas.push(sorteado); // Adiciona à lista de já alocados
    }
  }

  const tarefaQuartoPequeno = tarefas.find(t => t.nome.toLowerCase() === "limpeza quarto pequeno".toLowerCase());
  if (tarefaQuartoPequeno) {
    const grupoValido = GRUPO_QUARTO_PEQUENO.filter(p => participantes.includes(p));
    const sorteado = sortearPessoaParaTarefaComRodizio(grupoValido, tarefaQuartoPequeno.nome);
    if (sorteado) {
      resultadoSorteio[tarefaQuartoPequeno.nome] = [sorteado];
      pessoasAlocadas.push(sorteado); // Adiciona à lista de já alocados
    }
  }

  // 2. Rodízio dos Missionários em TODAS as tarefas gerais
  // Filtra as tarefas que não são especiais (quartos, almoço) para o rodízio
  const tarefasParaRodizioMissionarios = tarefas.filter(t =>
    t.nome !== TAREFA_ALMOCO && t.nome.toLowerCase() !== "limpeza quarto grande".toLowerCase() && t.nome.toLowerCase() !== "limpeza quarto pequeno".toLowerCase()
  );
  // <-- ALTERAÇÃO: passa responsavelAlmoco para garantir que essa pessoa não seja alocada como missionário
  const { resultado: resultadoMissionarios, pessoasAlocadas: missionariosAlocados } = distribuirTarefasMissionariosComRodizio(tarefasParaRodizioMissionarios, responsavelAlmoco);
  // Mescla os resultados dos missionários no resultado principal
  for (const tarefa in resultadoMissionarios) {
    if (!resultadoSorteio[tarefa]) resultadoSorteio[tarefa] = [];
    resultadoSorteio[tarefa].push(...resultadoMissionarios[tarefa]);
  }

  // 3. Obter disponíveis para o sorteio geral
  let pessoasAlocadasFinal = [...new Set([...pessoasAlocadas, ...missionariosAlocados])];

  // Garante que o responsável pelo almoço NÃO entre no sorteio das outras tarefas (proteção extra)
  if (responsavelAlmoco) {
    pessoasAlocadasFinal = [...new Set([...pessoasAlocadasFinal, responsavelAlmoco])];
  }

  let { disponiveis } = obterParticipantesDisponiveis(pessoasAlocadasFinal);

  // Remover explicitamente o responsável pelo almoço da lista de disponíveis (garantia)
  if (responsavelAlmoco) {
    disponiveis = disponiveis.filter(p => p !== responsavelAlmoco);
  }

  // 4. Filtrar tarefas restantes para o sorteio geral
  // Pega todas as tarefas, exceto o almoço, para serem processadas no sorteio geral.
  const tarefasParaSorteioGeral = tarefas.filter(t => t.nome !== TAREFA_ALMOCO);

  // 5. Distribuir tarefas normais para o restante do pessoal
  // A função agora recebe o resultado parcial e o completa com as pessoas restantes.
  resultadoSorteio = distribuirTarefasNormais(disponiveis, tarefasParaSorteioGeral, resultadoSorteio);

  // 6. Unir todos os resultados em um objeto final
  const tarefaAlmoco = tarefas.find(t => t.nome === TAREFA_ALMOCO);
  if (tarefaAlmoco) {
    resultadoSorteio[TAREFA_ALMOCO] = responsavelAlmoco ? [responsavelAlmoco] : [];
  }

  // 7. Salvar e exibir
  const dataHoje = new Date().toLocaleDateString("pt-BR");

  // Atualiza o offset dos missionários para o próximo sorteio
  missionarioOffset = (missionarioOffset + 1) % (tarefasParaRodizioMissionarios.length || 1);

  historico.push({ data: dataHoje, tarefas: resultadoSorteio });
  salvarDados();

  // Exibir resultados e atualizar a UI
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
    li.style.border = "1px solid #ccc"; li.style.padding = "10px"; li.style.marginBottom = "10px"; li.style.borderRadius = "5px";
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
    missionarioOffset = 0; // Reseta o rodízio também
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
