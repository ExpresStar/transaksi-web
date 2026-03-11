const express = require('express');
const cors = require('cors');
const path = require('path');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const app = express();
app.use(cors());
app.use(express.json());

// Request logging to help debug
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Admin Credentials & 2FA Secret
// In production, these should be in a database or environment variables
const ADMIN_CREDENTIALS = {
    username: 'bobi908',
    password: 'ytr908',
    // We generate a static secret base32 string so it remains consistent across restarts
    // Generated via speakeasy.generateSecret({ name: 'TransWeb' })
    secretBase32: 'JFBVIOLNKBEEKVKEJFJEQUCNKVHEIVCDKRHUITKVINHVORKLIFYA'
};

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files (for index.html, style.css, script.js)
app.use(express.static(__dirname));

// Serve /public folder → /logos/*.svg accessible as /logos/mb.svg etc.
app.use(express.static(path.join(__dirname, 'public')));

/* =========================================================
   SECURITY & AUTHENTICATION ENDPOINTS
   ========================================================= */

// Serve a page for the admin to scan their Google Authenticator QR Code
app.get('/setup-2fa', (req, res) => {
    // Generate the otpauth URL for Google Authenticator
    const otpauth_url = `otpauth://totp/TransWeb%20Admin%20(%E6%B3%A2%E6%AF%94)?secret=${ADMIN_CREDENTIALS.secretBase32}`;
    
    QRCode.toDataURL(otpauth_url, (err, data_url) => {
        if (err) {
            return res.status(500).send('Error generating QR code.');
        }
        res.send(`
            <div style="text-align:center; padding: 50px; font-family: sans-serif;">
                <h1>Google Authenticator Setup</h1>
                <p>Scan this QR Code with your Google Authenticator App.</p>
                <img src="${data_url}" alt="QR Code" style="width: 250px; height: 250px;">
                <p>Secret Manual Key (if needed): <strong>${ADMIN_CREDENTIALS.secretBase32}</strong></p>
                <br>
                <a href="/" style="display:inline-block; padding: 10px 20px; background:#409EFF; color:white; text-decoration:none; border-radius:4px;">Back to Login</a>
            </div>
        `);
    });
});

// Admin Login Endpoint
app.post('/login', (req, res) => {
    const { username, password, securityCode } = req.body;

    if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
        return res.status(401).json({ success: false, message: 'Invalid Username or Password' });
    }

    if (!securityCode) {
        return res.status(401).json({ success: false, message: 'Security Code is required' });
    }

    // Verify 6-digit TOTP code
    const verified = speakeasy.totp.verify({
        secret: ADMIN_CREDENTIALS.secretBase32,
        encoding: 'base32',
        token: securityCode,
        window: 1 // Allow 30 seconds drift either way
    });

    if (verified) {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Security Code' });
    }
});

// Static files (for index.html, style.css, script.js)
app.use(express.static(__dirname));

// Serve /public folder → /logos/*.svg accessible as /logos/mb.svg etc.
app.use(express.static(path.join(__dirname, 'public')));

/* =========================================================
   1. REALISTIC VIETNAM DATA GENERATOR
   ========================================================= */
const usedNames = new Set();
const lastNames = ["Nguyen","Tran","Le","Pham","Hoang","Vo","Bui","Doan","Truong","Dang","Do","Duong","Ly","Ngo","Dinh","Vu","Phan","Huynh","Trinh","Mai"];
const maleMiddle = ["Van","Duc","Quoc","Thanh","Minh","Gia","Cong","Huu","Xuan","Bao"];
const femaleMiddle = ["Thi","Ngoc","Kim","Thu","My","Lan","Bich","Phuong","Anh","Thanh"];
const maleFirst = ["Huy","Tien","Khoa","Bao","Hung","Dat","Nam","Long","Tuan","Phuc","Tri","Viet","Son","Kiet","Hai","Thinh","Cuong","An","Hoang","Linh"];
const femaleFirst = ["Mai","Lan","Thao","Huong","Trang","Anh","Ngan","Vy","Chau","Linh","Trinh","Hoa","My","Hanh","Quynh","Dieu","Bich","Yen","Ngoc","Tam"];

