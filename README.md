# ASSIGNMENT 18 | NEST.JS FIRST ASSIGNMENT
Author: mohamed mahmoud abo al magd  
Group: Node_C45_Mon&Thurs_9:00pm (Online)

---

## Project overview
A modular NestJS application (TypeScript) built with Mongoose for MongoDB and focused on user and e-commerce related domains. The project uses Nest's modular design and validation pipeline and provides a starting point for building REST APIs with authentication, product, category, brand and order modules.

### Stack
- Language(s): TypeScript
- Framework / runtime: NestJS (v11)
- Notable libraries:
  - @nestjs/common, @nestjs/core, @nestjs/platform-express
  - @nestjs/mongoose, mongoose (MongoDB integration)
  - bcrypt (password hashing)
  - class-validator / class-transformer (validation & DTOs)
  - zod (schema validation / parsing)

---

## Repository layout
Important top-level files and folders:
```
.env.development               # environment file (dev)
.env.production                # environment file (prod)
.gitignore
package.json                   # scripts, deps, devDeps, jest config
tsconfig.json
tsconfig.build.json
nest-cli.json
src/
  main.ts                      # application entry (sets ValidationPipe, reads PORT from config)
  app.module.ts                # root Nest module (module wiring)
  app.controller.ts            # example controller
  app.service.ts               # example service
  config/
    config.ts                   # configuration exports (PORT is imported from here)
    index.ts
  model/
    user.model.ts               # user Mongoose model
    index.ts
  common/                      # common decorators, pipes, interfaces, repositories, utils
  modules/
    authentication/            # authentication module (auth flows)
    user/                      # user module
    product/                   # product module
    category/                  # category module
    brand/                     # brand module
    order/                     # order module
test/                          # tests and e2e config
```

How it fits together:
- The application bootstrap is in src/main.ts which creates the Nest app, registers a global ValidationPipe, and starts the server on PORT from configuration.
- AppModule composes domain modules (authentication, user, product, category, brand, order). Models (e.g., src/model/user.model.ts) provide Mongoose schemas used by module repositories/services.
- Validation is enforced globally using Nest's ValidationPipe (stopAtFirstError, whitelist, forbidNonWhitelisted).

---

## Key features (inferred from structure & dependencies)
- Modular NestJS architecture with separated domain modules (authentication, user, product, category, brand, order).
- MongoDB persistence via Mongoose.
- Input validation using class-validator / class-transformer and zod available for schema parsing/validation.
- Password hashing support using bcrypt.
- Ready-to-run scripts for development, production, and testing.

---

## Setup & run (shortest path)
1. Install dependencies:
```bash
npm install
```

2. Development:
```bash
npm run start:dev
# or
npm run start
```

3. Production build + run:
```bash
npm run build
npm run start:prod
```

4. Tests:
```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

Scripts available (from package.json):
- build: nest build
- start, start:dev, start:prod
- lint: eslint ... --fix
- format: prettier --write "src/**/*.ts" "test/**/*.ts"
- test, test:watch, test:cov, test:e2e

---

## Configuration
- The application reads configuration from src/config (src/config/config.ts is present) and main.ts imports a PORT constant from that config.
- Environment files included at repo root: .env.development and .env.production — use them to keep environment-specific values outside source.
- Ensure the config (or environment files) provide the port and any DB connection strings the app needs (the project depends on mongoose).


---

## Notes for maintainers / next steps
- Confirm and document required environment variables in src/config/config.ts (PORT and MongoDB connection string), and add an example .env.example if desired.
- Add API documentation (e.g., Swagger/OpenAPI) if you intend to expose and document endpoints for consumers.
- Add a short outline in README describing the main endpoints (controllers) and sample requests once controllers are stabilized.
- Add CONTRIBUTING.md and a short development checklist for common tasks (run, test, lint, build).

---

## License
This project is currently marked as "UNLICENSED" in package.json.
