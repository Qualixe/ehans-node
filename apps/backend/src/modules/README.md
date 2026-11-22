# Feature modules

Business features live here, one folder per bounded context. **None are implemented yet.**

Planned modules (not yet built): `catalog` (products, categories), `cart`, `checkout`,
`orders`, `payments`, `customers`/`auth`.

## Module layout

```
src/modules/<feature>/
  <feature>.module.ts        # Nest module; exports only the services other modules need
  <feature>.controller.ts    # HTTP layer: routing, DTO validation, Swagger decorators
  <feature>.service.ts       # business logic; the only layer that uses PrismaService
  dto/                       # class-validator request DTOs + Swagger response DTOs
  <feature>.service.spec.ts  # unit tests beside the code (Vitest)
```

## Rules

- Register each module in `src/app.module.ts`.
- Modules talk to each other through exported services, never through another
  module's tables or Prisma queries (modular monolith, not microservices).
- Relative imports end in `.js` (ESM / `nodenext`).
- Put types the frontend also needs in `packages/shared`.
- Schema changes ship with a Prisma migration (`pnpm db:migrate`).