function generateVietnameseName() {
    let name;
    do {
        const last = lastNames[Math.floor(Math.random()*lastNames.length)];
        const isMale = Math.random() > 0.5;
        const middle = isMale
            ? maleMiddle[Math.floor(Math.random()*maleMiddle.length)]
            : femaleMiddle[Math.floor(Math.random()*femaleMiddle.length)];
        const first = isMale
            ? maleFirst[Math.floor(Math.random()*maleFirst.length)]
            : femaleFirst[Math.floor(Math.random()*femaleFirst.length)];
        name = `${last} ${middle} ${first}`.toUpperCase(); // uppercase for bank standard
    } while (usedNames.has(name) && usedNames.size < 8000); // safety catch
    usedNames.add(name);
    return name;
}

const usedAmounts = new Set();
function generateUniqueAmount() {
    let amount;
    do {
        amount = Math.floor(Math.random() * 90 + 10) * 10000;
    } while (usedAmounts.has(amount) && usedAmounts.size < 90);
    usedAmounts.add(amount);
    return amount;
}

const banks = ["MB", "BIDV", "VCB", "TCB", "AGRI", "VPB"];

function generateRandomNumberString(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10).toString();
    }
    return result;
}

/* =========================================================
   2. IN-MEMORY GLOBAL QUEUE SYSTEM
   ========================================================= */
let globalQueue = [];
let autoIncrementId = 1;

// 1. GLOBAL TIME CONFIG (for backlog/live separation)
let lastBacklogCursor = Date.now();

// 2. HELPER: CEK KONDISI WAKTU
function getTrafficMultiplier(date) {
    const hour = date.getHours();
    const day = date.getDay(); // 0=Sunday
    let multiplier = 1;

    if (day === 0 || day === 6) multiplier *= 1.8; // Weekend
    if (hour >= 9 && hour <= 11) multiplier *= 0.6; // Morning Peak
    if (hour >= 14 && hour <= 16) multiplier *= 0.7; // Afternoon Peak
    if (hour === 12) multiplier *= 2.2; // Lunch Slowdown
    if (hour >= 23 || hour <= 5) multiplier *= 3; // Night Sleep

    return multiplier;
}

// 3. TRANSACTION FACTORY
function createNewTransaction(specificTime = null) {
    // If no specificTime provided, it's a "Live" hit at the current moment
    const createdTime = specificTime || new Date();
    
    // Natural bank processing delays (5s to 60s)
    const allowDelays = [5, 7, 20, 60];
    const allowDelay = allowDelays[Math.floor(Math.random() * allowDelays.length)];
    const allowTime = new Date(createdTime.getTime() + (allowDelay * 1000));

    const newTx = {
        id: autoIncrementId++,
        order_no: generateRandomNumberString(18),
        recharge_no: generateRandomNumberString(18),
        receiver_name: generateVietnameseName(),
        card_number: generateRandomNumberString(10),
        bank_name: banks[Math.floor(Math.random() * banks.length)],
        amount: generateUniqueAmount(),
        created_at: createdTime.toISOString(),
        allow_transfer_time: allowTime.toISOString(),
        status: 'pending',
        admin_note: null,
        failureReason: null,
        isCorrupted: Math.random() < 0.03,
        approvedBy: null,
        approvedAt: null
    };

    // Unshift adds to the beginning: currentQueue will be [newest, ..., oldest]
    globalQueue.unshift(newTx);
    if (globalQueue.length > 5000) globalQueue.pop();
}

// 4. GENERATE BACKLOG (Going backwards from now)
// Create 200 items in the past hour
let backlogCursorTime = Date.now();
for (let i = 0; i < 200; i++) {
    const cursorDate = new Date(backlogCursorTime);
    const m = getTrafficMultiplier(cursorDate);
    const gap = (15000 + Math.random() * 20000) * m; // 15-35s gaps
    
    // Bergerak ke BELAKANG (masa lalu)
    backlogCursorTime -= gap;
    createNewTransaction(new Date(backlogCursorTime));
}

