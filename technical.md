
# Technical Specification: SatsCASH MVP

This document provides an in-depth technical specification for building the SatsCASH Minimum Viable Product (MVP). It is intended as a practical guide for developers to begin construction.

## 1. MVP Goal and Philosophy

The primary goal of the MVP is to **prove the core security and state-change logic** of the SatsCASH system in a self-contained, local environment. We will simulate all external dependencies to isolate and test the fundamental architecture.

**Key Principles for the MVP:**
*   **Local-First:** The entire system runs on a local PC and Wi-Fi network. No cloud services are required.
*   **Simulated Treasury:** Real Bitcoin and the Lightning network are not used. The "treasury" is a value in the local database.
*   **Focus on the Flow:** The goal is to successfully execute the end-to-end flow from tapping a physical tag to marking it as `spent` in the database.
*   **Security by Separation:** The Mint and Custodian services will be built as two separate, independent applications to enforce the security model from day one.

## 2. System Architecture (MVP)

The MVP consists of four core components running locally.

### 2.1. Physical Hardware
*   **NFC Tag:** NXP NTAG424 DNA (card or sticker format).
*   **NFC Reader:** An Android smartphone or tablet with an NFC chip and a modern web browser (e.g., Chrome).

### 2.2. Mint Service
*   **Technology:** Node.js with Express.js.
*   **Port:** `3001`
*   **Database:** SQLite3 (`mint_database.db`).
*   **Responsibilities:**
    *   Manages the ledger of all coins.
    *   Hosts the public-facing web app for verification.
    *   Hosts the public-facing community dashboard.
    *   Provides the API for coin authentication.

### 2.3. Custodian Service
*   **Technology:** Node.js with Express.js.
*   **Port:** `3002`
*   **Database:** SQLite3 (`custodian_database.db`).
*   **Responsibilities:**
    *   Manages the creation and storage of PINs.
    *   Provides the API for PIN verification.
    *   **Crucially, has no knowledge of coin values or the treasury.**

### 2.4. User Interface (Web App)
*   **Technology:** HTML, CSS, JavaScript.
*   **Hosted on:** The Mint Service (`http://localhost:3001`).
*   **Accessed via:** An Android tablet's web browser over the local Wi-Fi network.
*   **Responsibilities:**
    *   Uses the Web NFC API to read the tag UID.
    *   Provides the UI for verification and spending.

## 3. Database Schemas (SQLite)

### 3.1. Mint Service Database (`mint_database.db`)

**Table: `coins`**
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `nfc_uid` | TEXT | PRIMARY KEY | The 7-byte UID from the NTAG424 tag, stored as a hex string. |
| `value_sats`| INTEGER | NOT NULL | The denomination of the coin in satoshis. |
| `status` | TEXT | NOT NULL | Current state: `minted`, `locked`, `spent`. |
| `pin_hash` | TEXT | NOT NULL | The SHA-256 hash of the PIN, provided by the Custodian. |

### 3.2. Custodian Service Database (`custodian_database.db`)

**Table: `coin_pins`**
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Internal record ID. |
| `nfc_uid` | TEXT | UNIQUE, NOT NULL | The UID this PIN is associated with. |
| `pin` | TEXT | NOT NULL | The plaintext PIN (for MVP simplicity; will be hashed in V1). |

## 4. API Endpoints

### 4.1. Mint Service API (Port 3001)

#### Public Endpoints

`GET /api/v1/public/coin-info`
*   **Purpose:** Public verification of a coin.
*   **Query Params:** `uid` (string, the nfc_uid)
*   **Success Response (200 OK):**
    ```json
    {
      "uid": "041a...",
      "value_sats": 100000,
      "status": "minted"
    }
    ```
*   **Error Response (404 Not Found):**
    ```json
    { "error": "Coin not found" }
    ```

