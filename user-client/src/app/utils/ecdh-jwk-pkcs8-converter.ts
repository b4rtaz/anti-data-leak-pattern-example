
/**
 * Single file PKCS8 <> JsonWebKey converter for private ECDH key.
 * It supports only version 0 (Chrome uses this).
 *
 * @author Bartlomiej Tadych <b4rtaz@gmail.com>
 */
export class EcdhJwkPkcs8Converter {

	public static toPkcs8(privateKey: JsonWebKey): Uint8Array {
		if (!privateKey) {
			throw new Error('privateKey is empty.');
		}

		const d = decodeJwkBase64(privateKey.d);
		const x = decodeJwkBase64(privateKey.x);
		const y = decodeJwkBase64(privateKey.y);

		return writePkcs8({ curveName: privateKey.crv, d, x, y });
	}

	public static toJwk(privateKey: Uint8Array, opts: string[] = null): JsonWebKey {
		if (!privateKey) {
			throw new Error('privateKey is empty.');
		}

		const data = readPkcs8(privateKey);
		return {
			crv: data.curveName,
			ext: true,
			key_ops: opts || ['deriveBits'],
			kty: 'EC',
			d: encodeJwkBase64(data.d),
			x: encodeJwkBase64(data.x),
			y: encodeJwkBase64(data.y)
		};
	}
}

const ecdsaOid = [ 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01 ]; // 1.2.840.10045.2.1

const supportedCurves: CurveInfo[] = [
	{
		name: 'P-521',
		oid: [ 0x2B, 0x81, 0x04, 0x00, 0x23 ] // 1.3.132.0.35
	},
	{
		name: 'P-384',
		oid: [ 0x2B, 0x81, 0x04, 0x00, 0x22 ] // 1.3.132.0.34
	},
	{
		name: 'P-256',
		oid: [ 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01, 0x07 ] // 1.2.840.10045.3.1.7
	}
];

interface CurveInfo {
	name: string;
	oid: number[];
}

function writePkcs8(data: Pkcs8Data): Uint8Array {
	const writer = new Asn1Writer();
	writer.writeBytes(data.y);
	writer.writeBytes(data.x);

	// TODO: two magic bytes. What is this?
	writer.write(4);
	writer.write(0);

	writer.writeLength(writer.buffer.length);
	writer.write(0x03);

	writer.writeLength(writer.buffer.length);
	writer.write(0xA1);

	writer.writeBytes(data.d);
	writer.writeLength(data.d.length);
	writer.write(0x04);

	writer.write(1);
	writer.writeLength(1);
	writer.write(0x02);

	writer.writeLength(writer.buffer.length);
	writer.write(0x30);

	writer.writeLength(writer.buffer.length);
	writer.write(0x04);

	const p = writer.buffer.length;
	const curve = supportedCurves.find(c => c.name === data.curveName);
	if (!curve) {
		throw new Error('Curve not supported.');
	}

	writer.writeBytes(curve.oid);
	writer.writeLength(curve.oid.length);
	writer.write(0x06);

	writer.writeBytes(ecdsaOid);
	writer.writeLength(ecdsaOid.length);
	writer.write(0x06);

	writer.writeLength(writer.buffer.length - p);
	writer.write(0x30);

	writer.write(0); // Version.
	writer.writeLength(1);
	writer.write(0x02);

	writer.writeLength(writer.buffer.length);
	writer.write(0x30); // SEQUENCE[0]
	return writer.close();
}

