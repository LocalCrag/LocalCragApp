# LocalCrag Client

## Setup

- Install [node](https://nodejs.org/en/download/package-manager), at least v21
- Install [Angular CLI](https://v17.angular.io/guide/setup-local)
- Install dependencies `npm i`
- Run the client for development `npm run dev` (runs the Tailwind CLI in watch mode alongside `ng serve`, so changes to templates, `src/tailwind.css` and `src/app/styles/*.scss` hot-reload)
- `npm run start` also works but compiles Tailwind only once (no Tailwind watch); prefer `npm run dev` while developing

> Tailwind CSS v4 is compiled by its standalone CLI into `src/tailwind.generated.css` (git-ignored) via the `tw:build` / `tw:watch` scripts, which the build/serve scripts run automatically. Tailwind is intentionally kept out of Angular's PostCSS pipeline: routing the Sass `styles.scss` through `@tailwindcss/postcss` breaks watch/hot-reload of the `@use`d SCSS partials (see [tailwindcss#19303](https://github.com/tailwindlabs/tailwindcss/issues/19303)).

## Running tests

- Run E2E Cypress tests with `npm run cypress:open`
- Run unit tests with `npm run test`

## i18n

- When adding new [transloco](https://jsverse.github.io/transloco/) translations, extract the keys using `npm run i18n:extract`
- Keys are added in the `src/assets/i18n` directory. They can be filled manually for the first language. As soon as we add a second language, we can use tool like weblate to help translating all the strings.
