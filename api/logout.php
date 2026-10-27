<?php

require_once 'config.php';

$_SESSION = [];
session_unset();
session_destroy();

responder(true, 'Sessão encerrada com sucesso.');