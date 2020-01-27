<?php

namespace AdminClient\Cryptography;

use FG\ASN1\ASNObject;
use FG\ASN1\Universal\Integer;
use FG\ASN1\Universal\ObjectIdentifier;
use FG\ASN1\Universal\OctetString;
use FG\ASN1\Universal\Sequence;
use Mdanter\Ecc\Crypto\Key\PrivateKeyInterface;
use Mdanter\Ecc\Serializer\PrivateKey\PrivateKeySerializerInterface;
use Mdanter\Ecc\Serializer\Util\CurveOidMapper;

/**
 * This serializer supports Chrome PKCS8 format.
 *
 * @author Bartlomiej Tadych <b4rtaz@gmail.com>
 */
class DerPrivateKeyV0Serializer implements PrivateKeySerializerInterface {

    public function serialize(PrivateKeyInterface $key): string {
        throw new \Exception('Not implemented.');
    }

    public function parse(string $formattedKey): PrivateKeyInterface {
        /* @var $rootSequence Sequence */
        $rootSequence = ASNObject::fromBinary($formattedKey);

        if (!($rootSequence instanceof Sequence) || $rootSequence->getNumberofChildren() !== 3) {
            throw new \RuntimeException('Invalid data.');
        }

        $rootChildren = $rootSequence->getChildren();
        /* @var $version Integer */
        $version = $rootChildren[0];

        if ($version->getContent() != 0) {
            throw new \RuntimeException('Invalid data: only version 0 is supported.');
        }

        /* @var $curveObjectIdentifier ObjectIdentifier */
        $curveObjectIdentifier = $rootChildren[1]->getChildren()[1];
        /* @var $octectString OctetString */
        $octectString = $rootChildren[2];
        $octectStringContent = $octectString->getBinaryContent();

        /* @var $octectSequence Sequence */
        $octectSequence = ASNObject::fromBinary($octectStringContent);

        $privateKey = gmp_init($octectSequence->getChildren()[1]->getContent(), 16);        

        $generator = CurveOidMapper::getGeneratorFromOid($curveObjectIdentifier);

        return $generator->getPrivateKeyFrom($privateKey);
    }
}
