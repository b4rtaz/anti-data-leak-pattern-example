import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class RegistrationDataService {

	public constructor(
		private readonly httpClient: HttpClient) {
	}

	public async register(requestBody: RegistrationRequestBody): Promise<void> {
		await this.httpClient.post('register', requestBody).toPromise();
	}
}

export interface RegistrationRequestBody {
	login: string;
	hashedPassword: string;
	userPublicKey: string;
	userEncryptedPrivateKey: string;
}