// 5. LIVE TRAFFIC GENERATOR — probabilistic delay distribution
function startLiveTraffic() {
    const rand = Math.random();
    let delay;

    if (rand < 0.50) {
        // 50% → cepat: 2–5 detik
        delay = (Math.random() * 3 + 2) * 1000;
    } else if (rand < 0.85) {
        // 35% → sedang: 5–10 detik
        delay = (Math.random() * 5 + 5) * 1000;
    } else {
        // 15% → lambat: 10–15 detik
        delay = (Math.random() * 5 + 10) * 1000;
    }

    setTimeout(() => {
        createNewTransaction(); // Uses exactly Date.now()
        startLiveTraffic();     // Recursively schedule next
    }, delay);
}
// Start the live engine
startLiveTraffic();


/* =========================================================
   2b. AUTO PROCESS: 5% FAILURE SIMULATION (every 15s)
   ========================================================= */

const failureReasons = [
    'Bank verification failed',
    'Account temporarily locked',
    'Insufficient daily limit',
    'Suspicious activity detected',
    'Card issuer declined'
];

setInterval(() => {
    const now = Date.now();
    globalQueue.forEach(tx => {
        if (tx.status === 'pending') {
            const diffMinutes = (now - new Date(tx.created_at)) / 60000;
            // Auto-process after 30–60 random minutes (Increased so items don't vanish too fast)
            if (diffMinutes >= 30 + Math.random() * 30) {
                if (Math.random() < 0.05) {
                    // 5% → auto-rejected
                    tx.status = 'rejected';
                    tx.failureReason = failureReasons[Math.floor(Math.random() * failureReasons.length)];
                } else {
                    // 95% → auto-approved
                    tx.status = 'approved';
                }
                tx.updated_at = new Date().toISOString();
            }
        }
    });
}, 15000);

/* =========================================================
   2c. BOT COMPETITION SYSTEM
   Bots vigorously compete with the user to approve orders
   ========================================================= */
const botNames = [
    'anan75', 'xiaoting99', 'xiaoxian98', 'yaer78'
];

function botTick(botId) {
    const now = Date.now();
    // Sort Oldest First (ASC) so index 0 is the absolute oldest transaction, same as what the user sees at the top of the table.
    const readyTxs = globalQueue
        .filter(tx => tx.status === 'pending')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (readyTxs.length > 0) {
        // LOWER chance to snatch (less aggressive)
        if (Math.random() < 0.2) { // Reduced from 0.8
            // Target OLDEST items (slice the first 10 items of the ASC list)
            const oldestSubset = readyTxs.slice(0, 10);
            
            // Randomly select one from the top 10 oldest (which are displayed at the very top of the table)
            const randomIndex = Math.floor(Math.random() * oldestSubset.length);
            const tx = oldestSubset[randomIndex];
            
            tx.status = 'approved';
            tx.approvedBy = botNames[botId];
            tx.approvedAt = new Date().toISOString();
            tx.updated_at = new Date().toISOString();
        }
    }

    // Randomize next tick to simulate realistic human speeds:
    // (5 to 15 seconds) - Much slower than before
    const nextDelay = Math.random() * 10000 + 5000;
    
    setTimeout(() => botTick(botId), nextDelay);
}

// Start 4 independent parallel bot workers (reduced from 6)
for (let i = 0; i < 4; i++) {
    // Stagger startup significantly
    const initialDelay = (i * 3000) + (Math.random() * 2000);
    setTimeout(() => botTick(i), initialDelay);
}

/* =========================================================
   3. API ENDPOINTS
   ========================================================= */

// Get all transactions (pending ONLY as requested)
app.get('/transactions', (req, res) => {
    const filtered = globalQueue
        .filter(tx => tx.status === 'pending')
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // ASC (oldest first)
    res.json({ success: true, data: filtered });
});

// Get recent approvals for Live Feed
app.get('/recent-approvals', (req, res) => {
    const recent = globalQueue
        .filter(tx => tx.status === 'approved' && tx.approvedBy)
        .sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime())
        .slice(0, 10);
    res.json({ success: true, data: recent });
});

