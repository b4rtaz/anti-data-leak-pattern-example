import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { ApiHttpInterceptor } from './api-http-interceptor';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthorizationGuard } from './authorization.guard';
import { AuthorizationService } from './authorization.service';
import { CreditCardsComponent } from './credit-cards/credit-cards.component';
import { CreditCardsDataService } from './credit-cards/credit-cards.data-service';
import { NewCreditCardComponent } from './credit-cards/new-credit-card.component';
import { EncryptionService } from './encryption.service';
import { LoginComponent } from './login/login.component';
import { LoginDataService } from './login/login.data-service';
import { RegistrationComponent } from './registration/registration.component';
import { RegistrationDataService } from './registration/registration.data-service';

@NgModule({
	imports: [
		BrowserModule,
		FormsModule,
		ReactiveFormsModule,
		HttpClientModule,
		AppRoutingModule
	],
	declarations: [
		AppComponent,
		RegistrationComponent,
		LoginComponent,
		CreditCardsComponent,
		NewCreditCardComponent
	],
	bootstrap: [
		AppComponent
	],
	providers: [
		AuthorizationService,
		AuthorizationGuard,
		{
			provide: HTTP_INTERCEPTORS,
			useClass: ApiHttpInterceptor,
			multi: true
		},
		EncryptionService,
		LoginDataService,
		RegistrationDataService,
		CreditCardsDataService
	]
})
export class AppModule {
}
