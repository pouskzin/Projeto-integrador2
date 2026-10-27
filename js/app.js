// js/app.js — Controle Completo: Login, Recuperação de Senha, Agendamento e Minhas Consultas

const CONTAS_PADRAO = [
  { id: 1, nome: "João Silva", matricula: "2026001", email: "aluno@unifio.edu.br", senha: "password" },
  { id: 2, nome: "Maria Oliveira", matricula: "2026002", email: "maria@unifio.edu.br", senha: "123456" },
];

function obterContasLocais() {
  const salvas = sessionStorage.getItem("unifio_contas");
  if (!salvas) {
    sessionStorage.setItem("unifio_contas", JSON.stringify(CONTAS_PADRAO));
    return CONTAS_PADRAO;
  }
  return JSON.parse(salvas);
}

document.addEventListener("DOMContentLoaded", () => {
  configurarBotaoSair();

  // 1. Tela de Login (index.html)
  const formLogin = document.querySelector("form.login");
  if (formLogin) inicializarLogin(formLogin);

  // 2. Tela Esqueci Minha Senha (esqueci-senha.html)
  const formRecuperar = document.getElementById("form-recuperar");
  if (formRecuperar) inicializarRecuperarSenha(formRecuperar);

  // 3. Tela de Agendamento (agendamento.html)
  const secaoAgendamento = document.querySelector('section[aria-label="Agendamento"]');
  if (secaoAgendamento) inicializarAgendamento();

  // 4. Tela de Minhas Consultas (consulta-marcada.html)
  const secaoConsulta = document.querySelector('section[aria-label="Consulta marcada"]');
  if (secaoConsulta) inicializarMinhasConsultas();
});

async function chamarApiPhp(url, opcoes = {}) {
  try {
    const resp = await fetch(url, opcoes);
    const texto = await resp.text();
    if (texto.trim().startsWith("<?php")) return null;
    return { status: resp.status, dados: JSON.parse(texto) };
  } catch (e) {
    return null;
  }
}

function configurarBotaoSair() {
  document.querySelectorAll("a.pill").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      await chamarApiPhp("api/logout.php", { method: "POST" });
      sessionStorage.removeItem("unifio_aluno");
      window.location.href = "index.html";
    });
  });
}

// ==========================================
// 1. LOGIN (index.html)
// ==========================================
function inicializarLogin(form) {
  // Garante que o link "Esqueci minha senha" aponte para esqueci-senha.html
  form.querySelectorAll("a").forEach((link) => {
    if (link.textContent.toLowerCase().includes("esqueci")) {
      link.setAttribute("href", "esqueci-senha.html");
    }
  });

  const inputLogin = document.getElementById("e");
  const inputSenha = document.getElementById("s");

  const msgErro = document.createElement("div");
  msgErro.className = "alert alert-danger py-2 px-3 small mb-3";
  msgErro.style.display = "none";
  form.insertBefore(msgErro, form.querySelector('button[type="submit"]'));

  form.onsubmit = async (e) => {
    e.preventDefault();
    msgErro.style.display = "none";

    const loginDigitado = inputLogin.value.trim();
    const senhaDigitada = inputSenha.value.trim();

    const respostaPhp = await chamarApiPhp("api/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: loginDigitado, senha: senhaDigitada }),
    });

    if (respostaPhp) {
      if (respostaPhp.dados.sucesso) {
        sessionStorage.setItem("unifio_aluno", JSON.stringify(respostaPhp.dados.aluno));
        window.location.href = "agendamento.html";
      } else {
        msgErro.textContent = respostaPhp.dados.mensagem;
        msgErro.style.display = "block";
      }
      return;
    }

    // Fallback se aberto via Live Server
    const contas = obterContasLocais();
    const alunoLocal = contas.find(
      (a) => (a.matricula === loginDigitado || a.email.toLowerCase() === loginDigitado.toLowerCase()) && a.senha === senhaDigitada
    );

    if (alunoLocal) {
      sessionStorage.setItem("unifio_aluno", JSON.stringify(alunoLocal));
      window.location.href = "agendamento.html";
    } else {
      msgErro.textContent = "Credenciais inválidas. Verifique sua matrícula/e-mail e senha.";
      msgErro.style.display = "block";
    }
  };
}

