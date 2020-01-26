import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EncryptedValue } from '../encryption.model';

@Injectable()
export class CreditCardsDataService {

	public constructor(
		private readonly httpClient: HttpClient) {
	}

	public getCreditCards(): Promise<CreditCardsResponseBody> {
		return this.httpClient.get<CreditCardsResponseBody>('credit-cards').toPromise();
	}

	public async addCreditCard(requestBody: AddCreditCardRequestBody): Promise<void> {
		await this.httpClient.post('credit-cards', requestBody).toPromise();
	}
}

export interface CreditCardsResponseBody {
	items: CreditCardItem[];
}

export interface CreditCardItem {
	number: EncryptedValue;
	exp: string;
	cvv2: EncryptedValue;
}

export interface AddCreditCardRequestBody {
	number: EncryptedValue[];
	exp: string;
	cvv2: EncryptedValue[];
}
