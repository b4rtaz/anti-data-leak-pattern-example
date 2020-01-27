<?php

namespace WebService\Controllers;

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
        switch ($request->getMethod()) {
            case 'POST':
                return $this->post($request, $response);
        }
        throw new \RuntimeException('Request method not supported.');
    }

    private function post(Request $request, Response $response): Response {
        $params = $request->getParsedBody();
        $login = (string)$params['login'];
        $hashedPassword = base64_decode((string)$params['hashedPassword']);
        $userPublicKey = base64_decode((string)$params['userPublicKey']);
        $userEncryptedPrivateKey = base64_decode((string)$params['userEncryptedPrivateKey']);

        /* @var $pdo \PDO */
        $pdo = $this->_container->get('db');
        $pdo->beginTransaction();

        try {
            $verifyQuery = $pdo->prepare('SELECT COUNT(*) count FROM users WHERE login = ?');
            $verifyQuery->execute([$login]);
            if ($verifyQuery->fetch()['count'] > 0) {
                throw new \RuntimeException('Username already taken.');
            }

            $password = $this->hashPassword($hashedPassword);

            $insertQuery = $pdo->prepare('INSERT INTO users(login, password, publicKey, encryptedPrivateKey) VALUES(?, ?, ?, ?)');
            $insertQuery->execute([
                $login,
                $password,
                $userPublicKey,
                $userEncryptedPrivateKey
            ]);

            $pdo->commit();
        } catch (\Exception $ex) {
            $pdo->rollBack();
            throw $ex;
        }

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