// ==========================================
// 2. ESQUECI MINHA SENHA (esqueci-senha.html)
// ==========================================
function inicializarRecuperarSenha(form) {
  const inputLogin = document.getElementById("rec-login");
  const inputNova = document.getElementById("rec-nova-senha");
  const inputConfirma = document.getElementById("rec-confirma-senha");
  const alerta = document.getElementById("alerta-recuperar");

  function exibirAlerta(sucesso, texto) {
    alerta.className = `alert ${sucesso ? "alert-success" : "alert-danger"} py-2 px-3 small mb-3`;
    alerta.textContent = texto;
    alerta.style.display = "block";
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    alerta.style.display = "none";

    const login = inputLogin.value.trim();
    const novaSenha = inputNova.value.trim();
    const confirmaSenha = inputConfirma.value.trim();

    if (novaSenha.length < 4) {
      exibirAlerta(false, "A nova senha deve ter pelo menos 4 caracteres.");
      return;
    }

    if (novaSenha !== confirmaSenha) {
      exibirAlerta(false, "As senhas digitadas não coincidem.");
      return;
    }

    // Tenta redefinir via API PHP
    const respPhp = await chamarApiPhp("api/recuperar-senha.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, nova_senha: novaSenha }),
    });

    if (respPhp) {
      exibirAlerta(respPhp.dados.sucesso, respPhp.dados.mensagem);
      if (respPhp.dados.sucesso) {
        form.reset();
        setTimeout(() => (window.location.href = "index.html"), 2000);
      }
      return;
    }

    // Fallback se aberto via Live Server
    const contas = obterContasLocais();
    const idx = contas.findIndex(
      (a) => a.matricula === login || a.email.toLowerCase() === login.toLowerCase()
    );

    if (idx === -1) {
      exibirAlerta(false, "Nenhuma conta encontrada com esta matrícula ou e-mail.");
      return;
    }

    contas[idx].senha = novaSenha;
    sessionStorage.setItem("unifio_contas", JSON.stringify(contas));
    exibirAlerta(true, `Senha de ${contas[idx].nome} atualizada com sucesso! Redirecionando para o login...`);
    form.reset();
    setTimeout(() => (window.location.href = "index.html"), 2000);
  };
}

