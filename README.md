# SatsCASH

A physical bearer instrument for the Lightning Network, bringing the tactile experience of cash to digital value.

SatsCASH transforms a simple NFC tag into a secure, fixed-value coin that can be verified with a tap and trusted for daily transactions. It's a system for creating "digital cash" that you can hold in your hand, give to a friend, or use to build a local economy.

---

## 🧭 The System: Roles & Responsibilities

SatsCASH operates on a principle of distributed trust, where no single entity has unilateral control over the funds. This creates a secure and balanced ecosystem.

*   **The Mint:** Creates the physical coins (NFC tags) that represent a value in sats, locked in a treasury Lightning wallet. The Mint **cannot spend the funds** without the PIN.
*   **The Custodian:** A separate, trusted entity that creates and securely holds the unique PIN code for each coin. The Custodian **cannot withdraw the funds** without the physical coin (NFC tag).
*   **The User:** Uses the coins as a simple medium of exchange. The primary tool is not a wallet, but a verifier. Possession of the coin is ownership.

---

## 🛠️ Technical Aspects

### Core Architecture

The system is composed of three independent components that communicate to ensure security and validity.

1.  **The Physical Coin:** An NXP NTAG424 DNA tag. It uses its factory-set, read-only Unique Identifier (UID) as its serial number. No data is written to the tag, making it simple, secure, and tamper-proof.
2.  **The Mint Server:** A web server that manages the central ledger. It holds the database of all coin UIDs, their values, and their status (`minted`, `locked`, `spent`). It integrates with the [Blink API](https://blink.sv/) to manage the real Bitcoin backing the coins using a "mark-and-hold" method.
3.  **The Custodian Server:** A standalone authentication server. Its sole responsibility is to securely generate, store, and release the PINs for coins upon proper authorization. It has no access to the Mint's funds or database.

### Security Model

The system's security is based on a cryptographic separation of duties, similar to a multi-signature wallet.

*   **To Spend a Coin:** One needs both the physical **NFC Tag** (to identify the coin to the Mint) and the secret **PIN Code** (to authorize the transaction with the Mint).
*   **The Mint** holds the funds but does not know the PINs.
*   **The Custodian** knows the PINs but has no access to the funds.
*   This ensures that neither the Mint nor the Custodian can act alone to compromise the system's funds.

### Tech Stack

*   **Backend:** Node.js with Express
*   **Database:** SQLite (for PoC) / PostgreSQL (for Production)
*   **Frontend:** HTML5, CSS3, JavaScript (Web NFC API)
*   **Lightning:** Blink API
*   **NFC Hardware:** NXP NTAG424 DNA Tags

---

## 📈 Phased Rollout

### MVP: The Technical Foundation

The initial version is a local Proof of Concept (PoC) designed to validate the core architecture and security model without external dependencies.

*   **Goal:** Prove that a physical NFC tag can be used as a secure key to a digital bearer asset.
*   **Setup:** A server running on a local PC, a local Wi-Fi network, and a web app on an Android tablet.
*   **Simulated Treasury:** The Lightning treasury is simulated within the local database. The PoC demonstrates the state change from `minted` to `spent` without moving real sats.
*   **Core Features Demonstrated:**
    *   Reading a tag's UID via the Web NFC API.
    *   Verifying a coin's status against a central database.
    *   The complete, secure authentication flow involving the PIN.
    *   The separation of the Mint and Custodian services.

### V1: The Local Community Usecase

The first production version is designed for a specific, real-world application: serving as trusted local money for a community.

*   **Goal:** Enable a high-velocity, low-friction medium of exchange for daily transactions within a defined group (a town, a market, a company).
*   **Primary Function: Verification.** The SatsCASH web app is used primarily as a **note verifier**. A merchant or user taps a coin to instantly confirm its authenticity and value, building trust for a transaction. The transaction itself is the simple physical handover of the coin, just like cash.
*   **Secondary Function: Redemption & Control.** The PIN, held by the Custodian, is used for exceptional circumstances, not daily spending. This includes:
    *   **Redemption:** A formal process for a user to convert their SatsCASH back into Bitcoin, exiting the local system.
    *   **System Administration:** Allowing the project administrators to perform actions like recalling an old series of coins or managing the money supply, much like a central bank^9^ managing physical currency^2^.
*   **User Experience:** For daily use, the system is completely anonymous. There are no accounts or logins needed to accept or verify a coin. The focus is on the tangible, physical exchange of value.
