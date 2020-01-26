import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { EncryptionService } from '../encryption.service';
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
		private readonly encryptionService: EncryptionService) {
	}

	public ngOnInit() {
		this.form = new FormGroup({
			number: new FormControl('', [
				Validators.required,
				Validators.maxLength(16)
			]),
			exp: new FormControl('', [
				Validators.required,
				Validators.maxLength(5)
			]),
			cvv2: new FormControl('', [
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
		const num = this.form.get('number').value;
		const exp = this.form.get('exp').value;
		const cvv2 = this.form.get('cvv2').value;

		const requestBody: AddCreditCardRequestBody = {
			number: await this.encryptionService.encrypt(num),
			exp,
			cvv2: await this.encryptionService.encrypt(cvv2)
		};

		await this.creditCardDataService.addCreditCard(requestBody);

		await this.router.navigateByUrl('/credit-cards');
	}
}
