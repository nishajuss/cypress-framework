import { byTestId } from './selectors';

class LoginPage {
  readonly path = '/';

  visit () {
    cy.visit(this.path);
  }

  usernameInput () {
    return cy.get(byTestId('username'));
  }

  passwordInput () {
    return cy.get(byTestId('password'));
  }

  loginButton () {
    return cy.get(byTestId('login-button'));
  }

  errorMessage () {
    return cy.get(byTestId('error'));
  }

  /** Fills and submits the login form. Empty values are left blank to support validation scenarios. */
  login (username: string, password: string) {
    this.usernameInput().clear();
    if (username) {
      this.usernameInput().type(username);
    }

    this.passwordInput().clear();
    if (password) {
      this.passwordInput().type(password, { log: false });
    }

    this.loginButton().click();
  }
}

export default new LoginPage();
