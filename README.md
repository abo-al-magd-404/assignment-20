# ASSIGNMENT 20
Author: mohamed mahmoud abo al magd  
Group: Node_C45_Mon&Thurs_9:00pm (Online)

---

## What this is
A modular NestJS (TypeScript) backend focused on user and e‑commerce domains — products, categories, brands, carts, orders and authentication — with MongoDB persistence (Mongoose) and a GraphQL schema (Apollo). It provides a practical starter for an e‑commerce API with file/upload integrations, caching, JWT auth primitives, and a clear module layout.

### Stack
- **Language(s):** TypeScript
- **Framework / runtime:** NestJS v11
- **Notable libraries:**
  - @nestjs/graphql / @apollo/server (GraphQL)
  - @nestjs/mongoose, mongoose (MongoDB)
  - @nestjs/jwt, jsonwebtoken, bcrypt (authentication)
  - @aws-sdk/*, cloudinary (file uploads)
  - redis, cache-manager (caching)
  - class-validator / class-transformer, zod (validation)

---

## Key features
- Modular NestJS architecture (authentication, user, product, category, brand, cart, order).
- MongoDB persistence with Mongoose models (src/model/*.model.ts).
- GraphQL schema present (src/schema.gql) and Apollo integration.
- Upload/storage integrations available via AWS SDK and Cloudinary packages.
- JWT-based authentication support and password hashing (bcrypt).
- Caching support (redis + cache-manager).
- Jest e2e test scaffold (test/app.e2e-spec.ts).

---

## Project layout
```
.env.development               # development environment variables
.env.production                # production environment variables
package.json                   # scripts, dependencies and test config
tsconfig.json
tsconfig.build.json
nest-cli.json
src/
  main.ts                      # app bootstrap (reads config, starts Nest app)
  app.module.ts                # root module wiring
  app.controller.ts            # example controller
  app.service.ts               # example service
  schema.gql                   # GraphQL schema
  config/
    config.ts                  # configuration exports (PORT, DB config)
    index.ts
  model/                       # Mongoose schemas & model exports
    user.model.ts
    product.model.ts
    category.model.ts
    brand.model.ts
    cart.model.ts
    index.ts
  common/                      # shared decorators, pipes, guards, utils
  modules/                     # domain modules (authentication, user, product, ...)
test/                          # e2e test scaffold and jest config
uploads/                       # uploads directory for file handling
README.md
```

How it fits together: src/main.ts boots the Nest application, imports configuration from src/config, and registers global pipes. AppModule composes domain modules; modules use Mongoose models from src/model. GraphQL schema (src/schema.gql) and @nestjs/graphql + @apollo/server integration provide the GraphQL API surface while platform-express supports REST controllers.

---

## Quickstart — shortest path to run locally
1. Install dependencies
```bash
npm install
```

2. Provide environment variables
- Use the included .env.development or .env.production as a starting point. Required variables (as referenced in src/config/config.ts and packages):
  - PORT (e.g., 3000)
  - MONGODB_URI (MongoDB connection string)

Optional (enable integrations/features):
  - JWT_SECRET (for signing tokens)
  - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET
  - CLOUDINARY_URL (or CLOUDINARY_NAME/KEY/SECRET)
  - REDIS_URL

3. Development
```bash
npm run start:dev
# or
npm run start
```

4. Production build + run
```bash
npm run build
npm run start:prod
```

5. Tests
```bash
npm run test       # unit tests
npm run test:e2e   # e2e (uses test/jest-e2e.json)
npm run test:cov   # coverage
```

---

## Configuration
- Configuration is centralized under src/config (see src/config/config.ts). main.ts imports PORT and other runtime settings from this module.
- The repository includes .env.development and .env.production — copy values into a local .env or create a .env.example documenting the variables you need.

---

## Files to inspect when extending
- src/schema.gql — GraphQL schema and available queries/mutations
- src/config/config.ts — authoritative list of environment variables and config defaults
- src/model/*.model.ts — domain schemas and relations (user, product, category, brand, cart)
- src/modules/* — where controllers/resolvers and services live
- test/app.e2e-spec.ts — example e2e test that shows API usage

---

## Maintenance & next steps
- Add a .env.example listing required env vars with short descriptions.
- Add API documentation: Swagger for REST controllers and a short GraphQL examples section (queries/mutations) extracted from src/schema.gql.
- Add CONTRIBUTING.md and CI workflows to run tests and linting on PRs.
- Choose and add a license (package.json is currently set to UNLICENSED).

---

## License
This repository is currently marked as "UNLICENSED" in package.json.
