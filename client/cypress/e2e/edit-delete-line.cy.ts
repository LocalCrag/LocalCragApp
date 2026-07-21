describe('Edit and delete line', () => {
  it('creates, renames, and deletes a disposable line under Shark Attack', () => {
    const suffix = Date.now();
    const name = `Cy Lifecycle Line ${suffix}`;
    const renamed = `Cy Lifecycle Line ${suffix} Edited`;

    cy.login();
    cy.intercept('POST', '**/areas/*/lines').as('createLine');
    cy.visit('/topo/brione/pampelmousse/shark-attack/create-line');
    cy.get('[data-cy="line-form-name"]').focus().type(name);
    cy.get('[data-cy="line-form-description"] .ql-editor')
      .focus()
      .type('Lifecycle line description.');
    cy.get('[data-cy="grade-dropdown"] > div').click();
    cy.get('[data-cy="grade-dropdown-item"]').eq(30).click();
    cy.get('[data-cy="starting-position-dropdown"] > div').click();
    cy.get('[data-cy="starting-position-dropdown-item"]').eq(2).click();
    cy.get('[data-cy="rating"] .p-rating-option').eq(3).click();
    cy.get('[data-cy="line-form-faName"]').focus().type('Shawn Raboutou');
    cy.get('[data-cy="line-form-faYear"] input').click();
    cy.get('.p-datepicker-year').eq(0).click();
    cy.get('[data-cy="line-form-highball"]').click();
    cy.get('[data-cy="submit"]').click();
    cy.wait('@createLine')
      .its('response.body.slug')
      .then((slug: string) => {
        cy.url().should(
          'include',
          '/topo/brione/pampelmousse/shark-attack/lines',
        );
        cy.contains('[data-cy="line-list-item"]', name);

        cy.intercept('PUT', `**/lines/${slug}`).as('updateLine');
        cy.visit(`/topo/brione/pampelmousse/shark-attack/${slug}/edit`);
        cy.get('[data-cy="line-form-name"]').clear().type(renamed);
        cy.get('[data-cy="submit"]').click();
        cy.wait('@updateLine')
          .its('response.body.slug')
          .then((renamedSlug: string) => {
            cy.url().should(
              'include',
              `/topo/brione/pampelmousse/shark-attack/${renamedSlug}`,
            );

            cy.intercept('DELETE', `**/lines/${renamedSlug}`).as('deleteLine');
            cy.visit(
              `/topo/brione/pampelmousse/shark-attack/${renamedSlug}/edit`,
            );
            cy.get('[data-cy="delete"]').click();
            cy.get('.p-confirmpopup-accept-button').eq(0).click();
            cy.wait('@deleteLine');

            cy.intercept('GET', '**/lines*').as('listLines');
            cy.visit('/topo/brione/pampelmousse/shark-attack/lines');
            cy.wait('@listLines');
            cy.get('[data-cy="line-list-item"]').should(
              'have.length.at.least',
              1,
            );
            cy.contains('[data-cy="line-list-item"]', renamed).should(
              'not.exist',
            );
          });
      });
  });
});
