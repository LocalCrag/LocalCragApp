describe('Auth test', () => {
  it('logs in and out', () => {
    Cypress.on('uncaught:exception', (err) => {
      return !err.message.includes(
        'ResizeObserver loop completed with undelivered notifications',
      );
    });

    cy.login();
    cy.get('[data-cy="navbar-login"]').should('not.exist');
    cy.get('[data-cy="auth-menu-button"]').click();
    cy.get('[data-cy="auth-menu"] #auth-menu-logout').click();
    cy.url().should('include', '/login');
  });
});
