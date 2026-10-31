// Seeded history so the assistant screen isn't empty on first open.
// Live answers come from the backend model; these show what a grounded
// exchange looks like, including the evidence pointer under a reply.

const seedConversations = {
  "mnl-001": [
    {
      id: "s1",
      role: "user",
      text: "What did the technician do in step 3?",
    },
    {
      id: "s2",
      role: "ghost",
      text: 'Step 3 is "Tag and disconnect leads", at 3:45. Photograph the transformer wiring before removing anything. Three primary leads, two secondary.',
      evidence: {
        kind: "step",
        label: "Step 3 · 3:45",
        detail: "Tag and disconnect leads",
        seconds: 225,
      },
    },
    {
      id: "s3",
      role: "user",
      text: "Is it safe to open the case right after unplugging?",
    },
    {
      id: "s4",
      role: "ghost",
      text: "No. The recording is explicit about this: wait 5 minutes after unplugging, then verify 0 V across the DC bus with a multimeter before touching any leads. The bus capacitors hold a lethal charge.",
      evidence: {
        kind: "safety",
        label: "Safety · 2 warnings",
        detail: "Bus capacitors hold a lethal charge",
      },
    },
  ],
  "mnl-004": [
    {
      id: "s1",
      role: "user",
      text: "Explain this repair procedure.",
    },
    {
      id: "s2",
      role: "ghost",
      text: "This is Marcus Bell's bleed procedure for a two-post lift circuit: raise and lock, crack the bleed screw on the slow-side carriage only, cycle the carriage to push air out, then re-check cable equalisation, which is the step most shops skip.",
      evidence: {
        kind: "overview",
        label: "Overview · 5 steps",
        detail: "Bleeding Air from a Two-Post Lift Hydraulic Circuit",
      },
    },
  ],
};

export default seedConversations;
