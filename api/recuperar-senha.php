<?php
// api/recuperar-senha.php — Redefinição de senha funcional em sessão
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(false, 'Método não permitido. Use POST.', [], 405);
}

$dados = lerEntrada();
$login = trim($dados['login'] ?? '');
$novaSenha = trim($dados['nova_senha'] ?? '');

if ($login === '' || $novaSenha === '') {
    responder(false, 'Informe sua matrícula/e-mail e a nova senha.', [], 400);
}

if (strlen($novaSenha) < 4) {
    responder(false, 'A nova senha deve ter pelo menos 4 caracteres.', [], 400);
}

$encontrado = false;
$nomeAluno = '';

foreach ($_SESSION['db_alunos'] as &$aluno) {
    if ($aluno['matricula'] === $login || strcasecmp($aluno['email'], $login) === 0) {
        $aluno['senha_hash'] = password_hash($novaSenha, PASSWORD_DEFAULT);
        $nomeAluno = $aluno['nome'];
        $encontrado = true;
        break;
    }
}
unset($aluno);

if (!$encontrado) {
    responder(false, 'Nenhuma conta encontrada com esta matrícula ou e-mail.', [], 404);
}

responder(true, "Senha de {$nomeAluno} redefinida com sucesso! Você já pode entrar com a nova senha.");