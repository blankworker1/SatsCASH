**SatsCASH**

**Magnetic Security Layer**

Technical Specification & MVP Roadmap

Version 0.2 \| April 2026 \| CONFIDENTIAL

*Updated: Stacked dual-magnet architecture, CNC operator instructions, destructive barrier specification*

**1. Executive Summary**

SatsCASH casino chips incorporate an NTAG213 NFC sticker on the front face, providing a cryptographic digital identity layer that is already operational. This document specifies the design, component selection, and MVP build plan for a second independent security layer: a stacked dual neodymium magnet assembly embedded in the rear face of each chip, verified by a dedicated USB peripheral connected to the Sunmi V2S POS terminal.

Version 0.2 updates the magnet architecture from single to stacked dual-magnet with opposite polarity orientations, incorporates the V-groove cradle locator system, specifies the face-embed geometry relative to the rear recess, and adds a full CNC drilling operator instruction section.

| **Layer**                 | **Technology**                                            | **Status** |
|---------------------------|-----------------------------------------------------------|------------|
| 1\. Visual                | Chip design, colour, denomination marking                 | LIVE       |
| 2\. Digital --- NFC       | NTAG213 sticker, cryptographic UID verification           | LIVE       |
| 3\. Physical --- Magnetic | Stacked N52 dual magnet, Hall sensor, Pico USB peripheral | IN DESIGN  |

**2. Security Architecture**

**2.1 The Destructive Verification Barrier**

The chip preparation method has been designed so that the only way to reverse-engineer the magnetic security feature is to physically destroy the chip in the process. This is not an accidental property --- it is a deliberate design objective that should be understood by everyone involved in the project.

The barrier is created by the combination of four elements applied in sequence during chip preparation:

- A precision-drilled blind hole at a specific radial and angular position within the rear recess

- Two N52 neodymium magnets inserted in a specific stacking order with specific polarity orientations

- A small drip of cyanoacrylate (superglue) applied into the hole before the second magnet is inserted, bonding both magnets permanently to the chip body

- The hole then sealed with colour-matched epoxy resin, sanded flush, and covered entirely by the rear adhesive sticker

Any attempt to access the magnets requires: removing the rear sticker (immediately detectable), grinding or drilling out the epoxy fill (destructive), and then attempting to extract two 2mm diameter magnets that are glued into a 2.1mm hole. The magnets themselves are brittle sintered material --- neodymium magnets crack and shatter under the mechanical force required to extract them from a glued hole. The counterfeiter ends up with chip fragments and broken magnet pieces, with no usable information about stack order or polarity orientation.

**⚠ The glue step is the most critical single action in the entire preparation process. A magnet inserted without glue can potentially be extracted with a fine pick tool and a strong external magnet. Always apply glue before inserting the second magnet.**

**2.2 What a Counterfeiter Must Know**

Even if a counterfeiter somehow obtains the chip dimensions, drilling position, and magnet specification from an internal source, they still face the following unknowns:

| **Parameter**                              | **Externally Detectable?**           | **Effect of Getting It Wrong**                           |
|--------------------------------------------|--------------------------------------|----------------------------------------------------------|
| Hole diameter (2.1mm)                      | Only under magnification             | Magnet won\'t fit or rattles --- inconsistent reading    |
| Hole depth (2.2mm)                         | Only if directly measured            | Wrong Z distance --- delta outside acceptance window     |
| Hole radial position (R=13mm)              | Hidden under rear sticker            | Magnet not over sensor --- near-zero delta, instant fail |
| Hole angular position (V-groove ref)       | Chip won\'t seat in cradle           | Cannot complete scan --- physical barrier                |
| Magnet 1 polarity (S face down --- bottom) | Cannot determine without destruction | Composite field wrong polarity --- instant fail          |
| Magnet 2 polarity (N face down --- top)    | Cannot determine without destruction | Composite field wrong polarity --- instant fail          |
| Stack order (M1 bottom, M2 top)            | Cannot determine without destruction | Net field value outside acceptance window                |
| Glue application                           | Only if extraction attempted         | Extraction destroys magnets --- no information gained    |

