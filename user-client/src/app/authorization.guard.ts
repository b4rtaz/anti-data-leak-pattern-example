import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

import { AuthorizationService } from './authorization.service';

@Injectable()
export class AuthorizationGuard implements CanActivate {

	public constructor(
		private readonly router: Router,
		private readonly authorizationService: AuthorizationService) {
	}

	public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
		if (!this.authorizationService.isAuthorized()) {
			this.router.navigateByUrl('/login');
			return false;
		}
		return true;
	}
}
