describe('Forms test', () => {
  it('creates a crag', () => {
    cy.login();
    cy.visit('localhost:4200/topo/create-crag');
    cy.get('[data-cy="crag-form-name"]').focus().type('Ferschweiler')
    cy.get('[data-cy="crag-form-shortDescription"] .ql-editor').focus().type('Ferschweiler ist toll.')
    cy.get('[data-cy="crag-form-description"] .ql-editor').focus().type('Ferschweiler ist sehr toll.')
    cy.get('[data-cy="crag-form-rules"] .ql-editor').focus().type('Kein Feuer machen!')
    cy.get('[data-cy="crag-form-lat"]').focus().type('90')
    cy.get('[data-cy="crag-form-lng"]').focus().type('180')
    cy.get('[data-cy="submit"]').click()
    cy.visit('localhost:4200/topo/crags');
    cy.get('[data-cy="crag-list-item"]').last().contains('Ferschweiler')
  })
})
