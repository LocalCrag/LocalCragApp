describe('Auth test', () => {
  it('logs in and out', () => {
    cy.visit('localhost:4200')
    cy.get('[data-cy="navbar-login"]').click()
    cy.get('[data-cy="login-form-email"]').focus().type('localcrag@fengelmann.de')
    cy.get('[data-cy="login-form-password"] input').focus().type('localcrag')
    cy.get('[data-cy="login-form-submit"]').click()
    cy.get('[data-cy="navbar-login"]').should('not.exist');
    cy.get('[data-cy="auth-menu-button"]').click()
    cy.get('[data-cy="auth-menu"] a').last().click()
    cy.url().should('include', '/login')
  })
})
