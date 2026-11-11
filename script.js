/* =====================================
   CONFIGURAÇÕES
===================================== */

const DURACAO_CALENDARIO = 30;
const HORARIO_CONSULTORIA = "10:00";

// Datas bloqueadas para testes: AAAA-MM-DD.
// Exemplo: ["2026-11-02"]
const datasIndisponiveis = [];

// =====================================================
// ÚNICA COISA QUE VOCÊ PRECISA EDITAR NESTE ARQUIVO:
// cole entre as aspas a URL do Apps Script (termina em /exec).
// =====================================================
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbyoyNJZdQP4TFI7bRnXFZpblmc1VNUWC1-hRr2ybK47fxY4I82grOVJg84dXxIstsgj/exec";

// Datas já reservadas por outras pessoas (vêm da planilha).
let datasOcupadas = [];


/* =====================================
   ELEMENTOS
===================================== */

const formulario = document.querySelector("#consultoria-form");
const calendarioDias = document.querySelector("#calendar-days");
const calendarioHorarios = document.querySelector("#calendar-times");

const campoData = document.querySelector("#data-consultoria");
const campoHorario = document.querySelector("#horario-consultoria");

const textoDataSelecionada =
  document.querySelector("#selected-date-label");

const botaoHorario = document.querySelector("#horario-10");
const erroHorario = document.querySelector("#erro-horario");

const secaoFormulario = document.querySelector("#formulario");
const secaoConfirmacao = document.querySelector("#confirmacao");

const mensagemConfirmacao =
  document.querySelector("#mensagem-confirmacao");

const confirmacaoData =
  document.querySelector("#confirmacao-data");

const confirmacaoHora =
  document.querySelector("#confirmacao-hora");

const statusAgendamento =
  document.querySelector("#status-agendamento");

document.querySelector("#ano-atual").textContent =
  new Date().getFullYear();


/* =====================================
   ESTADO
===================================== */

let dataSelecionada = "";
let horarioSelecionado = "";


/* =====================================
   FUNÇÕES DE DATA
===================================== */

function formatarISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


function formatarDataLonga(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);

  const data = new Date(ano, mes - 1, dia, 12);

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(data);
}


function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}


/* =====================================
   VERIFICAR DISPONIBILIDADE
===================================== */

function horarioJaPassou(dataISO) {
  const agora = new Date();
  const hojeISO = formatarISO(agora);

  if (dataISO < hojeISO) {
    return true;
  }

  if (dataISO === hojeISO) {
    const minutosAtuais =
      agora.getHours() * 60 + agora.getMinutes();

    return minutosAtuais >= 600;
  }

  return false;
}


function dataEstaOcupada(dataISO) {
  return (
    datasIndisponiveis.includes(dataISO) ||
    datasOcupadas.includes(dataISO)
  );
}


function dataEstaDisponivel(data, dataISO) {
  const diaSemana = data.getDay();

  const diaPermitido =
    diaSemana === 1 || diaSemana === 4;

  return (
    diaPermitido &&
    !dataEstaOcupada(dataISO) &&
    !horarioJaPassou(dataISO)
  );
}


/* =====================================
   GERAR CALENDÁRIO DE 30 DIAS
===================================== */

function gerarCalendario() {
  calendarioDias.replaceChildren();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];

  diasSemana.forEach((dia) => {
    const cabecalho = document.createElement("span");

    cabecalho.className = "calendar-weekday";
    cabecalho.textContent = dia;
    cabecalho.setAttribute("aria-hidden", "true");

    calendarioDias.appendChild(cabecalho);
  });

  // Alinha o primeiro dia com o dia correto da semana.
  for (let i = 0; i < hoje.getDay(); i++) {
    const espaco = document.createElement("span");

    espaco.setAttribute("aria-hidden", "true");

    calendarioDias.appendChild(espaco);
  }

  // Hoje e os próximos 29 dias.
  for (let i = 0; i < DURACAO_CALENDARIO; i++) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() + i);

    criarDiaCalendario(data, formatarISO(data));
  }
}


