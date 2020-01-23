import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class LoginDataService {

	public constructor(
		private readonly httpClient: HttpClient) {
	}

	public login(requestBody: LoginRequestBody): Promise<LoginResponseBody> {
		return this.httpClient.post<LoginResponseBody>('login', requestBody).toPromise();
	}
}

export interface LoginRequestBody {
	login: string;
	hashedPassword: string;
}

export interface LoginResponseBody {
	token: string;
	adminPublicKey: string;
	backendPublicKey: string;
	userPublicKey: string;
	userEncryptedPrivateKey: string;
}
