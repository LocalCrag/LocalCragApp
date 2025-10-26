describe('Ascent lifespan workflow', () => {
  it('creates an ascent and deletes it again', () => {
    cy.viewport(1920, 1080);
    cy.login();

    cy.visit(
      'localhost:4200/topo/brione/schattental/dritter-block-von-links/topo-images',
    );
    cy.get('[data-cy="tick-button"]').eq(1).click();
    cy.get('[data-cy="rating"] .p-rating-option').eq(3).click();
    cy.get('[data-cy="comment"]').focus().type('Guter Boulder Yo!');
    cy.get('[data-cy="withKneepad"]').click();
    cy.get('[data-cy="submit"]').click();

    cy.visit('localhost:4200/users/admin-admin');
    cy.get('[data-cy="kneepadtag"]').should('have.length', 2);
    cy.get('[data-cy="ascent-actions-button"]').eq(0).click();
    cy.get('#edit-ascent').eq(0).click();
    cy.get('[data-cy="withKneepad"]').click();
    cy.get('[data-cy="submit"]').click();
    cy.get('[data-cy="kneepadtag"]').should('have.length', 1);

    cy.get('[data-cy="ascent-list-item"]').should('have.length', 2);
    cy.get('[data-cy="ascent-actions-button"]').eq(0).click();
    cy.get('#delete-ascent').eq(0).click();
    cy.get('.p-confirmpopup-accept-button').eq(0).click();
    cy.get('[data-cy="ascent-list-item"]').should('have.length', 1);
  });
});
