# Prometheus — Project Memory

## What This Project Is
Gym machine occupancy detection dashboard. Uses YOLOv10 to detect whether each gym machine is Free or Occupied from a CCTV video feed. No new hardware — reuses existing cameras.

## Team Split
- **Friend's responsibility:** Train the YOLOv10 model, produce inference output (machine detections, bounding boxes, confidence scores, occupancy states)
- **Our responsibility:** Complete the website and make it ready to consume metadata from the trained model

## Deadline
2 days from 2026-05-13 → **2026-05-15**

## Scope Change (2026-05-13) — Deadline Constraint
- **Machine naming is DROPPED.** No per-machine custom names. Too time-consuming for a 2-day deadline.
- The model only outputs: which bbox is a human, which is a machine, and whether a machine is free/occupied.
- Machines are identified by auto-generated IDs only (`machine_1`, `machine_2`, …).
- Face blur is still deferred.

## Current Scope (What We're Building)
- Complete the frontend dashboard (VideoUpload → MachineConfirm → LiveDashboard)
- Build the FastAPI backend to bridge model output → WebSocket → browser
- Data contract is defined in `/docs/data-contract.md`

## AI Pipeline (for context)
1. Video frame → YOLOv10 detects persons + machines → bounding boxes
2. IoU overlap check: person bbox vs machine bbox → Free or Occupied
3. 5-second temporal smoothing buffer (suppress false positives from passersby)
4. WebSocket → frontend dashboard shows live status per machine

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui
- **Routing:** React Router v6 (3 pages: `/`, `/confirm`, `/dashboard`)
- **State:** Local useState + React Query (installed, not yet used for real data)
- **Animation:** Framer Motion
- **Backend (to build):** Python FastAPI — receives model output, serves WebSocket
- **Model:** YOLOv10 (friend's responsibility)

## Design System Colors (prometheus- prefix in Tailwind)
- bg `#080808`, card `#121212`, sidebar `#0f181e`, elevated `#212B39`
- border `#242527`, cream `#F5F0E8`, secondary `#8A8A8A`
- green `#00C896` (free/ok), red `#E84545` (occupied/error), yellow `#F5A623` (medium confidence)
- Confidence thresholds: ≥85% green, ≥65% yellow, <65% red

## Current Frontend State
All data is mocked/hardcoded — no real backend calls yet:
- `VideoUpload`: simulates 4-step pipeline with setTimeout
- `MachineConfirm`: static list of machines with hardcoded confidence scores
- `LiveDashboard`: machines toggle randomly every 8 seconds via setInterval
- `src/api/base44Client.js` and `src/lib/AuthContext.jsx` are stubs

## Remaining Steps (prioritized for deadline)
1. ✅ Define data contract → `/docs/data-contract.md`
2. Build FastAPI backend (receive model output, serve WebSocket)
3. Replace mocked frontend data with real WebSocket/API calls
4. Face blur — after deadline, out of scope now
