import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthorizationService } from './authorization.service';

@Injectable()
export class ApiHttpInterceptor implements HttpInterceptor {

	public constructor(
		private readonly authorizationService: AuthorizationService) {
	}

	public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		let headers = new HttpHeaders();
		if (this.authorizationService.isAuthorized()) {
			headers = headers.set('Authorization', 'Bearer ' + this.authorizationService.token);
		}

		const apiRequest = request.clone({
			url: '../../web-service/' + request.url,
			headers
		});
		return next.handle(apiRequest);
	}
}
