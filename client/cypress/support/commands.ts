Cypress.Commands.add('login' as any, () => {
  cy.visit('localhost:4200')
  cy.get('[data-cy="navbar-login"]').click()
  cy.get('[data-cy="login-form-email"]').focus().type('admin@localcrag.invalid.org')
  cy.get('[data-cy="login-form-password"] input').focus().type('admin')
  cy.get('[data-cy="login-form-submit"]').click()
})
