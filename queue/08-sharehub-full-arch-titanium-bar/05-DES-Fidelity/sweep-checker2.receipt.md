# Independent Fidelity Checker 2 Sweep Receipt

- Model: `gpt-6-luna` (medium)
- Canonical module read: `repo/.dentcast/des-v3.5-knowledge.md`
- SHA-256:
  - `repo/.dentcast/des-v3.5-knowledge.md`: `1a99dd261f2c5269b059793eb9e1bbb638902b943dbc50ed72c02ec9c8c54b0b`
  - `scientific/sweep-runs/input-src0.json`: `43319e67d575e28378d5b0ed2fa54f1931f2786a410df2d7f22700b2cac36810`
  - `scientific/sweep-runs/input-src1.json`: `0a23a3aeca21c3d7c13d4db21ce3c30daa4db5727f9de912a4c4060fb233c330`
  - `scientific/sweep-runs/out-src0-2.json`: `be6bfd401116cbf2f470958b800606dcf1714851e75d21aa900465c698fab158`
  - `scientific/sweep-runs/out-src1-2.json`: `221cd5cc93f5aa921673ca3626d137d927993284d79982567d808ca8bd02d257`

- Arithmetic and quote validation passed. Src0: 4 MATCHES, 0 ALTERED, 0 REVERSED, 2 NOT_IN_SOURCE, 0 NOT_A_CLAIM; assessable 4, score 100, HIGH. Src1: 20 MATCHES, 1 ALTERED, 0 REVERSED, 3 NOT_IN_SOURCE, 12 NOT_A_CLAIM; assessable 21, score 98, HIGH.
- ALTERED: src1 u35 (`HEDGE_REMOVED`, added exclusivity «فقط»). No REVERSED units.
