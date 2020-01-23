export class SHA256 {

	public static async digest(data: string | ArrayBuffer): Promise<ArrayBuffer> {
		if (typeof(data) === 'string') {
			data = new TextEncoder().encode(data);
		}
		return await crypto.subtle.digest('SHA-256', data);
	}
}