// Approve Transaction — FIRST APPROVE WINS
app.post('/transactions/:id/approve', (req, res) => {
    const { id } = req.params;
    const { admin_note, username } = req.body;
    const tx = globalQueue.find(tx => tx.id === parseInt(id));

    if (!tx) {
        return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    // Race condition: already approved by someone else
    if (tx.approvedBy) {
        return res.json({
            success: false,
            alreadyTaken: true,
            takenBy: tx.approvedBy,
            message: '此订单已被处理'
        });
    }

    tx.status = 'approved';
    tx.admin_note = admin_note || null;
    tx.approvedBy = username || 'anonymous';
    tx.approvedAt = new Date().toISOString();
    tx.updated_at = new Date().toISOString();

    res.json({ success: true, message: '处理成功', approvedBy: tx.approvedBy });
});

// Reject Transaction
app.post('/transactions/:id/reject', (req, res) => {
    const { id } = req.params;
    const { admin_note, username } = req.body;
    const tx = globalQueue.find(tx => tx.id === parseInt(id));

    if (!tx) {
        return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }
    if (tx.approvedBy) {
        return res.json({ success: false, alreadyTaken: true, takenBy: tx.approvedBy, message: '此订单已被处理' });
    }

    tx.status = 'rejected';
    tx.admin_note = admin_note || null;
    tx.updated_at = new Date().toISOString();

    res.json({ success: true, message: '处理成功' });
});

/* =========================================================
   4b. APPROVAL HISTORY ROUTES
   ========================================================= */

// GET /approval-history
app.get('/approval-history', (req, res) => {
    // Get all approved transactions, sorted newest first
    const approved = globalQueue
        .filter(tx => tx.approvedBy)
        .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt));

    res.render('history/leaderboard', { transactions: approved, total: approved.length });
});

// GET /approval-history/:username — per-user transaction list
app.get('/approval-history/:username', (req, res) => {
    const { username } = req.params;
    const userTx = globalQueue
        .filter(tx => tx.approvedBy === username)
        .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt));
    res.render('history/user', { username, transactions: userTx, total: userTx.length });
});

/* =========================================================
   4. DYNAMIC DETAIL PAGE (EJS)
   ========================================================= */

/**
 * Mutates a COPY of transaction data for anomaly simulation.
 * Only affects the detail page — original queue data is untouched.
 * 3% of transactions are flagged isCorrupted = true.
 */
function mutateTransactionData(tx) {
    const clone = { ...tx }; // shallow copy — never mutate the queue
    const anomalyType = Math.floor(Math.random() * 4);
    switch (anomalyType) {
        case 0: clone.bank_name = 'UNKNOWN BANK';        break;
        case 1: clone.amount += 100000;                  break;
        case 2: clone.receiver_name = 'SYSTEM ERROR USER'; break;
        case 3: clone.bank_name = 'GLOBAL FINANCE LTD'; break;
    }
    return clone;
}

app.get('/transaction-detail/:id', (req, res) => {
    const { id } = req.params;
    const raw = globalQueue.find(tx => tx.id === parseInt(id));
    
    if (!raw) {
        return res.status(404).send('Transaction not found or already processed.');
    }

    // Apply anomaly mutation on detail page only (original data stays clean)
    const transaction = raw.isCorrupted ? mutateTransactionData(raw) : { ...raw };

    // Determine which EJS template to use (fallback to mb if unknown bank)
    const knownBanks = ['mb', 'bidv', 'vcb', 'tcb', 'agri', 'vpb'];
    const bankTag = transaction.bank_name.toLowerCase();
    const template = knownBanks.includes(bankTag) ? bankTag : raw.bank_name.toLowerCase();

    try {
        res.render(`receipts/${template}`, { transaction });
    } catch (error) {
        res.status(500).send('Receipt template not found for bank: ' + transaction.bank_name);
    }
});


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with In-Memory Queue (Tick: 5s)`);
});