/* =====================================
   CRIAR CADA DIA
===================================== */

function criarDiaCalendario(data, dataISO) {
  const disponivel = dataEstaDisponivel(data, dataISO);

  const botao = document.createElement("button");

  botao.type = "button";

  botao.className = disponivel
    ? "calendar-date available"
    : "calendar-date unavailable";

  botao.disabled = !disponivel;

  botao.setAttribute("aria-pressed", "false");

  botao.setAttribute(
    "aria-label",
    `${formatarDataLonga(dataISO)}: ${
      disponivel ? "disponível às 10 horas" : "indisponível"
    }`
  );

  const numero = document.createElement("span");
  numero.className = "day-number";
  numero.textContent = data.getDate();

  const mes = document.createElement("span");
  mes.className = "day-month";

  mes.textContent = new Intl.DateTimeFormat("pt-BR", {
    month: "short"
  }).format(data).replace(".", "");

  const indicador = document.createElement("span");
  indicador.className = "availability-dot";
  indicador.setAttribute("aria-hidden", "true");

  botao.append(numero, mes, indicador);

  if (disponivel) {
    botao.addEventListener("click", () => {
      selecionarData(dataISO, botao);
    });
  }

  calendarioDias.appendChild(botao);
}


/* =====================================
   SELECIONAR DATA
===================================== */

function selecionarData(dataISO, botaoSelecionado) {
  dataSelecionada = dataISO;
  horarioSelecionado = "";

  campoData.value = dataISO;
  campoHorario.value = "";

  calendarioDias
    .querySelectorAll(".calendar-date")
    .forEach((botao) => {
      botao.classList.remove("selected");
      botao.setAttribute("aria-pressed", "false");
    });

  botaoSelecionado.classList.add("selected");
  botaoSelecionado.setAttribute("aria-pressed", "true");

  botaoHorario.classList.remove("selected");
  botaoHorario.setAttribute("aria-pressed", "false");

  textoDataSelecionada.textContent =
    `${capitalizar(formatarDataLonga(dataISO))} — escolha seu horário`;

  calendarioHorarios.hidden = false;
  erroHorario.hidden = true;
}


/* =====================================
   SELECIONAR HORÁRIO
===================================== */

botaoHorario.addEventListener("click", () => {
  if (!dataSelecionada) {
    return;
  }

  // Confere se o horário continua válido.
  const [ano, mes, dia] = dataSelecionada.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  if (!dataEstaDisponivel(data, dataSelecionada)) {
    erroHorario.textContent =
      "Esta data não está mais disponível. Escolha outra.";

    erroHorario.hidden = false;

    limparSelecao();
    gerarCalendario();

    return;
  }

  horarioSelecionado = HORARIO_CONSULTORIA;
  campoHorario.value = horarioSelecionado;

  botaoHorario.classList.add("selected");
  botaoHorario.setAttribute("aria-pressed", "true");

  erroHorario.hidden = true;
});


/* =====================================
   LIMPAR SELEÇÃO
===================================== */

function limparSelecao() {
  dataSelecionada = "";
  horarioSelecionado = "";

  campoData.value = "";
  campoHorario.value = "";

  calendarioHorarios.hidden = true;

  botaoHorario.classList.remove("selected");
  botaoHorario.setAttribute("aria-pressed", "false");
}


/* =====================================
   VALIDAR HORÁRIO
===================================== */

function validarHorario() {
  if (dataSelecionada && horarioSelecionado) {
    erroHorario.hidden = true;
    return true;
  }

  erroHorario.textContent =
    "Escolha uma data disponível e selecione o horário das 10h.";

  erroHorario.hidden = false;

  erroHorario.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  return false;
}


/* =====================================
   COMUNICAÇÃO COM A PLANILHA
===================================== */

function urlConfigurada() {
  return URL_SCRIPT.startsWith("https://script.google.com/");
}


