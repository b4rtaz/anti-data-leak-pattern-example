import { Injectable } from '@angular/core';

import { EncryptedValue } from './encryption.model';
import { AES } from './utils/aes';
import { Base64 } from './utils/base64';

@Injectable()
export class EncryptionService {

	private readonly keys: EncryptionKey[] = [];

	public registerKey(relation: string[], key: CryptoKey) {
		if (!relation || relation.length !== 2) {
			throw new Error('relation is empty or invalid.');
		}
		if (!key) {
			throw new Error('key is empty.');
		}
		if (this.tryFindKeyByRelation(relation)) {
			throw new Error('This relation is already used.');
		}
		this.keys.push({ relation, key });
	}

	public deregisterAllKeys() {
		this.keys.length = 0;
	}

	public getKeysCount(): number {
		return this.keys.length;
	}

	public async decrypt(encryptedValue: EncryptedValue): Promise<string> {
		if (!encryptedValue) {
			throw new Error('encryptedValue is empty.');
		}

		const encryptionKey = this.tryFindKeyByRelation(encryptedValue.relation);
		if (!encryptionKey) {
			throw new Error('Cannot find a supported relation in the encrypted data.');
		}

		const raw = Base64.decode(encryptedValue.value);
		return await AES.decryptText(encryptionKey.key, raw);
	}

	public async encrypt(value: string): Promise<EncryptedValue[]> {
		if (!value) {
			throw new Error('data is empty.');
		}

		return await Promise.all(this.keys.map(async (ek) => {
			return {
				relation: ek.relation,
				value: Base64.encode(await AES.encrypt(ek.key, value))
			};
		}));
	}

	private tryFindKeyByRelation(relation: string[]): EncryptionKey {
		return this.keys.find(ek =>
			(relation.includes(ek.relation[0]) &&
			(relation.includes(ek.relation[1]))));
	}
}

interface EncryptionKey {
	relation: string[];
	key: CryptoKey;
}
