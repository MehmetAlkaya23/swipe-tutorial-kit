# Contributing

```sh
npm install
npm run check        # typecheck + lint + tests
npm run test:coverage
```

To try changes on a device, run the example app. It resolves the kit straight
from `../src`, so edits hot-reload:

```sh
cd example
npm install
npx expo start
```

Guidelines:

- Keep the package free of runtime dependencies. It should only need `react` and `react-native`.
- Every behavior change comes with a test.
- Update `CHANGELOG.md` under an "Unreleased" heading.
