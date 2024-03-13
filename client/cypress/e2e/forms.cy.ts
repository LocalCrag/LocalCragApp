describe('Forms test', () => {
  it('creates a crag', () => {
    cy.login();
    cy.visit('localhost:4200/topo/create-crag');
    cy.get('[data-cy="crag-form-name"]').focus().type('Ferschweiler')
    cy.get('[data-cy="crag-form-shortDescription"] .ql-editor').focus().type('Ferschweiler ist toll.')
    cy.get('[data-cy="crag-form-description"] .ql-editor').focus().type('Ferschweiler ist sehr toll.')
    cy.get('[data-cy="crag-form-rules"] .ql-editor').focus().type('Kein Feuer machen!')
    cy.get('[data-cy="crag-form-portraitImage"] input').focus().selectFile('cypress/fixtures/images/peter.jpeg', {force: true})
    cy.get('[data-cy="crag-form-lat"]').focus().type('90')
    cy.get('[data-cy="crag-form-lng"]').focus().type('180')
    cy.get('[data-cy="submit"]').click()
    cy.visit('localhost:4200/topo/crags');
    cy.get('[data-cy="crag-list-item"]').last().contains('Ferschweiler')
  })
  it('creates a sector', () => {
    cy.login();
    cy.visit('localhost:4200/topo/brione/create-sector');
    cy.get('[data-cy="sector-form-name"]').focus().type('Düsterwald')
    cy.get('[data-cy="sector-form-shortDescription"] .ql-editor').focus().type('Düsterwald ist toll.')
    cy.get('[data-cy="sector-form-description"] .ql-editor').focus().type('Düsterwald ist sehr toll.')
    cy.get('[data-cy="sector-form-rules"] .ql-editor').focus().type('Kein Feuer machen!')
    cy.get('[data-cy="sector-form-portraitImage"] input').focus().selectFile('cypress/fixtures/images/peter.jpeg', {force: true})
    cy.get('[data-cy="sector-form-lat"]').focus().type('90')
    cy.get('[data-cy="sector-form-lng"]').focus().type('180')
    cy.get('[data-cy="submit"]').click()
    cy.visit('localhost:4200/topo/brione/sectors');
    cy.get('[data-cy="sector-list-item"]').last().contains('Düsterwald')
  })
  it('creates an area', () => {
    cy.login();
    cy.visit('localhost:4200/topo/brione/schattental/create-area');
    cy.get('[data-cy="area-form-name"]').focus().type('Oben')
    cy.get('[data-cy="area-form-shortDescription"] .ql-editor').focus().type('Oben ist toll.')
    cy.get('[data-cy="area-form-description"] .ql-editor').focus().type('Oben ist sehr toll.')
    cy.get('[data-cy="area-form-portraitImage"] input').focus().selectFile('cypress/fixtures/images/peter.jpeg', {force: true})
    cy.get('[data-cy="area-form-lat"]').focus().type('90')
    cy.get('[data-cy="area-form-lng"]').focus().type('180')
    cy.get('[data-cy="submit"]').click()
    cy.visit('localhost:4200/topo/brione/schattental/areas');
    cy.get('[data-cy="area-list-item"]').last().contains('Oben')
  })
  it('creates a line', () => {
    cy.login();
    cy.visit('localhost:4200/topo/brione/schattental/dritter-block-von-links/create-line');
    cy.get('[data-cy="line-form-name"]').focus().type('Alphane')
    cy.get('[data-cy="line-form-description"] .ql-editor').focus().type('Oben ist sehr toll.')
    cy.get('[data-cy="grade-dropdown"] > div').click()
    cy.get('[data-cy="grade-dropdown-item"]').eq(30).click()
    cy.get('[data-cy="starting-position-dropdown"] > div').click()
    cy.get('[data-cy="starting-position-dropdown-item"]').eq(2).click()
    cy.get('[data-cy="rating"] staricon').eq(3).click()
    cy.get('[data-cy="line-form-faName"]').focus().type('Shawn Raboutou')
    cy.get('[data-cy="line-form-faYear"] input').click()
    cy.get('.p-yearpicker-year').eq(0).click()
    cy.get('[data-cy="line-form-highball"]').click()
    cy.get('[data-cy="submit"]').click()
    cy.visit('localhost:4200/topo/brione/schattental/dritter-block-von-links/lines');
    cy.get('[data-cy="line-list-item"]').last().contains('Alphane')
  })
  it('adds a topo image', () => {
    cy.login();
    cy.visit('localhost:4200/topo/brione/schattental/dritter-block-von-links/topo-images');
    cy.get('[data-cy="topo-image-list-item"]').its('length').then((numBefore => {
      cy.visit('localhost:4200/topo/brione/schattental/dritter-block-von-links/add-topo-image');
      cy.get('[data-cy="topo-image-input"] input').focus().selectFile('cypress/fixtures/images/peter.jpeg', {force: true})
      cy.wait(500)
      cy.get('[data-cy="submit"]').click()
      cy.visit('localhost:4200/topo/brione/schattental/dritter-block-von-links/topo-images');
      cy.get('[data-cy="topo-image-list-item"]').should('have.length', numBefore + 1)
    }));
  })
  it('draws a line on a topo image', () => {
    cy.login();
    cy.visit('localhost:4200/topo/brione/schattental/dritter-block-von-links/topo-images/f4625acb-b0fe-41f6-ab3c-fa258e586f2c/add-line-path');
    cy.get('[data-cy="line-dropdown"] > div').click()
    cy.get('[data-cy="line-dropdown-item"]').eq(1).click()
    cy.get('lc-line-path-editor').click(10,10)
    cy.get('lc-line-path-editor').click(100,100)
    cy.get('lc-line-path-editor').click(100,200)
    cy.get('lc-line-path-editor').click(200,250)
    cy.get('[data-cy="submit"]').click()
    cy.visit('localhost:4200/topo/brione/schattental/dritter-block-von-links/topo-images');
    cy.get('[data-cy="topo-image-list-item"]:nth-child(2) [data-cy="line-row"]').should('have.length', 2)
  })
})
