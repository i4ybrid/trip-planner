# TripPlanner Development Guidelines

## Code Organization Standards

### Backend Structure
```
backend/src/
├── routes/          # API route handlers
├── services/        # Business logic layer
├── middleware/      # Auth, validation, error handling
├── lib/             # Utilities, validators, config
├── types/           # TypeScript type definitions
└── test/            # Test utilities and helpers
```

### Frontend Structure
```
frontend/src/
├── app/             # Next.js App Router pages
├── components/      # Reusable UI components
├── services/        # API client and services
├── types/           # TypeScript type definitions
├── hooks/           # Custom React hooks
└── lib/             # Utilities and constants
```

## Feature Implementation Guidelines

### 1. Algorithm Implementation
- Create dedicated service for debt simplification
- Implement algorithm with clear separation of concerns
- Add comprehensive error handling
- Document algorithm logic and edge cases

### 2. Backend Endpoint
- Follow REST conventions
- Include proper authentication and authorization
- Return consistent response format
- Add request validation

### 3. Testing Guidelines

#### Unit Tests
- Test individual functions in isolation
- Use Jest for testing framework
- Aim for >80% code coverage
- Mock external dependencies

#### Integration Tests
- Test API endpoints end-to-end
- Test database interactions
- Test authentication flows
- Use test database for isolation

### 4. CI/CD Integration

#### Automated Testing Pipeline
1. **Commit Hook**: Run linting and type checking
2. **PR Validation**: 
   - Run all unit tests
   - Run integration tests
   - Check code coverage
   - Run linting
3. **Merge to Main**:
   - Run full test suite
   - Build application
   - Deploy to staging

#### Test Commands
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- payments.service.test.ts

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Testing Coverage Requirements

### Simplify Debt Algorithm

#### Unit Tests (services/debtSimplifier.service.test.ts)
- [ ] Test basic debt simplification (3-person scenario)
- [ ] Test chain settlements (A→B→C)
- [ ] Test zero-sum scenarios
- [ ] Test edge cases (single person, no debts)
- [ ] Test precision handling (decimal rounding)

#### Integration Tests (routes/debtSimplifier.test.ts)
- [ ] Test GET /api/trips/:tripId/debt-simplify endpoint
- [ ] Test authentication/authorization
- [ ] Test invalid trip ID handling
- [ ] Test empty debt scenario
- [ ] Test complex debt network

#### E2E Tests (frontend)
- [ ] Test debt simplification display in UI
- [ ] Test settlement suggestions UI
- [ ] Test payment flow after simplification

## Code Quality Standards

### TypeScript
- Enable strict mode
- Use explicit types
- Avoid `any` type
- Document complex types

### Backend
- Use async/await for async operations
- Implement proper error handling
- Log significant events
- Use environment variables for config

### Frontend
- Use TypeScript for all components
- Implement proper loading states
- Handle error states gracefully
- Use responsive design

## Documentation Requirements

### API Documentation
- Document all endpoints in OpenAPI/Swagger format
- Include request/response examples
- Document authentication requirements
- Note rate limits and constraints

### Code Documentation
- Add JSDoc comments for functions
- Document algorithm logic in code
- Add comments for complex logic
- Document edge cases

## Deployment Checklist

- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Monitoring configured
