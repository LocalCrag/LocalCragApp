describe('Create area', () => {
  it('creates an area', () => {
    cy.login();
    cy.visit('localhost:4200/topo/brione/schattental/create-area');
    cy.get('[data-cy="area-form-name"]').focus().type('Oben');
    cy.get('[data-cy="area-form-shortDescription"] .ql-editor')
      .focus()
      .type('Oben ist toll.');
    cy.get('[data-cy="area-form-description"] .ql-editor')
      .focus()
      .type('Oben ist sehr toll.');
    cy.get('[data-cy="area-form-portraitImage"] input')
      .focus()
      .selectFile('cypress/fixtures/images/peter.jpeg', { force: true });
    cy.get('[data-cy="open-marker-config-modal"]').eq(0).click();
    cy.get('[data-cy="type-dropdown"] > div').click();
    cy.get('[data-cy="type-dropdown-item"]').eq(0).click();
    cy.get('[data-cy="lat"]').focus().type('90');
    cy.get('[data-cy="lng"]').focus().type('180');
    cy.get('[data-cy="save-marker"]').click();
    cy.get('[data-cy="submit"]').click();
    cy.visit('localhost:4200/topo/brione/schattental/areas');
    cy.get('[data-cy="area-list-item"]').last().contains('Oben');
  });
});
