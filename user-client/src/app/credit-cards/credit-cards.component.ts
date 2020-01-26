import { Component, OnInit } from '@angular/core';

import { EncryptionService } from '../encryption.service';
import { CreditCardItem, CreditCardsDataService } from './credit-cards.data-service';

@Component({
	templateUrl: 'credit-cards.component.html'
})
export class CreditCardsComponent implements OnInit {

	public items: DecryptedCreditCardItem[];

	public constructor(
		private readonly creditCardsDataService: CreditCardsDataService,
		private readonly encryptionService: EncryptionService) {
	}

	public async ngOnInit() {
		const response = await this.creditCardsDataService.getCreditCards();
		this.items = await Promise.all(response.items.map(i => this.decryptItem(i)));
	}

	private async decryptItem(item: CreditCardItem): Promise<DecryptedCreditCardItem> {
		return {
			number: await this.encryptionService.decrypt(item.number),
			exp: item.exp,
			cvv2: await this.encryptionService.decrypt(item.cvv2)
		};
	}
}

interface DecryptedCreditCardItem {
	number: string;
	exp: string;
	cvv2: string;
}
