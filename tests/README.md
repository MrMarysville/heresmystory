# Testing Guide

This directory contains all tests for the Here's My Story application.

## Test Structure

```
tests/
├── setup.ts                 # Test environment setup
├── lib/                     # Unit tests for utilities
│   ├── monitoring/
│   ├── analytics/
│   └── performance/
├── components/              # Component tests
│   └── error/
├── api/                     # API integration tests
│   ├── monitoring/
│   └── analytics/
└── e2e/                     # End-to-end tests
    ├── auth.spec.ts
    ├── dashboard.spec.ts
    ├── profiles.spec.ts
    ├── library.spec.ts
    ├── accessibility.spec.ts
    └── keepsakes.spec.ts
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- error-logger.test.ts
```

### End-to-End Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run specific test file
npm run test:e2e -- auth.spec.ts

# Run tests in specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

## Writing Tests

### Unit Tests

Unit tests use Vitest and Testing Library. Example:

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '@/lib/myModule'

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })
})
```

### Component Tests

Component tests use React Testing Library:

```typescript
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

it('should render component', () => {
  render(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

### E2E Tests

E2E tests use Playwright:

```typescript
import { test, expect } from '@playwright/test'

test('should navigate to page', async ({ page }) => {
  await page.goto('/my-page')
  await expect(page.locator('h1')).toContainText('Page Title')
})
```

## Coverage Goals

- **Overall**: 70%+ code coverage
- **Critical paths**: 90%+ coverage
- **Utilities**: 80%+ coverage
- **Components**: 70%+ coverage

## CI/CD Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Pre-deployment checks

## Test Data

- Use mock data for unit tests
- Use test fixtures for E2E tests
- Never use production data
- Clean up test data after tests

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One assertion per test**: Keep tests focused
3. **Descriptive names**: Use clear test descriptions
4. **Mock external dependencies**: Isolate units
5. **Test edge cases**: Cover error scenarios
6. **Keep tests fast**: Optimize test performance
7. **Clean up**: Reset state between tests

## Debugging Tests

### Vitest

```bash
# Run tests in debug mode
npm test -- --inspect-brk

# Run specific test with console output
npm test -- error-logger.test.ts --reporter=verbose
```

### Playwright

```bash
# Debug specific test
npm run test:e2e:debug -- auth.spec.ts

# View test report
npx playwright show-report

# Record test video
npm run test:e2e -- --video=on
```

## Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout in config
2. **Flaky tests**: Add proper waits, avoid race conditions
3. **Mock issues**: Verify mock setup in setup.ts
4. **Browser issues**: Update Playwright browsers

### Getting Help

- Check test logs
- Review test reports
- Consult documentation
- Ask team for assistance
