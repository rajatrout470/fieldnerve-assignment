# fieldnerve-assignment

An Intelligent Vendor Recommendation Platform. The `vendors`, `vendor-documents`, and
`work-requirements` modules manage the core domain data. This document covers the
`recommendations` and `ai` modules built on top of them: a deterministic scoring engine
that ranks vendors against a work requirement, plus an AI-generated plain-language
summary of each run.

## Project Architecture

```
work-requirements  vendors  vendor-documents
        \            |            /
         \           |           /
          v          v          v
              recommendations
                     |
                     v
                    ai
```

- **`recommendations`** depends on `VendorsService`, `VendorDocumentsService`, and
  `WorkRequirementsService` (all imported read-only, never modified) to fetch the data
  it scores, and on `AiService` to obtain a plain-language summary.
- **`ai`** does not import `Vendor`, `VendorDocument`, or `WorkRequirement` at all. Its
  public surface is a single `SummaryInput` interface (`src/ai/interfaces/summary-input.interface.ts`)
  containing only plain strings/numbers built by `RecommendationsService`. This keeps the
  `ai` module swappable (e.g. for a different LLM vendor) and unit-testable without a
  database or the other domain modules.
- Neither existing module (`vendors`, `vendor-documents`, `work-requirements`) was
  modified — `recommendations` only reads through their existing services.

### Adapting to the real schema

The build spec assumed uuid primary keys, `vendorType`, `contactEmail`/`contactPhone`,
lowercase enums, and a `status` field on `VendorDocument`. The actual codebase differs:

| Assumed | Actual |
|---|---|
| uuid PKs on Vendor/VendorDocument/WorkRequirement | auto-increment integer PKs (`SERIAL`) |
| `Vendor.vendorType` | field does not exist — not referenced anywhere in the new code |
| `Vendor.contactEmail` / `contactPhone` | `Vendor.email` / `Vendor.phone` |
| Enum values lowercase (`active`, `high`, ...) | Enum values uppercase (`ACTIVE`, `HIGH`, ...) |
| `VendorDocument.status` (`valid`/`expired`/`pending`/`rejected`) | no such column — only `issueDate`/`expiryDate` |
| `WorkRequirement.estimatedValue` decimal | stored as `varchar` |
| `WorkRequirement.status` includes `in_progress` | actual enum is `OPEN` / `ASSIGNED` / `CLOSED` |

The `recommendations` and `ai` modules were written against the real shapes. See
**Assumptions** below for how the compliance gate was adapted to the missing
`VendorDocument.status` field.

## Database Design

### Existing domain tables

These three tables pre-date `recommendations`/`ai` and were not modified — documented
here for reference since `recommendations` reads through them.

**`vendors`:**

| Column | Type | Notes |
|---|---|---|
| `id` | `SERIAL` (pk) | auto-increment integer |
| `name` | `varchar(255)` | |
| `category` | `varchar(255)` | free-text, matched exactly (case-sensitive) against `work_requirements.category` |
| `email` | `varchar(255)` | |
| `phone` | `varchar(50)` | |
| `operating_location` | `varchar(255)` | free-text, matched against `work_requirements.location` |
| `rating` | `decimal(3,2)` | default `0`; returned as a string by `pg`, coerced with `Number(...)` at read time in `recommendations` |
| `status` | `enum` (indexed) | `ACTIVE`, `INACTIVE`, `BLACKLISTED`, `PENDING_VERIFICATION`, `UNAVAILABLE`, `AVAILABLE` — default `PENDING_VERIFICATION` |
| `created_at` / `updated_at` | `timestamp` | auto-managed |
| `created_by` | `uuid` | required |
| `updated_by` | `uuid`, nullable | |

Relation: `Vendor 1—* VendorDocument` (`documents`, no cascade defined on the `Vendor`
side — cascade is declared on `VendorDocument.vendor` instead).

**`vendor_documents`:**

