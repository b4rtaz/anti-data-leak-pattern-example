<?php

error_reporting(E_ALL);

use AdminClient\Cryptography\Crypt;
use AdminClient\Cryptography\ECDH;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\RequestOptions;

require './settings.php';
require 'vendor/autoload.php';

function request(string $method, string $url, array $options = []): array {
    global $settings;
    $client = new GuzzleClient([
        'verify' => $settings['verifySSL'],
        'headers' => [
            'Authorization' => 'Bearer ' . $settings['adminApiToken']
        ]
    ]);
    $response = $client->request($method, $settings['apiBaseUrl'] . $url, $options)->getBody();
    $json = json_decode($response, true);
    if ($json === null) {
        throw new \RuntimeException(json_last_error_msg());
    }
    return $json;
}

function printRow(string $c1, string $c2, string $c3, string $c4, string $c5) {
    print sprintf('%8s %14s %20s %10s %10s', $c1, $c2, $c3, $c4, $c5) . PHP_EOL;
}

$ECDH = new ECDH();
$crypt = new Crypt();

$wellKnownResponse = request('GET', 'admin/.well-known');

$adminPrivateKey = $ECDH->parsePrivateKey($settings['adminPrivateKey']);
$backendPublickKey = $ECDH->parsePublicKey($wellKnownResponse['backendPublickKey']);
$backendEncryptionKey = $ECDH->deriveEncryptionKey($adminPrivateKey, $backendPublickKey);

$crypt->registerKey(['admin', 'backend'], $backendEncryptionKey);

$cardsResponse = request('GET', 'admin/credit-cards');

$creditCards = [];
$userCryptCache = [];
foreach ($cardsResponse['items'] as $item) {
    $login = $item['_user']['login'];

    if (!array_key_exists($login, $userCryptCache)) {
        $userPublicKey = $ECDH->parsePublicKey($item['_user']['publicKey']);
        $adminEncryptionKey = $ECDH->deriveEncryptionKey($adminPrivateKey, $userPublicKey);
        $userCrypt = $crypt->clone();
        $userCrypt->registerKey(['admin', 'user'], $adminEncryptionKey);
        $userCryptCache[$login] = $userCrypt;
    }
    $userCrypt = $userCryptCache[$login];

    $creditCards[] = [
        'id' => $item['id'],
        'login' => $login,
        'number' => $userCrypt->decrypt($item['number']),
        'exp' => $item['exp'],
        'cvv2' => $userCrypt->decrypt($item['number'])
    ];
}

printRow('Index', 'Login', 'Number', 'Exp', 'CVV2');
printRow('-----', '-----', '------', '---', '----');
foreach ($creditCards as $index => $card) {
    printRow($index, $card['login'], $card['number'], $card['exp'], $card['cvv2']);
}

$index = (int)readline('Enter card index: ');
if ($index < 0 || $index >= count($creditCards)) {
    throw new \RuntimeException('Invalid index.');
}

$card = $creditCards[$index];
$number = readline('Enter new number: ');
$exp = readline('Enter new exp: ');
$cvv2 = readline('Enter new CVV2: ');

$userCrypt = $userCryptCache[$card['login']];
$row = [
    'number' => $userCrypt->encrypt($number),
    'exp' => $exp,
    'cvv2' => $userCrypt->encrypt($cvv2)
];

request('PUT', 'admin/credit-cards/' . $card['id'], [
    RequestOptions::JSON => $row
]);
print 'OK.' . PHP_EOL;
