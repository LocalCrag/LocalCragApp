describe('Ascent lifespan workflow', () => {
  it('creates an ascent and deletes it again', () => {
    cy.viewport(1920, 1080);
    cy.login();

    cy.visit('/topo/brione/pampelmousse/shark-attack/topo-images');
    cy.get('[data-cy="tick-button"]').eq(1).click();
    cy.get('[data-cy="rating"] .p-rating-option').eq(3).click();
    cy.get('[data-cy="comment"]').focus().type('Good boulder yo!');
    cy.get('[data-cy="withKneepad"]').click();
    cy.get('[data-cy="submit"]').click();

    cy.visit('/users/admin-admin');
    cy.get('[data-cy="kneepadtag"]:visible').should('have.length', 2);
    cy.get('[data-cy="ascent-actions-button"]:visible').first().click();
    cy.get('#edit-ascent').eq(0).click();
    cy.get('[data-cy="withKneepad"]').click();
    cy.get('[data-cy="submit"]').click();
    cy.get('[data-cy="kneepadtag"]:visible').should('have.length', 1);

    cy.get('[data-cy="ascent-list-item"]').should('have.length', 2);
    cy.get('[data-cy="ascent-actions-button"]:visible').first().click();
    cy.get('#delete-ascent').eq(0).click();
    cy.get('.p-confirmpopup-accept-button').eq(0).click();
    cy.get('[data-cy="ascent-list-item"]').should('have.length', 1);
  });

  it('creates an ascent with year instead of date', () => {
    cy.viewport(1920, 1080);
    cy.login();

    const ascentYear = new Date().getFullYear() - 1;

    cy.intercept('POST', '**/ascents').as('createAscent');
    cy.visit('/topo/brione/pampelmousse/shark-attack/topo-images');
    cy.get('[data-cy="tick-button"]').eq(1).click();
    cy.get('[data-cy="yearOnly"]').click();
    cy.get('#year').click();
    cy.get('.p-datepicker-year').contains(String(ascentYear)).click();
    cy.get('[data-cy="rating"] .p-rating-option').eq(3).click();
    cy.get('[data-cy="comment"]').focus().type('Year-only ascent');
    cy.get('[data-cy="submit"]').click();

    cy.wait('@createAscent').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
      expect(interception.request.body.year).to.eq(ascentYear);
      expect(interception.request.body.date).to.eq(null);
    });

    cy.visit('/users/admin-admin');
    cy.get('[data-cy="ascent-list-item"]').should('have.length', 2);
    cy.get('[data-cy="ascent-date"]:visible')
      .first()
      .should('contain', String(ascentYear));

    cy.get('[data-cy="ascent-actions-button"]:visible').first().click();
    cy.get('#delete-ascent').eq(0).click();
    cy.get('.p-confirmpopup-accept-button').eq(0).click();
    cy.get('[data-cy="ascent-list-item"]').should('have.length', 1);
  });
});
