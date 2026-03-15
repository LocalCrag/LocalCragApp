describe('Cookie test', () => {
  it('accepts the cookies', () => {
    cy.visit('/');
    cy.get('[data-cy="accept-cookies"]').click();
    cy.get('[data-cy="accept-cookies"]').should('not.exist');
  });
});
