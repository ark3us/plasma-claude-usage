import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const mainQml = fs.readFileSync(new URL("../contents/ui/main.qml", import.meta.url), "utf8");

test("bar panel metrics use a stable preferred height", () => {
    const barStyleStart = mainQml.indexOf("// === BAR STYLE ===");
    const barStyleEnd = mainQml.indexOf("// Error text", barStyleStart);

    assert.notEqual(barStyleStart, -1);
    assert.notEqual(barStyleEnd, -1);

    const barStyleBlock = mainQml.slice(barStyleStart, barStyleEnd);

    assert.doesNotMatch(barStyleBlock, /Layout\.preferredHeight:\s*parent\.height/);
});
