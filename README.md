# feednow-auth-ui

Planning foundation for FeedNow's static account application at
`account.feednow.io`. The source requirements and dependency-aware delivery
phases are in [`specs/draft`](specs/draft/). Implementation begins only after
the first phase is planner- and reviewer-approved and promoted to `specs/wip/`.

The UI is a React/Vite frontend. Its Python backend is the separate
`feednow-auth` service; see the cross-repository contract phase before adding
browser calls.
