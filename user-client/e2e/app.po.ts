import { browser } from 'protractor';

export class App {

	public navigateTo() {
		return browser.get('/');
	}
}
