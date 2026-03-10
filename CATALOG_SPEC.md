# Scientia Catalog Spec (Phase 1)

This catalog contract is the minimum baseline for products sold by Scientia Academy.

## Product Categories

- Books
- Physical Books
- Question Banks
- Notes
- Digital Downloads

## Required Product Metadata

All products should include these metadata keys:

- `material_type`: `book` | `question_bank` | `notes`
- `delivery_mode`: `digital` | `physical` | `hybrid`
- `exam`: target exam (for example `neet`, `jee`, `upsc`)
- `subject`: subject or stream
- `language`: `english`, `hindi`, or other supported language code
- `academic_level`: class/year/cohort label

## Digital Product Metadata

Digital and downloadable products must also include:

- `is_downloadable`: `true`
- `download_provider`: storage source (for example `s3`)
- `download_asset_key`: secure storage key/path for the file
- `access_window_days`: validity period in days (optional for perpetual access)

## Physical Product Metadata

Physical products must also include:

- `is_shippable`: `true`
- `weight_grams`: numeric weight for shipping calculations
- `hsn_code`: tax reporting code (if applicable)
- `dispatch_sla_days`: expected dispatch SLA in days

## Variant Baseline

Where relevant, variants should cover:

- format: `paperback`, `hardcover`, `ebook`, `pdf`, `combo`
- edition or version
- language variant

## Naming Convention

Use:

- title: concise student-facing name
- subtitle in description for exam/class alignment
- handle: lowercase, hyphen-separated, stable URL slug
