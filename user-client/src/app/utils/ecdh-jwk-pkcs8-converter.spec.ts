import { decodeJwkBase64, EcdhJwkPkcs8Converter } from './ecdh-jwk-pkcs8-converter';

describe('ecdh-jwt-pkcs8-converter', () => {

	const examples = [
		{
			// tslint:disable-next-line:max-line-length
			jwk: '{"crv":"P-521","d":"AH_abaPtUV3uSEYtl1vyU0l7dQPVOpftVwsotK4Ia0TK1O4aWoom9atA_B5yzLky-62ZZKlhpfYWpFMRkI_iuIYv","ext":true,"key_ops":["deriveBits"],"kty":"EC","x":"AUb3bP5CKY4wpH78M3_PaLL-c91lMGz9tPEAFVM0nhW33ZNHqTqhxmUZDjkx0yPY6pq16_2OiicdahGVTYuN9cms","y":"Adkir6bZwRf2kkeH9BvCVAUZxj5kyfgZhXoCKMh29JFcLuJFUTGHJituKV-Tvx7vRyPkOeCcGHwMUhUoM-e3bptb"}',
			// tslint:disable-next-line:max-line-length
			pkcs8: 'MIHuAgEAMBAGByqGSM49AgEGBSuBBAAjBIHWMIHTAgEBBEIAf9pto+1RXe5IRi2XW/JTSXt1A9U6l+1XCyi0rghrRMrU7hpaiib1q0D8HnLMuTL7rZlkqWGl9hakUxGQj+K4hi+hgYkDgYYABAFG92z+QimOMKR+/DN/z2iy/nPdZTBs/bTxABVTNJ4Vt92TR6k6ocZlGQ45MdMj2Oqatev9joonHWoRlU2LjfXJrAHZIq+m2cEX9pJHh/QbwlQFGcY+ZMn4GYV6AijIdvSRXC7iRVExhyYrbilfk78e70cj5DngnBh8DFIVKDPnt26bWw=='
		},
		{
			// tslint:disable-next-line:max-line-length
			jwk: '{"crv":"P-521","d":"APSLYM1UNQkfIK94fznsiUBoEe5NI2j6VrtiweyPglRQux5raGIRtqAdxFwwsHcZ7HPEjNXkYbkAi_RP32v-oqhl","ext":true,"key_ops":["deriveBits"],"kty":"EC","x":"AMIr7k-CHdxN0lTD_Sm0y7dgpOPFuXbka8-QeMIl2PawLxAeCZ1VjSmE3P3Qr5GcUhpY0ZXUNIicR8G5TSav304L","y":"AIWBNQZD6IM_aByr0bcrtiqgHDroWxX_URhZhSv8MW3RRJgy0JFIPrnJy6o8l1yvfQFU84MHnyfpsVeodqI21x6I"}',
			// tslint:disable-next-line:max-line-length
			pkcs8: 'MIHuAgEAMBAGByqGSM49AgEGBSuBBAAjBIHWMIHTAgEBBEIA9ItgzVQ1CR8gr3h/OeyJQGgR7k0jaPpWu2LB7I+CVFC7HmtoYhG2oB3EXDCwdxnsc8SM1eRhuQCL9E/fa/6iqGWhgYkDgYYABADCK+5Pgh3cTdJUw/0ptMu3YKTjxbl25GvPkHjCJdj2sC8QHgmdVY0phNz90K+RnFIaWNGV1DSInEfBuU0mr99OCwCFgTUGQ+iDP2gcq9G3K7YqoBw66FsV/1EYWYUr/DFt0USYMtCRSD65ycuqPJdcr30BVPODB58n6bFXqHaiNtceiA=='
		},
		{
			// tslint:disable-next-line:max-line-length
			jwk: '{"crv":"P-384","d":"nFTUbIl2oCiFo-5qJyg_mNahsFFo0WLCd1aTK58tZ7ODC2YeF3-umTwUQokWvIvA","ext":true,"key_ops":["deriveBits"],"kty":"EC","x":"9BGNzaCyWOuic1HMhGixQnCbGShvfpZyY0ytq19xhHoR4rVTh3oCKpePdE2_68uv","y":"CY5xExBmWHITFV9e5-z2MoxKD1uWCRcaJ5lqASzSzCYj4QvWSzH6epLEoDekrOz-"}',
			// tslint:disable-next-line:max-line-length
			pkcs8: 'MIG2AgEAMBAGByqGSM49AgEGBSuBBAAiBIGeMIGbAgEBBDCcVNRsiXagKIWj7monKD+Y1qGwUWjRYsJ3VpMrny1ns4MLZh4Xf66ZPBRCiRa8i8ChZANiAAT0EY3NoLJY66JzUcyEaLFCcJsZKG9+lnJjTK2rX3GEehHitVOHegIql490Tb/ry68JjnETEGZYchMVX17n7PYyjEoPW5YJFxonmWoBLNLMJiPhC9ZLMfp6ksSgN6Ss7P4='
		},
		{
			// tslint:disable-next-line:max-line-length
			jwk: '{"crv":"P-384","d":"z6pJC-UoWyxht_CMxdCVWgbKtO2EQEZw1r2EfmEOS92Tc02qxQnt7XI18JgOd9S9","ext":true,"key_ops":["deriveBits"],"kty":"EC","x":"w_HhIbEnD84jaqNbZ15-myz1VwWB68hZJh0jB10mBq6MaB-gFEKfiOlqY2mZVmNJ","y":"WQFKcnl37E_lTNlDh4A2sEbRc-ygH0dJJ1esK4pmSKItMYZqZm11-Du2LFQoNrBT"}',
			// tslint:disable-next-line:max-line-length
			pkcs8: 'MIG2AgEAMBAGByqGSM49AgEGBSuBBAAiBIGeMIGbAgEBBDDPqkkL5ShbLGG38IzF0JVaBsq07YRARnDWvYR+YQ5L3ZNzTarFCe3tcjXwmA531L2hZANiAATD8eEhsScPziNqo1tnXn6bLPVXBYHryFkmHSMHXSYGroxoH6AUQp+I6WpjaZlWY0lZAUpyeXfsT+VM2UOHgDawRtFz7KAfR0knV6wrimZIoi0xhmpmbXX4O7YsVCg2sFM='
		},
		{
			// tslint:disable-next-line:max-line-length
			jwk: '{"crv":"P-256","d":"Jgq0uUaBoQtWZ6fCnEZJVsOi20wKQgXfVw05v2fSKvw=","ext":true,"key_ops":["deriveBits"],"kty":"EC","x":"Nq-2OC7PjY_qDSYQo8bhWxGWWOcHz2UO1dYnoGMblaI=","y":"v7fBdgQJ_loN3B5-cjIttJfMKGg8HWh1hUTpdSXcZ-4="}',
			// tslint:disable-next-line:max-line-length
			pkcs8: 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgJgq0uUaBoQtWZ6fCnEZJVsOi20wKQgXfVw05v2fSKvyhRANCAAQ2r7Y4Ls+Nj+oNJhCjxuFbEZZY5wfPZQ7V1iegYxuVor+3wXYECf5aDdwefnIyLbSXzChoPB1odYVE6XUl3Gfu'
		},
		{
			// tslint:disable-next-line:max-line-length
			jwk: '{"crv":"P-256","d":"I9M0nhXfPZFeYWNdNNO-0lBOSnwTCJHB94PWBrPnge4=","ext":true,"key_ops":["deriveBits"],"kty":"EC","x":"jRSPrkfWZxK0kfs7wiigPMIjR3Inulta8zzmtl4IaZc=","y":"nGMD1fzyCm9enN4rkOlEWu06VWPS_xuwk-CYZCZfDXE="}',
			// tslint:disable-next-line:max-line-length
			pkcs8: 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgI9M0nhXfPZFeYWNdNNO+0lBOSnwTCJHB94PWBrPnge6hRANCAASNFI+uR9ZnErSR+zvCKKA8wiNHcie6W1rzPOa2Xghpl5xjA9X88gpvXpzeK5DpRFrtOlVj0v8bsJPgmGQmXw1x'
		}
	];

	it('should convert jwk to expected pkcs8 value', () =>  {
		examples.forEach(example => {
			const pkcs8 = decodeJwkBase64(example.pkcs8);
			const jwk = JSON.parse(example.jwk) as JsonWebKey;

			const converted = EcdhJwkPkcs8Converter.toPkcs8(jwk);

			expect(converted).toEqual(pkcs8);
		});
	});

	it('should convert pkcs8 to expected jwk', () => {
		examples.forEach(example => {
			const pkcs8 = decodeJwkBase64(example.pkcs8);
			const jwk = JSON.parse(example.jwk) as JsonWebKey;

			const c = EcdhJwkPkcs8Converter.toJwk(pkcs8 as Uint8Array);

			expect(c).toEqual(jwk);
		});
	});

	// This test doesn't work in Firefox 72.0.1.
	it('could import converted pkcs8 key by crypto.subtle (Chrome only)', async () => {
		for (const example of examples) {
			const jwk = JSON.parse(example.jwk) as JsonWebKey;
			const pkcs8 = EcdhJwkPkcs8Converter.toPkcs8(jwk);

			const key = await crypto.subtle.importKey('pkcs8', pkcs8, {
				name: 'ECDH',
				namedCurve: jwk.crv
			}, true, [ 'deriveBits' ]);

			expect(key).not.toBeNull();
		}
	});
});
