# GitPro Report Module (`src/modules/report/`)

## Overview
The **Report Module** transforms raw engineering intelligence (Dashboard DTOs, Insight DTOs, AI summaries, and Search results) into professional, highly polished engineering reports. It supports six core report categories (**Executive**, **Repository**, **Developer**, **Organization**, **Weekly**, and **Monthly**) and four output formats (**PDF**, **HTML**, **Markdown**, and **JSON**).

---

## Strict Architectural Principles

### 1. Complete Decoupling from Notifications
Why are Reports and Notifications separate modules?
- **Single Responsibility Principle**: The Report module is exclusively responsible for **synthesis and rendering**. It knows **nothing** about email servers, Slack webhooks, retries, or delivery statuses.
- **Independent Evolution**: Adding a new delivery channel (e.g., Microsoft Teams or SMS) in the Notification module does not require touching a single line of report generation code.
- **Reusability**: Reports can be downloaded directly via HTTP endpoints or consumed programmatically by background schedulers without triggering notifications.

### 2. Generator Isolation
Why are export generators isolated into dedicated files (`pdf.generator.ts`, `html.generator.ts`, `markdown.generator.ts`, `json.generator.ts`)?
- **Format-Specific Complexity**: Each formatting engine has distinct structural constraints (e.g., PDF binary byte streams vs. HTML CSS styling vs. Markdown table syntax). Isolating them prevents conditional clutter inside the service layer.
- **Zero Service Contamination**: `ReportService` owns orchestration and delegates rendering completely:
  ```
  [ReportService] ──► [ReportMapper] ──► [PDF / HTML / Markdown / JSON Generator]
  ```

### 3. Immutable Report DTOs
Why are `ReportDTO` objects immutable?
- **Deterministic Rendering**: Once `ReportMapper.toReportDTO()` constructs a report payload, its properties (`readonly`) cannot be modified by downstream formatters or notification delivery providers.
- **Clean Audit Trails**: An immutable DTO guarantees that the PDF, HTML, and Markdown exports generated from the same report cycle contain identical data and timestamps.

---

## Layering & Data Flow

```
[HTTP GET /reports/*]
        │
        ▼
[ReportController] (HTTP transport & MIME type negotiation)
        │
        ▼
[ReportService] (Orchestrates Dashboard, Insight, AI & Search retrieval)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
[ReportRepository]             [InsightService]             [SearchService]
(Persistence boundary)         (Health evaluations)         (Unified search)
        │
        ▼
[ReportMapper] (Static DTO transformation layer)
        │
        ▼
[Export Generators] (PDFGenerator / HTMLGenerator / MarkdownGenerator / JSONGenerator)
        │
        ▼
[ReportResult Envelope] (Returned to client or passed to Notification module)
```
