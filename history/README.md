# Original Git history

The repository root contains all 130 source, image, test and documentation files from PATCHFLOW v0.16, verified against their original Git blob hashes.

This GitHub import uses a new commit. The complete original Git history is preserved in the split Git bundle below, including original commit IDs, authors and timestamps. Reassemble and clone it to work with the original history.

## Restore

Run from this directory:

```sh
cat patchflow.bundle.part* > /tmp/patchflow-full-history.bundle
shasum -a 256 /tmp/patchflow-full-history.bundle
git clone /tmp/patchflow-full-history.bundle patchflow-original
```

Expected SHA-256: `f42860553fe64d043fcb442e70630b05c309f50362eda8f17aa4f1e12f4c415e`

Original latest commit: `2111893dd2fb433189f200e62f990dfcc5c187f3`

Bundle size: 6582650 bytes. Parts: 7 (1 MiB except the final part).

The bundle was checked with `git bundle verify` before upload. It contains the complete main branch history. It does not contain browser-local user projects or credentials.
