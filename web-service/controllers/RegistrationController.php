<?php

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class RegistrationController {

    /**
     * @var ContainerInterface 
     */
    private $_container;

    public function __construct(ContainerInterface $container) {
        $this->_container = $container;
    }

    public function __invoke(Request $request, Response $response): Response {
        $params = $request->getParsedBody();
        $login = (string)$params['login'];
        $hashedPassword = base64_decode((string)$params['hashedPassword']);
        $userPublicKey = base64_decode((string)$params['userPublicKey']);
        $userEncryptedPrivateKey = base64_decode((string)$params['userEncryptedPrivateKey']);

        /* @var $pdo \PDO */
        $pdo = $this->_container->get('db');

        $password = $this->hashPassword($hashedPassword);

        $query = $pdo->prepare('INSERT INTO users(login, password, publicKey, encryptedPrivateKey) VALUES(?, ?, ?, ?)');
        $query->execute([
            $login,
            $password,
            $userPublicKey,
            $userEncryptedPrivateKey
        ]);

        return $response->withJson([], 200);
    }

    private function hashPassword(string $hashedPassword): string {
        $pepper = base64_decode($this->_container['settings']['passwordPepper']);
        $peppered = hash_hmac('sha256', $hashedPassword, $pepper, true);
        return password_hash($peppered, PASSWORD_ARGON2I, [
            'time_cost' => 32,
            'memory_cost' => '8192k',
            'threads' => 4
        ]);
    }
}
