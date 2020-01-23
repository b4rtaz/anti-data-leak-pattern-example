
export class Base64 {

	public static encode(buffer: ArrayBuffer): string {
		return btoa(String.fromCharCode(...new Uint8Array(buffer)));
	}

	public static decode(data: string): ArrayBuffer {
		return Uint8Array.from(atob(data), c => c.charCodeAt(0));
	}
}
