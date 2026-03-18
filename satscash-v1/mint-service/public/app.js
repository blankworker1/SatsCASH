document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sections = {
        tap: document.getElementById('tap-section'),
        result: document.getElementById('result-section'),
        spend: document.getElementById('spend-section'),
    };

    const buttons = {
        startScan: document.getElementById('start-scan-btn'),
        spendCoin: document.getElementById('spend-coin-btn'),
        scanAnother: document.getElementById('scan-another-btn'),
        confirmSpend: document.getElementById('confirm-spend-btn'),
        cancelSpend: document.getElementById('cancel-spend-btn'),
    };

    const displays = {
        nfcStatus: document.getElementById('nfc-status'),
        coinInfo: document.getElementById('coin-info'),
        coinInfoSpend: document.getElementById('coin-info-spend'),
        spendStatus: document.getElementById('spend-status'),
        pinInput: document.getElementById('pin-input'),
    };

    let currentCoinData = null;
    let ndefReader = null;

    // --- Section Switching ---
    function showSection(sectionKey) {
        Object.values(sections).forEach(s => s.classList.remove('active'));
        sections[sectionKey].classList.add('active');
    }

    // --- UI Feedback ---
    function setStatus(element, message, type = 'info') {
        element.textContent = message;
        element.className = `status-box ${type}`;
        element.classList.remove('hidden');
    }

    function hideStatus(element) {
        element.classList.add('hidden');
    }

    function displayCoinInfo(element, data) {
        const statusClass = data.status === 'minted' ? 'success' : 'error';
        element.innerHTML = `
            <p><strong>UID:</strong> ${data.uid}</p>
            <p><strong>Value:</strong> <span class="coin-value">${data.value_sats.toLocaleString()} sats</span></p>
            <p><strong>Status:</strong> <span class="coin-status">${data.status}</span></p>
        `;
        element.className = `info-box ${statusClass}`;
    }

    // --- NFC Logic ---
    async function startNFCScan() {
        if (!("NDEFReader" in window)) {
            setStatus(displays.nfcStatus, "NFC is not supported on this device.", "error");
            return;
        }

        try {
            ndefReader = new NDEFReader();
            await ndefReader.scan();
            setStatus(displays.nfcStatus, "Scanner is active. Tap a coin now.", "success");
            buttons.startScan.disabled = true;

            ndefReader.addEventListener("reading", ({ message, serialNumber }) => {
                console.log(`> UID Scanned: ${serialNumber}`);
                if (serialNumber) {
                    handleNFCScan(serialNumber);
                }
            });

        } catch (error) {
            console.error("NFC Error:", error);
            setStatus(displays.nfcStatus, `NFC Scan failed: ${error.message}`, "error");
            buttons.startScan.disabled = false;
        }
    }

    async function handleNFCScan(uid) {
        setStatus(displays.nfcStatus, `Verifying coin ${uid}...`, "info");
        try {
            const response = await fetch(`/api/v1/public/coin-info?uid=${uid}`);
            const data = await response.json();

            if (response.ok) {
                currentCoinData = data;
                displayCoinInfo(displays.coinInfo, data);
                showSection('result');
                // Disable spend button if not minted
                buttons.spendCoin.disabled = data.status !== 'minted';
            } else {
                setStatus(displays.nfcStatus, `Error: ${data.error}`, "error");
            }
        } catch (error) {
            setStatus(displays.nfcStatus, `Network error: ${error.message}`, "error");
        }
    }

    // --- Spend Logic ---
    async function confirmSpend() {
        const pin = displays.pinInput.value;
        if (!pin || pin.length !== 6) {
            setStatus(displays.spendStatus, "Please enter a valid 6-digit PIN.", "error");
            return;
        }

        setStatus(displays.spendStatus, "Authorizing spend...", "info");
        buttons.confirmSpend.disabled = true;

        try {
            const response = await fetch('/api/v1/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nfc_uid: currentCoinData.uid,
                    pin: pin,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setStatus(displays.spendStatus, result.message, "success");
                // Reset and go back to start after a delay
                setTimeout(() => {
                    resetToStart();
                }, 3000);
            } else {
                setStatus(displays.spendStatus, `Error: ${result.error}`, "error");
                buttons.confirmSpend.disabled = false;
            }
        } catch (error) {
            setStatus(displays.spendStatus, `Network error: ${error.message}`, "error");
            buttons.confirmSpend.disabled = false;
        }
    }

    function resetToStart() {
        currentCoinData = null;
        displays.pinInput.value = '';
        hideStatus(displays.nfcStatus);
        hideStatus(displays.spendStatus);
        buttons.startScan.disabled = false;
        buttons.spendCoin.disabled = true;
        if (ndefReader) {
            // How to properly stop scanning is browser dependent, but creating a new instance is a safe way to reset.
            ndefReader = null; 
        }
        showSection('tap');
    }

    // --- Event Listeners ---
    buttons.startScan.addEventListener('click', startNFCScan);
    buttons.spendCoin.addEventListener('click', () => {
        displayCoinInfo(displays.coinInfoSpend, currentCoinData);
        showSection('spend');
    });
    buttons.scanAnother.addEventListener('click', resetToStart);
    buttons.cancelSpend.addEventListener('click', resetToStart);
    buttons.confirmSpend.addEventListener('click', confirmSpend);

    // Initial state
    resetToStart();
});
