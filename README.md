<p align="center"><img src="https://github.com/twilio-labs/mcp/blob/246f1b1cd1854d1343468af07a2dfa179dc30a16/docs/twilioAlphaLogoLight.png?raw=true#gh-dark-mode-only" height="70" alt="Twilio Alpha"/><img src="https://github.com/twilio-labs/mcp/blob/246f1b1cd1854d1343468af07a2dfa179dc30a16/docs/twilioAlphaLogoDark.png?raw=true#gh-light-mode-only" height="70" alt="Twilio Alpha"/></p>
<h1 align="center">Twilio MCP (Fork)</h1>

Fork of [twilio-labs/mcp](https://github.com/twilio-labs/mcp) published as `@ayushmudgal94/twilio-mcp` on npm.

## What's different from upstream

- **Tool name separator**: Uses `_` instead of `--` for cross-provider compatibility (Bedrock, Gemini, LibreChat)
- **Tool name shortening**: Truncates names to 53 chars so LibreChat's `_mcp_twilio` suffix stays under 64
- **Tool name normalization**: Handles LibreChat suffix stripping on incoming tool calls
- **GET query parameters**: Properly sends params as query strings instead of dropping them
- **Parameter sanitization**: Handles Twilio's `<`/`>` in param names (e.g. `StartTime<` → `StartTime_lt`)
- **`--methods` flag**: Filter by HTTP method (e.g. `--methods get` for read-only mode)

## Packages

| Package | npm |
|---|---|
| `@ayushmudgal94/twilio-mcp` | [npm](https://www.npmjs.com/package/@ayushmudgal94/twilio-mcp) |
| `@ayushmudgal94/openapi-mcp-server` | [npm](https://www.npmjs.com/package/@ayushmudgal94/openapi-mcp-server) |

## Quick Start

### Claude Code CLI

```bash
claude mcp add twilio -- npx -y @ayushmudgal94/twilio-mcp \
  YOUR_ACCOUNT_SID/YOUR_API_KEY:YOUR_API_SECRET \
  --methods get
```

### LibreChat (librechat.yaml)

```yaml
mcpServers:
  twilio:
    title: "Twilio"
    description: "Twilio API integration - Read-only"
    command: npx
    args:
      - "-y"
      - "@ayushmudgal94/twilio-mcp@1.1.0"
      - "${TWILIO_API_KEY}"
      - "--services"
      - "twilio_api_v2010,twilio_verify_v2"
      - "--methods"
      - "get"
    startup: false
```

### Generic MCP client (JSON config)

```json
{
  "twilio": {
    "command": "npx",
    "args": [
      "-y",
      "@ayushmudgal94/twilio-mcp",
      "YOUR_ACCOUNT_SID/YOUR_API_KEY:YOUR_API_SECRET",
      "--methods", "get",
      "--services", "twilio_api_v2010,twilio_verify_v2"
    ]
  }
}
```

## Configuration Options

| Flag | Alias | Description | Default |
|---|---|---|---|
| `--services` | `-e` | Comma-separated list of Twilio API services to load | `twilio_api_v2010` |
| `--tags` | `-t` | Filter endpoints by OpenAPI tags | all |
| `--methods` | `-m` | Filter by HTTP method (e.g. `get` for read-only) | all |

### Useful service combinations

| Use case | `--services` value |
|---|---|
| Core SMS/Calls only | `twilio_api_v2010` |
| SMS + Verify | `twilio_api_v2010,twilio_verify_v2` |
| Messaging service | `twilio_api_v2010,twilio_messaging_v1` |
| Everything | omit the flag (loads all, can be slow) |

### Credentials format

Pass credentials as a single positional argument: `ACCOUNT_SID/API_KEY:API_SECRET`

Or use named flags: `--accountSid AC... --apiKey SK... --apiSecret ...`

Visit [Twilio API Keys docs](https://www.twilio.com/docs/iam/api-keys) for information on how to find/create your API Key and Secret.

## Development

```bash
# Install dependencies
npm ci

# Build both packages
npm run build --workspaces

# Run tests
npm test --workspaces

# Run linting
npm run lint --workspaces

# Run the server locally
node packages/mcp/build/index.js \
  YOUR_ACCOUNT_SID/YOUR_API_KEY:YOUR_API_SECRET \
  --methods get
```

## Publishing to npm

Publishing is manual version bumps + automated CI publish.

### Step 1: Bump versions in your PR

Three files need version changes:

| File | What to bump |
|---|---|
| `packages/openapi-mcp-server/package.json` | `"version"` |
| `packages/mcp/package.json` | `"version"` |
| `packages/mcp/package.json` | `"@ayushmudgal94/openapi-mcp-server"` dependency version (must match) |

Use semver: `patch` for fixes, `minor` for new features/breaking tool name changes, `major` for API contract changes.

### Step 2: Add the `publish` label to the PR

The GitHub Actions workflow only publishes when a merged PR has the `publish` label.

### Step 3: Merge

On merge, CI will:
1. Run tests and lint
2. Build both packages
3. Publish `@ayushmudgal94/openapi-mcp-server` first (dependency)
4. Publish `@ayushmudgal94/twilio-mcp` second

### Prerequisites (one-time setup)

1. **Enable GitHub Actions** at https://github.com/ayushmudgal/twilio-mcp/actions
2. **Add `NPM_TOKEN` secret** at https://github.com/ayushmudgal/twilio-mcp/settings/secrets/actions — use a granular access token with publish rights to `@ayushmudgal94/*`

### Publishing manually (without CI)

```bash
npm run build --workspaces
cd packages/openapi-mcp-server && npm publish --access public
cd ../mcp && npm publish --access public
```

## Syncing with upstream

```bash
git fetch upstream
git merge upstream/main
# resolve conflicts, test, push
```

## Troubleshooting

- **Tool not found in LibreChat**: Check that tool names use `_` separator (v1.1.0+). Old `--` names cause lookup failures.
- **Context size too large**: Use `--services` to load only the APIs you need.
- **npx hangs in container**: Make sure `-y` flag is passed before the package name.
- **npm publish 403**: Either 2FA is blocking or the token lacks publish rights. Use a granular access token.

## License

This project is licensed under the ISC License - see the LICENSE file for details.