Parameters 5, 6, 7, and 8 are protected by the destructive barrier. Parameters 3 and 4 are protected by the sticker and the cradle geometry respectively. A counterfeiter who successfully defeats all eight parameters has essentially had to manufacture a perfect clone of the entire system from scratch --- at which point they have spent more resource than the chips are worth.

**3. Stacked Dual-Magnet Architecture**

**3.1 Configuration Overview**

Two N52 neodymium disc magnets (2mm diameter x 1mm thickness each) are stacked vertically in a single drilled hole. They are oriented with opposite polarities --- south face down on the bottom magnet (M1, closest to sensor), north face down on the top magnet (M2, furthest from sensor). This is referred to throughout this document as the S-N stack configuration.

CROSS-SECTION VIEW --- CHIP REAR FACE (not to scale)

══════════════════════════════════ recess surface

┌───────────┐

│ M2 │ ← Top magnet. N face DOWN. (furthest from sensor)

│ N face ↓ │ Glue applied to base before inserting M2

├───────────┤ ← Glue bond line

│ M1 │ ← Bottom magnet. S face DOWN. (closest to sensor)

│ S face ↓ │ Inserted first

└─────┬─────┘

│ Epoxy fill + surface sand flush

══════════════════════════════════ chip body (\~1.5mm)

│

\[DRV5053\] ← Hall sensor in cradle base

**3.2 Why Opposite Polarity Stacking**

Two magnets stacked with the same polarity simply double the field strength --- a counterfeiter could replicate this with a single stronger magnet. Opposite polarity stacking creates a fundamentally different and deceptive signature.

Because M1 (south face down, closest to sensor) and M2 (north face down, furthest from sensor) have opposing fields along the vertical axis, their fields partially cancel each other at the sensor. The net field reading at the sensor is weaker than either magnet alone would produce --- it reads as a modest north-polarity signal because M2\'s north face is fractionally dominant at the sensor distance.

This creates three important security properties:

- The apparent field strength is deceptively weak. A counterfeiter detecting the field from outside the sealed chip would likely conclude a single weak magnet is present, not two strong N52 magnets partially cancelling each other.

- A single magnet of any strength cannot replicate the composite reading. A weaker single magnet produces the right polarity but insufficient delta. A stronger single magnet produces too much delta. No single magnet lands in the acceptance window.

- The cancellation ratio is fixed by the physics of two touching 2x1mm N52 magnets. It is the same on every correctly prepared chip, giving highly consistent and repeatable ADC readings across a batch.

**3.3 Self-Assembling Stack**

An important practical benefit: because M1 has its south face down and M2 has its north face down, and opposite poles attract, M2 is naturally drawn toward M1 when placed above it. The magnets want to stack in the correct orientation. The correct assembly is also the stable assembly. The preparation jig simply needs to ensure the first magnet (M1) is inserted south-face-down --- the second magnet will self-orient correctly as it is lowered into the hole.

**⚠ Although the magnets self-attract into correct orientation, always confirm M1 polarity with a compass or field indicator before insertion. A reversed M1 results in a same-polarity stack that produces a strong reading outside the acceptance window --- the chip will fail every scan.**

**4. Chip Geometry & Hole Specification**

**4.1 Chip Dimensions (Blank Stock)**

| **Dimension**         | **Value**           | **Notes**                                                     |
|-----------------------|---------------------|---------------------------------------------------------------|
| Overall diameter      | 39mm (typical)      | Confirm against actual blank stock before finalising jig      |
| Overall thickness     | \~3.5-4mm (typical) | Confirm against actual blank stock                            |
| Rear recess diameter  | 32mm                | Sticker recess --- magnet hole must fall within this boundary |
| Rear recess depth     | \~0.5mm             | Shallow cosmetic recess for sticker seating                   |
| Front recess diameter | 32mm                | NFC sticker location --- opposite face                        |
| Rim width             | \~3.5mm each side   | V-groove cut into this rim                                    |

**4.2 Magnet Hole Specification**

The following dimensions define the single drilled hole that receives both magnets. These values must be entered into the CNC program exactly as specified. Do not substitute or approximate.

