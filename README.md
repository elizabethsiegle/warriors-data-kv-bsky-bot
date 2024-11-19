# Automate Posts to BlueSky with BlueSky API, Cloudflare Workers, Cloudflare KV, Cron Triggers
This is a [Cloudflare Workers](https://workers.cloudflare.com/) application that makes use of [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) to automate posting once a day to [Blue Sky](https://bsky.app/). It passes data from [basketball-data/GSW.json](./basketball-data/GSW.json) hosted in a Cloudflare KV namespace to a Workers AI call using [Llama-3.2](https://developers.cloudflare.com/workers-ai/models/llama-3.2-3b-instruct/).

That data was scraped from [https://www.basketball-reference.com/teams/${team}/${year}.html](https://www.basketball-reference.com/teams/GSW/2023.html)

Check it out on [Blue Sky here](https://bsky.app/profile/warriorsbot.bsky.social)!

## Setup
Copy [.dev.vars.example](./.dev.vars.example) to `.dev.vars` and add your `BLUESKY_USERNAME` and `BLUESKY_PASSWORD`.

For more information about hosting data on Workers KV, see this [Workers KV Getting Started page](https://developers.cloudflare.com/kv/get-started/)

```bash
npm install
npx wrangler login # if it's your first time here
```

In [wrangler.toml](./wrangler.toml), you can set the time to post in the `crons` array beneath the `triggers` configuration. Reminder--cron tabs are written in UTC. I used the [Cloudflare Workers AI LLM Playground](https://playground.ai.cloudflare.com/) to generate my cron tabs using this system message from my wonderful teammate [Craig Dennis](https://twitter.com/craigsdennis):

```
You help write cron tabs.

The user will give you a description of time they are looking for and your job is to generate a cron tab string.

The user will specify timezones, you know the server runs in UTC.

Return the cron tab and the explanation.
```

## Develop locally
```bash
npm run dev
```

## Deploy
```bash
npm run deploy
```