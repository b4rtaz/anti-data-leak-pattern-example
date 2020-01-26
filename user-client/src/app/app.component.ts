import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthorizationService } from './authorization.service';
import { EncryptionService } from './encryption.service';

@Component({
	selector: 'app-root',
	templateUrl: 'app.component.html'
})
export class AppComponent {

	public constructor(
		private readonly router: Router,
		private readonly authorizationService: AuthorizationService,
		private readonly encryptionService: EncryptionService) {
	}

	public get login(): string {
		return this.authorizationService.login;
	}

	public logOut() {
		this.encryptionService.deregisterAllKeys();
		this.authorizationService.logOut();
		this.router.navigateByUrl('/login');
	}
}
