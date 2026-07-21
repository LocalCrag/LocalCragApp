describe('Edit and delete area', () => {
  it('creates, renames, and deletes a disposable area under Brione/Pampelmousse', () => {
    const suffix = Date.now();
    const name = `Cy Lifecycle Area ${suffix}`;
    const renamed = `Cy Lifecycle Area ${suffix} Edited`;

    cy.login();
    cy.intercept('POST', '**/sectors/*/areas').as('createArea');
    cy.visit('/topo/brione/pampelmousse/create-area');
    cy.get('[data-cy="area-form-name"]').type(name);
    cy.get('[data-cy="area-form-shortDescription"] .ql-editor')
      .focus()
      .type('Lifecycle area short description.');
    cy.get('[data-cy="area-form-description"] .ql-editor')
      .focus()
      .type('Lifecycle area description.');
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
    cy.wait('@createArea')
      .its('response.body.slug')
      .then((slug: string) => {
        cy.url().should('include', '/topo/brione/pampelmousse/areas');
        cy.contains('[data-cy="area-list-item"]', name);

        cy.intercept('PUT', `**/areas/${slug}`).as('updateArea');
        cy.visit(`/topo/brione/pampelmousse/${slug}/edit`);
        cy.get('[data-cy="area-form-name"]').clear().type(renamed);
        cy.get('[data-cy="submit"]').click();
        cy.wait('@updateArea')
          .its('response.body.slug')
          .then((renamedSlug: string) => {
            cy.url().should(
              'include',
              `/topo/brione/pampelmousse/${renamedSlug}`,
            );

            cy.intercept('DELETE', `**/areas/${renamedSlug}`).as('deleteArea');
            cy.visit(`/topo/brione/pampelmousse/${renamedSlug}/edit`);
            cy.get('[data-cy="delete"]').click();
            cy.get('.p-confirmpopup-accept-button').eq(0).click();
            cy.wait('@deleteArea');

            cy.intercept('GET', '**/sectors/*/areas').as('listAreas');
            cy.visit('/topo/brione/pampelmousse/areas');
            cy.wait('@listAreas');
            cy.get('[data-cy="area-list-item"]').should(
              'have.length.at.least',
              1,
            );
            cy.contains('[data-cy="area-list-item"]', renamed).should(
              'not.exist',
            );
          });
      });
  });
});
