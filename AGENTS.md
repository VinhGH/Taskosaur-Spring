# AGENTS.md - Taskosaur AI Agent Configuration

This document provides guidance for AI agents working with the Taskosaur project, including development setup, testing, and code quality standards.

## Project Overview

Taskosaur is an open-source project management platform with conversational AI task execution. It's built as a monorepo with:
- **Backend**: NestJS API server (port 3000)
- **Frontend**: Next.js application (port 3001)
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis with BullMQ

## Development Setup

### Prerequisites
- Node.js 22+ and npm 10+
- PostgreSQL 16+ (or Docker)
- Redis 7+ (or Docker)

### Quick Start with Docker (Recommended)
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Start all services
docker-compose -f docker-compose.dev.yml up
```

### Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup database
npm run db:migrate
npm run db:seed

# 3. Start development servers
npm run dev
```

## Available Commands

### Development
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only (port 3001)
npm run dev:backend      # Start backend only (port 3000)
```

### Database Operations
```bash
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
npm run db:seed:admin    # Seed database with admin user only
npm run db:reset         # Reset database (deletes all data!)
npm run db:studio        # Open Prisma Studio (database GUI)
```

### Testing
```bash
npm run test             # Run all tests
npm run test:frontend    # Run frontend tests
npm run test:backend     # Run backend unit tests
npm run test:e2e         # Run backend end-to-end tests
npm run test:cov         # Run backend tests with coverage
```

### Code Quality
```bash
npm run lint             # Lint all workspaces
npm run lint:frontend    # Lint frontend code
npm run lint:backend     # Lint backend code
npm run format           # Format backend code with Prettier
```

### Build
```bash
npm run build            # Build all workspaces
npm run build:frontend   # Build frontend for production
npm run build:backend    # Build backend for production
npm run build:dist       # Build complete distribution package
```

### Cleanup
```bash
npm run clean            # Clean all build artifacts
npm run clean:frontend   # Clean frontend build artifacts
npm run clean:backend    # Clean backend build artifacts
```

## Project Structure

```
taskosaur/
├── backend/                # NestJS Backend (Port 3000)
│   ├── src/
│   │   ├── modules/       # Feature modules (auth, tasks, projects, etc.)
│   │   ├── common/        # Shared utilities and middleware
│   │   ├── config/        # Configuration files
│   │   ├── gateway/       # WebSocket gateway
│   │   ├── seeder/        # Database seeding
│   │   └── prisma/        # Database service
│   ├── prisma/            # Database schema and migrations
│   ├── public/            # Static files
│   └── uploads/           # File uploads
├── frontend/              # Next.js Frontend (Port 3001)
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilities
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
├── docker/               # Docker configuration
├── scripts/              # Build and utility scripts
├── plans/               # Development plans and documentation
└── package.json         # Root package configuration
```

## Coding Standards

### TypeScript & JavaScript
- Use TypeScript for all new code
- Enable strict mode with null checks
- Provide explicit type annotations
- Avoid `any` type unless absolutely necessary

### Backend (NestJS)
- Use dependency injection via constructors
- Implement proper error handling with try/catch
- Use DTOs for request/response validation
- Follow existing module structure

### Frontend (Next.js/React)
- Use functional components with hooks
- Implement proper error boundaries
- Use TypeScript interfaces for props
- Follow existing component structure

### Database (Prisma)
- Write clear, descriptive migration names
- Include both up and down migrations
- Test migrations on sample data
- Document schema changes

## Git Hooks & Code Quality

Automatic code quality checks with **Husky**:
- **Pre-commit**: Runs linters on all workspaces before each commit
- Ensures code quality and consistency
- Bypass with `--no-verify` (emergencies only)

```bash
git commit -m "feat: add feature"  # Runs checks automatically
```

## Testing Guidelines

### Backend Tests
- Unit tests in `backend/test/` directory
- E2E tests in `backend/test/e2e/` directory
- Use Jest as the testing framework
- Mock external dependencies appropriately

### Frontend Tests
- Use Vitest for unit testing
- Use Playwright for E2E testing
- Test components in isolation
- Mock API calls appropriately

## Environment Variables

Key environment variables to configure:

```env
# Database Configuration
DATABASE_URL="postgresql://taskosaur:taskosaur@localhost:5432/taskosaur"

# Authentication & Security
JWT_SECRET="your-jwt-secret-key-change-this"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-this-too"
ENCRYPTION_KEY="your-64-character-hex-encryption-key-change-this-to-random-value"

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Frontend Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
FRONTEND_URL=http://localhost:3001
CORS_ORIGIN="http://localhost:3001"
```

## Docker Development

### Development Docker Compose
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Useful Docker Commands
```bash
# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Execute commands in container
docker-compose -f docker-compose.dev.yml exec app sh

# Reset database
docker-compose -f docker-compose.dev.yml exec app npm run db:reset

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Message Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(auth): add password reset functionality
fix(tasks): resolve kanban drag and drop issue
docs: update API documentation for task endpoints
```

## Agent Workflow

When working on Taskosaur as an AI agent:

1. **Always run linting after making changes**:
   ```bash
   npm run lint
   ```

2. **Run tests for affected areas**:
   ```bash
   npm run test:backend   # For backend changes
   npm run test:frontend  # For frontend changes
   ```

3. **Check database migrations** (if schema changed):
   ```bash
   npm run db:migrate
   ```

4. **Verify build works**:
   ```bash
   npm run build
   ```

5. **Follow existing patterns** in the codebase for consistency

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Run `npm run db:migrate` to apply migrations

2. **Redis connection errors**:
   - Ensure Redis is running
   - Check REDIS_HOST and REDIS_PORT in .env

3. **Port conflicts**:
   - Backend runs on port 3000
   - Frontend runs on port 3001
   - Modify in docker-compose.dev.yml if needed

4. **Dependency issues**:
   - Run `npm install` to reinstall dependencies
   - Clear node_modules and reinstall if needed

## Resources

- [README.md](README.md) - Main project documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [SECURITY.md](SECURITY.md) - Security policies
- [DOCKER_DEV_SETUP.md](DOCKER_DEV_SETUP.md) - Docker development guide
- API Documentation: http://localhost:3000/api/docs (when running)

## Support

- GitHub Issues: https://github.com/Taskosaur/Taskosaur/issues
- GitHub Discussions: https://github.com/Taskosaur/Taskosaur/discussions
- Discord: https://discord.gg/5cpHUSxePp
- Email: support@taskosaur.com