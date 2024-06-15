# LocalCrag Client

## Setup

- Install [node](https://nodejs.org/en/download/package-manager), at least v21
- Install [Angular CLI](https://v17.angular.io/guide/setup-local)
- Install dependencies `npm i`
- Run the client `npm run start`

## Running tests

- Run E2E Cypress tests with `npm run cypress:open`
- Run unit tests with `npm run test`

## i18n

- When adding new [transloco](https://jsverse.github.io/transloco/) translations, extract the keys using `npm run i18n:extract`
- Keys are added in the `src/assets/i18n` directory. They can be filled manually for the first language. As soon as we add a second language, we can use tool like weblate to help translating all the strings.
