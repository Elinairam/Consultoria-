/* =====================================
   CONFIGURAÇÕES
===================================== */

const DURACAO_CALENDARIO = 30;
const HORARIO_CONSULTORIA = "10:00";

// Datas bloqueadas para testes: AAAA-MM-DD.
// Exemplo: ["2026-11-02"]
const datasIndisponiveis = [];


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
  return datasIndisponiveis.includes(dataISO);
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
   ENVIAR FORMULÁRIO
===================================== */

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (!validarHorario()) {
    return;
  }

  if (!formulario.reportValidity()) {
    return;
  }

  const dados = new FormData(formulario);
  const nome = String(dados.get("nome") || "").trim();

  confirmacaoData.textContent =
    capitalizar(formatarDataLonga(dataSelecionada));

  confirmacaoHora.textContent =
    `${horarioSelecionado} — Horário de Brasília`;

  mensagemConfirmacao.textContent =
    `Obrigada pela confiança, ${nome}! Sua solicitação foi preenchida com sucesso.`;

  statusAgendamento.textContent =
    "Esta é uma confirmação visual de demonstração. Para garantir sua vaga e registrar seus dados, precisamos conectar o formulário a um serviço de agendamento.";

  secaoFormulario.hidden = true;
  secaoConfirmacao.hidden = false;

  secaoConfirmacao.focus();

  secaoConfirmacao.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});


/* =====================================
   INICIALIZAÇÃO
===================================== */

gerarCalendario();
