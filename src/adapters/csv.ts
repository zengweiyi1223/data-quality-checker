import type { NormalizedTable } from "../shared/types.js";

export type CsvParseErrorCode =
  | "EMPTY_FILE"
  | "INVALID_HEADER"
  | "UNCLOSED_QUOTE"
  | "UNEXPECTED_QUOTE"
  | "ROW_WIDTH_MISMATCH";

export class CsvParseError extends Error {
  readonly code: CsvParseErrorCode;
  readonly sourceLine: number | undefined;

  constructor(code: CsvParseErrorCode, message: string, sourceLine?: number) {
    super(message);
    this.name = "CsvParseError";
    this.code = code;
    this.sourceLine = sourceLine;
  }
}

interface ParsedRecord {
  readonly sourceLine: number;
  readonly values: readonly string[];
}

function tokenizeCsv(input: string): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  let fields: string[] = [];
  let field = "";
  let sourceLine = 1;
  let recordStartLine = 1;
  let inQuotes = false;
  let justClosedQuote = false;
  let endedWithRecordSeparator = false;

  const finishField = (): void => {
    fields.push(field);
    field = "";
    justClosedQuote = false;
  };

  const finishRecord = (): void => {
    finishField();
    records.push({ sourceLine: recordStartLine, values: fields });
    fields = [];
  };

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (character === undefined) {
      break;
    }

    if (inQuotes) {
      if (character === '"') {
        if (nextCharacter === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          justClosedQuote = true;
        }
      } else if (character === "\r" && nextCharacter === "\n") {
        field += "\r\n";
        index += 1;
        sourceLine += 1;
      } else {
        field += character;
        if (character === "\n") {
          sourceLine += 1;
        }
      }
      endedWithRecordSeparator = false;
      continue;
    }

    if (justClosedQuote) {
      if (character === ",") {
        finishField();
        endedWithRecordSeparator = false;
        continue;
      }
      if (character === "\n" || (character === "\r" && nextCharacter === "\n")) {
        finishRecord();
        if (character === "\r") {
          index += 1;
        }
        sourceLine += 1;
        recordStartLine = sourceLine;
        endedWithRecordSeparator = true;
        continue;
      }
      throw new CsvParseError(
        "UNEXPECTED_QUOTE",
        `Unexpected character after closing quote on source line ${sourceLine}.`,
        sourceLine,
      );
    }

    if (character === '"') {
      if (field.length !== 0) {
        throw new CsvParseError(
          "UNEXPECTED_QUOTE",
          `Unexpected quote in an unquoted field on source line ${sourceLine}.`,
          sourceLine,
        );
      }
      inQuotes = true;
      endedWithRecordSeparator = false;
      continue;
    }

    if (character === ",") {
      finishField();
      endedWithRecordSeparator = false;
      continue;
    }

    if (character === "\n" || (character === "\r" && nextCharacter === "\n")) {
      finishRecord();
      if (character === "\r") {
        index += 1;
      }
      sourceLine += 1;
      recordStartLine = sourceLine;
      endedWithRecordSeparator = true;
      continue;
    }

    field += character;
    endedWithRecordSeparator = false;
  }

  if (inQuotes) {
    throw new CsvParseError(
      "UNCLOSED_QUOTE",
      `Unclosed quoted field starting in record on source line ${recordStartLine}.`,
      recordStartLine,
    );
  }

  if (!endedWithRecordSeparator || fields.length > 0 || field.length > 0 || justClosedQuote) {
    finishRecord();
  }

  return records;
}

export function parseCsv(text: string): NormalizedTable {
  const input = text.startsWith("\uFEFF") ? text.slice(1) : text;
  if (input.length === 0) {
    throw new CsvParseError("EMPTY_FILE", "The CSV file is empty.", 1);
  }

  const records = tokenizeCsv(input);
  const headerRecord = records[0];
  if (headerRecord === undefined || headerRecord.values.length === 0) {
    throw new CsvParseError("EMPTY_FILE", "The CSV file is empty.", 1);
  }

  const seenHeaders = new Set<string>();
  const columns = headerRecord.values.map((name, index) => {
    if (name.length === 0 || seenHeaders.has(name)) {
      throw new CsvParseError(
        "INVALID_HEADER",
        `Header at column ${index + 1} is empty or duplicated.`,
        headerRecord.sourceLine,
      );
    }
    seenHeaders.add(name);
    return { index, name };
  });

  const rows = records.slice(1).map((record, index) => {
    if (record.values.length !== columns.length) {
      throw new CsvParseError(
        "ROW_WIDTH_MISMATCH",
        `Data row ${index + 1} has ${record.values.length} fields; expected ${columns.length}.`,
        record.sourceLine,
      );
    }
    return {
      rowNumber: index + 1,
      sourceLine: record.sourceLine,
      values: [...record.values],
    };
  });

  return { columns, rows };
}
