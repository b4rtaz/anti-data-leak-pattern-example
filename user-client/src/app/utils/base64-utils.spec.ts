import { Base64 } from './base64';

describe('base64', () => {

	it('should decode example base64 text to expected value', () => {
		const bytes = Base64.decode('MTI=');
		expect(bytes.byteLength).toEqual(2);
		expect(bytes[0]).toEqual('1'.charCodeAt(0));
		expect(bytes[1]).toEqual('2'.charCodeAt(0));
	});

	it('should encode example text to expected base64 value', () => {
		const bytes = new TextEncoder().encode('12');
		const b64 = Base64.encode(bytes);

		expect(b64).toEqual('MTI=');
	});
});