| Column | Type | Notes |
|---|---|---|
| `id` | `SERIAL` (pk) | |
| `vendor_id` | `integer` (indexed) | plain FK column, also backs the `ManyToOne` relation |
| `document_type` | `enum` | `TAX_REGISTRATION`, `INSURANCE`, `TRADE_LICENSE`, `SAFETY_CERTIFICATE`, `AGREEMENT` |
| `document_number` | `varchar(255)` | |
| `issuing_authority` | `varchar(255)` | |
| `issue_date` | `date` | stored/compared as `YYYY-MM-DD` strings |
| `expiry_date` | `date` | same; this is the only field driving "validity" — there is **no `status` column** |
| `created_at` / `updated_at` | `timestamp` | |
| `created_by` | `uuid` | required |
| `updated_by` | `uuid`, nullable | |

Relation: `VendorDocument.vendor` is `@ManyToOne(() => Vendor)` with
`onDelete: 'CASCADE'` — deleting a vendor deletes its documents at the DB level.

**`work_requirements`:**

| Column | Type | Notes |
|---|---|---|
| `id` | `SERIAL` (pk) | |
| `title` | `varchar(255)` | |
| `category` | `varchar(255)` | matched exactly against `vendors.category` |
| `location` | `varchar(255)` | matched against `vendors.operating_location` |
| `estimated_value` | `varchar(255)` | **stored as a string, not numeric** — no arithmetic is ever done on it |
| `priority` | `enum` (indexed) | `URGENT`, `HIGH`, `MEDIUM`, `LOW` — required, no default |
| `expected_start_date` | `date` | `YYYY-MM-DD` string |
| `status` | `enum` (indexed) | `OPEN`, `ASSIGNED`, `CLOSED` — default `OPEN` |
| `assigned_vendor_id` | `integer`, nullable (indexed) | plain column, no FK relation object (kept independent of `Vendor`), set by `assignVendor()` |
| `created_at` / `updated_at` | `timestamp` | |
| `created_by` | `uuid` | required |
| `updated_by` | `uuid`, nullable | |

### New tables (recommendations)

Three new tables, added in migration `1783153000000-AddRecommendations`:

- **`recommendations`** — one row per scoring run.
  `id` (uuid, pk), `work_requirement_id` (int), `total_vendors_evaluated` (int),
  `generated_at` (timestamp).
- **`recommendation_results`** — one row per vendor evaluated in a run.
  `id` (uuid, pk), `recommendation_id` (uuid, fk → recommendations, `ON DELETE CASCADE`),
  `vendor_id` (int, fk → vendors, no cascade — historical results should survive
  vendor edits), `total_score` (decimal 5,2, nullable), `rank` (int, nullable),
  `score_breakdown` (jsonb, nullable), `excluded` (boolean), `excluded_reason` (varchar, nullable).
- **`ai_summaries`** — one row per run's AI summary, one-to-one with `recommendations`.
  `id` (uuid, pk), `recommendation_id` (uuid, unique, fk → recommendations,
  `ON DELETE CASCADE`), `summary_text` (text), `source` (`llm` | `fallback`),
  `model` (varchar, nullable), `input_tokens` / `output_tokens` / `generation_time_ms` (int, nullable).

**Relations:**
`Recommendation 1—* RecommendationResult` (cascade insert/delete),
`Recommendation 1—1 AiSummary` (cascade insert/delete, nullable).

`Recommendation.workRequirementId` and `RecommendationResult.vendorId` are **plain
integer columns with no TypeORM relation object** — this mirrors the existing codebase's
own convention for cross-module id references (see `WorkRequirement.assignedVendorId`,
which points at `vendors.id` the same way). A real FK constraint still exists at the
database level (with `ON DELETE CASCADE` for `work_requirement_id`, matching the spec),
but the entity classes stay decoupled from `Vendor`/`WorkRequirement` as objects.

## API Design

### Vendors (`VendorsController`, base path `/vendors`)

```
POST   /vendors                 Create a vendor
GET    /vendors                 List vendors, or search if any filter query param is present
GET    /vendors/:id             Get one vendor (404 if missing)
PATCH  /vendors/:id             Partial update
PATCH  /vendors/:id/status      Update status only ({ status, updatedBy })
DELETE /vendors/:id             Delete (204), 404 if missing
```

`GET /vendors` filters (`FilterVendorDto`, all optional, combined with `AND`):
`name` (`ILIKE %value%`), `category` (exact), `operatingLocation` (`ILIKE %value%`),
`status` (exact enum), `minRating` (`rating >= value`, coerced to `Number` via
`class-transformer`). If none are present, `findAll()` is called instead of `search()`.

