describe('Topo images test', () => {
  it('adds a topo image', () => {
    cy.login();
    cy.visit('localhost:4200/topo/brione/schattental/dritter-block-von-links/topo-images');
    cy.get('[data-cy="topo-image-list-item"]').its('length').then((numBefore => {
      cy.visit('localhost:4200/topo/brione/schattental/dritter-block-von-links/add-topo-image');
      cy.get('[data-cy="topo-image-input"] input').focus().selectFile('cypress/fixtures/images/peter.jpeg', {force: true})
      cy.wait(2000); // As we are testing the live DO Spaces, we should wait a little extra...
      cy.get('[data-cy="topo-image-form-gps"] input').eq(0).focus().type('90')
      cy.get('[data-cy="topo-image-form-gps"] input').eq(1).focus().type('180')
      cy.get('[data-cy="topo-image-form-title"]').focus().type('Toller Block')
      cy.get('[data-cy="topo-image-form-description"] .ql-editor').focus().type('Sehr großer Block eh')
      cy.get('[data-cy="submit"]').click()
      cy.visit('localhost:4200/topo/brione/schattental/dritter-block-von-links/topo-images');
      cy.get('[data-cy="topo-image-list-item"]').should('have.length', numBefore + 1)
    }));
  })
  it('draws a line on a topo image', () => {
    cy.viewport(1920 , 1080)
    cy.login();
    cy.visit('localhost:4200/topo/brione/schattental/dritter-block-von-links/topo-images/f4625acb-b0fe-41f6-ab3c-fa258e586f2c/add-line-path');
    cy.wait(2000);
    cy.get('[data-cy="line-dropdown"] > div').click()
    cy.get('[data-cy="line-dropdown-item"]').eq(2).click()
    cy.get('lc-line-path-editor').click(10,10)
    cy.get('lc-line-path-editor').click(100,100)
    cy.get('lc-line-path-editor').click(100,200)
    cy.get('lc-line-path-editor').click(200,250)
    cy.get('[data-cy="submit"]').click()
    cy.visit('localhost:4200/topo/brione/schattental/dritter-block-von-links/topo-images');
    cy.get('[data-cy="topo-image-list-item"]:nth-child(2) [data-cy="line-row"]').should('have.length', 2)
  })
})
