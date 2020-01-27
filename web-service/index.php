<?php

error_reporting(E_ALL);

use Slim\App;
use Slim\Container;
use WebService\Controllers\CreditCardsAdminController;
use WebService\Controllers\CreditCardsController;
use WebService\Controllers\LoginController;
use WebService\Controllers\RegistrationController;
use WebService\Controllers\WellKnownAdminController;

require 'settings.php';
require 'vendor/autoload.php';

$container = new Container([
    'settings' => $settings
]);

$container['db'] = function (Container $container) {
    $db = $container->get('settings')['db'];
    $pdo = new \PDO($db['dsn'], $db['username'], $db['password']);
    $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);

    $pdo->exec('SET SESSION sql_mode = `TRADITIONAL`');
    return $pdo;
};

$app = new App($container);

$app->get('/admin/.well-known', WellKnownAdminController::class);
$app->get('/admin/credit-cards', CreditCardsAdminController::class);
$app->get('/credit-cards', CreditCardsController::class);
$app->post('/credit-cards', CreditCardsController::class);
$app->post('/login', LoginController::class);
$app->post('/register', RegistrationController::class);
$app->put('/admin/credit-cards/{id}', CreditCardsAdminController::class);

$app->run();
