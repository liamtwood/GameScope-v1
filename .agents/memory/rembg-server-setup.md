---
name: rembg server-side background removal
description: How rembg is installed and wired into the Express server for ML-based background removal.
---

# rembg Server-Side Background Removal

## Rule
The background removal endpoint at `POST /api/remove-background` uses rembg (Python, ML-based) via `execFile`. The old client-side canvas flood-fill in `backgroundRemoval.ts` was replaced with a thin fetch wrapper — the public API (`BackgroundRemover.removeBackground(file)`) is unchanged.

**Why:** The client-side canvas approach (edge flood-fill) produced poor results on complex photos with varied backgrounds. rembg's U2-Net model handles flyaway hair, complex edges, and varied backgrounds cleanly.

## How to apply
- rembg must be installed as `rembg[cpu,cli]` — all three extras are required or it exits with instructions
- Binary path: `/home/runner/workspace/.pythonlibs/bin/rembg`
- Install command: `pip install "rembg[cpu,cli]"`
- First run downloads the U2-Net model (~170MB) to `~/.u2net/`

## Key detail
The first request is slow (~40s) while the model downloads. Subsequent requests are fast (~1-2s for a 1024x1024 image). This is expected behaviour.
