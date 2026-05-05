import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";

function loadHelper() {
    const source = fs.readFileSync(new URL("../contents/ui/accountSwitching.js", import.meta.url), "utf8");
    const context = {};
    vm.createContext(context);
    vm.runInContext(source, context);
    return context;
}

test("parseCswapList extracts accounts and active state", () => {
    const { parseCswapList } = loadHelper();
    const output = [
        "Accounts:",
        " 1: alice@example.com [personal]",
        "   ├ 5h:  23% resets 14:00 in 2h 1m",
        "   └ 7d:  51%",
        "",
        " 2: bob@example.com [work] (active)",
        "   └ 5h:  10%",
    ].join("\n");

    assert.deepEqual(JSON.parse(JSON.stringify(parseCswapList(output))), [
        { id: "1", email: "alice@example.com", tag: "personal", label: "1: alice@example.com [personal]", active: false },
        { id: "2", email: "bob@example.com", tag: "work", label: "2: bob@example.com [work]", active: true },
    ]);
});

test("parseCswapList strips ansi styling and ignores non-account lines", () => {
    const { parseCswapList } = loadHelper();
    const output = [
        "\u001b[1mAccounts:\u001b[0m",
        " \u001b[36m3:\u001b[0m charlie@example.com \u001b[2m[team]\u001b[0m \u001b[1m(active)\u001b[0m",
        " Running instances:",
        "   ● claude ~/project (1 session)",
    ].join("\n");

    assert.deepEqual(JSON.parse(JSON.stringify(parseCswapList(output))), [
        { id: "3", email: "charlie@example.com", tag: "team", label: "3: charlie@example.com [team]", active: true },
    ]);
});

test("shellQuote safely quotes command arguments", () => {
    const { shellQuote } = loadHelper();

    assert.equal(shellQuote("user@example.com"), "'user@example.com'");
    assert.equal(shellQuote("team's account"), "'team'\\''s account'");
});

test("buildLoginAndAddCommand chains Claude login and account add", () => {
    const { buildLoginAndAddCommand } = loadHelper();

    assert.equal(
        buildLoginAndAddCommand("cswap"),
        "claude auth login && cswap --add-account; echo; read -r -p 'Press Enter to close...'"
    );
});

test("buildCommandDetector prefers configured command when set", () => {
    const { buildCommandDetector } = loadHelper();

    assert.equal(buildCommandDetector("claude-swap"), "printf '%s' 'claude-swap'");
});

test("buildCommandDetector detects cswap then claude-swap by default", () => {
    const { buildCommandDetector } = loadHelper();
    const detector = buildCommandDetector("");

    assert.match(detector, /command -v cswap/);
    assert.match(detector, /command -v claude-swap/);
    assert.match(detector, /\$HOME\/\.local\/bin\/cswap/);
    assert.match(detector, /\$HOME\/\.local\/bin\/claude-swap/);
});

test("buildCommandDetector finds user-local claude-swap with a minimal Plasma PATH", () => {
    const { buildCommandDetector } = loadHelper();
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "claude-swap-home-"));
    const binDir = path.join(home, ".local", "bin");
    const commandPath = path.join(binDir, "claude-swap");

    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(commandPath, "#!/bin/sh\nexit 0\n");
    fs.chmodSync(commandPath, 0o755);

    const output = execFileSync("sh", ["-c", buildCommandDetector("")], {
        encoding: "utf8",
        env: { HOME: home, PATH: "/usr/bin:/bin" },
    });

    assert.equal(output, commandPath);
});
