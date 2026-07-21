describe('Edit and delete crag', () => {
  it('creates, renames, and deletes a disposable crag', () => {
    const suffix = Date.now();
    const name = `Cy Lifecycle Crag ${suffix}`;
    const renamed = `Cy Lifecycle Crag ${suffix} Edited`;

    cy.login();
    cy.intercept('POST', '**/crags').as('createCrag');
    cy.visit('/topo/create-crag');
    cy.get('[data-cy="crag-form-name"]').type(name);
    cy.get('[data-cy="crag-form-shortDescription"] .ql-editor')
      .focus()
      .type('Lifecycle crag short description.');
    cy.get('[data-cy="crag-form-description"] .ql-editor')
      .focus()
      .type('Lifecycle crag description.');
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
    cy.wait('@createCrag')
      .its('response.body.slug')
      .then((slug: string) => {
        cy.url().should('include', '/topo/crags');
        cy.contains('[data-cy="crag-list-item"]', name);

        cy.intercept('PUT', `**/crags/${slug}`).as('updateCrag');
        cy.visit(`/topo/${slug}/edit`);
        cy.get('[data-cy="crag-form-name"]').clear().type(renamed);
        cy.get('[data-cy="submit"]').click();
        cy.wait('@updateCrag')
          .its('response.body.slug')
          .then((renamedSlug: string) => {
            cy.url().should('include', `/topo/${renamedSlug}`);

            cy.intercept('DELETE', `**/crags/${renamedSlug}`).as('deleteCrag');
            cy.visit(`/topo/${renamedSlug}/edit`);
            cy.get('[data-cy="delete"]').click();
            cy.get('.p-confirmpopup-accept-button').eq(0).click();
            cy.wait('@deleteCrag');

            cy.intercept('GET', '**/crags').as('listCrags');
            cy.visit('/topo/crags');
            cy.wait('@listCrags');
            cy.get('[data-cy="crag-list-item"]').should(
              'have.length.at.least',
              1,
            );
            cy.contains('[data-cy="crag-list-item"]', renamed).should(
              'not.exist',
            );
          });
      });
  });
});
