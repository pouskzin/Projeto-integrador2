<?php
// api/login.php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(false, 'Método não permitido. Use POST.', [], 405);
}

$dados = lerEntrada();
$login = trim($dados['login'] ?? '');
$senha = trim($dados['senha'] ?? '');

if ($login === '' || $senha === '') {
    responder(false, 'Preencha o e-mail/matrícula e a senha.', [], 400);
}

$alunoEncontrado = null;
foreach ($_SESSION['db_alunos'] as$aluno) {
    if ($aluno['matricula'] ===$login || strcasecmp($aluno['email'],$login) === 0) {
        $alunoEncontrado =$aluno;
        break;
    }
}

if (!$alunoEncontrado || !password_verify($senha,$alunoEncontrado['senha_hash'])) {
    responder(false, 'Credenciais inválidas. Verifique sua matrícula/e-mail e senha.', [], 401);
}

$_SESSION['aluno_id'] =$alunoEncontrado['id'];
$_SESSION['aluno_nome'] =$alunoEncontrado['nome'];

responder(true, 'Login realizado com sucesso!', [
    'aluno' => [
        'id' => $alunoEncontrado['id'],
        'nome' => $alunoEncontrado['nome'],
        'matricula' => $alunoEncontrado['matricula'],
        'email' => $alunoEncontrado['email']
    ]
]);