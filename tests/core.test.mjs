import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { checkTable } from "../dist/assets/core/quality.js";

const columns = ["id", "name", "email"].map((name, index) => ({ index, name }));

test("matches the frozen quality oracle without UI or CSV adapter", async () => {
  const expected = JSON.parse(
    await readFile(new URL("../fixtures/quality-oracle.expected.json", import.meta.url), "utf8"),
  );
  const table = {
    columns,
    rows: [
      { rowNumber: 1, sourceLine: 2, values: ["1", "Alice", "alice@example.test"] },
      { rowNumber: 2, sourceLine: 3, values: ["2", "", "bob@example.test"] },
      { rowNumber: 3, sourceLine: 4, values: ["2", "", "bob@example.test"] },
      { rowNumber: 4, sourceLine: 5, values: ["3", "Carol", ""] },
      { rowNumber: 5, sourceLine: 6, values: ["4", "Dan", "dan@example.test"] },
    ],
  };

  assert.deepEqual(checkTable(table), expected);
});

test("treats whitespace as a value and the exact empty string as missing", () => {
  const report = checkTable({
    columns: [{ index: 0, name: "value" }],
    rows: [
      { rowNumber: 1, sourceLine: 2, values: [" "] },
      { rowNumber: 2, sourceLine: 3, values: [""] },
    ],
  });

  assert.equal(report.summary.issueCount, 1);
  assert.deepEqual(report.missingValues, [
    {
      kind: "missing-value",
      rowNumber: 2,
      sourceLine: 3,
      columnIndex: 0,
      columnName: "value",
    },
  ]);
});

test("returns duplicate groups in first-seen order with stable row order", () => {
  const report = checkTable({
    columns: [{ index: 0, name: "value" }],
    rows: [
      { rowNumber: 1, sourceLine: 2, values: ["A"] },
      { rowNumber: 2, sourceLine: 3, values: ["B"] },
      { rowNumber: 3, sourceLine: 4, values: ["A"] },
      { rowNumber: 4, sourceLine: 5, values: ["B"] },
      { rowNumber: 5, sourceLine: 6, values: ["B"] },
    ],
  });

  assert.deepEqual(report.duplicateGroups, [
    { kind: "exact-duplicate", rowNumbers: [1, 3], sourceLines: [2, 4] },
    { kind: "exact-duplicate", rowNumbers: [2, 4, 5], sourceLines: [3, 5, 6] },
  ]);
  assert.deepEqual(report.affectedRows, [1, 2, 3, 4, 5]);
  assert.equal(report.summary.issueCount, 2);
});

test("supports a header-only normalized table", () => {
  const report = checkTable({ columns: [{ index: 0, name: "id" }], rows: [] });

  assert.deepEqual(report, {
    schemaVersion: 1,
    summary: {
      totalRows: 0,
      issueCount: 0,
      missingValueCount: 0,
      duplicateGroupCount: 0,
      affectedRowCount: 0,
    },
    missingValues: [],
    duplicateGroups: [],
    affectedRows: [],
  });
});

test("does not mutate the normalized table", () => {
  const table = {
    columns: [{ index: 0, name: "id" }],
    rows: [{ rowNumber: 1, sourceLine: 2, values: ["1"] }],
  };
  const before = structuredClone(table);

  checkTable(table);

  assert.deepEqual(table, before);
});

test("rejects malformed normalized tables instead of repairing them", () => {
  assert.throws(
    () =>
      checkTable({
        columns: [{ index: 0, name: "id" }],
        rows: [{ rowNumber: 1, sourceLine: 2, values: ["1", "extra"] }],
      }),
    /does not match the table width/,
  );
});
