# EquiX Frontend

React 19 and Vite client for the EquiX horse-racing tournament management system.

## Local development

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:5173` and expects the Spring Boot API at `http://localhost:9090/api` by default. Copy `.env.example` to `.env.local` only when local overrides are needed.

## Quality checks

```bash
npm test
npm run lint
npm run build
```

See the [project README](../README.md) for SQL Server setup, backend commands, role workflows, demo data, and full documentation.
