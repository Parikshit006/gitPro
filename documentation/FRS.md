# GitPro — Functional Requirements Specification

**Product Name:** GitPro — Engineering Intelligence Platform
**Document Version:** 1.0
**Date:** July 11, 2026
**Classification:** Confidential — Engineering Contract
**Author:** Product & Architecture Team
**Companion Documents:**
- [GitPro PRD v1.0](file:///C:/Users/parik/.gemini/antigravity-ide/brain/f6f25ae4-9cdf-440b-925b-f3e28356fea3/PRD.md)
- [GitPro MVP Definition v1.1](file:///C:/Users/parik/.gemini/antigravity-ide/brain/f6f25ae4-9cdf-440b-925b-f3e28356fea3/MVP_Definition.md)

---
## Table of Contents

1. [Authentication](#1-authentication)
2. [Repository Connection](#2-repository-connection)
3. [Repository Selection](#3-repository-selection)
4. [Repository Analysis](#4-repository-analysis)
5. [Engineering Metrics](#5-engineering-metrics)
6. [AI Report](#6-ai-report)
7. [Dashboard](#7-dashboard)
8. [Basic Error Handling](#8-basic-error-handling)
9. [Appendix A: Deferred Functional Requirements](#appendix-a-deferred-functional-requirements)

---

## 1. Authentication

---

### FR-002: GitHub Authentication

| Field | Value |
|---|---|
| **Title** | GitHub Authentication |
| **Description** | The system shall allow a user to authenticate using GitHub. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. A user is authenticated via GitHub OAuth. 2. The system receives a valid authentication token. |
| **Dependencies** | None |

---

### FR-006: AI Provider Configuration

| Field | Value |
|---|---|
| **Title** | AI Provider Configuration |
| **Description** | The system shall allow the user to configure an AI provider by specifying the provider endpoint and authentication credentials. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The user can enter a provider endpoint URL and an authentication key. 2. The system validates the provided credentials by performing a connectivity check against the endpoint. 3. Upon successful validation, the configuration is persisted and used for all subsequent AI report generation. 4. Upon failed validation, the user receives an error message indicating the nature of the failure (unreachable endpoint, invalid credentials). 5. The user can update the AI provider configuration at any time after initial setup. |
| **Dependencies** | FR-002 |

---

## 2. Repository Connection

---

### FR-007: GitHub Account Connection

| Field | Value |
|---|---|
| **Title** | GitHub Account Connection |
| **Description** | The system shall allow the user to connect their GitHub account by initiating an authorization flow that grants the system read-only access to the user's repositories. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The user can initiate the GitHub connection flow from the dashboard. 2. The user is directed to GitHub to authorize read-only repository access. 3. Upon successful authorization, the system stores the connection and displays the user's accessible repositories. 4. The system requests only read-level permissions — no write, delete, or administrative access. |
| **Dependencies** | FR-002 |

---

### FR-008: Repository Listing

| Field | Value |
|---|---|
| **Title** | Repository Listing |
| **Description** | The system shall display a list of all repositories accessible through the user's connected GitHub account. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. All repositories the user has read access to are displayed in a list. 2. Each repository entry displays the repository name, owner, visibility (public/private), and primary language. 3. The list is sortable by repository name. 4. The list supports text-based search filtering by repository name. |
| **Dependencies** | FR-007 |

---

### FR-009: Repository Selection

| Field | Value |
|---|---|
| **Title** | Repository Selection |
| **Description** | The system shall allow the user to select a single repository from the repository list for analysis. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The user can select exactly one repository at a time. 2. Upon selection, the system displays repository metadata including total commit count, contributor count, date of first commit, date of most recent commit, and primary language. 3. The user can confirm or cancel the selection before proceeding to analysis. |
| **Dependencies** | FR-008 |

---

### FR-011: Repository Access Validation

| Field | Value |
|---|---|
| **Title** | Repository Access Validation |
| **Description** | The system shall validate that the user's GitHub connection still has active read access to a repository before initiating analysis. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Before analysis begins, the system confirms that the stored authorization still grants read access to the selected repository. 2. If access has been revoked, the system displays an error message instructing the user to re-authorize. 3. The system does not attempt to ingest repository data if access validation fails. |
| **Dependencies** | FR-007, FR-009 |

---

### FR-012: GitHub Account Disconnection

| Field | Value |
|---|---|
| **Title** | GitHub Account Disconnection |
| **Description** | The system shall allow the user to disconnect their GitHub account, revoking the stored authorization. |
| **Priority** | P1 |
| **Acceptance Criteria** | 1. The user can initiate disconnection from the settings area. 2. Upon disconnection, the stored GitHub authorization is removed. 3. Previously analyzed repository data and reports remain accessible. 4. The repository listing becomes unavailable until a new GitHub account is connected. |
| **Dependencies** | FR-007 |

---

## 3. Repository Selection

---

### FR-009: Repository Selection

| Field | Value |
|---|---|
| **Title** | Repository Selection |
| **Description** | The system shall allow the user to select a single repository from the repository list for analysis. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The user can select exactly one repository at a time. 2. Upon selection, the system displays repository metadata including total commit count, contributor count, date of first commit, date of most recent commit, and primary language. 3. The user can confirm or cancel the selection before proceeding to analysis. |
| **Dependencies** | FR-008 |

---

### FR-010: Repository Metadata Persistence

| Field | Value |
|---|---|
| **Title** | Repository Metadata Persistence |
| **Description** | The system shall persist the metadata of every repository that has been selected for analysis, including repository name, owner, remote URL, primary language, and the timestamp of the most recent synchronization. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. After a repository is selected and analysis is initiated, its metadata is permanently stored. 2. The stored metadata is accessible from the dashboard without requiring re-connection to GitHub. 3. Previously analyzed repositories appear in the user's repository history. |
| **Dependencies** | FR-009 |

---

### FR-011: Repository Access Validation

| Field | Value |
|---|---|
| **Title** | Repository Access Validation |
| **Description** | The system shall validate that the user's GitHub connection still has active read access to a repository before initiating analysis. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Before analysis begins, the system confirms that the stored authorization still grants read access to the selected repository. 2. If access has been revoked, the system displays an error message instructing the user to re-authorize. 3. The system does not attempt to ingest repository data if access validation fails. |
| **Dependencies** | FR-007, FR-009 |

---

### FR-013: Language Support Disclosure

| Field | Value |
|---|---|
| **Title** | Language Support Disclosure |
| **Description** | The system shall display a notice during repository selection indicating that the initial analysis supports JavaScript and TypeScript, and that additional languages are supported through analyzer plugins. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. When a user selects a repository, the system displays the repository's detected primary language. 2. If the primary language is JavaScript or TypeScript, the system indicates full analysis support. 3. If the primary language is neither JavaScript nor TypeScript, the system displays a notice that language-specific analysis depth may be limited, while repository-structural analysis remains available. |
| **Dependencies** | FR-009 |

---

## 4. Repository Analysis

---

### FR-014: Analysis Initiation

| Field | Value |
|---|---|
| **Title** | Analysis Initiation |
| **Description** | The system shall allow the user to initiate a full analysis run on a selected repository. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The user can trigger analysis with a single action from the repository detail view. 2. The system confirms the analysis scope (repository name, estimated commit count) before beginning. 3. Analysis begins immediately upon user confirmation. 4. The system rejects an analysis request if there is already an active analysis running for the same repository. |
| **Dependencies** | FR-009, FR-011 |

---

### FR-015: Repository History Ingestion

| Field | Value |
|---|---|
| **Title** | Repository History Ingestion |
| **Description** | The system shall ingest the complete Git commit history of the selected repository, extracting commit metadata including author name, author email, timestamp, files changed, lines added, lines removed, and merge commit indicators. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. All commits from the repository's default branch are ingested. 2. Each commit record includes author name, author email, commit timestamp, list of files changed, lines added per file, and lines removed per file. 3. Merge commits are identified and flagged distinctly from non-merge commits. 4. The ingested data is available for downstream metric computation within the same analysis run. |
| **Dependencies** | FR-014 |

---

### FR-016: Analysis Progress Feedback

| Field | Value |
|---|---|
| **Title** | Analysis Progress Feedback |
| **Description** | The system shall display real-time progress feedback to the user throughout the duration of an analysis run. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The dashboard displays a progress indicator while analysis is in progress. 2. The progress indicator identifies the current phase of analysis (ingestion, metric computation, AI report generation). 3. The progress indicator updates at least once every 10 seconds during active processing. 4. The user can navigate away from the progress view and return without losing progress information. |
| **Dependencies** | FR-014 |

---

### FR-017: Analysis Completion Notification

| Field | Value |
|---|---|
| **Title** | Analysis Completion Notification |
| **Description** | The system shall notify the user when an analysis run has completed successfully. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Upon completion, the dashboard displays a completion indicator with the total analysis duration. 2. The user is presented with a direct navigation path to the analysis results. 3. If the user navigated away during analysis, the completion state is visible upon return to the dashboard. |
| **Dependencies** | FR-016 |

---

### FR-018: Analysis Result Persistence

| Field | Value |
|---|---|
| **Title** | Analysis Result Persistence |
| **Description** | The system shall persist all outputs of a completed analysis run, including computed metrics, AI-generated report content, confidence scores, evidence references, and analysis metadata (start time, end time, duration, repository snapshot identifier). |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. All analysis outputs are permanently stored upon completion. 2. Stored results are retrievable through the dashboard at any time after completion. 3. Each analysis run is uniquely identifiable by a run identifier. 4. Analysis results remain available across user sessions. |
| **Dependencies** | FR-014 |

---

### FR-019: Concurrent Analysis Prevention

| Field | Value |
|---|---|
| **Title** | Concurrent Analysis Prevention |
| **Description** | The system shall prevent the user from initiating a new analysis run on the same repository while a previous analysis run is still in progress. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. If the user attempts to start analysis on a repository that already has an active analysis run, the system rejects the request with a message indicating that an analysis is already in progress. 2. The user is permitted to initiate analysis on a different repository while another repository's analysis is running. |
| **Dependencies** | FR-014 |

---

### FR-020: Analysis Re-run

| Field | Value |
|---|---|
| **Title** | Analysis Re-run |
| **Description** | The system shall allow the user to initiate a new analysis run on a repository that has been previously analyzed. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The user can trigger a new analysis on a previously analyzed repository. 2. The new analysis run creates a distinct result set with its own run identifier and timestamp. 3. Previous analysis results for the same repository are not overwritten or deleted. 4. Both the new and all prior analysis results are accessible through the dashboard. |
| **Dependencies** | FR-014, FR-018 |

---

## 5. Engineering Metrics

---

### FR-021: Hotspot Identification

| Field | Value |
|---|---|
| **Title** | Hotspot Identification |
| **Description** | The system shall identify hotspot files within a configurable time window based on change metrics. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Every file in the repository receives a hotspot score. 2. The hotspot score accounts for both change frequency (number of commits modifying the file) and modification complexity (total lines added and removed). 3. Files are ranked by hotspot score in descending order. 4. The top hotspot files are surfaced in the analysis results with their scores and contributing factors. |
| **Dependencies** | FR-015 |

---

### FR-022: Directory-Level Hotspot Aggregation

| Field | Value |
|---|---|
| **Title** | Directory-Level Hotspot Aggregation |
| **Description** | The system shall aggregate file-level hotspot scores to the directory level, identifying directories with the highest concentration of hotspot activity. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Every directory in the repository receives an aggregated hotspot score derived from its constituent files. 2. Directories are ranked by aggregated score in descending order. 3. The dashboard presents both file-level and directory-level hotspot views. |
| **Dependencies** | FR-021 |

---

### FR-023: Primary Author Identification

| Field | Value |
|---|---|
| **Title** | Primary Author Identification |
| **Description** | The system shall identify the primary author of each file, defined as the contributor with the highest percentage of total modifications (lines added and removed) to that file. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Each file has exactly one identified primary author. 2. The primary author's contribution percentage is computed and stored. 3. The primary author is determined based on cumulative commit history, not solely the most recent commit. |
| **Dependencies** | FR-015 |

---

### FR-024: Bus Factor Computation

| Field | Value |
|---|---|
| **Title** | Bus Factor Computation |
| **Description** | The system shall compute the bus factor for each file to indicate the concentration of knowledge. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Every file in the repository has a computed bus factor value. 2. Files with a bus factor of 1 are explicitly flagged as single-contributor dependencies. 3. The bus factor is computed using the cumulative commit history within the configured time window. |
| **Dependencies** | FR-015 |

---

### FR-025: Ownership Erosion Detection

| Field | Value |
|---|---|
| **Title** | Ownership Erosion Detection |
| **Description** | The system shall detect ownership erosion for each file by determining whether the primary author has made any contributions to the file within the most recent 90-day period. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Files where the primary author has not committed within the last 90 days are flagged as having eroded ownership. 2. The date of the primary author's most recent contribution is recorded. 3. The number of days since the primary author's last contribution is computed and displayed. |
| **Dependencies** | FR-023 |

---

### FR-026: Contributor Distribution per File

| Field | Value |
|---|---|
| **Title** | Contributor Distribution per File |
| **Description** | The system shall compute the number of distinct contributors and the percentage of modifications attributed to each contributor for every file in the repository. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Each file has an associated list of all contributors who have modified it. 2. Each contributor entry includes the number of commits and the percentage of total modifications (lines changed). 3. Contributors are sorted by modification percentage in descending order. |
| **Dependencies** | FR-015 |

---

### FR-027: Temporal Coupling Detection

| Field | Value |
|---|---|
| **Title** | Temporal Coupling Detection |
| **Description** | The system shall identify pairs of files that consistently change together across commits, computing a coupling score based on the frequency of co-occurrence in the same commit relative to their individual change frequencies. |
| **Priority** | P1 |
| **Acceptance Criteria** | 1. The system identifies all file pairs that have appeared together in at least 3 commits. 2. Each coupled pair has a computed coupling score between 0 and 1, where 1 indicates perfect co-change correlation. 3. Coupled pairs are ranked by coupling score in descending order. 4. The top coupled pairs are surfaced in the analysis results. |
| **Dependencies** | FR-015 |

---

### FR-028: Change Frequency Classification

| Field | Value |
|---|---|
| **Title** | Change Frequency Classification |
| **Description** | The system shall compute the change frequency for each file over a configurable time window and classify the churn as either healthy (changes concentrated in new or actively-developed files) or unhealthy (repeated modifications to the same established files). |
| **Priority** | P1 |
| **Acceptance Criteria** | 1. Each file has a computed change count for the configured time window. 2. Each file's churn is classified as "healthy" or "unhealthy" based on whether the file's creation date falls within the analysis window (healthy) or predates it by a significant margin (unhealthy). 3. The classification and supporting data are available in the analysis results. |
| **Dependencies** | FR-015 |

---

## 6. AI Report

---

### FR-029: Report Generation Trigger

| Field | Value |
|---|---|
| **Title** | Report Generation Trigger |
| **Description** | The system shall automatically initiate AI report generation upon successful completion of all engineering metric computations within an analysis run. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Report generation begins without manual user intervention after metrics are computed. 2. Report generation uses the structured metric data from the current analysis run as its sole input. 3. The system does not initiate report generation if any metric computation failed. |
| **Dependencies** | FR-021, FR-024, FR-025, FR-026 |

---

### FR-030: Fixed Report Structure

| Field | Value |
|---|---|
| **Title** | Fixed Report Structure |
| **Description** | The system shall generate every AI report conforming to a fixed, mandatory nine-section structure: (1) Repository Health Summary, (2) Top Risks, (3) Hotspot Analysis, (4) Ownership Risks, (5) Technical Debt Indicators, (6) Engineering Recommendations, (7) Next Sprint Priorities, (8) Evidence References, (9) Confidence Scores. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Every generated report contains exactly nine sections in the specified order. 2. No section is omitted, even if the section body indicates no findings for that category. 3. The section titles match the specified names exactly. 4. The report structure is consistent across all analysis runs regardless of repository characteristics. |
| **Dependencies** | FR-029 |

---

### FR-031: Evidence Citation per Insight

| Field | Value |
|---|---|
| **Title** | Evidence Citation per Insight |
| **Description** | The system shall ensure that every AI-generated insight in the report includes at least one explicit evidence citation referencing a specific metric value, file name, time range, or pattern from the computed engineering metrics. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Every insight statement in the report contains at least one evidence reference. 2. Each evidence reference corresponds to a verifiable data point present in the computed metrics for the same analysis run. 3. Insights that cannot be grounded in computed metrics are excluded from the report. |
| **Dependencies** | FR-029, FR-030 |

---

### FR-032: Confidence Level Assignment

| Field | Value |
|---|---|
| **Title** | Confidence Level Assignment |
| **Description** | The system shall assign a confidence level of High, Medium, or Low to every AI-generated insight in the report. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Every insight in the report has exactly one assigned confidence level: High, Medium, or Low. 2. No insight is presented without a confidence level. |
| **Dependencies** | FR-031 |

---

### FR-033: Confidence Score Computation

| Field | Value |
|---|---|
| **Title** | Confidence Score Computation |
| **Description** | The system shall assign a numeric confidence score between 0 and 100 to every AI-generated insight based on the underlying engineering metrics. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Every insight has a numeric score between 0 and 100 inclusive. 2. The score correlates with the number and consistency of independent metrics supporting the insight. 3. An insight supported by multiple converging metrics and sufficient historical data receives a higher score than one supported by a single metric with limited data. 4. The score is deterministic given the same metric inputs — re-generating the report with identical metric data produces scores within a ±5 tolerance band. |
| **Dependencies** | FR-031 |

---

### FR-034: Mandatory Explainability per Insight

| Field | Value |
|---|---|
| **Title** | Mandatory Explainability per Insight |
| **Description** | The system shall include an explicit explanation for every AI-generated insight, listing the specific engineering metrics that produced the finding. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Every insight includes a "Why" section enumerating the contributing metrics. 2. Each contributing metric is identified by name (e.g., complexity, code churn, bus factor, maintainability) and its computed value. 3. An insight with no explainable contributing metrics is excluded from the report. |
| **Dependencies** | FR-031, FR-033 |

---

### FR-035: Report Persistence

| Field | Value |
|---|---|
| **Title** | Report Persistence |
| **Description** | The system shall persist every generated AI report as part of the analysis run results, retaining the full report content, all confidence scores, all evidence references, and the report generation timestamp. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The complete report is stored upon generation. 2. The stored report is retrievable in its entirety from the dashboard. 3. No report data is lost or truncated during persistence. 4. The report remains accessible across user sessions indefinitely. |
| **Dependencies** | FR-030, FR-018 |

---

### FR-036: AI Provider Abstraction

| Field | Value |
|---|---|
| **Title** | AI Provider Abstraction |
| **Description** | The system shall interact with AI providers exclusively through a provider-agnostic interface, such that the report generation behaviour is functionally identical regardless of which AI provider is configured. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Report generation succeeds with the shipped default AI provider. 2. The system's report generation workflow does not reference any provider-specific capabilities or features. 3. Changing the AI provider configuration does not require any change to the report generation behaviour or report structure. |
| **Dependencies** | FR-006 |

---

### FR-037: AI Provider Connectivity Validation

| Field | Value |
|---|---|
| **Title** | AI Provider Connectivity Validation |
| **Description** | The system shall validate connectivity to the configured AI provider before initiating report generation within an analysis run. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Before sending metric data to the AI provider, the system verifies that the configured endpoint is reachable and the credentials are valid. 2. If validation fails, the analysis run completes the metric computation phase but skips report generation, and the user receives an error message identifying the connectivity failure. 3. The computed metrics are still persisted even if report generation is skipped. |
| **Dependencies** | FR-006, FR-029 |

---

## 7. Dashboard

---

### FR-039: Dashboard Landing View

| Field | Value |
|---|---|
| **Title** | Dashboard Landing View |
| **Description** | The system shall present an authenticated user with a dashboard landing view that displays their connected repositories, recent analysis runs, and quick-access navigation to key functions. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The dashboard is the first view after login (for users who have completed onboarding). 2. The dashboard displays a list of previously analyzed repositories. 3. The dashboard displays the most recent analysis run for each repository with its completion timestamp and overall health status. 4. The dashboard provides navigation to initiate a new analysis, view past results, and access settings. |
| **Dependencies** | FR-002, FR-005 |

---

### FR-040: Hotspot Visualization

| Field | Value |
|---|---|
| **Title** | Hotspot Visualization |
| **Description** | The system shall present hotspot analysis results as a visual map indicating the relative hotspot intensity of files and directories within the analyzed repository. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The visualization displays files and directories with visual encoding (size, colour, or position) proportional to their hotspot score. 2. The user can distinguish high-intensity hotspots from low-intensity areas at a glance. 3. The user can hover over or select a file to view its exact hotspot score, change frequency, and modification complexity. |
| **Dependencies** | FR-021, FR-022 |

---

### FR-041: Ownership Visualization

| Field | Value |
|---|---|
| **Title** | Ownership Visualization |
| **Description** | The system shall present ownership analysis results as a visual display indicating bus factor, primary author, and ownership erosion status across the repository's files and directories. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Files with a bus factor of 1 are visually distinguished from files with higher bus factors. 2. Files with eroded ownership are visually distinguished from files with active ownership. 3. The user can select a file to view its contributor list, primary author, bus factor, and the date of the primary author's most recent contribution. |
| **Dependencies** | FR-023, FR-024, FR-025 |

---

### FR-042: Report Viewer

| Field | Value |
|---|---|
| **Title** | Report Viewer |
| **Description** | The system shall provide an in-dashboard report viewer that displays the full AI-generated report with all nine sections, confidence scores, and evidence references in a readable, navigable format. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The report viewer displays all nine report sections in order. 2. Each section is individually navigable (the user can jump to a specific section). 3. Confidence levels and numeric scores are visually displayed alongside each insight. 4. Evidence references within the report are displayed inline with each insight. |
| **Dependencies** | FR-030, FR-035 |

---

### FR-043: Evidence Drill-Down

| Field | Value |
|---|---|
| **Title** | Evidence Drill-Down |
| **Description** | The system shall allow the user to select any AI-generated insight in the report and view the complete set of supporting engineering metrics that produced that insight. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Each insight in the report is selectable. 2. Upon selection, the system displays all contributing metrics with their computed values, the specific files referenced, and the time ranges used. 3. The drill-down view presents the same data that was used as input to the AI for that specific insight. |
| **Dependencies** | FR-031, FR-034, FR-042 |

---

### FR-044: Analysis Summary Cards

| Field | Value |
|---|---|
| **Title** | Analysis Summary Cards |
| **Description** | The system shall display summary cards on the repository analysis view presenting key aggregate metrics: total files analyzed, number of hotspots identified, number of files with bus factor of 1, number of files with eroded ownership, and overall confidence distribution. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Summary cards are displayed at the top of the analysis results view. 2. Each card displays a single aggregate metric with its numeric value. 3. Cards update to reflect the selected analysis run. |
| **Dependencies** | FR-021, FR-024, FR-025, FR-032 |

---

## 8. Basic Error Handling

---

### FR-052: GitHub Connectivity Failure

| Field | Value |
|---|---|
| **Title** | GitHub Connectivity Failure |
| **Description** | The system shall display a user-comprehensible error message if the system cannot establish a connection to GitHub during repository listing, selection, or analysis initiation. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The error message identifies the nature of the failure (network unreachable, authentication expired, rate limit exceeded). 2. The error message suggests a corrective action (check network, re-authorize, wait and retry). 3. No partial or corrupted data is stored as a result of the failure. |
| **Dependencies** | FR-007 |

---

### FR-053: Analysis Pipeline Failure

| Field | Value |
|---|---|
| **Title** | Analysis Pipeline Failure |
| **Description** | The system shall gracefully handle failures during any phase of the analysis pipeline (ingestion, metric computation, or report generation) by recording the failure, preserving any successfully computed data, and notifying the user. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The analysis run is marked with a "failed" status and the failure phase is recorded. 2. If metric computation succeeded before report generation failed, the computed metrics are persisted and viewable. 3. The user receives an error message identifying which phase failed and a suggested corrective action. 4. The user can initiate a new analysis run after a failure. |
| **Dependencies** | FR-014 |

---

### FR-054: AI Provider Failure During Report Generation

| Field | Value |
|---|---|
| **Title** | AI Provider Failure During Report Generation |
| **Description** | The system shall handle AI provider failures (timeout, rate limit, authentication error, malformed response) during report generation without losing the computed engineering metrics. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. If the AI provider returns an error, the analysis run is marked with a status indicating that metrics are available but report generation failed. 2. The computed metrics remain fully accessible through the dashboard. 3. The user receives an error message identifying the AI provider failure type. 4. The user can re-trigger report generation for the same analysis run once the AI provider issue is resolved. |
| **Dependencies** | FR-029, FR-037 |

---

### FR-055: Report Regeneration

| Field | Value |
|---|---|
| **Title** | Report Regeneration |
| **Description** | The system shall allow the user to re-trigger AI report generation for an analysis run whose report generation previously failed, using the persisted metrics from that run. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The user can initiate report regeneration from the analysis detail view when report generation has previously failed. 2. Regeneration uses the same computed metrics as the original run — no re-ingestion or re-computation occurs. 3. Upon successful regeneration, the report is persisted and the analysis run status is updated to "completed." |
| **Dependencies** | FR-054 |

---

### FR-056: Input Validation Feedback

| Field | Value |
|---|---|
| **Title** | Input Validation Feedback |
| **Description** | The system shall validate all user inputs (registration fields, AI provider configuration, repository selection) and provide specific, actionable error messages for any validation failure. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Invalid inputs are rejected before submission to backend processing. 2. Error messages are displayed adjacent to the input field that failed validation. 3. Error messages describe the specific validation rule that was violated (e.g., "Email format is invalid," "Endpoint URL must begin with https://"). |
| **Dependencies** | None |

---

## Appendix A: Deferred Functional Requirements

---

The following functional requirements have been deferred from the MVP to reduce scope and focus on essential validation.

### FR-001: User Registration

| Field | Value |
|---|---|
| **Title** | User Registration |
| **Description** | The system shall allow a new user to create an account by providing a unique email address and a password. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. A user who provides a valid, unique email and a password meeting minimum complexity requirements is successfully registered. 2. A user who provides an email that is already registered receives an error message indicating the email is taken. 3. A user who provides a password that does not meet complexity requirements receives an error message specifying the unmet requirement. |
| **Dependencies** | None |

---

### FR-003: User Logout

| Field | Value |
|---|---|
| **Title** | User Logout |
| **Description** | The system shall allow an authenticated user to terminate their active session. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Upon logout, the user's session is invalidated. 2. The user is redirected to the login screen. 3. Subsequent requests using the terminated session are rejected. |
| **Dependencies** | FR-002 |

---

### FR-004: Session Persistence

| Field | Value |
|---|---|
| **Title** | Session Persistence |
| **Description** | The system shall maintain the user's authenticated session across page reloads and browser tabs until the session expires or the user explicitly logs out. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. A user who reloads the dashboard page remains authenticated. 2. A user who opens the application in a new browser tab within the same browser remains authenticated. 3. A session that has exceeded the configured expiration period is automatically invalidated. |
| **Dependencies** | FR-002 |

---

### FR-005: First-Time Onboarding

| Field | Value |
|---|---|
| **Title** | First-Time Onboarding |
| **Description** | The system shall present a guided onboarding flow to a user who has logged in for the first time, directing them to configure their AI provider and connect their GitHub account. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. A user logging in for the first time is presented with an onboarding flow before accessing the main dashboard. 2. The onboarding flow includes a step for AI provider configuration. 3. The onboarding flow includes a step for GitHub account connection. 4. The user can complete the onboarding flow and proceed to the dashboard. 5. A user who has previously completed onboarding is not shown the flow on subsequent logins. |
| **Dependencies** | FR-002 |

---

### FR-038: Report Export as Markdown

| Field | Value |
|---|---|
| **Title** | Report Export as Markdown |
| **Description** | The system shall allow the user to export any generated AI report as a Markdown file. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The user can trigger Markdown export from the report view. 2. The exported file contains the complete report content including all sections, evidence references, confidence scores, and explanations. 3. The exported file is a valid, well-formatted Markdown document. 4. The file is downloaded to the user's local machine. |
| **Dependencies** | FR-035 |

---

### FR-045: Responsive Dashboard Layout

| Field | Value |
|---|---|
| **Title** | Responsive Dashboard Layout |
| **Description** | The system shall render the dashboard in a usable and visually coherent layout on viewport widths of 1024 pixels and above. |
| **Priority** | P1 |
| **Acceptance Criteria** | 1. All dashboard elements are fully visible and functional at 1024px viewport width. 2. No horizontal scrolling is required at 1024px viewport width or above. 3. Visualizations scale proportionally to the available viewport space. |
| **Dependencies** | FR-039 |

---

### FR-046: Report Export as PDF

| Field | Value |
|---|---|
| **Title** | Report Export as PDF |
| **Description** | The system shall allow the user to export any generated AI report as a formatted PDF document. |
| **Priority** | P1 |
| **Acceptance Criteria** | 1. The user can trigger PDF export from the report view. 2. The exported PDF contains the complete report content including all sections, evidence references, confidence scores, and explanations. 3. The PDF is formatted for readability with appropriate headings, spacing, and page breaks. 4. The file is downloaded to the user's local machine. |
| **Dependencies** | FR-035 |

---

### FR-047: Analysis Run History List

| Field | Value |
|---|---|
| **Title** | Analysis Run History List |
| **Description** | The system shall display a chronological list of all analysis runs that have been completed for a given repository, showing the run identifier, start timestamp, end timestamp, duration, and completion status. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. All completed analysis runs for the selected repository are displayed. 2. Runs are sorted by start timestamp in descending order (most recent first). 3. Each entry includes the run identifier, start timestamp, end timestamp, total duration, and status (completed, failed). |
| **Dependencies** | FR-018, FR-020 |

---

### FR-048: Historical Analysis Navigation

| Field | Value |
|---|---|
| **Title** | Historical Analysis Navigation |
| **Description** | The system shall allow the user to select any previous analysis run from the history list and view its complete results, including all computed metrics and the generated AI report. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The user can select any analysis run from the history list. 2. Upon selection, the dashboard loads the complete analysis results for that run, including metrics and the AI report. 3. The displayed results are identical to what was generated at the time of that analysis run — no retroactive recalculation occurs. |
| **Dependencies** | FR-047 |

---

### FR-049: Current vs. Historical Indicator

| Field | Value |
|---|---|
| **Title** | Current vs. Historical Indicator |
| **Description** | The system shall visually indicate whether the user is viewing the most recent analysis run or a historical analysis run. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. When viewing the most recent analysis run, the dashboard displays a "Latest" indicator. 2. When viewing a historical run, the dashboard displays the run's timestamp and a visual indicator distinguishing it from the latest run. 3. The user can navigate back to the latest run from any historical view with a single action. |
| **Dependencies** | FR-048 |

---

### FR-050: Analysis Run Metadata

| Field | Value |
|---|---|
| **Title** | Analysis Run Metadata |
| **Description** | The system shall display metadata for each analysis run including the total number of commits analyzed, the number of files analyzed, the number of contributors identified, the analysis duration, and the AI provider used. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. All specified metadata fields are displayed for every analysis run. 2. The metadata is accessible from both the analysis history list and the individual analysis view. |
| **Dependencies** | FR-018 |

---

### FR-051: Analysis Deletion

| Field | Value |
|---|---|
| **Title** | Analysis Deletion |
| **Description** | The system shall allow the user to delete a specific historical analysis run and all its associated data, including computed metrics and generated reports. |
| **Priority** | P1 |
| **Acceptance Criteria** | 1. The user can initiate deletion from the analysis history view. 2. The system requests explicit confirmation before proceeding with deletion. 3. Upon confirmation, all data associated with the analysis run is permanently removed. 4. The deleted analysis no longer appears in the history list. 5. If the deleted analysis was the most recent, the dashboard updates to display the next most recent run. |
| **Dependencies** | FR-047 |

---

### FR-057: Settings Access

| Field | Value |
|---|---|
| **Title** | Settings Access |
| **Description** | The system shall provide a settings area accessible from the dashboard where the user can view and modify their AI provider configuration and GitHub connection status. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The settings area is accessible from the main dashboard navigation. 2. The settings area displays the currently configured AI provider endpoint (with credentials masked). 3. The settings area displays the current GitHub connection status (connected/disconnected). 4. The user can modify AI provider settings and GitHub connection from this area. |
| **Dependencies** | FR-006, FR-007 |

---

### FR-058: Complexity Trend Display

| Field | Value |
|---|---|
| **Title** | Complexity Trend Display |
| **Description** | The system shall display complexity trend data for individual files, showing how the file's modification density and growth rate have evolved over time. |
| **Priority** | P1 |
| **Acceptance Criteria** | 1. The user can select a file from the analysis results and view its complexity trend. 2. The trend is presented as a time-series visualization showing modification density per time period. 3. The visualization covers the full commit history of the file within the analysis window. |
| **Dependencies** | FR-021, FR-015 |

---

### FR-059: Report Sharing via Link

| Field | Value |
|---|---|
| **Title** | Report Sharing via Link |
| **Description** | The system shall allow the user to generate a shareable link to a specific analysis report that can be accessed by other authenticated users of the same deployment. |
| **Priority** | P1 |
| **Acceptance Criteria** | 1. The user can generate a link from any completed report view. 2. The link navigates directly to the specific analysis report. 3. Access to the linked report requires authentication. 4. The link remains valid as long as the analysis report exists. |
| **Dependencies** | FR-035 |

---

### FR-060: Source Code Non-Transmission

| Field | Value |
|---|---|
| **Title** | Source Code Non-Transmission |
| **Description** | The system shall not transmit raw source code content to any external AI provider. The system shall transmit only structured, aggregated engineering metrics and metadata to the AI provider for report generation. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. No request to the AI provider contains raw file content, source code lines, or code snippets. 2. All data sent to the AI provider consists exclusively of computed metric values, file names, directory paths, author identifiers, timestamps, and aggregated statistics. 3. This constraint is verifiable by inspecting the data payload transmitted during report generation. |
| **Dependencies** | FR-029 |

---

### FR-061: Deterministic Metric Computation

| Field | Value |
|---|---|
| **Title** | Deterministic Metric Computation |
| **Description** | The system shall produce identical engineering metric outputs when the same repository state is analyzed multiple times. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. Two analysis runs executed against the same repository at the same commit produce identical hotspot scores, bus factor values, ownership erosion flags, and contributor distributions. 2. Determinism applies to all metric computations — it does not apply to AI-generated report text, which may vary between runs. |
| **Dependencies** | FR-021, FR-024, FR-025, FR-026 |

---

### FR-062: Read-Only Repository Access

| Field | Value |
|---|---|
| **Title** | Read-Only Repository Access |
| **Description** | The system shall interact with connected GitHub repositories using read-only access exclusively. The system shall not create, modify, delete, or write any content to the connected repository. |
| **Priority** | P0 |
| **Acceptance Criteria** | 1. The system's GitHub authorization requests only read-level scopes. 2. No operation performed by the system results in a write, modification, or deletion on the connected repository. 3. This constraint is enforceable at the authorization scope level. |
| **Dependencies** | FR-007 |

---

