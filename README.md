# Code Challenge

![Working screenshot](./docs/working-screenshot.png)

![Monthly Budget reference](./docs/aws-usd-budget.png)

The easy way to review would be following [Development Section](#development)
and read the [Code Review Section](#code-review)

## Code Review

[Endpoint exposed](systems/api/schema.graphql)

[Frontend code related to feature](./systems/frontend/src/GameLibraryPage)

[Backend code related to feature](systems/api/src/game-gallery)

[Infrastructure setup](./systems/infrastructure/src/index.ts)

[Architecture decision record](./docs/adr)
P.S. some of ADR document I circle back after finish coding, so it may out of order.

## Development

```sh
bash ./scripts/setup.sh
bash ./scripts/dev.sh

Open http://localhost:3000 for dev
```
