export interface TableColumn {
  readonly index: number;
  readonly name: string;
}

export interface NormalizedRow {
  readonly rowNumber: number;
  readonly sourceLine: number;
  readonly values: readonly string[];
}

export interface NormalizedTable {
  readonly columns: readonly TableColumn[];
  readonly rows: readonly NormalizedRow[];
}

export interface MissingValueFinding {
  readonly kind: "missing-value";
  readonly rowNumber: number;
  readonly sourceLine: number;
  readonly columnIndex: number;
  readonly columnName: string;
}

export interface DuplicateGroupFinding {
  readonly kind: "exact-duplicate";
  readonly rowNumbers: readonly number[];
  readonly sourceLines: readonly number[];
}

export interface QualityReport {
  readonly schemaVersion: 1;
  readonly summary: {
    readonly totalRows: number;
    readonly issueCount: number;
    readonly missingValueCount: number;
    readonly duplicateGroupCount: number;
    readonly affectedRowCount: number;
  };
  readonly missingValues: readonly MissingValueFinding[];
  readonly duplicateGroups: readonly DuplicateGroupFinding[];
  readonly affectedRows: readonly number[];
}
