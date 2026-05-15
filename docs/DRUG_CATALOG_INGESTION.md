# Drug Catalog Ingestion

Moromoke separates **stock inventory** from the **medicine catalog**:

- Stock inventory contains what the hospital physically has, with batch, expiry, location, price, and reorder levels.
- The medicine catalog contains searchable drug identities, labels, safety warnings, RxCUIs, NDCs, DailyMed SetIDs, dm+d identifiers, and Odoo product IDs.

Run the catalog job:

```bash
npm run download:drug-catalogs
```

The default mode downloads RxNorm/RxCUI concepts and records the openFDA/DailyMed bulk download manifests without storing multi-GB archives in the repository.

To download the large public FDA/DailyMed archives onto the machine:

```bash
npm run download:drug-catalogs -- --include-large-files
```

Generated files are written to:

```text
data/drug-catalogs/
```

That folder is ignored by git because the source archives can be very large.

## Source Notes

- **RxNorm / RxCUIs:** downloaded through the NLM RxNav REST API.
- **FDA NDC Directory:** source archive links are captured from openFDA download metadata.
- **DailyMed:** SPL label archive links are discovered from DailyMed public release pages.
- **NHS dm+d:** requires NHS/TRUD release files. Download them through your licensed TRUD access, then set `DMD_RELEASE_PATH` before running the job.
- **Odoo:** requires your hospital Odoo instance or export. Set `ODOO_PRODUCTS_CSV` to an Odoo product export for local ingestion.

Example:

```bash
$env:DMD_RELEASE_PATH="C:\path\to\dmd-release"
$env:ODOO_PRODUCTS_CSV="C:\path\to\odoo-products.csv"
npm run download:drug-catalogs
```

Every imported inventory item should still be reviewed by a pharmacist before use for prescribing or dispensing.
