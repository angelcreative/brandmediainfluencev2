Brand data export (Criterion-style sample used in better-di-in)
Generated for external data visualization tools.

Files
-----
brand_domain.json  Full "Brands relationship" tree + REPORT_META (audience label, dates).
brand_rows.json    Flat array: one object per brand/item row.
brand_rows.csv     Same rows as CSV (UTF-8).

Columns (brand_rows.*)
------------------------
domainId        Always "brands-relationship".
categoryId      Stable id for the interest category node.
categoryTitle   Human title of that category.
breadcrumb      Path string from the source export.
mediaGroup      High-level group label (Retail & commerce, Automotive & mobility, …).
name            Entity / brand name.
subName         Extra label when present (often empty).
pen             Target penetration (% of audience), x-axis in the app chart.
sel             Times more likely (TML) vs benchmark, y-axis in the app chart.
reach           Absolute reach count from the source dataset (not recomputed).
benchmarkPen    Derived: pen / sel when sel > 0 (benchmark penetration %); same as app logic.

Notes
-----
- pen / sel / reach come from the bundled sample; treat as demo/sample data.
- For a second absolute scale you can multiply benchmarkPen by a fixed audience size in your viz.
