import { EcdhJwkPkcs8Converter } from './ecdh-jwk-pkcs8-converter';
import { SHA256 } from './sha256';

export class ECDH {

	public static async generateKey(): Promise<CryptoKeyPair> {
		return await crypto.subtle.generateKey({
			name: 'ECDH',
			namedCurve: 'P-521'
		}, true, [
			'deriveBits'
		]);
	}

	public static async exportPrivateKey(privateKey: CryptoKey): Promise<ArrayBuffer> {
		const jwk = await crypto.subtle.exportKey('jwk', privateKey);
		// Firefox 72.0.1 doesn't support PKCS8 export format, so I use the converter.
		return EcdhJwkPkcs8Converter.toPkcs8(jwk);
	}

	public static async importPivateKey(privateKeyBytes: ArrayBuffer): Promise<CryptoKey> {
		const jwk = EcdhJwkPkcs8Converter.toJwk(new Uint8Array(privateKeyBytes));
		return await crypto.subtle.importKey('jwk', jwk, {
			name: 'ECDH',
			namedCurve: 'P-521'
		}, true, [
			'deriveBits'
		]);
	}

	public static async exportPublicKey(publicKey: CryptoKey): Promise<ArrayBuffer> {
		return await crypto.subtle.exportKey('spki', publicKey);
	}

	public static async importPublicKey(publicKeyBytes: ArrayBuffer): Promise<CryptoKey> {
		return await crypto.subtle.importKey('spki', publicKeyBytes, {
			name: 'ECDH',
			namedCurve: 'P-521'
		}, true, []);
	}

	public static async deriveEncryptionKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
		const bytes = await crypto.subtle.deriveBits({
			name: 'ECDH',
			public: publicKey
		}, privateKey, 528); // 528 is max for P-521 curve.
		const hash = await SHA256.digest(bytes);
		return await crypto.subtle.importKey('raw', hash, {
			name: 'AES-CBC',
			length: 256,
		}, false, [
			'encrypt',
			'decrypt'
		]);
	}
}