`VendorsService` is a thin CRUD wrapper over `VendorsRepository` (`Repository<Vendor>`
+ a hand-built `createQueryBuilder` search). `update()` and `remove()` call `findOne()`
first purely to produce a 404 `NotFoundException` before delegating to the repository
(`update()`'s own null-check is a second guard against a row disappearing between those
two calls). `updateStatus()` is a restricted alias of `update()` that only ever writes
`status` + `updatedBy`, so a status change can't accidentally smuggle in other field
edits from the same request. There is no `vendorType` field, and no bulk/paginated
listing — `findAll()`/`search()` always return every matching row.

### Vendor Documents (`VendorDocumentsController`, base path `/vendor-documents`)

```
POST   /vendor-documents                Create a document
GET    /vendor-documents                List all documents (with vendor relation loaded)
GET    /vendor-documents/expired        Documents where expiryDate <= today
GET    /vendor-documents/expiring       Documents expiring within N days (?days=, default 30)
GET    /vendor-documents/vendor/:vendorId  Documents for one vendor
GET    /vendor-documents/:id            Get one document (404 if missing)
PATCH  /vendor-documents/:id            Partial update (vendorId/createdBy immutable)
DELETE /vendor-documents/:id            Delete (204), 404 if missing
```

Route ordering matters: `expired`, `expiring`, and `vendor/:vendorId` are declared
*before* `:id` in the controller so they aren't swallowed by the `:id` param route.

Same thin service/repository CRUD shape as `Vendors`. The two date-range finders are
the only non-trivial logic: `findExpiredDocuments()` → `expiryDate <= today` (TypeORM
`LessThanOrEqual`, formatted as `YYYY-MM-DD`); `findExpiringDocuments(days)` →
`expiryDate BETWEEN today AND today+days` via a raw `createQueryBuilder` range, computed
by mutating a `Date` with `setDate()`. Since there's no `status` field, "is this
document currently valid" is always derived by callers from `expiryDate` at read time —
`recommendations` does this per mandatory document type (see **Compliance
completeness** in Recommendation Logic below), rather than trusting a stored flag that
could go stale.

### Work Requirements (`WorkRequirementsController`, base path `/work-requirements`)

```
POST   /work-requirements                    Create a work requirement
GET    /work-requirements                    List, or search if any filter query param is present
GET    /work-requirements/:id                Get one (404 if missing)
PATCH  /work-requirements/:id                Partial update
PATCH  /work-requirements/:id/status         Update status only ({ status, updatedBy })
PATCH  /work-requirements/:id/assign-vendor  Assign a vendor ({ vendorId, updatedBy })
DELETE /work-requirements/:id                Delete (204), 404 if missing
```

`GET /work-requirements` filters (`FilterWorkRequirementDto`): `title` (`ILIKE`),
`category` (exact), `location` (`ILIKE`), `priority` (exact enum), `status` (exact enum).

Same CRUD shape as the other two modules, plus one workflow method:
`assignVendor(id, { vendorId, updatedBy })` sets `assignedVendorId` **and** forces
`status = ASSIGNED` in the same update — a work requirement can't have a vendor
assigned while still showing as `OPEN`. It does not validate that `vendorId` refers to
an existing, active, or category-matching vendor (no cross-module read back into
`VendorsService`) — that validation lives entirely in `recommendations`' scoring phase,
which is advisory rather than enforced at assignment time. `updateStatus()` is a
restricted alias of `update()` for the same "narrow the blast radius of one PATCH"
reason as `Vendors.updateStatus()`.

### Recommendations (`RecommendationsController`, base path `/work-requirements/:id`)

```
POST   /work-requirements/:id/recommendations   Run scoring + AI summary, persist, return full result
GET    /work-requirements/:id/recommendations    Return the latest stored recommendation (does NOT recompute)
```

Both return a `Recommendation` with its `results` (one per vendor evaluated) and
`aiSummary` nested. `:id` refers to a `WorkRequirement.id` (integer). A 404 is returned
if the work requirement doesn't exist (`POST`/`GET`) or if no recommendation has been
generated yet for it (`GET` only).

## Recommendation Logic

Implemented in `RecommendationsService.generateRecommendation()`, run against **every**
vendor in the system (not just ones matching the work requirement's category — see
Assumptions), so exclusion reasons like "category mismatch" are meaningful and visible
rather than silently pre-filtered away.

