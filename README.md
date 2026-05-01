# Claude Usage Switcher Widget

A KDE Plasma 6 widget that displays your Claude Code usage statistics and switches Claude accounts from the taskbar.

Based on the original [plasma-claude-usage](https://github.com/izll/plasma-claude-usage) widget by izll, with optional account switching through [claude-swap](https://github.com/realiti4/claude-swap) by realiti4.

## Features

- **Compact Panel Display**: Shows session and weekly usage percentages right in your taskbar
- **Color-coded Indicators**: Green (<50%), Yellow (<80%), Red (≥80%)
- **Detailed Popup**: Click to see full statistics
  - Session and weekly usage with progress bars
  - Reset times for both limits
  - Per-model breakdown (Sonnet/Opus)
  - Your subscription plan badge
- **Configurable Refresh**: Default 5 min polling (adjustable in settings)
- **Smart Rate Limit Handling**: Uses `retry-after` header, exponential backoff, and token watcher for automatic recovery
- **Local Cache**: Remembers last data on restart (up to 24h)
- **Stale Detection**: Widget dims when data is outdated
- **Error Handling**: Clear messages when not logged in, token expired, or rate limited
- **Custom API Support**: Optional proxy/gateway with custom base URL and API key
- **15 Languages**: EN, HU, DE, FR, ES, IT, PT, RU, PL, NL, TR, JA, KO, ZH-CN, ZH-TW
- **No Bundled Dependencies**: Pure QML; account switching uses an already-installed optional CLI
- **New: Account Switcher**: Optional popup selector for `claude-swap` managed accounts

## Requirements

- KDE Plasma 6.0 or later
- Claude Code CLI installed and logged in
- Optional: [`claude-swap`](https://github.com/realiti4/claude-swap) for account switching

## Installation

### From KDE Store

Install from the [Claude Usage Switcher KDE Store page](https://store.kde.org/p/2357774).

1. Right-click on your panel
2. Select "Add Widgets..."
3. Click "Get New Widgets..." > "Download New Plasma Widgets..."
4. Search for "Claude Usage Switcher"
5. Click Install

### Manual Installation

```bash
kpackagetool6 -t Plasma/Applet -i claude-usage-switcher.plasmoid
```

### From Source

```bash
git clone https://github.com/izll/plasma-claude-usage.git
cd plasma-claude-usage
kpackagetool6 -t Plasma/Applet -i .
```

## Usage

1. Make sure you're logged in to Claude Code (run `claude` in terminal)
2. Add the widget to your panel
3. Click the widget to see detailed usage statistics

## Configuration

Right-click the widget and select **Configure...** to open the settings.

### Custom API Base URL (optional)

By default the widget reads your OAuth credentials from `~/.claude/.credentials.json` and calls `https://api.anthropic.com` directly — no configuration needed.

If you use a custom API proxy or gateway, you can override this:

| Setting | Description |
|---|---|
| **Base URL** | Your proxy URL, e.g. `https://your-proxy.example.com` |
| **API key** | Your `ANTHROPIC_API_KEY` |

> **Note:** The widget calls `/api/oauth/usage`, not the standard `/v1/messages` endpoint. Use the root URL without any path suffix — e.g. `https://api.anthropic.com`, not `https://api.anthropic.com/v1`.

When a base URL is configured, the widget authenticates with `x-api-key` instead of the OAuth token. Leave the Base URL field empty to go back to the default credentials file method.

### Account Switching (optional)

If you manage multiple Claude Code accounts with `claude-swap`, the popup can switch between them directly. The widget uses the installed `claude-swap` command to read accounts with `--list`, switch with `--switch-to <account-number>`, and save the currently logged-in account with `--add-account`.

The **Login & add** button opens a terminal and runs `claude auth login && claude-swap --add-account`, because Claude login is interactive. Finish the login in that terminal, then refresh the account selector.

| Setting | Description |
|---|---|
| **Command** | Optional `claude-swap` command override; leave empty for automatic detection |

The selector is only shown in the default OAuth credentials mode. It is hidden when a custom API base URL is configured.

## How It Works

The widget calls the Anthropic usage API directly from QML. No data is stored or sent anywhere else.

### API Endpoint

```
GET https://api.anthropic.com/api/oauth/usage
Headers:
  Authorization: Bearer <oauth-token>   (default mode)
  x-api-key: <api-key>                  (custom base URL mode)
  anthropic-beta: oauth-2025-04-20
```

## Troubleshooting

### "Not logged in" error

Make sure you're logged in to Claude Code:
```bash
claude
```

### "Token expired" error

Your OAuth token has expired. Run Claude Code again to refresh it:
```bash
claude
```
The widget also has an "Open Claude" button for this.

### "Rate limited" error

The API allows ~4 requests per 5-minute window. The widget handles this automatically:
- Reads the `retry-after` header and waits the specified time
- Falls back to exponential backoff (5/10/15 min)
- Monitors for token refresh and recovers instantly

To avoid rate limiting, keep the refresh interval at 5 minutes or higher.

### "Invalid API key" error

The API key in the widget settings is wrong or revoked. Open **Configure...** and update it.

### "Endpoint not found — check base URL" error

The base URL in the widget settings doesn't point to a valid API. Make sure you're using the root URL without `/v1`, e.g. `https://api.anthropic.com`.

### Widget shows 0%

- Click the refresh button in the popup
- Check logs: `journalctl --user -f | grep -i claude`

## File Structure

```
plasma-claude-usage/
├── metadata.json           # Widget metadata
├── install.sh              # Installation script
├── contents/
│   ├── config/
│   │   └── main.xml        # Configuration schema
│   ├── ui/
│   │   ├── main.qml        # Widget implementation
│   │   ├── configGeneral.qml # Settings UI
│   │   └── Translations.qml # i18n (15 languages)
│   └── icons/
│       └── claude.svg      # Claude logo (orange)
└── screenshots/            # Preview images
```

## License

GPL-3.0-or-later

## Credits

- Original widget: [plasma-claude-usage](https://github.com/izll/plasma-claude-usage) by izll
- Account switching integration uses the external [claude-swap](https://github.com/realiti4/claude-swap) CLI by realiti4
