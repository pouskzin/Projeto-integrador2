<?php
// api/agendamentos.php — Listagem, Criação e Cancelamento de Consultas
require_once 'config.php';

if (!isset($_SESSION['aluno_id'])) {
    responder(false, 'Acesso negado. Inicie sessão para continuar.', [], 401);
}

$alunoId = $_SESSION['aluno_id'];
$metodo = $_SERVER['REQUEST_METHOD'];

// 1. GET: Lista todas as consultas do aluno logado
if ($metodo === 'GET') {
    $meusAgendamentos = [];
    $ocupados = [];

    foreach ($_SESSION['db_agendamentos'] as $ag) {
        if ($ag['status'] !== 'Cancelada') {
            $ocupados[] = [
                'profissional_id' => $ag['profissional_id'],
                'dia' => $ag['dia'],
                'horario' => $ag['horario']
            ];
        }
        if ($ag['aluno_id'] === $alunoId) {
            $meusAgendamentos[] = $ag;
        }
    }

    responder(true, 'Dados carregados com sucesso.', [
        'aluno_nome' => $_SESSION['aluno_nome'],
        'profissionais' => $_SESSION['db_profissionais'],
        'horarios_ocupados' => $ocupados,
        'meus_agendamentos' => array_reverse($meusAgendamentos)
    ]);
}

// 2. POST: Cria novo agendamento OU cancela um agendamento existente
if ($metodo === 'POST') {
    $dados = lerEntrada();

    // Se for uma ação de cancelamento enviada pelo painel "Minhas Consultas"
    if (($dados['acao'] ?? '') === 'cancelar') {
        $idCancelar = (int) ($dados['id'] ?? 0);
        foreach ($_SESSION['db_agendamentos'] as &$ag) {
            if ($ag['id'] === $idCancelar && $ag['aluno_id'] === $alunoId) {
                $ag['status'] = 'Cancelada';
                responder(true, 'Consulta cancelada com sucesso.');
            }
        }
        unset($ag);
        responder(false, 'Consulta não encontrada.', [], 404);
    }

    // Criação de novo agendamento
    $profissionalId = (int) ($dados['profissional_id'] ?? 1);
    $dia = trim($dados['dia'] ?? '20');
    $diaSemana = trim($dados['dia_semana'] ?? 'Ter');
    $horario = trim($dados['horario'] ?? '14h');

    $profSelecionado = $_SESSION['db_profissionais'][0];
    foreach ($_SESSION['db_profissionais'] as $prof) {
        if ($prof['id'] === $profissionalId) {
            $profSelecionado = $prof;
            break;
        }
    }

    // Verifica conflito apenas em consultas ativas (não canceladas)
    foreach ($_SESSION['db_agendamentos'] as $ag) {
        if (
            $ag['profissional_id'] === $profissionalId &&
            $ag['dia'] === $dia &&
            $ag['horario'] === $horario &&
            $ag['status'] !== 'Cancelada'
        ) {
            responder(false, 'Este horário já está reservado com ' . $profSelecionado['nome_curto'] . '. Escolha outro horário.', [], 409);
        }
    }

    $novoAgendamento = [
        'id' => count($_SESSION['db_agendamentos']) + 1,
        'aluno_id' => $alunoId,
        'profissional_id' => $profSelecionado['id'],
        'iniciais' => $profSelecionado['iniciais'],
        'profissional' => $profSelecionado['nome'],
        'nome_curto' => $profSelecionado['nome_curto'],
        'dia' => $dia,
        'dia_semana' => $diaSemana,
        'data_curta' => $dia . '/10/2026',
        'data_extenso' => $dia . ' de outubro de 2026',
        'horario' => $horario,
        'modalidade' => 'Online (Videochamada)',
        'status' => 'Confirmada'
    ];

    $_SESSION['db_agendamentos'][] = $novoAgendamento;

    responder(true, 'Consulta agendada com sucesso!', [
        'agendamento' => $novoAgendamento
    ], 201);
}

responder(false, 'Método não suportado.', [], 405);