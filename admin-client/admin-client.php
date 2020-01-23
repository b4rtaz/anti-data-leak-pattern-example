<?php

error_reporting(E_STRICT);

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

function execGetRequest(string $url, string $token, bool $veryfy): array {
    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token
    ]);
    if (!$veryfy) {
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
    }

    $data = curl_exec($curl);
    if ($data === false) {
        throw new \RuntimeException(curl_error($curl));
    }
    $info = curl_getinfo($curl);
    if ($info['http_code'] !== 200) {
        throw new RuntimeException('Invalid api reponse code.');
    }
    return json_decode($data, true);
}

function printRow(string $col1, string $col2, string $col3, string $col4) {
    print sprintf('%14s %20s %10s %10s', $col1, $col2, $col3, $col4);
    print PHP_EOL;
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

$adminPrivateKey = parsePrivateKey($settings['adminPrivateKey']);

$requestUrl = $settings['apiBaseUrl'] . '/admin/credit-cards';
$response = execGetRequest($requestUrl, $settings['adminApiToken'], $settings['verifySSL']);

$adminEncryptionKeysCache = [];

printRow('Login', 'Number', 'Exp', 'CVV2');
printRow('-----', '------', '---', '----');
foreach ($response['items'] as $item) {
    $login = $item['login'];

    if (!array_key_exists($login, $adminEncryptionKeysCache)) {
        $userPublicKey = parsePublicKey($item['publickKey']);
        $adminEncryptionKeysCache[$login] = deriveEncryptionKey($adminPrivateKey, $userPublicKey);
    }
    $adminEncryptionKey = $adminEncryptionKeysCache[$login];

    $number = decryptBase64Data($item['number'], $adminEncryptionKey);
    $cvv2 = decryptBase64Data($item['cvv2'], $adminEncryptionKey);

    printRow($login, $number, $item['exp'], $cvv2);
}