// ==========================================
// 3. AGENDAMENTO (agendamento.html)
// ==========================================
async function inicializarAgendamento() {
  const respostaPhp = await chamarApiPhp("api/agendamentos.php");
  const alunoSessao = JSON.parse(sessionStorage.getItem("unifio_aluno") || "null");

  if (respostaPhp && respostaPhp.status === 401 && !alunoSessao) {
    window.location.href = "index.html";
    return;
  }

  const nomeAluno = respostaPhp?.dados?.aluno_nome || alunoSessao?.nome || "Aluno";
  const btnSair = document.querySelector("a.pill");
  if (btnSair) btnSair.innerHTML = `<i class="bi bi-person-check me-1"></i>${nomeAluno.split(" ")[0]} · Sair`;

  const cardsPro = document.querySelectorAll(".pro");
  const botoesDia = document.querySelectorAll(".days .slot");
  const botoesHora = document.querySelectorAll(".times .slot");
  const btnConfirmar = document.querySelector(".confirm .btn");

  const listaProfissionais = [
    { id: 1, iniciais: "AM", nome: "Psicóloga Ana Martins", curto: "Ana Martins" },
    { id: 2, iniciais: "RC", nome: "Psicólogo Rafael Costa", curto: "Rafael Costa" },
    { id: 3, iniciais: "BL", nome: "Psicóloga Beatriz Lima", curto: "Beatriz Lima" },
  ];

  const mapaDiaExtenso = {
    Seg: "Segunda-feira",
    Ter: "Terça-feira",
    Qua: "Quarta-feira",
    Qui: "Quinta-feira",
    Sex: "Sexta-feira",
  };

  let estado = {
    profissional_id: 1,
    iniciais: "AM",
    profissional: "Psicóloga Ana Martins",
    nome_curto: "Ana Martins",
    dia_semana: "Ter",
    dia: "20",
    horario: "14h",
  };

  function atualizarResumo() {
    const subProf = document.getElementById("sub-profissional");
    if (subProf) subProf.textContent = `Disponibilidade de ${estado.nome_curto} · Modalidade online`;

    const labelDia = document.getElementById("label-dia-escolhido");
    if (labelDia) labelDia.textContent = `${mapaDiaExtenso[estado.dia_semana]}, ${estado.dia} de outubro · horários disponíveis`;

    const resumoConfirm = document.getElementById("resumo-confirmacao");
    if (resumoConfirm) resumoConfirm.textContent = `${estado.nome_curto} · ${estado.dia_semana}, ${estado.dia}/10/2026 · ${estado.horario} · Online`;
  }

  cardsPro.forEach((card, index) => {
    card.addEventListener("click", () => {
      cardsPro.forEach((c) => c.classList.toggle("sel", c === card));
      const p = listaProfissionais[index];
      estado.profissional_id = p.id;
      estado.iniciais = p.iniciais;
      estado.profissional = p.nome;
      estado.nome_curto = p.curto;
      atualizarResumo();
    });
  });

  botoesDia.forEach((btn) => {
    btn.addEventListener("click", () => {
      botoesDia.forEach((b) => b.setAttribute("aria-pressed", b === btn));
      estado.dia_semana = btn.querySelector("small").textContent.trim();
      estado.dia = btn.querySelector("b").textContent.trim();
      atualizarResumo();
    });
  });

  botoesHora.forEach((btn) => {
    btn.addEventListener("click", () => {
      botoesHora.forEach((b) => {
        const limpo = b.textContent.replace("✓", "").trim();
        b.setAttribute("aria-pressed", b === btn);
        b.textContent = b === btn ? `✓ ${limpo}` : limpo;
      });
      estado.horario = btn.textContent.replace("✓", "").trim();
      atualizarResumo();
    });
  });

  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", async (e) => {
      e.preventDefault();

      // 1º Tenta salvar no PHP
      const postPhp = await chamarApiPhp("api/agendamentos.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(estado),
      });

      if (postPhp) {
        if (!postPhp.dados.sucesso) {
          alert(postPhp.dados.mensagem);
          return;
        }
        window.location.href = "consulta-marcada.html";
        return;
      }

      // 2º Fallback se aberto via Live Server
      const listaLocal = JSON.parse(sessionStorage.getItem("unifio_agendamentos_lista") || "[]");
      const conflito = listaLocal.find(
        (ag) =>
          ag.profissional_id === estado.profissional_id &&
          ag.dia === estado.dia &&
          ag.horario === estado.horario &&
          ag.status !== "Cancelada"
      );

      if (conflito) {
        alert(`Este horário já está reservado com ${estado.nome_curto}. Escolha outro horário.`);
        return;
      }

      const novaConsulta = {
        id: Date.now(),
        ...estado,
        data_curta: `${estado.dia}/10/2026`,
        data_extenso: `${estado.dia} de outubro de 2026`,
        modalidade: "Online (Videochamada)",
        status: "Confirmada",
      };

      listaLocal.unshift(novaConsulta);
      sessionStorage.setItem("unifio_agendamentos_lista", JSON.stringify(listaLocal));
      window.location.href = "consulta-marcada.html";
    });
  }
}

