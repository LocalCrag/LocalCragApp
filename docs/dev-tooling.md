# Dev tooling

## pre-commit hooks for linting using Husky

The linting pipeline will do several checks on the codebase. To ensure that your code is properly formatted and passes all checks _before_ you commit and push it, you can install and set up Husky.  

### Installing Husky

1. Run `npm install` in the root directory of the project to install Husky and its dependencies.
2. Initialize Husky by running `npx husky init`. This will activate the existing hooks in the project.

### Using Husky during development

- Automatic hook execution: Once initialized, the Husky hooks will run automatically before each commit. This ensures that your code is formatted and linted according to the project's standards.

### Importance of Husky

Using `husky` ensures that your code is formatted correctly and passes all linting checks before being committed. This helps prevent pipeline failures due to formatting issues or linting errors. Make sure to set up and use `Husky` to maintain code quality and consistency throughout the project.