# Fidelity checker 1 sweep receipt

Model: gpt-6-luna, medium
Spec: DES v3.5 FIDELITY track; independent per-source checks.
Basis: FULL_TEXT for both inputs.
Validation: all non-empty source quotes are exact source substrings after whitespace normalization; quote fields contain one complete source sentence (table group/result cells quoted as such); unit text copied verbatim.

| Input | SHA-256 | Output | SHA-256 |
|---|---|---|---|
| `input-src0.json` | `43319e67d575e28378d5b0ed2fa54f1931f2786a410df2d7f22700b2cac36810` | `out-src0-1.json` | `5671e31202acfd8e65f0aee6790be82dc1d4ffa16e15d698b1d15dbe29dedfb2` |
| `input-src1.json` | `0a23a3aeca21c3d7c13d4db21ce3c30daa4db5727f9de912a4c4060fb233c330` | `out-src1-1.json` | `51cd95d2762201f3f89deac283074f94557f25ebf0cb7b0874bde3a540608721` |
