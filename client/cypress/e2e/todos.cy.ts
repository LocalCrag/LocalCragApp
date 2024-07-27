describe('Todo lifespan workflow', () => {
  it('creates a to-do and deletes it again', () => {
    cy.viewport(1920, 1080)
    cy.login();

    cy.visit('localhost:4200/topo/brione/schattental/dritter-block-von-links/lines')
    cy.get('[data-cy="todo-button"]').eq(0).click()

    cy.visit('localhost:4200/todos')
    cy.get('[data-cy="todo-list-item"]').should('have.length', 1)

    cy.get('[data-cy="delete-todo"]').eq(0).click()
    cy.get('[data-cy="todo-list-item"]').should('have.length', 0)

  })
})
