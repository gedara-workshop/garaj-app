# Working rules

## Commits

- One small commit per task or feature.
- Conventional Commits: `feat`, `fix`, `chore`, `docs`, `refactor` (scope optional, e.g. `feat(home): ...`).
- Imperative mood, short subject.
- Run `npm run typecheck` before every commit. If it fails, don't commit.

## Writing

- Never use the em dash character anywhere: code, comments, commit messages, docs. Use a comma, colon, parentheses or a new sentence instead.

## Design

Follow the design rules in the README:

- Every text goes through `<Txt variant=...>`.
- Colors come from tokens only (`bg-surface-200`, `text-ink-muted`, `bg-brand`); never hard-code a hex in a component.
- Join classes with `cn()` so overrides win.
- Status colors (`ok`, `soon`, `due`) only ever mean status, and always come with an icon and words.

## Dependencies

- Ask before adding a new dependency.
- Use `npx expo install <package>` for Expo and React Native packages so versions match the SDK.
