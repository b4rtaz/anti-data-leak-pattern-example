<?php

error_reporting(E_ALL);

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\RequestOptions;
use Mdanter\Ecc\Crypto\Key\PrivateKeyInterface;
use Mdanter\Ecc\Crypto\Key\PublicKeyInterface;
use Mdanter\Ecc\Serializer\PrivateKey\DerPrivateKeyV0Serializer;
use Mdanter\Ecc\Serializer\PublicKey\DerPublicKeySerializer;

require './settings.php';
require 'vendor/autoload.php';
require 'DerPrivateKeyV0Serializer.php';

function parsePrivateKey(string $base64Key): PrivateKeyInterface {
    $privateKey = base64_decode($base64Key);
    $serializer = new DerPrivateKeyV0Serializer();
    return $serializer->parse($privateKey);
}

function parsePublicKey(string $base64Key): PublicKeyInterface {
    $publicKey = base64_decode($base64Key);
    $serializer = new DerPublicKeySerializer();
    return $serializer->parse($publicKey);
}

function deriveEncryptionKey(PrivateKeyInterface $privateKey, PublicKeyInterface $publicKey): string {
    $sharedKey = $privateKey->createExchange($publicKey)->calculateSharedKey();
    $maxBits = 528 / 8; // 528 is max for P-521 curve.
    $bytes = $publicKey->getGenerator()->getAdapter()->intToFixedSizeString($sharedKey, $maxBits);
    return hash('sha256', $bytes, true);
}

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

function decryptBase64Data(array $encryptedValue, string $adminEncryptionKey): string {
    if (!in_array('user', $encryptedValue['relation']) || !in_array('admin', $encryptedValue['relation'])) {
        throw new \RuntimeException('Cannot find supported relation in encrypted data.');
    }

    $bytes = base64_decode($encryptedValue['value']);
    $iv = substr($bytes, 0, 16);
    $data = substr($bytes, 16, strlen($bytes) - 16);
    $decrypted = openssl_decrypt($data, 'aes-256-cbc', $adminEncryptionKey, OPENSSL_RAW_DATA, $iv);
    if ($decrypted === false) {
        throw new \RuntimeException(openssl_error_string());
    }
    return $decrypted;
}

function encryptToBase64Data(string $data, string $encryptionKey): string {
    $iv = openssl_random_pseudo_bytes(16);
    $encrypted = openssl_encrypt($data, 'aes-256-cbc', $encryptionKey, OPENSSL_RAW_DATA, $iv);
    if ($encrypted === false) {
        throw new \RuntimeException(openssl_error_string());
    }
    return base64_encode($iv . $encrypted);
}

/////

$adminPrivateKey = parsePrivateKey($settings['adminPrivateKey']);

$wellKnownResponse = request('GET', 'admin/.well-known');
$backendPublickKey = parsePublicKey($wellKnownResponse['backendPublickKey']);
$backendEncryptionKey = deriveEncryptionKey($adminPrivateKey, $backendPublickKey);

$cardsResponse = request('GET', 'admin/credit-cards');

$creditCards = [];
$adminEncryptionKeysCache = [];
foreach ($cardsResponse['items'] as $item) {
    $login = $item['_user']['login'];

    if (!array_key_exists($login, $adminEncryptionKeysCache)) {
        $userPublicKey = parsePublicKey($item['_user']['publicKey']);
        $adminEncryptionKeysCache[$login] = deriveEncryptionKey($adminPrivateKey, $userPublicKey);
    }
    $adminEncryptionKey = $adminEncryptionKeysCache[$login];

    $creditCards[] = [
        'id' => $item['id'],
        'login' => $login,
        'number' => decryptBase64Data($item['number'], $adminEncryptionKey),
        'exp' => $item['exp'],
        'cvv2' => decryptBase64Data($item['number'], $adminEncryptionKey),
        'adminEncryptionKey' => $adminEncryptionKey
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

$row = [
    'number' => [[
        'relation' => ['admin', 'user'],
        'value' => encryptToBase64Data($number, $card['adminEncryptionKey'])
    ], [
        'relation' => ['admin', 'backend'],
        'value' => encryptToBase64Data($number, $backendEncryptionKey)
    ]],
    'exp' => $exp,
    'cvv2' => [[
        'relation' => ['admin', 'user'],
        'value' => encryptToBase64Data($cvv2, $card['adminEncryptionKey'])
    ], [
        'relation' => ['admin', 'backend'],
        'value' => encryptToBase64Data($cvv2, $backendEncryptionKey)
    ]],
];

request('PUT', 'admin/credit-cards/' . $card['id'], [
    RequestOptions::JSON => $row
]);
print 'Saved.' . PHP_EOL;
