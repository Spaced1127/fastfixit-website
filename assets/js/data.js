/* ------------------------------------------------------------------
   Bench estimate data
   ------------------------------------------------------------------
   `from` is a starting labor price in whole dollars. Change these
   to your own numbers before launch. Every figure on the site is
   presented as a starting point, confirmed by a written quote.
   ------------------------------------------------------------------ */

window.FFI_DATA = {
  // 0 renders as "Free" everywhere the diagnosis is mentioned.
  diagnostic: 0,

  devices: [
    {
      id: "console",
      label: "Game console",
      faults: [
        {
          id: "no-power",
          label: "Won't power on",
          category: "power",
          check: "Standby rail, power supply and the first-stage regulators. We check for a short before applying power.",
          time: "2–4 days",
          from: 79
        },
        {
          id: "no-video",
          label: "No picture / HDMI",
          category: "video",
          check: "HDMI port pins, the encoder and the filter network behind it. We test the cable and display first.",
          time: "2–4 days",
          from: 100
        },
        {
          id: "overheat",
          label: "Overheating / shutting down",
          category: "thermal",
          check: "Fan curve, heatsink contact, thermal compound and the temperature sensors under load.",
          time: "2–3 days",
          from: null
        },
        {
          id: "disc",
          label: "Disc drive",
          category: "media",
          check: "Laser, spindle motor and the drive board. We test with a known-good disc.",
          time: "3–5 days",
          from: null
        },
        {
          id: "port",
          label: "Damaged port",
          category: "port",
          check: "The port, its pads and the traces behind it. We replace at board level when the pads are sound.",
          time: "2–4 days",
          from: null
        },
        {
          id: "liquid",
          label: "Liquid damage",
          category: "liquid",
          check: "Corrosion under the shields, damaged traces and any parts that took current. We clean and assess before quoting.",
          time: "3–5 days",
          from: null
        },
        {
          id: "other",
          label: "Something else",
          category: "other",
          check: "A visual inspection and a bench test first, then a straight answer about what we found.",
          time: "2–4 days",
          from: null
        }
      ]
    },
    {
      id: "controller",
      label: "Controller",
      faults: [
        {
          id: "drift",
          label: "Stick drift",
          category: "controls",
          check: "Stick module wear, dead zone and calibration. We replace the module and recalibrate.",
          time: "1–2 days",
          from: 40
        },
        {
          id: "buttons",
          label: "Buttons or triggers",
          category: "controls",
          check: "Contacts, membranes, tact switches and the trigger mechanism.",
          time: "1–2 days",
          from: null
        },
        {
          id: "charge",
          label: "Charging or battery",
          category: "battery",
          check: "Charge port, battery health and the charging circuit.",
          time: "1–2 days",
          from: null
        },
        {
          id: "pairing",
          label: "Connection or pairing",
          category: "pairing",
          check: "Radio, pairing button and the antenna. We test on a known-good console.",
          time: "1–2 days",
          from: null
        },
        {
          id: "liquid",
          label: "Liquid damage",
          category: "liquid",
          check: "Corrosion on the board and under the buttons. We clean and assess before quoting.",
          time: "2–3 days",
          from: null
        },
        {
          id: "other",
          label: "Something else",
          category: "other",
          check: "A bench test and a look inside, then a straight answer.",
          time: "1–2 days",
          from: null
        }
      ]
    },
    {
      id: "handheld",
      label: "Handheld",
      faults: [
        {
          id: "screen",
          label: "Cracked or dead screen",
          category: "screen",
          check: "Panel, digitizer and the ribbon connector. We test touch, brightness and color after.",
          time: "2–4 days",
          from: null
        },
        {
          id: "charge",
          label: "Won't charge",
          category: "battery",
          check: "Charge port, battery health and the charging IC.",
          time: "2–4 days",
          from: null
        },
        {
          id: "battery",
          label: "Battery life",
          category: "battery",
          check: "Battery health, charge cycle count and standby drain.",
          time: "1–3 days",
          from: null
        },
        {
          id: "drift",
          label: "Stick drift",
          category: "controls",
          check: "Stick module wear and calibration. We replace the module where parts allow.",
          time: "1–3 days",
          from: 40
        },
        {
          id: "liquid",
          label: "Liquid damage",
          category: "liquid",
          check: "Corrosion under the shields and damaged traces. We clean and assess before quoting.",
          time: "3–5 days",
          from: null
        },
        {
          id: "no-power",
          label: "Won't power on",
          category: "power",
          check: "Standby rail, power button and the first-stage regulators.",
          time: "2–4 days",
          from: 79
        },
        {
          id: "other",
          label: "Something else",
          category: "other",
          check: "A bench test and a look inside, then a straight answer.",
          time: "2–4 days",
          from: null
        }
      ]
    },
    {
      id: "computer",
      label: "Laptop or desktop",
      faults: [
        {
          id: "no-power",
          label: "Won't power on",
          category: "power",
          check: "Standby circuit, charge IC, battery and the power button.",
          time: "2–5 days",
          from: 79
        },
        {
          id: "no-display",
          label: "No display",
          category: "video",
          check: "Panel, backlight, display cable and GPU output.",
          time: "2–5 days",
          from: null
        },
        {
          id: "charge",
          label: "Charging port",
          category: "battery",
          check: "Charge port, its pads and the charging circuit.",
          time: "2–4 days",
          from: null
        },
        {
          id: "keyboard",
          label: "Keyboard or trackpad",
          category: "controls",
          check: "Key switches, membrane, ribbon and trackpad cable.",
          time: "2–4 days",
          from: null
        },
        {
          id: "thermal",
          label: "Overheating or loud fan",
          category: "thermal",
          check: "Fan, heatsink, thermal compound and the fan curve under load.",
          time: "1–3 days",
          from: null
        },
        {
          id: "liquid",
          label: "Liquid damage",
          category: "liquid",
          check: "Corrosion, damaged traces and parts that took current. We clean and assess before quoting.",
          time: "3–7 days",
          from: null
        },
        {
          id: "storage",
          label: "Storage or memory",
          category: "other",
          check: "Drive health, memory test and the replacement path. Data transfer is quoted separately.",
          time: "1–3 days",
          from: null
        },
        {
          id: "other",
          label: "Something else",
          category: "other",
          check: "A bench test and a look inside, then a straight answer.",
          time: "2–5 days",
          from: null
        }
      ]
    },
    {
      id: "phone",
      label: "Phone or tablet",
      faults: [
        {
          id: "screen",
          label: "Cracked screen",
          category: "screen",
          check: "Panel and digitizer. We check touch and brightness after.",
          time: "1–3 days",
          from: null
        },
        {
          id: "battery",
          label: "Battery or charging",
          category: "battery",
          check: "Battery health, charge port and the charging circuit.",
          time: "1–3 days",
          from: null
        },
        {
          id: "port",
          label: "Charge port",
          category: "port",
          check: "Port, pads and the traces behind it. Board-level where the pads are sound.",
          time: "2–4 days",
          from: null
        },
        {
          id: "liquid",
          label: "Liquid damage",
          category: "liquid",
          check: "Corrosion, current damage and data risk. We assess before quoting.",
          time: "2–5 days",
          from: null
        },
        {
          id: "data",
          label: "Data recovery",
          category: "other",
          check: "Storage health and board-level access. We quote recovery only after imaging.",
          time: "3–7 days",
          from: null
        },
        {
          id: "other",
          label: "Something else",
          category: "other",
          check: "A bench test and a look inside, then a straight answer.",
          time: "2–4 days",
          from: null
        }
      ]
    },
    {
      id: "audio",
      label: "Audio or TV",
      faults: [
        {
          id: "no-power",
          label: "Won't power on",
          category: "power",
          check: "Power supply, protection circuit and output stage.",
          time: "3–5 days",
          from: 79
        },
        {
          id: "no-sound",
          label: "No sound / one channel",
          category: "audio",
          check: "Inputs, relays, output stage and speaker terminals.",
          time: "3–5 days",
          from: null
        },
        {
          id: "hdmi",
          label: "HDMI input",
          category: "video",
          check: "HDMI port, switch and the board's power rails.",
          time: "3–5 days",
          from: 100
        },
        {
          id: "caps",
          label: "Hum or failing capacitors",
          category: "audio",
          check: "Power supply capacitors, regulators and the output stage.",
          time: "3–5 days",
          from: null
        },
        {
          id: "turntable",
          label: "Turntable service",
          category: "audio",
          check: "Belt, bearing, tonearm and cartridge alignment. We test the output.",
          time: "3–5 days",
          from: null
        },
        {
          id: "other",
          label: "Something else",
          category: "other",
          check: "A bench test and a look inside, then a straight answer.",
          time: "3–5 days",
          from: null
        }
      ]
    },
    {
      id: "other",
      label: "Something else",
      faults: [
        {
          id: "diagnose",
          label: "Help me identify it",
          category: "other",
          check: "A visual inspection and a bench test first, then a straight answer about what we found.",
          time: "2–5 days",
          from: null
        }
      ]
    }
  ],

  categories: [
    { id: "power", label: "Won't power on / no power" },
    { id: "video", label: "No picture or video" },
    { id: "audio", label: "No sound or audio fault" },
    { id: "thermal", label: "Overheating or shutting down" },
    { id: "battery", label: "Charging or battery" },
    { id: "controls", label: "Buttons, sticks or triggers" },
    { id: "screen", label: "Screen or glass damage" },
    { id: "liquid", label: "Liquid damage" },
    { id: "media", label: "Disc or media drive" },
    { id: "pairing", label: "Connection or pairing" },
    { id: "port", label: "Damaged port or connector" },
    { id: "other", label: "Something else" }
  ]
};