async function carregarDatasOcupadas() {
  if (!urlConfigurada()) {
    return;
  }

  try {
    const resposta = await fetch(`${URL_SCRIPT}?acao=datas`, {
      cache: "no-store"
    });

    const resultado = await resposta.json();

    if (Array.isArray(resultado.ocupadas)) {
      datasOcupadas = resultado.ocupadas;
    }
  } catch (erro) {
    console.error("Não foi possível carregar as datas ocupadas:", erro);
  }
}


async function enviarPedido(pedido) {
  const controlador = new AbortController();

  const temporizador = setTimeout(() => {
    controlador.abort();
  }, 20000);

  try {
    const resposta = await fetch(URL_SCRIPT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(pedido),
      signal: controlador.signal
    });

    return await resposta.json();
  } finally {
    clearTimeout(temporizador);
  }
}


/* =====================================
   MENSAGENS DE ERRO DO ENVIO
===================================== */

const botaoEnviar = formulario.querySelector(".submit-button");

const erroEnvio = document.createElement("p");
erroEnvio.className = "form-error";
erroEnvio.setAttribute("role", "alert");
erroEnvio.hidden = true;

botaoEnviar.insertAdjacentElement("afterend", erroEnvio);


function mostrarErroEnvio(mensagem) {
  erroEnvio.textContent = mensagem;
  erroEnvio.hidden = false;

  erroEnvio.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}


/* =====================================
   MOSTRAR CONFIRMAÇÃO
===================================== */

function mostrarConfirmacao(nome) {
  confirmacaoData.textContent =
    capitalizar(formatarDataLonga(dataSelecionada));

  confirmacaoHora.textContent =
    `${horarioSelecionado} — Horário de Brasília`;

  mensagemConfirmacao.textContent =
    `Obrigada pela confiança, ${nome}! Sua solicitação foi registrada com sucesso.`;

  statusAgendamento.textContent =
    "Sua solicitação foi registrada e esse horário já está reservado para você.";

  secaoFormulario.hidden = true;
  secaoConfirmacao.hidden = false;

  secaoConfirmacao.focus();

  secaoConfirmacao.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =====================================
   ENVIAR FORMULÁRIO
===================================== */

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  erroEnvio.hidden = true;

  if (!validarHorario()) {
    return;
  }

  if (!formulario.reportValidity()) {
    return;
  }

  if (!urlConfigurada()) {
    console.error("URL_SCRIPT ainda não foi configurada no script.js.");

    mostrarErroEnvio(
      "O envio ainda não está ativo. Tente novamente mais tarde."
    );

    return;
  }

  const dados = new FormData(formulario);

  const pedido = {
    data: dataSelecionada,
    horario: horarioSelecionado,
    nome: String(dados.get("nome") || "").trim(),
    email: String(dados.get("email") || "").trim(),
    telefone: String(dados.get("telefone") || "").trim(),
    portfolio: String(dados.get("portfolio") || "").trim(),
    marcas: String(dados.get("marcas") || "").trim(),
    desafio: String(dados.get("desafio") || "").trim(),
    consentimento: true
  };

  const textoOriginal = botaoEnviar.textContent;

  botaoEnviar.disabled = true;
  botaoEnviar.textContent = "ENVIANDO...";

  try {
    const resultado = await enviarPedido(pedido);

    if (resultado.ok) {
      mostrarConfirmacao(pedido.nome);
      return;
    }

    if (resultado.erro === "ocupada") {
      datasOcupadas.push(pedido.data);

      limparSelecao();
      gerarCalendario();

      mostrarErroEnvio(
        "Essa data acabou de ser reservada por outra pessoa. Escolha outra data."
      );

      return;
    }

    mostrarErroEnvio(
      resultado.mensagem ||
      "Não conseguimos enviar agora. Tente novamente."
    );
  } catch (erro) {
    console.error("Erro ao enviar o pedido:", erro);

    mostrarErroEnvio(
      "Não conseguimos enviar agora. Verifique sua conexão e tente de novo."
    );
  } finally {
    botaoEnviar.disabled = false;
    botaoEnviar.textContent = textoOriginal;
  }
});


/* =====================================
   INICIALIZAÇÃO
===================================== */

carregarDatasOcupadas().then(gerarCalendario);