| **Parameter**                    | **Value**                                 | **Tolerance** | **Rationale**                                                    |
|----------------------------------|-------------------------------------------|---------------|------------------------------------------------------------------|
| Hole diameter                    | 2.10mm                                    | ±0.05mm       | 2mm magnet + 0.05mm clearance each side. Snug fit prevents tilt. |
| Hole depth                       | 2.20mm                                    | ±0.05mm       | 2x 1mm magnets (2.0mm) + 0.2mm for epoxy cap. No deeper.         |
| Radial distance from chip centre | 13.0mm                                    | ±0.1mm        | Within 32mm recess (16mm radius) with 3mm inset from recess edge |
| Angular position                 | Defined by V-groove reference (see 4.3)   | ±1°           | CNC jig V-groove pin sets the 0° reference for all chips         |
| Hole type                        | Blind hole --- does not pass through chip | ---           | Must not break through front face under any circumstances        |

**CRITICAL: The hole must never break through to the front face of the chip. Set CNC depth stop with a safety margin. If in doubt, drill shallower and test fit before committing to the full batch.**

**4.3 V-Groove Locator Specification**

A V-shaped groove is cut into the outer rim of the chip. This groove serves as the angular reference for both the CNC drilling jig and the verification cradle. The chip can only be seated in the cradle in one orientation --- the groove engages a locating pin and prevents rotation.

| **Parameter**                       | **Value**                                                 | **Notes**                                                               |
|-------------------------------------|-----------------------------------------------------------|-------------------------------------------------------------------------|
| Groove profile                      | V-shape, 60° included angle                               | Self-centring. Guides the locating pin smoothly.                        |
| Groove depth                        | 1.5mm                                                     | Deep enough to positively engage pin. Shallow enough not to weaken rim. |
| Groove width at opening             | 2.0mm                                                     | Matches 2mm locating pin diameter in cradle                             |
| Groove position on rim              | Outer cylindrical rim, midpoint of chip thickness         | Not on face --- on the edge                                             |
| Angular relationship to magnet hole | V-groove at 0°. Magnet hole at 90° clockwise from groove. | This offset angle is a secret parameter. Do not publish.                |

**⚠ The angular offset between the V-groove and the magnet hole (90° in this specification) is a security parameter. It should not appear in any external documentation, staff training materials, or supplier communications. The CNC program encodes this offset implicitly --- operators do not need to know the value.**

**4.4 NFC Interference Check**

With the magnet positioned at R=13mm from chip centre on the rear face, and the NTAG213 sticker centred on the front face, the separation between the magnet and the NFC antenna coil is approximately the full chip thickness (\~3.5-4mm) plus the lateral offset of the magnet from centre (\~13mm). This geometry means the magnet is not directly behind the NFC coil, and the separation is sufficient to prevent antenna detuning.

Before drilling the full batch, perform the following empirical test on a single test chip:

1.  Apply NTAG213 sticker to front face centre.

2.  Hold a 2x1mm N52 magnet against the rear face at the specified R=13mm position.

3.  Scan the NFC tag with the Sunmi V2S or a test phone. Note read distance.

4.  Scan the same tag without the magnet present. Compare read distance.

5.  If read distance drops by more than 20%, shift the magnet position 3-5mm further from chip centre and retest.

**5. CNC Operator Instructions**

*This section is written for the person operating the CNC machine and performing chip preparation. It should be read in full before beginning any work. No prior knowledge of the security architecture is required to follow these instructions.*

**5.1 Equipment & Materials Checklist**

Confirm all of the following are present and ready before starting:

