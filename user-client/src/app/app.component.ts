import { Component } from '@angular/core';
import { AuthorizationService } from './authorization.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-root',
	templateUrl: 'app.component.html'
})
export class AppComponent {

	public constructor(
		private readonly router: Router,
		private readonly authorizationService: AuthorizationService) {
	}

	public get login(): string {
		return this.authorizationService.login;
	}

	public logOut() {
		this.authorizationService.logOut();
		this.router.navigateByUrl('/login');
	}
}
