function stripAnsi(text) {
    return (text || "").replace(/\x1b\[[0-9;]*m/g, "")
}

function parseCswapList(output) {
    var accounts = []
    var lines = stripAnsi(output).split(/\r?\n/)

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim()
        var match = line.match(/^(\d+):\s+(\S+)(?:\s+\[([^\]]+)\])?(?:\s+\(active\))?$/)
        if (!match) {
            continue
        }

        var id = match[1]
        var email = match[2]
        var tag = match[3] || ""
        var active = /\(active\)$/.test(line)
        var label = id + ": " + email + (tag ? " [" + tag + "]" : "")

        accounts.push({
            id: id,
            email: email,
            tag: tag,
            label: label,
            active: active
        })
    }

    return accounts
}

function shellQuote(value) {
    return "'" + String(value).replace(/'/g, "'\\''") + "'"
}

function buildLoginAndAddCommand(accountSwitchCommand) {
    return "claude auth login && " + (accountSwitchCommand || "cswap") + " --add-account; echo; read -r -p 'Press Enter to close...'"
}

function buildCommandDetector(configuredCommand) {
    var command = (configuredCommand || "").trim()
    if (command) {
        return "printf '%s' " + shellQuote(command)
    }
    return "if command -v cswap >/dev/null 2>&1; then command -v cswap"
        + "; elif command -v claude-swap >/dev/null 2>&1; then command -v claude-swap"
        + "; elif [ -x \"$HOME/.local/bin/cswap\" ]; then printf '%s' \"$HOME/.local/bin/cswap\""
        + "; elif [ -x \"$HOME/.local/bin/claude-swap\" ]; then printf '%s' \"$HOME/.local/bin/claude-swap\""
        + "; elif [ -x \"$HOME/bin/cswap\" ]; then printf '%s' \"$HOME/bin/cswap\""
        + "; elif [ -x \"$HOME/bin/claude-swap\" ]; then printf '%s' \"$HOME/bin/claude-swap\""
        + "; elif [ -x \"$HOME/.cargo/bin/cswap\" ]; then printf '%s' \"$HOME/.cargo/bin/cswap\""
        + "; elif [ -x \"$HOME/.cargo/bin/claude-swap\" ]; then printf '%s' \"$HOME/.cargo/bin/claude-swap\""
        + "; fi"
}
