import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CreditCardsComponent } from './credit-cards/credit-cards.component';
import { NewCreditCardComponent } from './credit-cards/new-credit-card.component';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { AuthorizationGuard } from './authorization.guard';

const routes: Routes = [{
		path: 'registration',
		component: RegistrationComponent
	}, {
		path: 'login',
		component: LoginComponent
	}, {
		path: 'credit-cards',
		component: CreditCardsComponent,
		canActivate: [ AuthorizationGuard ]
	}, {
		path: 'credit-cards/new',
		component: NewCreditCardComponent,
		canActivate: [ AuthorizationGuard ]
	}, {
		path: '**',
		redirectTo: 'login'
	}
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, {
			useHash: true
		})
	],
	exports: [
		RouterModule
	]
})
export class AppRoutingModule {
}
