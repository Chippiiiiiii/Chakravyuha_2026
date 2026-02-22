const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// ✅ IMPORTANT: Enable CORS for Render
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ✅ Socket.IO with CORS config
const io = new Server(server, {
    cors: {
        origin: "*",   // For production, replace with your Render URL
        methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
});

// -------------------- STATE --------------------

let teams = {};
let history = [];
let currentRoundBids = {};
let roundNumber = 1;
let timerRunning = false;
let timeLeft = 60;
let showLeaderboard = false;

let initialCapital = 0;
let basePrice = 0;

// -------------------- ROUTES --------------------

// Register team
app.post("/register", (req, res) => {
    const { teamName } = req.body;

    if (!teamName || teams[teamName]) {
        return res.json({ success: false, error: "Invalid or duplicate team" });
    }

    teams[teamName] = {
        capital: initialCapital,
        bid: 0
    };

    io.emit("update", getData());
    res.json({ success: true, capital: initialCapital });
});

// Place bid
app.post("/bid", (req, res) => {
    const { teamName, amount } = req.body;

    if (!teams[teamName])
        return res.json({ error: "Team not registered" });

    if (amount < basePrice)
        return res.json({ error: `Bid must be at least ₹${basePrice}` });

    if (amount > teams[teamName].capital)
        return res.json({ error: "Not enough capital" });

    teams[teamName].bid = amount;
    currentRoundBids[teamName] = amount;

    io.emit("update", getData());
    res.json({ success: true });
});

// Save settings
app.post("/settings", (req, res) => {
    const { capital, roundTime, basePrice: bp } = req.body;

    initialCapital = capital || 0;
    timeLeft = roundTime || 60;
    basePrice = bp || 0;

    io.emit("update", getData());
    res.json({ success: true });
});

// Start round
app.post("/start", (req, res) => {
    timerRunning = true;
    timeLeft = timeLeft || 60;

    currentRoundBids = {};

    for (let t in teams) {
        teams[t].bid = 0;
    }

    io.emit("update", getData());
    res.json({ success: true });
});

// End round
app.post("/end", (req, res) => {
    endRoundLogic();
    res.json({ success: true });
});

// Toggle leaderboard
app.post("/toggleLeaderboard", (req, res) => {
    showLeaderboard = !showLeaderboard;
    io.emit("update", getData());
    res.json({ success: true });
});

// -------------------- ROUND LOGIC --------------------

function endRoundLogic() {
    timerRunning = false;

    const roundBids = Object.entries(currentRoundBids).map(
        ([team, bid], index) => ({
            teamNo: index + 1,
            team,
            bid
        })
    );

    const sorted = Object.entries(currentRoundBids)
        .sort((a, b) => b[1] - a[1]);

    let winner = sorted[0];

    if (winner) {
        const [winnerName, winningBid] = winner;

        teams[winnerName].capital -= winningBid;
        if (teams[winnerName].capital < 0)
            teams[winnerName].capital = 0;

        history.push({
            round: roundNumber,
            team: winnerName,
            bid: winningBid,
            allBids: roundBids
        });
    } else {
        history.push({
            round: roundNumber,
            team: null,
            bid: 0,
            allBids: roundBids
        });
    }

    // Reset bids
    for (let t in teams) {
        teams[t].bid = 0;
    }

    currentRoundBids = {};
    roundNumber++;

    io.emit("update", getData());
}

// -------------------- LEADERBOARD --------------------

function calculateLeaderboard() {
    let leaderboard = {};

    history.forEach(h => {
        if (h.team) {
            leaderboard[h.team] =
                (leaderboard[h.team] || 0) + 1;
        }
    });

    return Object.entries(leaderboard)
        .map(([team, wins], index) => ({
            teamNo: index + 1,
            team,
            wins
        }));
}

// -------------------- STATE DATA --------------------

function getData() {
    return {
        teams,
        history,
        roundNumber,
        timerRunning,
        timeLeft,
        basePrice,
        leaderboard: calculateLeaderboard(),
        showLeaderboard
    };
}

// -------------------- TIMER --------------------

setInterval(() => {
    if (timerRunning && timeLeft > 0) {
        timeLeft--;
        io.emit("update", getData());

        if (timeLeft === 0) {
            endRoundLogic();
        }
    }
}, 1000);

// -------------------- ROOT --------------------

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------- START SERVER --------------------

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
