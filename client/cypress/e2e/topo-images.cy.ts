describe('Topo images test', () => {
  it('adds a topo image and draws a line on it', () => {
    cy.viewport(1920, 1080);
    cy.login();
    cy.intercept('POST', '**/upload').as('uploadFile');
    cy.intercept('POST', '**/areas/*/topo-images').as('createTopoImage');
    cy.intercept('POST', '**/topo-images/*/line-paths').as('createLinePath');
    cy.visit('/topo/brione/schattental/dritter-block-von-links/topo-images');
    cy.get('[data-cy="topo-image-list-item"]')
      .its('length')
      .then((numBefore) => {
        cy.visit(
          '/topo/brione/schattental/dritter-block-von-links/add-topo-image',
        );
        cy.get('[data-cy="topo-image-input"] input')
          .focus()
          .selectFile('cypress/fixtures/images/peter.jpeg', { force: true });
        cy.wait('@uploadFile');
        cy.get('[data-cy="topo-image-form-coordinates"] input')
          .eq(0)
          .focus()
          .type('90');
        cy.get('[data-cy="topo-image-form-coordinates"] input')
          .eq(1)
          .focus()
          .type('180');
        cy.get('[data-cy="topo-image-form-title"]')
          .focus()
          .type('Toller Block');
        cy.get('[data-cy="topo-image-form-description"] .ql-editor')
          .focus()
          .type('Sehr großer Block eh');
        cy.get('[data-cy="submit"]').click();
        cy.wait('@createTopoImage');
        cy.url().should(
          'include',
          '/topo/brione/schattental/dritter-block-von-links/topo-images',
        );
        cy.get('[data-cy="topo-image-list-item"]').should(
          'have.length',
          numBefore + 1,
        );
        let topoImageId;
        cy.get('[data-cy="topo-image-list-item"]')
          .eq(2)
          .invoke('attr', 'id')
          .then((id) => {
            topoImageId = id;
            cy.visit(
              `/topo/brione/schattental/dritter-block-von-links/topo-images/${topoImageId}/add-line-path`,
            );
            cy.wait(2000);
            cy.get('[data-cy="line-dropdown"] > div').click();
            cy.get('[data-cy="line-dropdown-item"]').eq(0).click();
            cy.get('lc-line-path-editor').click(10, 10);
            cy.get('lc-line-path-editor').click(100, 100);
            cy.get('lc-line-path-editor').click(100, 200);
            cy.get('lc-line-path-editor').click(200, 250);
            cy.get('[data-cy="submit"]').click();
            cy.wait('@createLinePath');
            cy.get('[data-cy="leave-editor"]').click();
            cy.url().should(
              'include',
              '/topo/brione/schattental/dritter-block-von-links/topo-images',
            );
            cy.get(
              '[data-cy="topo-image-list-item"]:nth-child(3) [data-cy="line-row"]',
            ).should('have.length', 1);
          });
      });
  });
});
