import { Injectable } from '@angular/core';

@Injectable()
export class AuthorizationService {

	public login: string = null;
	public token: string = null;

	public isAuthorized(): boolean {
		return !!this.token;
	}

	public logIn(login: string, token: string) {
		if (!login) {
			throw new Error('login is empty.');
		}
		if (!token) {
			throw new Error('token is empty.');
		}

		this.login = login;
		this.token = token;
	}

	public logOut() {
		this.login = null;
		this.token = null;
	}
}
