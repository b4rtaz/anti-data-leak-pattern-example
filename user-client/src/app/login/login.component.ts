import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthorizationService } from '../authorization.service';
import { EncryptionService } from '../encryption.service';
import { AES } from '../utils/aes';
import { Base64 } from '../utils/base64';
import { ECDH } from '../utils/ecdh';
import { SHA256 } from '../utils/sha256';
import { LoginDataService, LoginRequestBody } from './login.data-service';

@Component({
	templateUrl: 'login.component.html'
})
export class LoginComponent {

	public isBusy = false;
	public error: string;
	public login: string;
	public password: string;

	public constructor(
		private readonly router: Router,
		private readonly loginDataService: LoginDataService,
		private readonly authorizationService: AuthorizationService,
		private readonly encryptionService: EncryptionService) {
	}

	public async submitForm() {
		if (!this.isBusy) {
			this.isBusy = true;
			this.error = null;
			try {
				if (this.validateForm()) {
					await this.tryLogin();
				} else {
					this.error = 'Please fill in required fields.';
				}
			} catch (e) {
				console.error(e);
				this.error = (e.error && e.error.reason)
					? e.error.reason
					: e.message;
			} finally {
				this.isBusy = false;
			}
		}
	}

	private validateForm(): boolean {
		return !!this.login && !!this.password;
	}

	private async tryLogin() {
		const privateHashedPasswordBytes = await SHA256.digest(this.password);
		const requestBody = await generateLoginRequestBody(this.login, privateHashedPasswordBytes);

		const responseBody = await this.loginDataService.login(requestBody);
		console.log('Logged in.');

		const userPrivateKey = await decryptAndImportUserPrivateKey(privateHashedPasswordBytes, responseBody.userEncryptedPrivateKey);
		console.log('User private key imported.');
		const adminPublicKey = await importPublicKey(responseBody.adminPublicKey);
		console.log('Admin public key imported.');
		const backendPublicKey = await importPublicKey(responseBody.backendPublicKey);
		console.log('Backend public key imported.');

		const adminEncryptionKey = await ECDH.deriveEncryptionKey(userPrivateKey, adminPublicKey);
		const backendEncryptionKey = await ECDH.deriveEncryptionKey(userPrivateKey, backendPublicKey);

		this.encryptionService.registerKey(['user', 'admin'], adminEncryptionKey);
		this.encryptionService.registerKey(['user', 'backend'], backendEncryptionKey);

		this.authorizationService.logIn(this.login, responseBody.token);

		await this.router.navigateByUrl('/credit-cards');
	}
}

async function generateLoginRequestBody(login: string, privateHashedPasswordBytes: ArrayBuffer): Promise<LoginRequestBody> {
	const hashedPasswordBytes = await SHA256.digest(privateHashedPasswordBytes);

	return {
		login,
		hashedPassword: Base64.encode(hashedPasswordBytes)
	};
}

async function decryptAndImportUserPrivateKey(
	privateHashedPasswordBytes: ArrayBuffer,
	userEncryptedPrivateKey: string): Promise<CryptoKey> {

	const userEncryptedPrivateKeyBytes = Base64.decode(userEncryptedPrivateKey);
	const privateKeyEncryptionKey = await AES.importKey(privateHashedPasswordBytes);
	const userPrivateKeyBytes = await AES.decrypt(privateKeyEncryptionKey, userEncryptedPrivateKeyBytes);

	return await ECDH.importPivateKey(userPrivateKeyBytes);
}

async function importPublicKey(publicKey: string): Promise<CryptoKey> {
	const publicKeyBytes = Base64.decode(publicKey);
	return await ECDH.importPublicKey(publicKeyBytes);
}
