describe('Auth test', () => {
  it('logs in and out', () => {
    cy.login();
    cy.get('[data-cy="navbar-login"]').should('not.exist');
    cy.get('[data-cy="auth-menu-button"]').click()
    cy.get('[data-cy="auth-menu"] a').last().click()
    cy.url().should('include', '/login')
  })
})
