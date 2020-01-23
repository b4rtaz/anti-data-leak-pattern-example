<?php

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CreditCardsAdminController {

    /**
     * @var ContainerInterface 
     */
    private $_container;

    public function __construct(ContainerInterface $container) {
        $this->_container = $container;
    }

    public function __invoke(Request $request, Response $response): Response {
        $this->authorize($request);

        /* @var $pdo \PDO */
        $pdo = $this->_container->get('db');
        $query = $pdo->query(
            'SELECT c.login, u.publicKey, c.number, c.exp, c.cvv2 ' .
            'FROM creditcards c ' .
            'INNER JOIN users u ON c.login = u.login');

        $items = [];
        while (($row = $query->fetch()) !== false) {
            $login = (string)$row['login'];
            $publicKey = (string)$row['publicKey'];
            $number = json_decode($row['number'], true);
            $exp = (string)$row['exp'];
            $cvv2 = json_decode($row['cvv2'], true);

            $items[] = [
                'login' => $login,
                'publickKey' => base64_encode($publicKey),
                'number' => $this->findEncryptedValue($number, 'admin'),
                'exp' => $exp,
                'cvv2' => $this->findEncryptedValue($cvv2, 'admin'),
            ];
        }

        return $response->withJson([
            'items' => $items
        ], 200);
    }

    private function findEncryptedValue(array $values, string $relation): array {
        foreach ($values as $value) {
            if (in_array($relation, $value['relation'])) {
                return $value;
            }
        }
        throw new RuntimeException('Cannot find the relation.');
    }

    private function authorize(Request $request) {
        $headers = $request->getHeader('Authorization');
        if (count($headers) !== 1 || strpos($headers[0], 'Bearer ') !== 0) {
            throw new \RuntimeException('Token not found.');
        }
        $token = substr($headers[0], 7);

        $adminToken = $this->_container->get('settings')['adminApiToken'];
        if ($token !== $adminToken) {
            throw new \RuntimeException('Token is not valid.');
        }
    }
}