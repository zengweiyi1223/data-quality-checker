import { CsvParseError, parseCsv } from "../adapters/csv.js";
import { checkTable } from "../core/quality.js";
import type { QualityReport } from "../shared/types.js";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element;
}

const fileInput = requireElement("csv-file") as HTMLInputElement;
const statusPanel = requireElement("status-heading").closest(".status-panel") as HTMLElement;
const statusHeading = requireElement("status-heading");
const statusMessage = requireElement("status-message");
const reportSection = requireElement("report");
const reportFile = requireElement("report-file");
const totalRows = requireElement("total-rows");
const issueCount = requireElement("issue-count");
const affectedRows = requireElement("affected-rows");
const missingCount = requireElement("missing-count");
const duplicateCount = requireElement("duplicate-count");
const missingBody = requireElement("missing-body");
const duplicateBody = requireElement("duplicate-body");
const missingTable = requireElement("missing-table");
const duplicateTable = requireElement("duplicate-table");
const missingEmpty = requireElement("missing-empty");
const duplicateEmpty = requireElement("duplicate-empty");

let activeRun = 0;

function setStatus(
  title: string,
  message: string,
  state: "idle" | "working" | "success" | "error",
): void {
  statusHeading.textContent = title;
  statusMessage.textContent = message;
  statusPanel.dataset.state = state;
}

function clearReport(): void {
  reportSection.hidden = true;
  reportFile.textContent = "";
  missingBody.replaceChildren();
  duplicateBody.replaceChildren();
}

function appendCell(row: HTMLTableRowElement, text: string): void {
  const cell = document.createElement("td");
  cell.textContent = text;
  row.append(cell);
}

function renderReport(fileName: string, report: QualityReport): void {
  reportFile.textContent = fileName;
  totalRows.textContent = String(report.summary.totalRows);
  issueCount.textContent = String(report.summary.issueCount);
  affectedRows.textContent = String(report.summary.affectedRowCount);
  missingCount.textContent = String(report.summary.missingValueCount);
  duplicateCount.textContent = String(report.summary.duplicateGroupCount);

  missingBody.replaceChildren();
  for (const finding of report.missingValues) {
    const row = document.createElement("tr");
    appendCell(row, String(finding.rowNumber));
    appendCell(row, String(finding.sourceLine));
    appendCell(row, finding.columnName);
    missingBody.append(row);
  }

  duplicateBody.replaceChildren();
  for (const finding of report.duplicateGroups) {
    const row = document.createElement("tr");
    appendCell(row, finding.rowNumbers.join(", "));
    appendCell(row, finding.sourceLines.join(", "));
    duplicateBody.append(row);
  }

  const hasMissing = report.missingValues.length > 0;
  missingTable.hidden = !hasMissing;
  missingEmpty.hidden = hasMissing;

  const hasDuplicates = report.duplicateGroups.length > 0;
  duplicateTable.hidden = !hasDuplicates;
  duplicateEmpty.hidden = hasDuplicates;

  reportSection.hidden = false;
}

function describeCsvError(error: CsvParseError): string {
  const location =
    error.sourceLine === undefined ? "" : ` Check source line ${error.sourceLine}.`;
  const messages: Record<CsvParseError["code"], string> = {
    EMPTY_FILE: "The selected CSV is empty.",
    INVALID_HEADER: "The header contains an empty or duplicate column name.",
    UNCLOSED_QUOTE: "A quoted field is not closed.",
    UNEXPECTED_QUOTE: "A quote appears in an invalid position.",
    ROW_WIDTH_MISMATCH: "A data row has a different number of fields than the header.",
  };
  return `${messages[error.code]}${location}`;
}

async function checkFile(file: File, run: number): Promise<void> {
  clearReport();

  if (file.size > MAX_FILE_BYTES) {
    setStatus(
      "File is outside this project’s range",
      "Choose a CSV no larger than 5 MiB. No file content was read.",
      "error",
    );
    return;
  }

  setStatus("Reading locally", "The file is being read in this browser tab.", "working");

  try {
    const text = await file.text();
    if (run !== activeRun) {
      return;
    }

    setStatus("Checking", "Parsing the CSV and applying the two frozen rules.", "working");
    const table = parseCsv(text);
    const report = checkTable(table);

    if (run !== activeRun) {
      return;
    }

    renderReport(file.name, report);
    const issueWord = report.summary.issueCount === 1 ? "issue" : "issues";
    setStatus(
      "Check complete",
      `Found ${report.summary.issueCount} ${issueWord} across ${report.summary.affectedRowCount} affected rows.`,
      "success",
    );
  } catch (error: unknown) {
    if (run !== activeRun) {
      return;
    }

    const message =
      error instanceof CsvParseError
        ? describeCsvError(error)
        : "The file could not be checked. Choose a valid UTF-8 CSV and try again.";
    setStatus("Unable to check this file", message, "error");
  }
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  fileInput.value = "";
  if (file === undefined) {
    return;
  }
  activeRun += 1;
  void checkFile(file, activeRun);
});

document.documentElement.dataset.appReady = "true";
