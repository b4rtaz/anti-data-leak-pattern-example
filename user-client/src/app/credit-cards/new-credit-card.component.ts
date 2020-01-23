import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthorizationService } from '../authorization.service';
import { AES } from '../utils/aes';
import { Base64 } from '../utils/base64';
import { AddCreditCardRequestBody, CreditCardsDataService } from './credit-cards.data-service';

@Component({
	templateUrl: 'new-credit-card.component.html'
})
export class NewCreditCardComponent implements OnInit {

	public isBusy = false;
	public error: string;
	public form: FormGroup;

	public constructor(
		private readonly router: Router,
		private readonly creditCardDataService: CreditCardsDataService,
		private readonly authorizationService: AuthorizationService) {
	}

	public ngOnInit() {
		this.form = new FormGroup({
			'number': new FormControl('', [
				Validators.required,
				Validators.maxLength(16)
			]),
			'exp': new FormControl('', [
				Validators.required,
				Validators.maxLength(5)
			]),
			'cvv2': new FormControl('', [
				Validators.required,
				Validators.maxLength(3)
			])
		});
	}

	public async submitForm() {
		if (!this.isBusy) {
			this.isBusy = true;
			this.error = null;
			try {
				if (this.form.valid) {
					await this.add();
				} else {
					this.error = 'Please fill in required fields.';
				}
			} catch (e) {
				console.error(e);
				this.error = e.message;
			} finally {
				this.isBusy = false;
			}
		}
	}

	private async add() {
		const requestBody = await generateAddCreditCardRequestBody(
			this.form.get('number').value,
			this.form.get('exp').value,
			this.form.get('cvv2').value,
			this.authorizationService.adminEncryptionKey,
			this.authorizationService.backendEncryptionKey);

		await this.creditCardDataService.addCreditCard(requestBody);

		await this.router.navigateByUrl('/credit-cards');
	}
}

async function generateAddCreditCardRequestBody(
	cardNumber: string,
	exp: string,
	cvv2: string,
	adminEncryptionKey: CryptoKey,
	backendEncryptionKey: CryptoKey): Promise<AddCreditCardRequestBody> {

	return {
		number: [
			{
				relation: ['user', 'admin'],
				value: Base64.encode(await AES.encrypt(adminEncryptionKey, cardNumber))
			},
			{
				relation: ['user', 'backend'],
				value: Base64.encode(await AES.encrypt(backendEncryptionKey, cardNumber))
			}
		],
		exp,
		cvv2: [
			{
				relation: ['user', 'admin'],
				value: Base64.encode(await AES.encrypt(adminEncryptionKey, cvv2))
			},
			{
				relation: ['user', 'backend'],
				value: Base64.encode(await AES.encrypt(adminEncryptionKey, cvv2))
			}
		]
	};
}