**Phase 1 — hard filters.** A vendor is excluded, in this order (first match wins, so a
vendor failing filter 1 is never document-checked), if:

1. `vendor.status !== ACTIVE` → `"Vendor is not active"`
2. `vendor.category !== workRequirement.category` → `"Category does not match work requirement"`
3. Missing or invalid document for any type in `MANDATORY_DOCUMENT_TYPES` (`INSURANCE`,
   `TRADE_LICENSE`) → `"Missing or invalid mandatory document: {TYPE}"`

Excluded vendors are persisted with `excluded: true`, the reason, and `totalScore` /
`rank` / `scoreBreakdown` set to `null` — they are never silently dropped.

**Phase 2 — weighted scoring (0–100)** for vendors that pass all filters:

| Factor | Max points | Formula |
|---|---|---|
| Category match | 25 | Always 25 (already exact-matched in phase 1) |
| Location match | 20 | 20 if `operatingLocation` exactly matches `location` (case-insensitive); 10 if the substring after the last comma matches (case-insensitive region/state check); else 0 |
| Rating | 25 | `(vendor.rating / 5) * 25`, rounded to 2 decimals |
| Compliance completeness | 20 | `(mandatory doc types with a currently-valid document / 2) * 20` |
| Priority fit | 10 | If priority is `HIGH` or `URGENT`: 10 if `rating >= 4`, else 4. Otherwise: flat 7 |

`totalScore` is the sum, rounded to 2 decimals. Included vendors are sorted by
`totalScore` descending and assigned `rank` starting at 1.

Scoring results are persisted **before** the AI service is called — `generateRecommendation`
saves the `Recommendation` + `RecommendationResult` rows first, then calls `AiService` in
a `try/catch`. If the AI call throws for any unexpected reason, the endpoint still
returns the already-persisted deterministic result with `aiSummary: null` — nothing
about the scoring result depends on or is corrupted by the AI step.

## AI Usage

`AiService.generateAndPersistSummary()` picks between two providers implementing a
common `SummaryProvider` interface:

- **`LlmSummaryProvider`** — calls the Gemini API
  (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  a model with a free tier under Google AI Studio API keys), `maxOutputTokens: 400`, using
  the system prompt and user prompt template specified for this feature verbatim.
  Captures `usageMetadata.promptTokenCount`/`candidatesTokenCount` and wall-clock
  generation time.
- **`FallbackSummaryProvider`** — a fully deterministic, template-based summary with **no
  external calls or dependencies**, built from the same `SummaryInput` data: names the
  top vendor and its highest-scoring factor, flags a close runner-up (within 5 points),
  flags expired/soon-to-expire documents among the top 3 vendors, and reports the
  exclusion count and most common reason (or, if nothing passed the filters, says so).

`AiService` picks the LLM provider only if `process.env.GEMINI_API_KEY` is set; the LLM
call is wrapped in `try/catch` and falls back to the templated provider on any failure
(network error, non-2xx response, empty text). This was verified live against Anthropic
during initial development (before switching to Gemini) by pointing the service at a
deliberately invalid key — the resulting `401` was caught, logged as a warning, and
silently replaced by the fallback summary, with the API caller never seeing an error.
The same `try/catch` path applies regardless of provider.

**The AI output is strictly additive and non-authoritative.** It never re-ranks, never
invents facts not in `SummaryInput`, and its absence (fallback or otherwise) never
affects `RecommendationResult` scores or ranks — those are already committed to the
database by the time the AI service is called.

## Assumptions

- **Location matching is string-based**, not geocoded. "Exact match" is a
  case-insensitive full-string comparison; "same region" compares the substring after
  the last comma (e.g. `"Austin, TX"` vs. `"Dallas, TX"` → both region `"tx"`). Vendors
  or requirements without a comma are compared as a single region token.
- **Mandatory documents are fixed** to `INSURANCE` and `TRADE_LICENSE`
  (`src/recommendations/constants/mandatory-document-types.constant.ts`). The spec asked
  for this constant to live in `vendor-documents`, but that module has no such concept
  today and the brief says not to modify it — so it lives in `recommendations` instead,
  importing only the existing `DocumentType` enum.