| **Item**                      | **Specification**                                                           | **Check** |
|-------------------------------|-----------------------------------------------------------------------------|-----------|
| CNC machine                   | Any desktop CNC mill capable of 2.1mm end mill work                         | ☐         |
| End mill / drill bit          | 2.1mm diameter, carbide preferred, minimum 5mm cutting length               | ☐         |
| Drilling jig                  | Custom jig --- chip seats in recess, V-groove pin engages rim groove        | ☐         |
| Blank casino chips            | Confirm diameter matches jig recess before batch run                        | ☐         |
| M1 magnets --- BOTTOM         | N52, 2mm dia x 1mm. Labelled or stored separately from M2.                  | ☐         |
| M2 magnets --- TOP            | N52, 2mm dia x 1mm. Same spec as M1 but opposite polarity stored facing up. | ☐         |
| Polarity test card or compass | To confirm M1 polarity before insertion                                     | ☐         |
| Cyanoacrylate superglue       | Thin viscosity (low viscosity flows into gap more effectively)              | ☐         |
| Colour-matched epoxy resin    | Mixed and ready. Colour matched to chip rear face.                          | ☐         |
| Fine sanding block            | 400 grit minimum for flush surface finish                                   | ☐         |
| Rear face stickers            | Pre-cut to 32mm diameter. Applied after epoxy fully cured.                  | ☐         |
| Inspection loupe or magnifier | 10x minimum. For post-drilling hole inspection.                             | ☐         |
| Waste / reject tray           | For chips that fail any inspection step.                                    | ☐         |

**5.2 CNC Machine Setup**

**Step 1: Load the drilling program**

> Load the SatsCASH chip drilling CNC program. Do not modify any values in the program. The hole position, depth, and diameter are pre-set. If the program appears incorrect, stop and contact the project lead before proceeding.

**Step 2: Install the 2.1mm end mill**

> Fit the 2.1mm carbide end mill into the collet. Ensure it is fully seated and tightened correctly. Check for runout by spinning slowly by hand --- there should be no visible wobble.

**Step 3: Set the Z-zero (work surface zero)**

> Place an undamaged blank chip in the jig. Set Z-zero to the surface of the chip rear face recess. This is the reference point from which the 2.20mm depth is measured. Confirm the depth stop is set to exactly 2.20mm from this zero point.

**Step 4: Dry run --- no cutting**