// ==========================================
// 4. MINHAS CONSULTAS (consulta-marcada.html)
// ==========================================
async function inicializarMinhasConsultas() {
  const containerLista = document.getElementById("lista-minhas-consultas");
  const badgeContador = document.getElementById("contador-consultas");

  const respostaPhp = await chamarApiPhp("api/agendamentos.php");
  const alunoSessao = JSON.parse(sessionStorage.getItem("unifio_aluno") || "null");

  if (respostaPhp && respostaPhp.status === 401 && !alunoSessao) {
    window.location.href = "index.html";
    return;
  }

  const nomeAluno = respostaPhp?.dados?.aluno_nome || alunoSessao?.nome || "Aluno";
  const btnSair = document.querySelector("a.pill");
  if (btnSair) btnSair.innerHTML = `<i class="bi bi-person-check me-1"></i>${nomeAluno.split(" ")[0]} · Sair`;

  let consultas = [];
  if (respostaPhp && respostaPhp.dados.sucesso) {
    consultas = respostaPhp.dados.meus_agendamentos || [];
  } else {
    consultas = JSON.parse(sessionStorage.getItem("unifio_agendamentos_lista") || "[]");
  }

  const ativas = consultas.filter((c) => c.status !== "Cancelada").length;
  if (badgeContador) {
    badgeContador.textContent = `${ativas} ativa(s) · ${consultas.length} no total`;
  }

  if (!containerLista) return;

  if (consultas.length === 0) {
    containerLista.innerHTML = `
      <div class="text-center py-5 border rounded-3 bg-light">
        <i class="bi bi-calendar-x text-secondary fs-1 d-block mb-2"></i>
        <h3 class="h6 fw-bold mb-1">Você ainda não possui consultas agendadas</h3>
        <p class="text-secondary small mb-3">Escolha um psicólogo e reserve um horário disponível na agenda.</p>
        <a href="agendamento.html" class="btn btn-unifio btn-sm">
          <i class="bi bi-plus-circle me-1"></i>Agendar minha primeira consulta
        </a>
      </div>
    `;
    return;
  }

  containerLista.innerHTML = consultas
    .map((c) => {
      const cancelada = c.status === "Cancelada";
      const badgeClass = cancelada ? "bg-secondary-subtle text-secondary" : "bg-success-subtle text-success";
      const iconeStatus = cancelada ? "bi-x-circle" : "bi-check-circle-fill";

      return `
        <div class="p-3 rounded-3 border ${cancelada ? "bg-light opacity-75" : "bg-white"}">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-3 mb-3 border-bottom">
            <div class="d-flex align-items-center gap-3">
              <div class="av">${c.iniciais || "PS"}</div>
              <div>
                <h3 class="h6 fw-bold mb-0">${c.profissional}</h3>
                <small class="text-secondary">Atendimento psicológico · Equipe UniFio</small>
              </div>
            </div>
            <span class="badge rounded-pill ${badgeClass} px-3 py-2">
              <i class="bi ${iconeStatus} me-1"></i>${c.status}
            </span>
          </div>

          <div class="row g-3 mb-3 small">
            <div class="col-sm-4">
              <span class="text-secondary d-block">DATA</span>
              <strong class="text-dark"><i class="bi bi-calendar-event text-primary me-1"></i>${c.data_extenso}</strong>
            </div>
            <div class="col-sm-4">
              <span class="text-secondary d-block">HORÁRIO</span>
              <strong class="text-dark"><i class="bi bi-clock text-primary me-1"></i>${c.horario}</strong>
            </div>
            <div class="col-sm-4">
              <span class="text-secondary d-block">MODALIDADE</span>
              <strong class="text-dark"><i class="bi bi-camera-video text-primary me-1"></i>Online</strong>
            </div>
          </div>

          ${
            !cancelada
              ? `
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-2 border-top">
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-sm btn-outline-primary rounded-3" onclick="alert('Sala virtual de ${c.profissional} (${c.data_extenso} às ${c.horario}): O link de videochamada será liberado 10 minutos antes do início.')">
                  <i class="bi bi-camera-video me-1"></i>Acessar sala online
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary rounded-3" onclick="window.print()">
                  <i class="bi bi-printer me-1"></i>Comprovante
                </button>
              </div>
              <button type="button" class="btn btn-sm btn-outline-danger rounded-3 btn-cancelar" data-id="${c.id}">
                <i class="bi bi-trash3 me-1"></i>Cancelar consulta
              </button>
            </div>
          `
              : `<div class="small text-secondary"><i class="bi bi-info-circle me-1"></i>Este horário foi cancelado e liberado novamente na agenda.</div>`
          }
        </div>
      `;
    })
    .join("");

  // Eventos dos botões "Cancelar consulta"
  containerLista.querySelectorAll(".btn-cancelar").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-id"));
      if (!confirm("Deseja realmente cancelar este agendamento?")) return;

      const respCancel = await chamarApiPhp("api/agendamentos.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "cancelar", id }),
      });

      if (!respCancel) {
        const listaLocal = JSON.parse(sessionStorage.getItem("unifio_agendamentos_lista") || "[]");
        const item = listaLocal.find((x) => x.id === id);
        if (item) item.status = "Cancelada";
        sessionStorage.setItem("unifio_agendamentos_lista", JSON.stringify(listaLocal));
      }

      inicializarMinhasConsultas();
    });
  });
}