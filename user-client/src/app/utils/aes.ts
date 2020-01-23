
export class AES {

	public static async importKey(keyBytes: ArrayBuffer): Promise<CryptoKey> {
		return await crypto.subtle.importKey('raw', keyBytes, 'AES-CBC', false, [
			'decrypt',
			'encrypt'
		]);
	}

	public static async decrypt(key: CryptoKey, dataBytes: ArrayBuffer): Promise<ArrayBuffer> {
		const iv = dataBytes.slice(0, 16);
		const bytes = dataBytes.slice(16);
		return await crypto.subtle.decrypt({
			name: 'AES-CBC',
			iv
		}, key, bytes);
	}

	public static async decryptText(key: CryptoKey, dataBytes: ArrayBuffer): Promise<string> {
		const bytes = await this.decrypt(key, dataBytes);
		return new TextDecoder().decode(bytes);
	}

	public static async encrypt(key: CryptoKey, data: string | ArrayBuffer): Promise<ArrayBuffer> {
		if (typeof(data) === 'string') {
			data = new TextEncoder().encode(data);
		}
		const iv = crypto.getRandomValues(new Uint8Array(16));
		const encrypted = await crypto.subtle.encrypt({
			name: 'AES-CBC',
			iv
		}, key, data);

		const res = new Uint8Array(iv.length + encrypted.byteLength);
		res.set(iv);
		res.set(new Uint8Array(encrypted), iv.length);
		return res;
	}
}
