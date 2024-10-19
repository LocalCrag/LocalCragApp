# Dev tooling

## pre-commit hooks for linting


The linting pipeline will do several checks on the codebase. To ensure that your code is properly formatted and passes all checks, you need to install and set up pre-commit.  

### Installing pre-commit

1. Install pre-commit:  
- Using `pip`: `pip install pre-commit`
- Using `brew`: `brew install pre-commit`
2. Install the pre-commit hooks:  
 - Run the following command to install the hooks defined in `.pre-commit-config.yaml`: `pre-commit install`

### Using pre-commit during development

- Automatic hook execution: Once installed, the pre-commit hooks will run automatically before each commit. This ensures that your code is formatted and linted according to the project's standards.
- Manual hook execution: To run the hooks on all files manually, use: `pre-commit run --all-files`

### Importance of pre-commit

Using `pre-commit` ensures that your code is formatted correctly and passes all linting checks before being committed. This helps prevent pipeline failures due to formatting issues or linting errors. Make sure to set up and use `pre-commit` to maintain code quality and consistency throughout the project.