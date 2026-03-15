Cypress.Commands.add('login' as any, () => {
  cy.visit('/');
  cy.get('[data-cy="navbar-login"]').click();
  cy.get('[data-cy="login-form-email"]')
    .focus()
    .type('admin@localcrag.invalid.org');
  cy.get('[data-cy="login-form-password"] input').focus().type('admin');
  cy.get('[data-cy="login-form-submit"]').click();
  // Ensure we left the login page. Use inclusion check so tests work with any baseUrl.
  cy.url().should('not.include', '/login');
});
