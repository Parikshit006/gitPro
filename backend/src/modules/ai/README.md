# AI Foundation & Execution Layer (`src/modules/ai/`)

## Overview

The **AI Foundation & Execution Layer** represents the top-level generative presentation and narrative abstraction stack of GitPro. It establishes clean, vendor-agnostic contracts and robust execution orchestration for interacting with Large Language Models (LLMs) such as OpenAI, Anthropic Claude, and local/mock instances without binding the platform to any single commercial vendor or SDK.

Currently implemented components:
1. **`ai.types.ts`**: Immutable DTOs defining provider types, model configuration, execution options, completion envelopes (`AIResponse` with token metadata and versioning), and context containers (`AIContext`).
2. **`provider.interface.ts`**: Standardized `IAIProvider` interface declaring `generateResponse`, `summarize`, and `explain` contracts.
3. **`context.builder.ts`**: Pure builder class transforming frontend presentation DTOs from Dashboard and Insight domains into immutable `AIContext` payloads.
4. **`prompt.builder.ts`**: Deterministic prompt generator translating structured `AIContext` containers into clean, reproducible natural language prompts.
5. **`provider.factory.ts`**: Dynamic provider registry and factory enabling pluggable vendor instantiations with default mappings for OpenAI, Anthropic, and Mock providers.
6. **`ai.config.ts`**: Centralized configuration defining execution parameters, timeout boundaries, retry strategies with exponential backoff, fallback provider presets, and prompt/response version tags.
7. **`openai.provider.ts`**: Concrete provider implementation utilizing the official `openai` Node.js SDK for chat completions.
8. **`anthropic.provider.ts`**: Concrete provider implementation utilizing the official `@anthropic-ai/sdk` for Claude message completions.
9. **`mock.provider.ts`**: Deterministic offline provider generating reproducible fake completions for unit tests, CI pipelines, and air-gapped environments.
10. **`ai.service.ts`**: High-level execution orchestration service coordinating context validation, prompt generation, provider resolution, timeout racing, exponential backoff retries, and automatic vendor fallback.

---

## Architectural Principles & Rationale

### 1. Why AI Sits Above Insights
In GitPro's strict data hierarchy, analytical processing occurs in well-defined abstraction boundaries:
```
[Raw Git Commits & Files] 
           │
           ▼ (Ingestion / Graph Module)
[Engineering Knowledge Graph] 
           │
           ▼ (Metrics Framework)
[Algorithmic Metric Calculation Snapshots] 
           │
           ▼ (Insight Domain - Deterministic Rule Engine)
[Structured DTOs: RepositoryInsight & ExecutiveSummary]
           │
           ▼ (AI Execution Layer - AIService)
[Generative Narrative / Executive Briefings / Natural Language Q&A]
```
The AI layer **must sit above the Insight domain**. If generative AI were allowed to read raw git commits or calculate metrics directly, it would bypass our deterministic rule engines, introduce severe mathematical inconsistencies, and expose the platform to AI hallucination hazards. By placing AI at the top of the stack, generative models act strictly as a natural-language *presentation formatting layer* over our verified, mathematically reproducible insights.

### 2. Why Providers Are Interchangeable & Pluggable
Commercial AI vendors evolve rapidly, modify pricing models, experience outages, or face enterprise compliance restrictions (e.g., EU data residency laws prohibiting US-hosted endpoints).
By programming strictly against `IAIProvider` and registering implementations dynamically via `ProviderFactory`:
- **Zero Vendor Lock-in**: Switching from OpenAI `gpt-4o` to Anthropic `claude-3-5-sonnet` requires changing only a single configuration string in `AIModelConfig.provider`.
- **Air-Gapped Compatibility**: Enterprise customers operating in isolated VPCs can register a custom `LOCAL` provider without altering a single line of core GitPro application code.
- **Automated Testing & Mocking**: Unit tests and CI pipelines execute against `MockProvider`, returning instant, deterministic responses without incurring vendor network latency or API token costs.

### 3. Why Prompts Are Deterministic
In generative AI engineering, prompt consistency is critical for reliable outputs. `PromptBuilder` generates **100% deterministic prompt strings** directly from immutable `AIContext` containers:
- Given an identical `RepositoryInsight` DTO, `PromptBuilder.buildSummaryPrompt()` will produce the exact same natural language instruction headers, bulleted metrics, and risk explanations every single time.
- Deterministic prompt formatting eliminates prompt drift, ensures prompt templates are version-controlled alongside application code, and prevents user injection vulnerabilities from corrupting system instructions.

### 4. Why DTOs Isolate AI from Database Schema
The AI Foundation module **never imports Prisma models, database access repositories, or git clients**. It consumes **only presentation DTOs** (`DashboardOverview`, `RepositoryInsight`, `ExecutiveSummary`):
- **Schema Decoupling**: Database schema migrations (e.g., renaming a column in PostgreSQL `commit_nodes`) never break AI prompts or completion pipelines because the AI layer has zero awareness of underlying database tables.
- **Data Minimization & Security**: Passing raw database rows or git email signatures to third-party LLMs poses severe data leakage risks. Clean presentation DTOs contain only aggregated, scrubbed analytical metrics safe for executive synthesis.

---

## Provider Execution Flow

```
[Dashboard / Insight Controller or Service]
                    │
                    ├─ 1. Invoke AIService.summarize(context) or explain(context, target)
                    ▼
              [AIService]
                    │
                    ├─ 2. Validate deterministic prompt via PromptBuilder
                    ├─ 3. Resolve target provider via ProviderFactory (OpenAI, Anthropic, Mock)
                    ├─ 4. Wrap execution in Promise.race() against timeoutMs boundary (e.g., 15000ms)
                    ▼
           [Primary Provider] ──► (Success) ──┐
                    │                         │
                    ├─ (Failure / Timeout)    │
                    ▼                         │
        [Exponential Backoff Retry]           │
                    │                         │
                    ├─ (All Retries Exhausted)│
                    ▼                         │
        [Fallback Provider (Mock / Local)]    │
                    │                         │
                    ▼                         ▼
            [AIResponse DTO] ◄────────────────┘
        (Enriched with totalTokens, promptVersion, responseVersion)
```
