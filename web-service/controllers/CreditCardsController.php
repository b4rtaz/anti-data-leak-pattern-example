<?php

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CreditCardsController {

    /**
     * @var ContainerInterface 
     */
    private $_container;

    public function __construct(ContainerInterface $container) {
        $this->_container = $container;
    }

    public function __invoke(Request $request, Response $response): Response {
        $method = $request->getMethod();
        if ($method === 'GET') {
            return $this->get($request, $response);
        }
        if ($method === 'POST') {
            return $this->post($request, $response);
        }
        throw new \RuntimeException('Not supported given request method.');
    }

    private function authorize(Request $request): string {
        $headers = $request->getHeader('Authorization');
        if (count($headers) !== 1 || strpos($headers[0], 'Bearer ') !== 0) {
            throw new \RuntimeException('Token not found.');
        }
        $token = substr($headers[0], 7);

        /* @var $pdo \PDO */
        $pdo = $this->_container->get('db');
        $query = $pdo->prepare('SELECT login FROM tokens WHERE token = ?');
        $query->execute([$token]);

        $row = $query->fetch();
        if ($row === false) {
            throw new \RuntimeException('Token is not valid.');
        }

        return $row['login'];
    }

    private function get(Request $request, Response $response): Response {
        $login = $this->authorize($request);

        /* @var $pdo \PDO */
        $pdo = $this->_container->get('db');

        $query = $pdo->prepare('SELECT number, exp, cvv2 FROM creditcards WHERE login = ?');
        $query->execute([$login]);

        $items = [];
        while (($row = $query->fetch()) !== false) {
            $number = json_decode($row['number'], true);
            $exp = (string)$row['exp'];
            $cvv2 = json_decode($row['cvv2'], true);

            $items[] = [
                'number' => $this->findEncryptedValue($number, 'user'),
                'exp' => $exp,
                'cvv2' => $this->findEncryptedValue($cvv2, 'user')
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

    private function post(Request $request, Response $response): Response {
        $login = $this->authorize($request);
        $params = $request->getParsedBody();

        $number = (array)$params['number'];
        $exp = (string)$params['exp'];
        $cvv2 = (array)$params['cvv2'];

        /* @var $pdo \PDO */
        $pdo = $this->_container->get('db');

        $query = $pdo->prepare('INSERT INTO creditcards(login, number, exp, cvv2) VALUES(?, ?, ?, ?)');
        $query->execute([
            $login,
            json_encode($number),
            $exp,
            json_encode($cvv2)
        ]);

        return $response->withJson([], 200);
    }
}