`GET /api/v1/public/dashboard-stats`
*   **Purpose:** Provides data for the community dashboard.
*   **Success Response (200 OK):**
    ```json
    {
      "total_value_minted": 1500000,
      "total_value_in_circulation": 1200000,
      "coins_by_denomination": {
        "10000": 50,
        "100000": 10
      },
      "coins_spent": 5
    }
    ```

#### Private Endpoints

`POST /api/v1/authenticate`
*   **Purpose:** Initiates the spending process.
*   **Request Body:**
    ```json
    {
      "nfc_uid": "041a...",
      "pin": "123456"
    }
    ```
*   **Logic:**
    1.  Find the coin by `nfc_uid`.
    2.  Check if `status` is `minted`.
    3.  Call the Custodian's verification endpoint to check the PIN.
    4.  If PIN is valid, update `status` to `spent`.
    5.  Return a success response.
*   **Success Response (200 OK):**
    ```json
    { "message": "Coin spent successfully." }
    ```
*   **Error Responses (400, 404):**
    ```json
    { "error": "Invalid PIN or coin status." }
    ```

### 4.2. Custodian Service API (Port 3002)

#### Private Endpoints

`POST /api/v1/create-pin`
*   **Purpose:** Called by the Mint service during coin creation.
*   **Request Body:**
    ```json
    { "nfc_uid": "041a..." }
    ```
*   **Logic:**
    1.  Generate a random 6-digit PIN.
    2.  Store the `nfc_uid` and `pin` in the `coin_pins` table.
    3.  Return the hash of the PIN to the Mint.
*   **Success Response (201 Created):**
    ```json
    { "pin_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3" }
    ```

`POST /api/v1/verify-pin`
*   **Purpose:** Called by the Mint service during user authentication.
*   **Request Body:**
    ```json
    {
      "nfc_uid": "041a...",
      "pin_to_check": "123456"
    }
    ```
*   **Logic:**
    1.  Find the record by `nfc_uid`.
    2.  Compare the `pin_to_check` with the stored `pin`.
    3.  Return a boolean result.
*   **Success Response (200 OK):**
    ```json
    { "is_valid": true }
    ```

## 5. User Interface (Web App) Logic

The web app will be a single-page application (`index.html`) served by the Mint service.

### 5.1. NFC Interaction (JavaScript)

```javascript
// Must be served over HTTPS, even with a self-signed cert.
async function startNFCReader() {
  try {
    const ndef = new NDEFReader();
    await ndef.scan();
    ndef.addEventListener("reading", ({ message, serialNumber }) => {
      console.log(`> Serial Number: ${serialNumber}`);
      // `serialNumber` is the nfc_uid we need.
      handleNfcTag(serialNumber);
    });
  } catch (error) {
    console.error("NFC Error:", error);
    alert("NFC is not supported or enabled on this device.");
  }
}
```

### 5.2. Page Structure
*   **Header:** "SatsCASH MVP"
*   **Main Section:**
    *   A "Tap Coin to Verify" button that calls `startNFCReader()`.
    *   A results display area to show coin info (value, status).
    *   A "Spend Coin" button (disabled until a coin is verified).
    *   A PIN input field (hidden until "Spend Coin" is clicked).
*   **Footer:** Link to `/dashboard` for the community dashboard.

### 5.3. Spend Flow Logic
1.  User taps "Spend Coin".
2.  App shows the PIN input field.
3.  User enters PIN and clicks "Confirm".
4.  App makes a `fetch` call to `POST /api/v1/authenticate` with the `nfc_uid` and the entered `pin`.
5.  App displays the success or error message from the server.

## 6. Local Development & Deployment Guide

### 6.1. Prerequisites
*   **Node.js and npm:** Installed on your development PC.
*   **Android Device:** A smartphone or tablet with NFC and a modern browser (Chrome).
*   **NTAG424 DNA Tag:** At least one physical tag for testing.
*   **Code Editor:** VS Code or similar.

