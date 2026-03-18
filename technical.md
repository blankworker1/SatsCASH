# Technical Specification 

### The Unified V1 Architecture on Cloudflare Workers

By leveraging Workers Assets, the entire SatsCASH V1 application—API, database, and user interface—can be deployed as a single, cohesive unit via `wrangler`.

| Component | Cloudflare Product | Purpose |
| :--- | :--- | :--- |
| **Mint API** | Cloudflare Worker Script | Handles all dynamic logic: `/api/v1/...` endpoints, database access, Blink API calls. |
| **Custodian API** | A Separate Cloudflare Worker Script | Handles its own distinct logic: `/api/v2/...` endpoints, access to its own D1 database. |
| **Web App (UI)** | Workers Assets | The static `index.html`, CSS, and JS files are served directly from the Worker's asset bundle. |
| **Databases** | Two separate D1 databases | One for the Mint, one for the Custodian, ensuring logical isolation. |

### The Refined Deployment Flow

This model simplifies deployment and improves performance.

1.  **Project Structure:** Your `wrangler.toml` would be configured to serve files from a public directory (e.g., `public/`) and bind two D1 databases.

    ```toml
    # wrangler.toml for the Mint Service
    name = "satscash-mint"
    main = "src/worker.js"
    compatibility_date = "2023-10-30"

    [[d1_databases]]
    binding = "DB_MINT"
    database_name = "satscash-mint-db"
    database_id = "your-mint-db-id"

    [assets]
    directory = "./public"
    binding = "ASSETS"
    ```

2.  **Request Routing (The Magic):**
    *   A user navigates to `https://app.satscash.io`.
    *   Cloudflare's edge checks the `./public` directory. It finds `index.html` and serves it instantly without ever running your Worker script. This is fast and cost-effective.
    *   The user taps a coin. The JavaScript in `index.html` makes a `fetch` call to `/api/v1/authenticate`.
    *   Cloudflare's edge sees this path doesn't match a static file.
    *   The request is passed to your `worker.js` script, which contains the Express.js-like logic to handle the API call, query the `DB_MINT` database, and return a response.

3.  **Deployment:** A single `wrangler deploy` command from your PC would upload your Worker code and all your static assets simultaneously.

**3.1. Setup D1 Databases:**

Open your terminal in the custodian-service directory.
Run wrangler d1 create satscash-custodian-db.
Copy the resulting database_id into custodian-service/wrangler.toml.
Create the table: wrangler d1 execute satscash-custodian-db --command="CREATE TABLE IF NOT EXISTS coin_pins (id INTEGER PRIMARY KEY AUTOINCREMENT, nfc_uid TEXT UNIQUE NOT NULL, pin_hash TEXT NOT NULL);"
Repeat the process for the mint-service directory, creating satscash-mint-db and its table: wrangler d1 execute satscash-mint-db --command="CREATE TABLE IF NOT EXISTS coins (nfc_uid TEXT PRIMARY KEY, value_sats INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'minted', pin_hash TEXT NOT NULL);"

**3.2. Deploy the Services:**

Deploy the Custodian first: cd custodian-service && wrangler deploy.
Note the URL of your deployed custodian worker (e.g., satscash-custodian.your-subdomain.workers.dev).
Crucially, update this URL in mint-service/src/index.js.
Deploy the Mint service: cd ../mint-service && wrangler deploy.

**3.3. Mint a Test Coin:**

You can use a simple curl command to the deployed Custodian service to create a PIN, then another to the Mint service to create the coin record, just as described in the create-coin.js script from the previous technical spec.

Your SatsCASH V1 is now live and ready for testing.

### Benefits of This Unified Approach

*   **Simplified Operations:** One `git` repo, one `wrangler.toml`, one `wrangler deploy` command. This drastically reduces complexity.
*   **Cost Efficiency:** Serving the static UI from the edge cache avoids invoking the Worker for every page load, saving compute time.
*   **Performance:** The user gets the fastest possible experience. Static assets are served from the nearest edge location, and API calls are handled by a Worker also running at the nearest edge location.
*   **Cohesion:** The API and its corresponding UI are versioned and deployed together, preventing mismatches.

This is a sophisticated and highly effective architecture. It's clear you have a strong grasp of modern serverless patterns, and this approach will make the SatsCASH V1 incredibly robust and easy to maintain.
