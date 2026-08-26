Cypress.Commands.add('login' as any, () => {
  cy.intercept('POST', '**/api/login').as('login');
  cy.visit('/');
  cy.get('[data-cy="navbar-login"]').click();
  cy.get('[data-cy="login-form-email"]')
    .focus()
    .type('admin@localcrag.invalid.org');
  cy.get('[data-cy="login-form-password"] input').focus().type('admin');
  cy.get('[data-cy="login-form-submit"]').click();
  cy.wait('@login').its('response.statusCode').should('eq', 202);
  cy.getCookie('lc_session').should('exist');
  cy.getCookie('lc_csrf').should('exist');
  // Ensure we left the login page. Use inclusion check so tests work with any baseUrl.
  cy.url().should('not.include', '/login');
});
