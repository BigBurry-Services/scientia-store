# Digital Assets Module

This project includes a custom Medusa module (`digital_asset`) to manage downloadable files without using product metadata.

## Data Model

- `digital_asset`: file reference and delivery metadata
- `variant_digital_asset_link`: mapping between product variant and digital asset

## Admin APIs

### Create Digital Asset

- `POST /admin/digital-assets`
- Body:

```json
{
  "title": "Physics Question Bank PDF",
  "file_url": "https://cdn.scientiaacademy.in/files/physics-qb-v1.pdf",
  "file_name": "physics-qb-v1.pdf",
  "mime_type": "application/pdf",
  "storage_provider": "external",
  "is_active": true
}
```

### List Digital Assets

- `GET /admin/digital-assets`

### Retrieve Digital Asset + Variant Links

- `GET /admin/digital-assets/:id`

### Attach Asset to Product Variant

- `POST /admin/digital-assets/:id/variants`
- Body:

```json
{
  "variant_id": "variant_..."
}
```

## Store APIs

Both store endpoints require authenticated customer session/JWT.

### List My Downloads

- `GET /store/digital-assets/my-downloads`

Returns downloadable assets derived from paid orders + linked variants.

### Get Download URL

- `GET /store/digital-assets/:id/download-url`

Validates customer entitlement based on paid orders and returns the asset URL.

## Notes

- Current implementation returns `file_url` directly after entitlement check.
- Next enhancement: provider-specific short-lived signed URLs (S3/R2/etc).
