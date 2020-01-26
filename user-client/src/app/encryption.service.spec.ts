import { EncryptionService } from './encryption.service';
import { AES } from './utils/aes';

describe('encryption-service', () => {

	function randomAesCbcKey(): Promise<CryptoKey> {
		const randomKey = crypto.getRandomValues(new Uint8Array(32));
		return AES.importKey(randomKey);
	}

	it('two same relations throw error', async () => {
		try {
			const service = new EncryptionService();
			service.registerKey(['user', 'admin'], await randomAesCbcKey());
			service.registerKey(['user', 'admin'], await randomAesCbcKey());

			fail('Expected exception.');
		} catch (e) {
			expect(e.message).toEqual('This relation is already used.');
		}
	});

	it('encrypt method generates correct amount of encrypted pairs', async () => {
		const service = new EncryptionService();
		service.registerKey(['john', 'abby'], await randomAesCbcKey());
		service.registerKey(['john', 'ada'], await randomAesCbcKey());

		const encrypted = await service.encrypt('example');

		expect(encrypted.length).toEqual(2);
		expect(encrypted[0].relation).toContain('abby');
		expect(encrypted[1].relation).toContain('ada');
	});

	it('encrypt / decrypt method test flow', async () => {
		const service = new EncryptionService();
		service.registerKey(['bart', 'john'], await randomAesCbcKey());

		const plain = 'lorem ipsum';
		const encrypted = await service.encrypt(plain);

		const decrypted = await service.decrypt(encrypted[0]);

		expect(plain).toEqual(decrypted);
	});

	it('can deregister all keys', async () => {
		const service = new EncryptionService();
		expect(service.getKeysCount()).toEqual(0);

		service.registerKey(['bart', 'john'], await randomAesCbcKey());

		expect(service.getKeysCount()).toEqual(1);

		service.deregisterAllKeys();

		expect(service.getKeysCount()).toEqual(0);
	});
});
