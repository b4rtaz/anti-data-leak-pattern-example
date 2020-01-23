import { App } from './app.po';

describe('core-ui App', () => {
	let page: App;

	beforeEach(() => {
		page = new App();
	});

	it('should display message saying app works', () => {
		page.navigateTo();
	});
});
