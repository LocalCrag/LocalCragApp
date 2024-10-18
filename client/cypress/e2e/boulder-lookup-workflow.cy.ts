describe('Boulder lookup workflow', () => {
  it('navigates step by step to a boulder detail page', () => {
    cy.visit('localhost:4200');
    cy.get('[data-cy="main-menu"] .root-child').eq(1).click();
    cy.get('[data-cy="crag-list-item"]').eq(0).click();
    cy.get('[data-cy="sector-list-item"]').eq(0).click();
    cy.get('[data-cy="area-list-item"]').eq(0).click();
    cy.get('[data-cy="area-tabs-menu"] a').eq(2).click();
    cy.get('[data-cy="line-list-item"]').contains('Super-Spreader 8A').click();
    cy.get('.p-card-title').contains('Super-Spreader 8A');
  });
});
