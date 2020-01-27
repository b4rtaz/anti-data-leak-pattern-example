<?php

namespace AdminClient\Cryptography;

use AdminClient\Cryptography\DerPrivateKeyV0Serializer;
use Mdanter\Ecc\Crypto\Key\PrivateKeyInterface;
use Mdanter\Ecc\Crypto\Key\PublicKeyInterface;
use Mdanter\Ecc\Serializer\PublicKey\DerPublicKeySerializer;

class ECDH {

    public function parsePrivateKey(string $base64Key): PrivateKeyInterface {
        $privateKey = base64_decode($base64Key);
        $serializer = new DerPrivateKeyV0Serializer();
        return $serializer->parse($privateKey);
    }

    public function parsePublicKey(string $base64Key): PublicKeyInterface {
        $publicKey = base64_decode($base64Key);
        $serializer = new DerPublicKeySerializer();
        return $serializer->parse($publicKey);
    }

    public function deriveEncryptionKey(PrivateKeyInterface $privateKey, PublicKeyInterface $publicKey): string {
        $sharedKey = $privateKey->createExchange($publicKey)->calculateSharedKey();
        $maxBits = 528 / 8; // 528 is max for P-521 curve.
        $bytes = $publicKey->getGenerator()->getAdapter()->intToFixedSizeString($sharedKey, $maxBits);
        return hash('sha256', $bytes, true);
    }
}
