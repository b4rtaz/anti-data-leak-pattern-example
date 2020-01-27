<?php

namespace WebService\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class LoginController {

    /**
     * @var ContainerInterface 
     */
    private $_container;

    public function __construct(ContainerInterface $container) {
        $this->_container = $container;
    }

    public function __invoke(Request $request, Response $response): Response {
        $requestBody = $request->getParsedBody();
        $login = (string)$requestBody['login'];
        $hashedPassword = base64_decode((string)$requestBody['hashedPassword']);

        $userRow = $this->tryReadUserRow($login);
        if (!$userRow) {
            return $response->withJson([
                'reason' => 'User not found.'
            ], 401);
        }

        $userPassword = (string)$userRow['password'];
        $userPublicKey = (binary)$userRow['publicKey'];
        $userEncryptedPrivateKey = (binary)$userRow['encryptedPrivateKey'];

        if (!$this->verifyPassword($hashedPassword, $userPassword)) {
            return $response->withJson([
                'reason' => 'Invalid password.'
            ], 401);
        }

        $token = bin2hex(openssl_random_pseudo_bytes(64));
        $this->insertToken($token, $login);

        $settings = $this->_container->get('settings');
        return $response->withJson([
            'token' => $token,
            'adminPublicKey' => $settings['adminPublicKey'],
            'backendPublicKey' => $settings['backendPublickKey'],
            'userPublicKey' => base64_encode($userPublicKey),
            'userEncryptedPrivateKey' => base64_encode($userEncryptedPrivateKey)
        ], 200);
    }

    private function verifyPassword(string $hashedPassword, string $userPassword): bool {
        $pepper = base64_decode($this->_container['settings']['passwordPepper']);
        $peppered = hash_hmac('sha256', $hashedPassword, $pepper, true);
        return password_verify($peppered, $userPassword);
    }

    /**
     * @param string $login
     * @return array|null
     */
    private function tryReadUserRow(string $login) {
        /* @var $pdo \PDO */
        $pdo = $this->_container->get('db');

        $query = $pdo->prepare(
            'SELECT password, publicKey, encryptedPrivateKey FROM users WHERE login = ?');
        $query->execute([$login]);
        return $query->fetch();
    }

    private function insertToken(string $token, string $login) {
        /* @var $pdo \PDO */
        $pdo = $this->_container->get('db');

        $query = $pdo->prepare('INSERT INTO tokens(token, login) VALUES(?, ?)');
        $query->execute([$token, $login]);
    }
}
