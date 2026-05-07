describe('Nigel Homepage Testing', () => {

  beforeEach(() => {
    cy.visit('https://nigel-edu-2026.onrender.com')
  })

  // Page loading
  it('loads the homepage successfully', () => {
    cy.get('body').should('be.visible')
  })

  // Title testing
  it('has the correct page title', () => {
    cy.title().should('contain', 'Welcome | Nigel')
  })

  // Navigation bar
  it('displays navigation menu', () => {
    cy.get('.site-nav').should('exist')
    cy.get('.site-menu li').should('have.length.at.least', 4)
  })

  // Brand logo
  it('displays Nigel brand', () => {
    cy.get('.brand').should('contain.text', 'nigel')
  })

  // Search bar
  it('displays Ask Nigel search input', () => {
    cy.get('#askNigel')
      .should('exist')
      .and('have.attr', 'placeholder', 'ask Nigel...')
  })

  // Notification button
  it('displays notification button', () => {
    cy.get('#notifBtn')
      .should('exist')
      .and('contain.text', '🔔')
  })

  // Login button
  it('contains login button', () => {
    cy.contains('Login')
      .should('have.attr', 'href', 'portal.html')
  })

  // Hero section
  it('displays hero section content', () => {
    cy.get('.hero-card').should('exist')

    cy.contains('Learn money skills for real life')
      .should('be.visible')

    cy.contains('Get started')
      .should('exist')
  })

  // Hero image
  it('loads hero image correctly', () => {
    cy.get('.hero-visual img')
      .should('have.attr', 'alt', 'Money learning illustration')
  })

  // Feature cards
  it('displays all feature cards', () => {
    cy.get('.feature-card')
      .should('have.length', 3)
  })

  // Feature headings
  it('contains feature section headings', () => {
    cy.contains('Short lessons')
    cy.contains('Quick quizzes')
    cy.contains('Track progress')
  })

  // Information section
  it('displays how it works section', () => {
    cy.contains('How it works')
      .should('be.visible')

    cy.contains('Start small and build your confidence')
      .should('be.visible')
  })

  // Navigation link testing
  it('navigation links exist', () => {
    cy.get('a[href="modules.html"]').should('exist')
    cy.get('a[href="student-dashboard.html"]').should('exist')
    cy.get('a[href="progress.html"]').should('exist')
  })

  // Accessibility checks
  it('images contain alt attributes', () => {
    cy.get('img').each(($img) => {
      cy.wrap($img)
        .should('have.attr', 'alt')
    })
  })

  // Responsive testing
  it('renders correctly on mobile viewport', () => {
    cy.viewport('iphone-x')

    cy.get('body').should('be.visible')
    cy.get('.topbar').should('exist')
  })

})