> Run the program once without cutting (raise Z by 5mm above work surface, or use the machine\'s dry run mode). Confirm the tool path moves to the correct XY position over the chip and does not travel outside the 32mm recess boundary.

**Step 5: Test cut on a sacrificial chip**

> Run a full cut on one chip designated as a test piece. Measure the resulting hole with a 2.1mm pin gauge or digital calipers. Confirm diameter 2.10mm ±0.05mm and depth 2.20mm ±0.05mm. Inspect with loupe for clean hole walls. Do not proceed to the batch if the test cut is outside tolerance.

**5.3 Drilling the Batch**

**Step 1: Seat the chip in the jig**

> Place the chip rear face UP in the jig recess. Engage the V-groove locating pin into the rim groove. The chip should seat firmly with no rocking. If it rocks, check for swarf or debris in the jig recess and clean before reseating.

**Step 2: Run the drilling program**

> Execute the CNC program. The machine will drill one hole to the specified depth and retract. Do not interrupt the program once started.

**Step 3: Remove and inspect**

> Remove the chip from the jig. Using the inspection loupe, check: hole walls are clean with no tearing or chip-out, hole is circular not oval, no visible cracking around the hole perimeter. If any defect is present, place the chip in the reject tray. Do not attempt to re-drill a rejected chip.

**Step 4: Clear swarf**

> Use compressed air or a clean brush to remove all cutting debris from the hole and jig before seating the next chip. Metal or composite swarf left in the hole will prevent full magnet seating.

**Step 5: Repeat for full batch**

> Process all chips before moving to the magnet insertion stage. Keep drilled chips in a separate labelled tray.

**5.4 Magnet Insertion --- Read Before Starting**

**⚠ Neodymium magnets are brittle and will snap together forcefully if allowed to approach each other unsupported. Keep M1 and M2 magnets in separate containers during this process. Handle individually.**

**⚠ Keep all magnets away from credit cards, NFC stickers, electronic devices, and other magnets during handling.**

The magnets are stored in two separate labelled containers:

- Container M1 --- BOTTOM magnets. These are stored south-face-up (the face that will point DOWN toward the sensor is currently facing UP in the container).

- Container M2 --- TOP magnets. These are stored north-face-up (the face that will point DOWN is currently facing UP in the container).

Before inserting any magnets, confirm polarity using the polarity test card or compass:

6.  Take one magnet from Container M1. Hold it near the compass. The face that repels the compass north needle is the NORTH face. The face that attracts it is the SOUTH face. Confirm the south face is the bottom face (the face that will go into the hole first). If reversed, return to container and re-examine labelling.

7.  You do not need to test M2 individually if M1 is confirmed --- because opposite poles attract, M2 will self-orient correctly once M1 is in place.

**5.5 Magnet Insertion Procedure --- Per Chip**

**CRITICAL: Perform all five steps for each chip before moving to the next chip. Do not batch-insert M1 across all chips before doing M2. One chip must be fully completed before starting the next.**

**Step 1: Insert M1 --- bottom magnet**

> Take one magnet from Container M1. Orient it south face DOWN. Lower it into the drilled hole south face first using tweezers or a non-magnetic pick tool. Press gently until it seats at the bottom of the hole. It should sit flush with or just below the recess surface. Confirm it is fully seated --- it must not protrude above the recess floor.

**Step 2: Apply glue**

> Apply a small drip of thin cyanoacrylate superglue into the hole, on top of M1. One drop is sufficient --- the thin viscosity will wick into the gap between the magnet and hole walls by capillary action. Do not flood the hole. Wait 10 seconds for the glue to begin setting before proceeding.

**Step 3: Insert M2 --- top magnet**

> Take one magnet from Container M2. Hold it a few centimetres above the hole. It will be attracted downward toward M1. Lower it into the hole using tweezers, allowing the magnetic attraction to guide it into position. The magnet will self-orient to the correct polarity as it is drawn toward M1. Press gently to seat it firmly against M1. The top of M2 should be approximately 0.2mm below the recess floor surface --- just enough space for the epoxy cap.

**Step 4: Apply epoxy cap**

> Mix a small amount of colour-matched epoxy resin. Apply a thin layer over the top of M2 and the surrounding recess floor, filling the remaining 0.2mm. The epoxy should be flush with or very slightly proud of the recess floor surface. Do not apply too much --- excess epoxy changes the effective Z distance between M2 and the sensor.

**Step 5: Cure and sand**

> Allow the epoxy to cure fully per the manufacturer\'s instructions (minimum 1 hour working strength, 24 hours full strength). Once fully cured, sand flush with 400 grit paper using light pressure. The surface should be smooth and continuous with the surrounding recess floor. Wipe clean.

**5.6 Final Inspection & Sticker Application**

**Step 1: Visual inspection**

> Examine the rear face with the loupe. The epoxy fill should be invisible or nearly invisible. There should be no raised bump, no depression, and no visible hole outline. If the fill is uneven, apply a second thin coat of epoxy, cure, and re-sand.

**Step 2: Functional test**

> Before applying the rear sticker, place the chip in the verification cradle connected to the Sunmi V2S. Confirm the webapp shows VERIFIED. If the chip fails, mark it as a reject --- do not apply the sticker and do not include it in the production batch.

**Step 3: Apply rear sticker**

> Once the functional test passes, apply the 32mm diameter rear sticker centred in the recess. Press firmly from centre outward to prevent air bubbles. The sticker completely covers the epoxy fill and the entire recess area.

**Step 4: Final scan**

> Perform one final NFC scan (front face) and one final magnetic scan (rear face in cradle) after sticker application. Both must pass. Record the chip serial number and pass result in the batch log.

**Step 5: Batch logging**

> Record in the batch log: chip serial number, date, operator initials, NFC pass/fail, magnetic pass/fail, any notes. Rejected chips must be logged with reason and securely destroyed --- do not discard in general waste.

**6. Hardware Specification**

**6.1 Component List**

| **Component**        | **Specification**                                | **Role**                                                       | **Est. Cost** |
|----------------------|--------------------------------------------------|----------------------------------------------------------------|---------------|
| Microcontroller      | Raspberry Pi Pico (RP2040), native USB-C         | ADC sampling, JSON output via USB CDC serial                   | £4-5          |
| Hall Effect Sensor   | TI DRV5053EA, SOT-23 package                     | Analogue field reading, polarity-sensitive, 0-2V output        | £1-2          |
| Bottom Magnet (M1)   | N52 neodymium, 2mm dia x 1mm, axial, S face down | Primary field source, closest to sensor                        | \< £0.20      |
| Top Magnet (M2)      | N52 neodymium, 2mm dia x 1mm, axial, N face down | Opposing field source, partially cancels M1                    | \< £0.20      |
| Glue                 | Thin cyanoacrylate superglue                     | Permanently bonds magnet stack in hole --- destructive barrier | \< £0.05      |
| Epoxy fill           | Colour-matched 2-part epoxy                      | Seals hole flush, conceals assembly                            | \< £0.10      |
| Decoupling capacitor | 0.01uF ceramic, 0402 or similar                  | Required on DRV5053 VCC pin for stable operation               | \< £0.05      |
| Cradle               | 3D printed PLA/PETG                              | Positions chip at fixed XY/Z over sensor, V-groove pin locator | \< £1         |
| USB-C cable          | USB-C to USB-C data cable, 0.3m                  | Pico to Sunmi V2S OTG port                                     | £3-4          |

**6.2 Wiring --- DRV5053 to Pico**

| **DRV5053 Pin** | **Pico Pin**         | **Signal**           | **Notes**                                                                     |
|-----------------|----------------------|----------------------|-------------------------------------------------------------------------------|
| Pin 1 --- VCC   | Pin 36 (3V3 OUT)     | 3.3V power           | Place 0.01uF ceramic cap between VCC and GND, as close to DRV5053 as possible |
| Pin 2 --- GND   | Pin 38 (GND)         | Ground               | Common ground reference                                                       |
| Pin 3 --- OUT   | Pin 31 (GP26 / ADC0) | Analogue output 0-2V | Ensure no capacitive load \> 10nF on this line. Direct connection only.       |

**6.3 Cradle Design Requirements**

- Chip recess diameter: match actual blank chip diameter exactly. Chip should drop in with no lateral play.

- V-groove locating pin: 2mm diameter, positioned to engage rim groove. Pin height: 1.5mm (matches groove depth).

- Sensor pocket in cradle base: DRV5053 sits face-up in pocket directly below the magnet hole position. Sensor face to chip base face clearance: 1.5-2.0mm of cradle material.

- Sensor pocket XY position: R=13mm from cradle centre, at the angular position corresponding to the magnet hole (90° clockwise from V-groove pin in this specification).

- Cable exit: route Pico USB-C cable through base or side of enclosure. Strain relief recommended.

**7. Firmware Specification (MicroPython --- Raspberry Pi Pico)**

**7.1 Configuration File**

Calibration thresholds are stored in config.py on the Pico flash. Editable as plain text --- no IDE required:

\# SatsCASH Magnetic Verification --- Threshold Configuration

\# Edit these values after running the calibration procedure (Section 7.3)

MIDPOINT = 2048 \# ADC midpoint (no field). 12-bit: 0-4095, 1V = 2048

THRESHOLD_MIN = 280 \# Minimum delta to accept. Set after calibration.

THRESHOLD_MAX = 480 \# Maximum delta to accept. Set after calibration.

EXPECTED_POLARITY = \'N\' \# Net polarity of S-N stack at sensor = North

IDLE_THRESHOLD = 50 \# Below this delta = no chip present

SAMPLE_RATE_MS = 200 \# Poll interval in milliseconds

*The EXPECTED_POLARITY is \'N\' (north) because M1 has south face down but M2\'s north face is fractionally dominant at sensor distance. Confirm empirically during calibration --- this value may need to be updated based on actual sensor distance.*

**7.2 JSON Output Packet**

The Pico emits one newline-terminated JSON packet per sample interval:

{\"raw\":1780,\"delta\":268,\"polarity\":\"N\",\"pass\":true,\"state\":\"chip\",\"ts\":17123}

{\"raw\":2051,\"delta\":3,\"polarity\":\"N\",\"pass\":false,\"state\":\"idle\",\"ts\":17124}

{\"raw\":1420,\"delta\":628,\"polarity\":\"N\",\"pass\":false,\"state\":\"chip\",\"ts\":17125}

| **Field** | **Type**       | **Description**                                                            |
|-----------|----------------|----------------------------------------------------------------------------|
| raw       | Integer 0-4095 | Raw 12-bit ADC reading from DRV5053 output pin                             |
| delta     | Integer 0-2048 | Absolute deviation from MIDPOINT. Higher = stronger net field              |
| polarity  | String N or S  | N = raw \< MIDPOINT (north dominant). S = raw \> MIDPOINT (south dominant) |
| pass      | Boolean        | True if: delta \>= MIN, delta \<= MAX, polarity == EXPECTED, state == chip |
| state     | String         | idle = no chip present (delta \< IDLE_THRESHOLD). chip = chip detected.    |
| ts        | Integer        | Milliseconds since Pico boot. Used for deduplication in audit log.         |

**7.3 Calibration Procedure**

Run this procedure with a confirmed genuine prepared chip batch before setting production thresholds:

8.  Connect Pico to laptop via USB-C. Open a serial terminal at 115200 baud.

9.  Place 20 prepared chips in the cradle one at a time. Record the delta value from each packet.

10. Calculate the mean delta (average) and standard deviation across all 20 chips.

11. Set THRESHOLD_MIN = mean minus (2 x standard deviation). Round down to nearest 10.

12. Set THRESHOLD_MAX = mean plus (2 x standard deviation). Round up to nearest 10.

13. Confirm EXPECTED_POLARITY matches the polarity field in the packets from genuine chips.

14. Test with 5 chips with no magnets. All must show state: idle or pass: false.

15. Test with 5 chips with a single magnet only (no stack). All must show pass: false.

16. Test with 5 chips with same-polarity stack (M1 and M2 both south-down). All must show pass: false.

17. Record final threshold values and update config.py on all production Pico units.

**8. Webapp Integration --- Web Serial API**

**8.1 Platform Requirements**

| **Requirement** | **Detail**                                                                           |
|-----------------|--------------------------------------------------------------------------------------|
| Device          | Sunmi V2S, SUNMI OS (Android 11)                                                     |
| Browser         | Android Chrome --- required for Web Serial API                                       |
| Connection      | HTTPS mandatory for Web Serial permission grant                                      |
| USB             | Pico connected via USB-C to V2S OTG port. Pico draws \< 100mA --- within OTG budget. |
| Driver          | None required. Pico native USB CDC recognised automatically by Android.              |
| Permission      | One-time user gesture to grant serial port access. Persists across sessions.         |

**8.2 UI Verification States**

| **State** | **Display**    | **Condition**                                                  |
|-----------|----------------|----------------------------------------------------------------|
| Idle      | **WAITING**    | state: idle in packet. No chip in cradle.                      |
| Pass      | **VERIFIED ✓** | pass: true. Correct delta range, correct polarity, chip state. |
| Fail      | **REJECTED ✗** | pass: false. Wrong delta range, wrong polarity, or both.       |
| Offline   | **NO SENSOR**  | USB cable unplugged or Web Serial port closed.                 |

**9. MVP Build Plan**

**Phase 1 --- Procurement (Week 1)**

| **Item**                             | **Qty**  | **Source**                    | **Notes**                                                      |
|--------------------------------------|----------|-------------------------------|----------------------------------------------------------------|
| Raspberry Pi Pico with headers       | 2        | Pimoroni / The Pi Hut         | Next day UK delivery                                           |
| TI DRV5053EA SOT-23                  | 10       | Mouser UK / DigiKey           | Order 10 to allow for soldering errors                         |
| 0.01uF ceramic capacitor             | 10       | Mouser / component kit        | Decoupling cap --- DRV5053 VCC pin                             |
| N52 2mm x 1mm neodymium disc magnets | 100      | first4magnets.com             | Confirm AXIAL magnetisation. Order 100 --- 2 per chip + spares |
| Thin cyanoacrylate superglue         | 1 bottle | Any hardware store            | Thin viscosity only --- not gel                                |
| Colour-matched epoxy resin           | 1 pack   | Amazon UK / hobby supplier    | Match to blank chip rear face colour                           |
| USB-C to USB-C data cable 0.3m       | 2        | Amazon UK                     | Confirm data cable --- not charge-only                         |
| Polarity test card                   | 2        | Amazon UK / first4magnets.com | For confirming M1 orientation before insertion                 |

**Phase 2 --- Hardware Prototype (Weeks 1-2)**

18. Solder DRV5053EA to perfboard or breakout adapter. Three connections: VCC, GND, OUT. Add 0.01uF decoupling cap on VCC.

19. Wire to Pico: VCC to Pin 36, GND to Pin 38, OUT to Pin 31 (GP26/ADC0).

20. Flash MicroPython to Pico. Open serial terminal. Confirm raw ADC readings. Wave a strong magnet near the DRV5053 and confirm delta response.

21. Design cradle in CAD (FreeCAD or Tinkercad). Key feature: V-groove locating pin at 0°, sensor pocket at 90° clockwise, R=13mm from centre.

22. 3D print cradle. Test fit with blank chips. Adjust and reprint as needed.

23. Epoxy DRV5053 into sensor pocket in cradle base.

**Phase 3 --- CNC Jig & Chip Preparation (Week 2)**

24. Design and fabricate CNC drilling jig. Jig must constrain chip in XY, engage V-groove, and present chip rear face to spindle.

25. Write CNC program: 2.1mm end mill, 2.2mm depth, R=13mm from chip centre, 90° clockwise from V-groove reference.

26. Run test cuts on 3 sacrificial chips. Measure and confirm hole dimensions before batch run.

27. Prepare a batch of 20 test chips following the Section 5 operator instructions exactly.

28. Run functional test on all 20 chips before sticker application.

**Phase 4 --- Firmware & Calibration (Week 2-3)**

29. Write full MicroPython firmware: ADC loop, delta calculation, polarity detection, state detection, JSON serialisation, USB CDC output.

30. Run calibration procedure (Section 7.3) across all 20 prepared test chips. Record delta values.

31. Set THRESHOLD_MIN and THRESHOLD_MAX from calibration data. Update config.py.

32. Run all rejection tests: no magnet, single magnet, same-polarity stack, wrong orientation in cradle. Confirm all fail.

**Phase 5 --- Webapp Development (Weeks 3-4)**

33. Build Web Serial connection manager: port picker, open/close, automatic reconnect.

34. Build JSON stream parser: readline buffer, JSON.parse, malformed packet handling.

35. Build verification UI: four states (idle/verified/rejected/no sensor) with unambiguous visual differentiation.

36. Integrate with existing NFC webapp. Magnetic verification runs as a parallel independent check.

37. Test on Sunmi V2S: connect Pico via USB-C OTG. Confirm Chrome Web Serial prompt and successful port open.

38. Time full dealer workflow: NFC scan + magnetic scan. Target: under 3 seconds combined.

**Phase 6 --- MVP Sign-off (Weeks 4-5)**

39. 200-chip pass/fail test. Target: 0% false positives, \< 1% false negatives.

40. Security rejection battery: no magnet, single magnet, same-polarity stack, wrong polarity, undersized magnet, oversized magnet, wrong cradle orientation. Document all results.

41. 500-placement cradle stress test. Check for sensor drift or mechanical wear.

42. Produce dealer reference card: one page, plain language, no security parameters.

43. Update this document with final confirmed threshold values and firmware version number.

**10. Future Roadmap (Post-MVP)**

| **Item**                       | **Description**                                                                                                                   | **Priority** |
|--------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|--------------|
| Custom PCB                     | Integrate Pico + DRV5053 + USB-C onto a single board. Production-grade units.                                                     | High         |
| Audit logging backend          | POST each scan result with chip ID, terminal ID, timestamp, pass/fail. Enables fraud pattern detection.                           | High         |
| Manufacturer integration       | Specify magnet embed as part of chip moulding process. Eliminates post-production drilling entirely.                              | High         |
| Denomination-specific polarity | Different chip denominations use different polarity conventions. Webapp selects expected polarity from NFC-reported denomination. | Medium       |
| Three-magnet stack             | Third magnet extends the composite field signature space further. Same single hole, one additional magnet, glued stack.           | Medium       |
| Tamper detection               | Pico monitors for sudden large field spikes suggesting an external magnet being used to attempt spoofing.                         | Low          |

SatsCASH --- Confidential Technical Document

*Version 0.2 \| April 2026 \| Not for distribution*
