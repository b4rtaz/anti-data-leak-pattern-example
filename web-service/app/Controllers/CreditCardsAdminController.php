<?php

namespace WebService\Controllers;

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

        switch ($request->getMethod()) {
            case 'GET':
                return $this->get($response);
            case 'PUT':
                return $this->put($request, $response);
        }
        throw new \RuntimeException('Request method not supported.');
    }

    public function get(Response $response): Response {
        /* @var $pdo \PDO */
        $pdo = $this->_container->get('db');
        $query = $pdo->query(
            'SELECT c.login, u.publicKey, c.id, c.number, c.exp, c.cvv2 ' .
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
                '_user' => [
                    'login' => $login,
                    'publicKey' => base64_encode($publicKey)
                ],
                'id' => $row['id'],
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
        throw new \RuntimeException('Cannot find the relation.');
    }

    private function put(Request $request, Response $response) {
        $route = $request->getAttribute('route');
        $id = (int)$route->getArgument('id');

        $params = $request->getParsedBody();
        $number = (array)$params['number'];
        $exp = (string)$params['exp'];
        $cvv2 = (array)$params['cvv2'];

        /* @var $pdo \PDO */
        $pdo = $this->_container->get('db');

        $query = $pdo->prepare('UPDATE creditcards SET number = ?, exp = ?, cvv2 = ? WHERE id = ?');
        $query->execute([
            json_encode($number),
            $exp,
            json_encode($cvv2),
            $id
        ]);

        return $response->withJson([], 200);
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
