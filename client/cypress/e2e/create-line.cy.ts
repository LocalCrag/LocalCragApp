describe('Create line', () => {
  it('creates a line', () => {
    cy.login();
    cy.visit('/topo/brione/shade-valley/third-block-from-the-left/create-line');
    cy.intercept('POST', '**/areas/*/lines').as('createLine');
    cy.get('[data-cy="line-form-name"]').focus().type('Alphane');
    cy.get('[data-cy="line-form-description"] .ql-editor')
      .focus()
      .type('Upper is very great.');
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
    cy.wait('@createLine');
    cy.url().should(
      'include',
      '/topo/brione/shade-valley/third-block-from-the-left/lines',
    );
    cy.contains('[data-cy="line-list-item"]', 'Alphane');
  });
});
