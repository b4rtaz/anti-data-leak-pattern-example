<?php

namespace AdminClient\Cryptography;

class Crypt {

    /**
     * @var array
     */
    private $_keys;

    public function __construct(array $keys = []) {
        $this->_keys = $keys;
    }

    public function registerKey(array $relation, string $key) {
        if (count($relation) !== 2) {
            throw new \RuntimeException('Invalid relation.');
        }
        if (strlen($key) !== 32) {
            throw new \RuntimeException('Invalid key size.');
        }
        $this->_keys[] = [
            'relation' => $relation,
            'key' => $key
        ];
    }

    public function clone(): Crypt {
        return new Crypt($this->_keys);
    }

    public function decrypt(array $encryptedValue): string {
        if (!array_key_exists('relation', $encryptedValue) ||
            !array_key_exists('value', $encryptedValue)) {
            throw new \RuntimeException('The encrypted value has invalid structure..');
        }

        $key = $this->findKeyByRelation($encryptedValue['relation']);

        $bytes = base64_decode($encryptedValue['value']);
        $iv = substr($bytes, 0, 16);
        $encryptedData = substr($bytes, 16, strlen($bytes) - 16);
        $text = openssl_decrypt($encryptedData, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
        if ($text === false) {
            throw new \RuntimeException(openssl_error_string());
        }
        return $text;
    }

    public function encrypt(string $text): array {
        $encryptedValue = [];
        foreach ($this->_keys as $kp) {
            $iv = openssl_random_pseudo_bytes(16);
            $encryptedData = openssl_encrypt($text, 'aes-256-cbc', $kp['key'], OPENSSL_RAW_DATA, $iv);
            if ($encryptedData === false) {
                throw new \RuntimeException(openssl_error_string());
            }
            $encryptedValue[] = [
                'relation' => $kp['relation'],
                'value' => base64_encode($iv . $encryptedData)
            ];
        }
        return $encryptedValue;
    }

    private function findKeyByRelation(array $relation): string {
        foreach ($this->_keys as $kp) {
            if (in_array($relation[0], $kp['relation']) &&
                in_array($relation[1], $kp['relation'])) {
                return $kp['key'];
            }
        }
        throw new \RuntimeException('Cannot find a supported relation.');
    }
}
