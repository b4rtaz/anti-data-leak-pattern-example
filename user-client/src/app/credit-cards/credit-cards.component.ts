import { Component, OnInit } from '@angular/core';

import { AuthorizationService } from '../authorization.service';
import { AES } from '../utils/aes';
import { Base64 } from '../utils/base64';
import { CreditCardItem, CreditCardsDataService, EncryptedValue } from './credit-cards.data-service';

@Component({
	templateUrl: 'credit-cards.component.html'
})
export class CreditCardsComponent implements OnInit {

	public items: DecryptedCreditCardItem[];

	public constructor(
		private readonly creditCardsDataService: CreditCardsDataService,
		private readonly authorizationService: AuthorizationService) {
	}

	public async ngOnInit() {
		const response = await this.creditCardsDataService.getCreditCards();
		this.items = await Promise.all(response.items.map(i => this.decryptItem(i)));
	}

	private async decryptItem(item: CreditCardItem): Promise<DecryptedCreditCardItem> {
		return {
			number: await this.decryptData(item.number),
			exp: item.exp,
			cvv2: await this.decryptData(item.cvv2)
		};
	}

	private async decryptData(ev: EncryptedValue): Promise<string> {
		let key: CryptoKey;

		if (!ev.relation.includes('user')) {
			throw new Error('Cannot find a user relation in encrypted data.');
		}
		if (ev.relation.includes('admin')) {
			key = this.authorizationService.adminEncryptionKey;
		} else if (ev.relation.includes('backend')) {
			key = this.authorizationService.backendEncryptionKey;
		} else {
			throw new Error('Cannot find supported relation in encrypted data.');
		}

		const raw = Base64.decode(ev.value);
		return await AES.decryptText(key, raw);
	}
}

interface DecryptedCreditCardItem {
	number: string;
	exp: string;
	cvv2: string;
}
