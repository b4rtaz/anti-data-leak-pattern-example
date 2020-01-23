import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AES } from '../utils/aes';
import { Base64 } from '../utils/base64';
import { ECDH } from '../utils/ecdh';
import { SHA256 } from '../utils/sha256';
import { RegistrationDataService, RegistrationRequestBody } from './registration.data-service';

@Component({
	templateUrl: 'registration.component.html'
})
export class RegistrationComponent {

	public isBusy = false;
	public error: string;
	public login: string;
	public password: string;

	public constructor(
		private readonly router: Router,
		private readonly registrationDataService: RegistrationDataService) {
	}

	public async submitForm() {
		if (!this.isBusy) {
			this.isBusy = true;
			this.error = null;
			try {
				if (this.validateForm()) {
					await this.tryRegister();
				} else {
					this.error = 'Please fill in required fields.';
				}
			} catch (e) {
				console.error(e);
				this.error = (e.error && e.error.exception)
					? e.error.exception[0].message
					: e.message;
			} finally {
				this.isBusy = false;
			}
		}
	}

	private validateForm(): boolean {
		return !!this.login && !!this.password;
	}

	private async tryRegister() {
		const requestBody = await generateRegistrationRequestBody(this.login, this.password);
		await this.registrationDataService.register(requestBody);
		await this.router.navigateByUrl('/login');
	}
}

async function generateRegistrationRequestBody(login: string, plainPassword: string): Promise<RegistrationRequestBody> {
	const privateHashedPasswordBytes = await SHA256.digest(plainPassword);
	const hashedPasswordBytes = await SHA256.digest(privateHashedPasswordBytes);

	const key = await ECDH.generateKey();

	const userPrivateKeyBytes = await ECDH.exportPrivateKey(key.privateKey);
	const userPublicKeyBytes = await ECDH.exportPublicKey(key.publicKey);

	console.log('userPrivateKey', Base64.encode(userPrivateKeyBytes));
	console.log('userPublicKey', Base64.encode(userPublicKeyBytes));

	const privateKeyEncryptionKey = await AES.importKey(privateHashedPasswordBytes);
	const userEncryptedPrivateKeyBytes = await AES.encrypt(privateKeyEncryptionKey, userPrivateKeyBytes);

	return {
		login,
		hashedPassword: Base64.encode(hashedPasswordBytes),
		userPublicKey: Base64.encode(userPublicKeyBytes),
		userEncryptedPrivateKey: Base64.encode(userEncryptedPrivateKeyBytes)
	};
}
