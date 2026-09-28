import type {
  DuplicateGroupFinding,
  MissingValueFinding,
  NormalizedRow,
  NormalizedTable,
  QualityReport,
} from "../shared/types.js";

function assertValidTable(table: NormalizedTable): void {
  const columnNames = new Set<string>();

  table.columns.forEach((column, columnIndex) => {
    if (column.index !== columnIndex) {
      throw new TypeError(`Column index ${column.index} is not contiguous.`);
    }
    if (column.name.length === 0 || columnNames.has(column.name)) {
      throw new TypeError(`Column name at index ${columnIndex} is empty or duplicated.`);
    }
    columnNames.add(column.name);
  });

  table.rows.forEach((row, rowIndex) => {
    if (row.rowNumber !== rowIndex + 1) {
      throw new TypeError(`Row number ${row.rowNumber} is not contiguous.`);
    }
    if (!Number.isInteger(row.sourceLine) || row.sourceLine < 2) {
      throw new TypeError(`Row ${row.rowNumber} has an invalid source line.`);
    }
    if (row.values.length !== table.columns.length) {
      throw new TypeError(`Row ${row.rowNumber} does not match the table width.`);
    }
  });
}

function collectMissingValues(table: NormalizedTable): MissingValueFinding[] {
  const findings: MissingValueFinding[] = [];

  for (const row of table.rows) {
    row.values.forEach((value, columnIndex) => {
      if (value === "") {
        const column = table.columns[columnIndex];
        if (column === undefined) {
          throw new TypeError(`Missing column metadata at index ${columnIndex}.`);
        }
        findings.push({
          kind: "missing-value",
          rowNumber: row.rowNumber,
          sourceLine: row.sourceLine,
          columnIndex,
          columnName: column.name,
        });
      }
    });
  }

  return findings;
}

function collectDuplicateGroups(rows: readonly NormalizedRow[]): DuplicateGroupFinding[] {
  const groups = new Map<string, NormalizedRow[]>();

  for (const row of rows) {
    const key = JSON.stringify(row.values);
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, [row]);
    } else {
      group.push(row);
    }
  }

  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      kind: "exact-duplicate" as const,
      rowNumbers: group.map((row) => row.rowNumber),
      sourceLines: group.map((row) => row.sourceLine),
    }));
}

export function checkTable(table: NormalizedTable): QualityReport {
  assertValidTable(table);

  const missingValues = collectMissingValues(table);
  const duplicateGroups = collectDuplicateGroups(table.rows);
  const affectedRows = [
    ...new Set([
      ...missingValues.map((finding) => finding.rowNumber),
      ...duplicateGroups.flatMap((group) => group.rowNumbers),
    ]),
  ].sort((left, right) => left - right);

  return {
    schemaVersion: 1,
    summary: {
      totalRows: table.rows.length,
      issueCount: missingValues.length + duplicateGroups.length,
      missingValueCount: missingValues.length,
      duplicateGroupCount: duplicateGroups.length,
      affectedRowCount: affectedRows.length,
    },
    missingValues,
    duplicateGroups,
    affectedRows,
  };
}