- **Category matching is exact** (case-sensitive string equality), not fuzzy — "Electrical"
  and "electrical" are treated as different categories.
- **Document "validity" is derived from `expiryDate`**, not a `status` field — the real
  `VendorDocument` entity has no `valid`/`expired`/`pending`/`rejected` column. A mandatory
  document counts as valid if the vendor's most-recently-expiring document of that type
  has `expiryDate >= now`. Same for the AI risk-flagging: "expired" and "expiring within
  30 days of the expected start date" are both computed from `expiryDate` at request time.
- **`Vendor.rating` is coerced with `Number(...)`** before arithmetic. Postgres returns
  `NUMERIC`/`DECIMAL` columns as strings via `pg`, and the existing `Vendor` entity has no
  transformer on `rating`. This is a pre-existing quirk in the `vendors` module (not
  modified here); the new `RecommendationResult.totalScore` column does define its own
  transformer so it round-trips as a `number`.
- **The full vendor pool is evaluated**, not pre-filtered by category via a query. There
  is no `VendorsService` method for "vendors by category with documents joined" as the
  original spec assumed, so `generateRecommendation` calls `VendorsService.findAll()` and
  applies category matching as one of the phase-1 filters. This also makes "category
  mismatch" a visible, reportable exclusion reason instead of an invisible pre-filter.
- **New entities have no `createdBy`/`updatedBy` audit columns**, unlike `Vendor` /
  `VendorDocument` / `WorkRequirement`. Those are system-generated, computed records (not
  user-submitted resources), so there's no "actor" to attribute them to.

## Trade-offs

- **Synchronous AI call.** `POST /work-requirements/:id/recommendations` calls the
  Gemini API inline and waits for it before responding. This is simple and matches
  the "AI is additive, scoring is authoritative" model cleanly (scoring is fully
  persisted first), but it means the endpoint's latency includes an LLM round-trip. A
  production version would likely persist the deterministic result immediately, return
  it, and generate/attach the AI summary asynchronously via a queue (with the client
  polling `GET` for the summary once it appears).
- **No auth or multi-tenancy.** Anyone who can reach the API can generate recommendations
  for any work requirement. Fine for this assignment's scope; a real deployment would
  need to scope work requirements/vendors to a tenant and authenticate callers.
- **N+1 document fetch.** `VendorDocumentsService.findByVendor()` is called once per
  vendor that survives the status/category filters, rather than in a single joined
  query. Acceptable at the vendor counts this system is likely to see; would want a
  batched `findByVendorIds()` at larger scale.
- **Cascade saves are not wrapped in an explicit transaction.** `RecommendationsRepository.save()`
  relies on TypeORM's relation cascade to insert `RecommendationResult` rows, which
  issues multiple statements. A partial failure mid-save is unlikely but not impossible;
  a `queryRunner`-based transaction would close that gap.

## Environment Variables

```
PORT=3000
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
DB_SYNCHRONIZE=false

# Optional. When set, AI-generated recommendation summaries call the Gemini API
# (gemini-2.5-flash, free tier). Get a key at https://aistudio.google.com/apikey.
# When unset, the deterministic fallback summary provider is used instead.
GEMINI_API_KEY=
```

## Migrations & Seed

```bash
npm run migration:run   # applies 1783153000000-AddRecommendations (adds the 3 new tables)
npm run seed            # inserts sample vendors/documents/work-requirements, if not already present
```

The seed script (`src/database/seed.ts`) is idempotent against its **own** data (keyed
on a fixed seed vendor email) rather than "any vendor exists", so it's safe to run
alongside hand-created sample records. It inserts 8 vendors and 3 work requirements
chosen to exercise every branch of the scoring engine:

- A full ranking with a region-only location match, a close-score (<5 pt) top-2
  trade-off, and a document expiring within 30 days of the work requirement's start date
  (`Substation Rewiring`, category `Electrical`).
- A single-vendor result with no runner-up and the flat low-priority score
  (`Residential Pipe Replacement`, category `Plumbing`).
- A zero-vendor result, since no vendor has a matching category
  (`Greenhouse Landscaping Overhaul`, category `Landscaping`).
- Vendors covering each phase-1 exclusion reason: inactive status, category mismatch, a
  missing mandatory document, and an expired mandatory document.
