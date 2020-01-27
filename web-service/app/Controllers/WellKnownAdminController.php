<?php

namespace WebService\Controllers;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class WellKnownAdminController {

    /**
     * @var ContainerInterface 
     */
    private $_container;

    public function __construct(ContainerInterface $container) {
        $this->_container = $container;
    }

    public function __invoke(Request $request, Response $response): Response {
        switch ($request->getMethod()) {
            case 'GET':
                return $this->get($response);
        }
        throw new \RuntimeException('Request method not supported.');
    }

    private function get(Response $response): Response {
        $settings = $this->_container->get('settings');

        return $response->withJson([
            'backendPublickKey' => $settings['backendPublickKey']
        ], 200);
    }
}