### 6.2. Project Setup
1.  Create a main project folder: `mkdir satscash-mvp && cd satscash-mvp`.
2.  Create two subdirectories: `mkdir mint-service && mkdir custodian-service`.
3.  Initialize each as a Node.js project:
    *   `cd mint-service && npm init -y && npm install express sqlite3 cors && cd ..`
    *   `cd custodian-service && npm init -y && npm install express sqlite3 cors && cd ..`

### 6.3. Running the Services
1.  **Start the Custodian Service:**
    *   `cd custodian-service`
    *   `node custodian.js` (This will start the service on `http://localhost:3002`).
2.  **Start the Mint Service:**
    *   `cd mint-service`
    *   `node mint.js` (This will start the service on `http://localhost:3001`).

### 6.4. Minting Your First Test Coin
Since the services are separate, you need a way to create a coin and link it between both databases. A simple Node.js script is sufficient.

**`create-coin.js` (run from the `mint-service` directory):**
```javascript
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

// --- Configuration ---
const MINT_DB_PATH = './mint_database.db';
const CUSTODIAN_API_URL = 'http://localhost:3002';

// --- Test Coin Data ---
const testCoin = {
  nfc_uid: '04A1B2C3D4E5F6', // Replace with a real tag's UID
  value_sats: 100000
};

async function createCoin() {
  console.log('Creating new coin...');

  // 1. Call Custodian to create PIN and get hash
  try {
    const response = await axios.post(`${CUSTODIAN_API_URL}/api/v2/create-pin`, {
      nfc_uid: testCoin.nfc_uid
    });
    const { pin_hash } = response.data;
    console.log(`Custodian created PIN. Hash: ${pin_hash}`);

    // 2. Insert coin into Mint database with the hash
    const db = new sqlite3.Database(MINT_DB_PATH);
    db.serialize(() => {
      db.run("INSERT INTO coins (nfc_uid, value_sats, status, pin_hash) VALUES (?, ?, ?, ?)", [
        testCoin.nfc_uid,
        testCoin.value_sats,
        'minted',
        pin_hash
      ], function(err) {
        if (err) {
          return console.error('Error inserting into Mint DB:', err.message);
        }
        console.log(`Coin successfully minted in Mint database with ID: ${testCoin.nfc_uid}`);
      });
    });
    db.close();

  } catch (error) {
    console.error('Failed to create coin:', error.response ? error.response.data : error.message);
  }
}

createCoin();
```

### 6.5. Accessing the Web App
1.  Find your PC's local IP address (e.g., `192.168.1.15`).
2.  On your Android tablet, connect to the same Wi-Fi network.
3.  Open the Chrome browser and navigate to: `http://<your_pc_ip>:3001`
4.  You will see the SatsCASH web app. Tap the coin to the tablet to begin.

## 7. Next Steps & V1 Considerations

This MVP provides a solid foundation. The path to a production-ready V1 involves replacing simulated components with real-world integrations.

*   **Production Database:** Migrate from SQLite to a more robust database like PostgreSQL.
*   **Real Lightning Treasury:** Replace the simulated treasury with the [Blink API](https://blink.sv/) integration. The `POST /api/v1/authenticate` endpoint will need to be updated to:
    1.  Lock the coin in the database (`status: 'locked'`).
    2.  Call the Blink API to generate a real LNURL-withdraw link.
    3.  Return this link to the web app.
    4.  Implement a webhook endpoint to listen for payment confirmation from Blink to finally set `status: 'spent'`.
*   **Enhanced Security:** The Custodian service should hash the PIN before storing it in the database. The `create-pin` endpoint would return the hash, and the `verify-pin` endpoint would compare hashes, not plaintext.
*   **HTTPS in Production:** For any real deployment, all services must be served over HTTPS with valid SSL certificates.
*   **Error Handling & Logging:** Implement more robust error handling, logging, and monitoring for production stability.



