# How this build was filed

Date: 27 September 2026.

Owner: [trigger6980](https://github.com/trigger6980).

This repository is the Sideboot app build: the TypeScript that runs, the styles, the favicon, the shell scripts, and the operator docs. It is not a summary standing in for missing code.

## Rule for later builds

Each Grok app build gets its own repository under trigger6980. The commit includes:

- `README.md` — what it is, what it cannot do, and where the code lives
- `docs/` — architecture, operator steps, and limits
- the source that was actually written for that build

Platform boilerplate that is not the product (dependency trees, auth wiring the app does not use, `node_modules`) stays out.

Older specialized repos already hold their own code. They are listed from [repo-index](https://github.com/trigger6980/repo-index). This file does not duplicate them.

A future chat does not see this sandbox. The filing rule is recorded in repo-index so the next build is published the same way: source plus docs, in the matching repo, without handing the push back.
