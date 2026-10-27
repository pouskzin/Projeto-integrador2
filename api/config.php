<?php
// api/config.php — Dados fictícios em sessão alinhados com o layout HTML
session_start();

header('Content-Type: application/json; charset=utf-8');

// 1. Alunos fictícios para login
if (!isset($_SESSION['db_alunos'])) {
    $_SESSION['db_alunos'] = [
        [
            'id' => 1,
            'nome' => 'João Silva',
            'matricula' => '2026001',
            'email' => 'aluno@unifio.edu.br',
            'senha_hash' => password_hash('password', PASSWORD_DEFAULT) // Senha: password
        ],
        [
            'id' => 2,
            'nome' => 'Maria Oliveira',
            'matricula' => '2026002',
            'email' => 'maria@unifio.edu.br',
            'senha_hash' => password_hash('123456', PASSWORD_DEFAULT) // Senha: 123456
        ]
    ];
}

// 2. Profissionais idênticos ao ficheiro agendamento.html
if (!isset($_SESSION['db_profissionais'])) {
    $_SESSION['db_profissionais'] = [
        [
            'id' => 1,
            'iniciais' => 'AM',
            'nome' => 'Psicóloga Ana Martins',
            'nome_curto' => 'Ana Martins',
            'especialidade' => 'Atendimento psicológico · Online'
        ],
        [
            'id' => 2,
            'iniciais' => 'RC',
            'nome' => 'Psicólogo Rafael Costa',
            'nome_curto' => 'Rafael Costa',
            'especialidade' => 'Atendimento psicológico · Online'
        ],
        [
            'id' => 3,
            'iniciais' => 'BL',
            'nome' => 'Psicóloga Beatriz Lima',
            'nome_curto' => 'Beatriz Lima',
            'especialidade' => 'Atendimento psicológico · Online'
        ]
    ];
}

// 3. Lista de agendamentos realizados na sessão
if (!isset($_SESSION['db_agendamentos'])) {
    $_SESSION['db_agendamentos'] = [];
}

function responder($sucesso, $mensagem, $dadosExtras = [], $codigoHttp = 200) {
    http_response_code($codigoHttp);
    echo json_encode(array_merge([
        'sucesso' => $sucesso,
        'mensagem' => $mensagem
    ], $dadosExtras), JSON_UNESCAPED_UNICODE);
    exit;
}

function lerEntrada() {
    $json = json_decode(file_get_contents('php://input'), true);
    return is_array($json) ? $json : $_POST;
}