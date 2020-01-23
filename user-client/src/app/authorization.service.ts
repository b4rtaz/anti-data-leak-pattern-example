import { Injectable } from '@angular/core';

@Injectable()
export class AuthorizationService {

	public login: string;
	public token: string;
	public adminEncryptionKey: CryptoKey;
	public backendEncryptionKey: CryptoKey;

	public isAuthorized(): boolean {
		return !!this.token;
	}

	public logIn(login: string, token: string, adminEncryptionKey: CryptoKey, backendEncryptionKey: CryptoKey) {
		if (!login) {
			throw new Error('login is empty.');
		}
		if (!token) {
			throw new Error('token is empty.');
		}
		if (!adminEncryptionKey) {
			throw new Error('adminEncryptionKey is empty.');
		}
		if (!backendEncryptionKey) {
			throw new Error('backendEncryptionKey is empty.');
		}

		this.login = login;
		this.token = token;
		this.adminEncryptionKey = adminEncryptionKey;
		this.backendEncryptionKey = backendEncryptionKey;
	}

	public logOut() {
		this.login = null;
		this.token = null;
		this.adminEncryptionKey = null;
		this.backendEncryptionKey = null;
	}
}
