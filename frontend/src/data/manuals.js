// Sample content until the backend exposes GET /api/manuals.
// Everything on the Manuals page (stats, filters, cards, detail view)
// is computed from this list — replacing the export with an API fetch
// is all that's needed to go live.

import { secondsFromStamp } from "../utils/format";

const rawManuals = [
  {
    id: "mnl-001",
    title: "Replacing the Transformer on a Miller Dynasty 350",
    equipment: "Miller Dynasty 350 TIG Welder",
    status: "approved",
    durationSeconds: 612,
    createdAt: "2026-08-14",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    overview:
      "Walks through removing the primary transformer on a Dynasty 350 and installing a replacement, from case removal through to a test arc. Recorded by Dale Whitmore, 31 years on welder service.",
    tools: [
      "10 mm nut driver",
      "#2 Phillips screwdriver",
      "Multimeter with continuity setting",
      "Anti-static wrist strap",
    ],
    components: ["Primary transformer T1", "Input rectifier bridge", "Gate driver board"],
    safetyWarnings: [
      "Unplug the machine and wait 5 minutes before opening the case — the bus capacitors hold a lethal charge.",
      "Verify 0 V across the DC bus with a multimeter before touching any leads.",
    ],
    steps: [
      { stamp: "0:00", title: "Isolate and discharge", detail: "Unplug the machine, wait 5 minutes, then confirm 0 V across the DC bus terminals." },
      { stamp: "1:20", title: "Remove the outer case", detail: "Six 10 mm nuts on the rear and side panels. Keep the top cover — the gasket is reusable if it's clean." },
      { stamp: "3:45", title: "Tag and disconnect leads", detail: "Photograph the transformer wiring before removing anything. Three primary leads, two secondary." },
      { stamp: "7:10", title: "Undo the mounting bolts", detail: "Two 10 mm bolts on the bottom bracket. The transformer weighs about 12 kg — brace it before the last turn." },
      { stamp: "9:30", title: "Fit replacement and re-terminate", detail: "Match the photograph, torque the spade terminals firmly, dress the leads away from the fan path." },
      { stamp: "10:15", title: "Test arc", detail: "Reassemble, plug in, strike an arc on scrap steel and confirm stable output at 120 A." },
    ],
    missingInfo: [],
    review: {
      reviewer: "Dale Whitmore",
      verdict: "Approved",
      notes: "Lead tagging step added after near-miss on a second unit. Good as-is.",
      date: "2026-08-20",
    },
  },
  {
    id: "mnl-002",
    title: "Clearing a Clogged Spray Bar on a Haas Mini Mill Coolant Pump",
    equipment: "Haas Mini Mill III",
    status: "approved",
    durationSeconds: 455,
    createdAt: "2026-09-02",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    overview:
      "How to clear the chip-packed spray bar and restore coolant flow without pulling the pump from the tank. Includes the five-minute check Rosa Ruiz does on every coolant job.",
    tools: ["8 mm hex key", "Pick set", "Shop rags", "Gloves"],
    components: ["Spray bar nozzles", "Pump intake screen", "Coolant tank lid"],
    safetyWarnings: [
      "Lock out the machine at the disconnect before reaching into the tank.",
      "Coolant causes skin irritation — gloves are not optional.",
    ],
    steps: [
      { stamp: "0:00", title: "Lock out and open tank", detail: "Kill power at the disconnect, tag it, then lift the tank lid." },
      { stamp: "0:55", title: "Pull the intake screen", detail: "Lift the screen and check the mesh — small tears mean the pump is chewing chips." },
      { stamp: "2:10", title: "Clear the spray bar", detail: "Run a pick through each nozzle from the fitting end. Don't use a drill bit, you'll enlarge the orifice." },
      { stamp: "5:30", title: "Flush and reassemble", detail: "Hose the tank walls down, seat the screen, lid on, power up." },
      { stamp: "6:20", title: "Flow check", detail: "Run the coolant pump and confirm an even fan from all six nozzles." },
    ],
    missingInfo: [],
    review: {
      reviewer: "Rosa Ruiz",
      verdict: "Approved",
      notes: "Confirmed the orifice warning — we ruined a bar by drilling it out in 2019.",
      date: "2026-09-05",
    },
  },
  {
    id: "mnl-003",
    title: "Swapping Worn Way Covers on a Bridgeport Series I",
    equipment: "Bridgeport Series I Mill",
    status: "pending",
    durationSeconds: 940,
    createdAt: "2026-10-11",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    overview:
      "Replacing the accordion way covers on the X and Y slides before chips reach the ways. First draft — needs a machinist's review before it goes in the library.",
    tools: ["6 mm hex key", "Brass brush", "Lint-free cloths", "Way oil (ISO 68)"],
    components: ["X-axis accordion cover", "Y-axis accordion cover", "Cover mounting strips"],
    safetyWarnings: [
      "Never oil bare ways with anything other than the specified ISO 68 way oil.",
      "Support the table before removing cover hardware at full travel.",
    ],
    steps: [
      { stamp: "0:00", title: "Clean the slide", detail: "Brass-brush the exposed way and wipe with lint-free cloths until no grit shows." },
      { stamp: "3:15", title: "Remove old cover", detail: "Four 6 mm hex screws per side. Note which end is anchored — only one end is fixed." },
      { stamp: "8:40", title: "Fit new cover", detail: "Seat the anchor strip first, then the slider. Cycle the axis slowly three times to settle the bellows." },
      { stamp: "12:05", title: "Inspection travel", detail: "Run full travel both axes and watch for pinching at the mount line." },
    ],
    missingInfo: [
      "No close-up of the anchor strip orientation — the camera missed it.",
      "Torque value for the mounting screws wasn't mentioned.",
    ],
    review: null,
  },
  {
    id: "mnl-004",
    title: "Bleeding Air from a Two-Post Lift Hydraulic Circuit",
    equipment: "Rotary SBL-10 Two-Post Lift",
    status: "approved",
    durationSeconds: 705,
    createdAt: "2026-07-29",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    overview:
      "How to bleed the cylinders when one post rises slower than the other, including the cable-equalisation re-check that most shops skip.",
    tools: ["13 mm flare wrench", "Fluid catch pan", "AWF #13 hydraulic fluid", "Safety goggles"],
    components: ["Master cylinder", "Flow restrictor", "Bleed screws on both carriages"],
    safetyWarnings: [
      "Never put hands under a raised carriage — use the mechanical locks.",
      "Hydraulic fluid is flammable near welding work; keep rags in the metal can.",
    ],
    steps: [
      { stamp: "0:00", title: "Raise and lock", detail: "Lift to chest height and confirm both mechanical locks are fully engaged." },
      { stamp: "2:30", title: "Crack the bleed screw", detail: "Half turn on the slow-side carriage only. Fluid should drip, not spray — spray means the restrictor is failing." },
      { stamp: "6:15", title: "Pump the air out", detail: "Cycle the carriage three times with the screw cracked, then re-seat and snug it at 13 mm." },
      { stamp: "9:00", title: "Equalise the cables", detail: "Lower fully, re-check cable tension with the 13 mm flare wrench, adjust the idler bracket." },
      { stamp: "10:40", title: "Top-off and test", detail: "Bring the reservoir to the sight glass, raise 30 cm, hold for 5 minutes, watch for drift." },
    ],
    missingInfo: [],
    review: {
      reviewer: "Marcus Bell",
      verdict: "Approved",
      notes: "Verified against the Rotary service manual, revision C.",
      date: "2026-08-03",
    },
  },
  {
    id: "mnl-005",
    title: "Resetting the Hour Meter and Changing Oil on a Kohler 25RECO Generator",
    equipment: "Kohler 25RECO Generator",
    status: "pending",
    durationSeconds: 530,
    createdAt: "2026-10-19",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    overview:
      "The 500-hour service interval done end to end: oil change, filter swap, and walking through the controller to reset the hour service prompt.",
    tools: ["13 mm socket", "Oil drain pan", "Funnel", "10W-30 API SJ or later"],
    components: ["Oil filter", "Drain valve", "Controller panel"],
    safetyWarnings: [
      "Kill the battery disconnect before touching the controller — the panel is live.",
      "Engine and exhaust get hot enough to burn through gloves. Let it sit 20 minutes.",
    ],
    steps: [
      { stamp: "0:00", title: "Cool down and disconnect", detail: "Run 2 minutes to warm the oil for draining, shut down, kill the battery disconnect." },
      { stamp: "2:45", title: "Drain the oil", detail: "Open the drain valve into the pan. 13 mm socket on the fill cap to break the vacuum." },
      { stamp: "5:50", title: "Swap the filter", detail: "New filter gets a film of clean oil on the gasket before it goes on — snug plus a third turn." },
      { stamp: "8:20", title: "Refill to the spec line", detail: "About 1.9 L. Check the dipstick, not the nameplate, the old oil never fully drains." },
      { stamp: "9:45", title: "Reset the service prompt", detail: "Up arrow three times on the controller, hold Enter, confirm SERVICE is clear before restarting." },
    ],
    missingInfo: ["The controller reset sequence happens in a single blurry frame — reshoot recommended."],
    review: null,
  },
  {
    id: "mnl-006",
    title: "Adjusting Backlash on a South Bend 16 Lathe Carriage",
    equipment: "South Bend 16 Lathe",
    status: "rejected",
    durationSeconds: 880,
    createdAt: "2026-06-30",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    overview:
      "Attempting to remove cross-feed backlash with the anti-friction screw instead of replacing the worn lead screw nut. Sent back: it papers over the actual fault.",
    tools: ["Crescent wrench", "Brass shim stock", "Dial indicator"],
    components: ["Cross-feed lead screw", "Split nut", "Anti-friction screw"],
    safetyWarnings: ["Dial indicator only — eyeballing backlash on a 60-year-old screw will fool you."],
    steps: [
      { stamp: "0:00", title: "Measure actual backlash", detail: "Dial indicator on the compound, rock the handwheel, read the total dead travel." },
      { stamp: "6:30", title: "Adjust the anti-friction screw", detail: "Back off a quarter turn at a time until the dial shows under 0.002 in." },
      { stamp: "11:00", title: "Re-check under cutting load", detail: "Take a light finishing cut — the measurement at rest lies once the feed is loaded." },
    ],
    missingInfo: [
      "No measurement of lead screw wear shown at all.",
      "Doesn't explain how to tell when the nut must be replaced instead of adjusted.",
    ],
    review: {
      reviewer: "Dale Whitmore",
      verdict: "Sent back",
      notes: "Adjustment is real but incomplete — a manual that lets people stop here will cost us warranty claims. Reshoot with the nut inspection.",
      date: "2026-07-04",
    },
  },
];

// seconds is derived from the displayed stamp so the data stays readable
const manuals = rawManuals.map((m) => ({
  ...m,
  steps: m.steps.map((s) => ({ ...s, seconds: secondsFromStamp(s.stamp) })),
}));

export default manuals;
