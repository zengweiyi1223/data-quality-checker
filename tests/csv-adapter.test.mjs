import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { CsvParseError, parseCsv } from "../dist/assets/adapters/csv.js";

test("parses the frozen quality fixture into the expected normalized table", async () => {
  const input = await readFile(
    new URL("../fixtures/quality-oracle.csv", import.meta.url),
    "utf8",
  );

  assert.deepEqual(parseCsv(input), {
    columns: [
      { index: 0, name: "id" },
      { index: 1, name: "name" },
      { index: 2, name: "email" },
    ],
    rows: [
      { rowNumber: 1, sourceLine: 2, values: ["1", "Alice", "alice@example.test"] },
      { rowNumber: 2, sourceLine: 3, values: ["2", "", "bob@example.test"] },
      { rowNumber: 3, sourceLine: 4, values: ["2", "", "bob@example.test"] },
      { rowNumber: 4, sourceLine: 5, values: ["3", "Carol", ""] },
      { rowNumber: 5, sourceLine: 6, values: ["4", "Dan", "dan@example.test"] },
    ],
  });
});

test("matches the independent CRLF, quoted-comma, escaped-quote and embedded-line oracle", async () => {
  const fixture = JSON.parse(
    await readFile(new URL("../fixtures/csv-adapter-rfc.json", import.meta.url), "utf8"),
  );

  assert.deepEqual(parseCsv(fixture.input), fixture.expected);
});

test("accepts a UTF-8 BOM, LF records and a final line terminator", () => {
  assert.deepEqual(parseCsv("\uFEFFid,name\n1,Alice\n"), {
    columns: [
      { index: 0, name: "id" },
      { index: 1, name: "name" },
    ],
    rows: [{ rowNumber: 1, sourceLine: 2, values: ["1", "Alice"] }],
  });
});

test("keeps an empty field and does not trim whitespace", () => {
  assert.deepEqual(parseCsv("id,value\n1,\n2, \n").rows, [
    { rowNumber: 1, sourceLine: 2, values: ["1", ""] },
    { rowNumber: 2, sourceLine: 3, values: ["2", " "] },
  ]);
});

test("allows a header-only CSV", () => {
  assert.deepEqual(parseCsv("id,name\n").rows, []);
});

for (const [name, input, code, sourceLine] of [
  ["empty file", "", "EMPTY_FILE", 1],
  ["empty header", "id,\n1,Alice", "INVALID_HEADER", 1],
  ["duplicate header", "id,id\n1,2", "INVALID_HEADER", 1],
  ["unclosed quote", 'id,name\n1,"Alice', "UNCLOSED_QUOTE", 2],
  ["unexpected quote", 'id,name\n1,Al"ice', "UNEXPECTED_QUOTE", 2],
  ["characters after quote", 'id,name\n1,"Alice"x', "UNEXPECTED_QUOTE", 2],
  ["row width mismatch", "id,name\n1", "ROW_WIDTH_MISMATCH", 2],
]) {
  test(`reports ${name} with a stable error code`, () => {
    assert.throws(
      () => parseCsv(input),
      (error) =>
        error instanceof CsvParseError &&
        error.code === code &&
        error.sourceLine === sourceLine,
    );
  });
}
