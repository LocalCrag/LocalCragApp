describe('Create sector', () => {
  it('creates a sector', () => {
    cy.login();
    cy.visit('/topo/brione/create-sector');
    cy.get('[data-cy="sector-form-name"]').type('Dark Forest');
    cy.get('[data-cy="sector-form-shortDescription"] .ql-editor')
      .focus()
      .type('Dark Forest is great.');
    cy.get('[data-cy="sector-form-description"] .ql-editor')
      .focus()
      .type('Dark Forest is very great.');
    cy.get('[data-cy="sector-form-rules"] .ql-editor')
      .focus()
      .type('No fires allowed!');
    cy.get('[data-cy="sector-form-portraitImage"] input')
      .focus()
      .selectFile('cypress/fixtures/images/peter.jpeg', { force: true });
    cy.get('[data-cy="open-marker-config-modal"]').eq(0).click();
    cy.get('[data-cy="type-dropdown"] > div').click();
    cy.get('[data-cy="type-dropdown-item"]').eq(0).click();
    cy.get('[data-cy="lat"]').focus().type('90');
    cy.get('[data-cy="lng"]').focus().type('180');
    cy.get('[data-cy="save-marker"]').click();
    cy.get('[data-cy="submit"]').click();
    cy.visit('/topo/brione/sectors');
    cy.get('[data-cy="sector-list-item"]').last().contains('Dark Forest');
  });
});
