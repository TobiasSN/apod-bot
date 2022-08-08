# Astronomy Picture of the Day Bot

This is a bot based on Cloudflare Workers that sends NASA's Astronomy Picture of
the Day to a Discord webhook when it comes out.

## Development

Firstly, make sure you have Yarn and Wrangler installed:
```sh
npm install -g yarn
yarn global add wrangler # Or `npm install -g wrangler`
```

Copy the contents of `wrangler.example.toml` to a new file called
`wrangler.toml`. Then, create a preview Workers KV store, and a regular one if
you want to deploy, and place them in your `wrangler.toml` under
`kv_namespaces`.

Finally, copy `.dev.example.vars` to `.dev.vars`, acquire a NASA API key from
https://api.nasa.gov, as well as a Discord webhook URL, and place both in the
new file.

Now you can run a local version of the bot with `wrangler dev`.
