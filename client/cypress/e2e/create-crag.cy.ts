describe('Create crag', () => {
  it('creates a crag', () => {
    cy.login();
    cy.visit('/topo/create-crag');
    cy.get('[data-cy="crag-form-name"]').type('Ferschweiler');
    cy.get('[data-cy="crag-form-shortDescription"] .ql-editor')
      .focus()
      .type('Ferschweiler is great.');
    cy.get('[data-cy="crag-form-description"] .ql-editor')
      .focus()
      .type('Ferschweiler is very great.');
    cy.get('[data-cy="crag-form-rules"] .ql-editor')
      .focus()
      .type('No fires allowed!');
    cy.get('[data-cy="crag-form-portraitImage"] input')
      .focus()
      .selectFile('cypress/fixtures/images/peter.jpeg', { force: true });
    cy.get('[data-cy="open-marker-config-modal"]').eq(0).click();
    cy.get('[data-cy="type-dropdown"] > div').click();
    cy.get('[data-cy="type-dropdown-item"]').eq(0).click();
    cy.get('[data-cy="lat"]').focus().type('90');
    cy.get('[data-cy="lng"]').focus().type('180');
    cy.get('[data-cy="save-marker"]').click();
    cy.get('[data-cy="submit"]').click();
    cy.visit('/topo/crags');
    cy.get('[data-cy="crag-list-item"]').last().contains('Ferschweiler');
  });
});