function readPkcs8(buffer: Uint8Array): Pkcs8Data {
	const reader = new Asn1Reader(buffer);

	function assert(result: boolean, message: string) {
		if (!result) {
			throw new Error(message);
		}
	}

	assert(reader.read() === 0x30, 'SEQUENCE[0]');
	const seqLen = reader.readLength();
	assert(seqLen + reader.index === buffer.byteLength, 'Invalid sequence length.');

	assert(reader.read() === 0x02, 'INTEGER[0]');
	const versionSize = reader.readLength();
	assert(versionSize === 1, 'Invalid version size.');
	assert(buffer[reader.index] === 0x00, 'Version not supported.');
	reader.skip(versionSize);

	assert(reader.read() === 0x30, 'SEQUENCE[1]');
	reader.readLength();

	assert(reader.read() === 0x06, 'OBJECT IDENTIFIER[0]');
	const ecdsaLen = reader.readLength();
	assert(reader.compare(ecdsaOid), 'ECDSA OID');
	reader.skip(ecdsaLen);

	assert(reader.read() === 0x06, 'OBJECT IDENTIFIER[1]');
	const curveLen = reader.readLength();
	const curve = supportedCurves.find(c => reader.compare(c.oid));
	assert(!!curve, 'Curve not supported.');
	reader.skip(curveLen);

	assert(reader.read() === 0x04, 'OCTET STRING[0]');
	reader.readLength();
	assert(reader.read() === 0x30, 'SEQUENCE[2]');
	reader.readLength();
	assert(reader.read() === 0x02, 'INTEGER[1]');
	reader.skip(reader.readLength());

	assert(reader.read() === 0x04, 'OCTET STRING[1]');
	const dLen = reader.readLength();
	const d = buffer.slice(reader.index, reader.index + dLen);
	reader.skip(dLen);

	assert(reader.read() === 0xA1, '0xA1');
	reader.readLength();
	assert(reader.read() === 0x03, 'BIT STRING');
	const pubLen = reader.readLength();
	const pubIndex = reader.index + 2;
	const pubHalfSize = (pubLen - 2) / 2;
	const x = buffer.slice(pubIndex, pubIndex + pubHalfSize);
	const y = buffer.slice(pubIndex + pubHalfSize);
	reader.skip(pubLen);

	assert(reader.index === buffer.byteLength, 'Invalid total length.');

	return { curveName: curve.name, d, x, y };
}

interface Pkcs8Data {
	curveName: string;
	d: Uint8Array;
	x: Uint8Array;
	y: Uint8Array;
}

class Asn1Reader {

	public index = 0;

	public constructor(
		private readonly buffer: ArrayBuffer) {
	}

	public read(): number {
		return this.buffer[this.index++];
	}

	public readLength(): number {
		const initial = this.buffer[this.index++];
		if (!(initial & 0x80)) {
			return initial;
		}
		const octets = initial & 0xf;
		let size = 0;
		for (let i = 0, off = this.index; i < octets; i++, off++) {
			size <<= 8;
			size |= this.buffer[off];
		}
		this.index += octets;
		return size;
	}

	public compare(bytes: number[]): boolean {
		for (let i = 0; i < bytes.length; i++) {
			if (this.buffer[this.index + i] !== bytes[i]) {
				return false;
			}
		}
		return true;
	}

	public skip(length: number) {
		this.index += length;
	}
}

class Asn1Writer {

	public readonly buffer: number[] = [];

	public writeBytes(bytes: Uint8Array | number[]) {
		for (let i = bytes.length - 1; i >= 0; i--) {
			this.buffer.push(bytes[i]);
		}
	}

	public write(value: number) {
		this.buffer.push(value);
	}

	public writeLength(length: number) {
		if (length < 0x80) {
			this.buffer.push(length);
			return;
		}
		let octets = 1 + (Math.log(length) / Math.LN2 >>> 3);
		const bytes = [octets | 0x80];
		while (--octets) {
			bytes.push((length >>> (octets << 3)) & 0xff);
		}
		bytes.push(length);
		this.writeBytes(bytes);
	}

	public close(): Uint8Array {
		this.buffer.reverse();
		return new Uint8Array(this.buffer);
	}
}

export function decodeJwkBase64(text: string): Uint8Array {
	return Uint8Array.from(atob(text
		.replace(/-/g, '+')
		.replace(/_/g, '/')), c => c.charCodeAt(0));
}

export function encodeJwkBase64(buffer: Uint8Array): string {
	return btoa(String.fromCharCode(...new Uint8Array(buffer)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
}
