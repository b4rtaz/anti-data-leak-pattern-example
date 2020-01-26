import { AuthorizationService } from "./authorization.service";

describe('authorization-service', () => {

	it('isAuthorized method returns false after creating a service instance', () => {
		const service = new AuthorizationService();

		expect(service.isAuthorized()).toEqual(false);
	});

	it('isAuthorized method returns true after logIn method called', () => {
		const service = new AuthorizationService();

		const login = 'Harry';
		const token = 'T0K3N';
		service.logIn(login, token);

		expect(service.isAuthorized()).toEqual(true);
		expect(service.login).toEqual(login);
		expect(service.token).toEqual(token);
	});
});
