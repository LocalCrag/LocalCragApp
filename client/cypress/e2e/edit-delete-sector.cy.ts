describe('Edit and delete sector', () => {
  it('creates, renames, and deletes a disposable sector under Brione', () => {
    const suffix = Date.now();
    const name = `Cy Lifecycle Sector ${suffix}`;
    const renamed = `Cy Lifecycle Sector ${suffix} Edited`;

    cy.login();
    cy.intercept('POST', '**/crags/*/sectors').as('createSector');
    cy.visit('/topo/brione/create-sector');
    cy.get('[data-cy="sector-form-name"]').type(name);
    cy.get('[data-cy="sector-form-shortDescription"] .ql-editor')
      .focus()
      .type('Lifecycle sector short description.');
    cy.get('[data-cy="sector-form-description"] .ql-editor')
      .focus()
      .type('Lifecycle sector description.');
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
    cy.wait('@createSector')
      .its('response.body.slug')
      .then((slug: string) => {
        cy.url().should('include', '/topo/brione/sectors');
        cy.contains('[data-cy="sector-list-item"]', name);

        cy.intercept('PUT', `**/sectors/${slug}`).as('updateSector');
        cy.visit(`/topo/brione/${slug}/edit`);
        cy.get('[data-cy="sector-form-name"]').clear().type(renamed);
        cy.get('[data-cy="submit"]').click();
        cy.wait('@updateSector')
          .its('response.body.slug')
          .then((renamedSlug: string) => {
            cy.url().should('include', `/topo/brione/${renamedSlug}`);

            cy.intercept('DELETE', `**/sectors/${renamedSlug}`).as(
              'deleteSector',
            );
            cy.visit(`/topo/brione/${renamedSlug}/edit`);
            cy.get('[data-cy="delete"]').click();
            cy.get('.p-confirmpopup-accept-button').eq(0).click();
            cy.wait('@deleteSector');

            cy.intercept('GET', '**/crags/*/sectors').as('listSectors');
            cy.visit('/topo/brione/sectors');
            cy.wait('@listSectors');
            cy.get('[data-cy="sector-list-item"]').should(
              'have.length.at.least',
              1,
            );
            cy.contains('[data-cy="sector-list-item"]', renamed).should(
              'not.exist',
            );
          });
      });
  });
});
