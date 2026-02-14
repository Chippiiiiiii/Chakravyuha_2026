const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

let teams = {};
let history = [];
let currentRoundBids = {};
let roundNumber = 1;
let timerRunning = false;
let timeLeft = 60;

// Admin settings
let initialCapital = 0;
let basePrice = 0;

// Register team
app.post("/register", (req, res) => {
    const { teamName } = req.body;
    if (!teamName || teams[teamName]) {
        return res.json({ success: false, error: "Invalid or duplicate team" });
    }
    teams[teamName] = { capital: initialCapital, bid: 0 };
    io.emit("update", getData());
    res.json({ success: true });
});

// Place bid
app.post("/bid", (req, res) => {
    const { teamName, amount } = req.body;
    if (!teams[teamName]) return res.json({ error: "Team not registered" });
    if (amount < basePrice) return res.json({ error: `Bid must be at least ₹${basePrice}` });
    if (amount > teams[teamName].capital) return res.json({ error: "Not enough capital" });

    teams[teamName].bid = amount;
    currentRoundBids[teamName] = amount;
    io.emit("update", getData());
    res.json({ success: true });
});

// Save settings
app.post("/settings", (req, res) => {
    const { capital, roundTime, basePrice: bp } = req.body;
    initialCapital = capital;
    timeLeft = roundTime;
    basePrice = bp;
    io.emit("update", getData());
    res.json({ success: true });
});

// Start round
app.post("/start", (req, res) => {
    timerRunning = true;
    currentRoundBids = {};
    for (let t in teams) teams[t].bid = 0;
    io.emit("update", getData());
    res.json({ success: true });
});

// End round
app.post("/end", (req, res) => {
    endRoundLogic();
    res.json({ success: true });
});

// Round end logic
function endRoundLogic() {
    timerRunning = false;

    const roundBids = Object.entries(currentRoundBids).map(([team, bid], index) => ({
        teamNo: index + 1,
        team,
        bid
    }));

    let winner = Object.entries(currentRoundBids).sort((a,b)=>b[1]-a[1])[0];

    if (winner) {
        const [winnerName, winningBid] = winner;
        if (teams[winnerName]) {
            teams[winnerName].capital -= winningBid;
            if (teams[winnerName].capital < 0) teams[winnerName].capital = 0;
        }
        history.push({ round: roundNumber, team: winnerName, bid: winningBid, allBids: roundBids });
    } else {
        history.push({ round: roundNumber, team: null, bid: 0, allBids: roundBids });
    }

    for (let t in teams) {
        teams[t].bid = 0;
    }
    currentRoundBids = {};

    roundNumber++;
    io.emit("update", getData());
}

// Helper: calculate leaderboard
function calculateLeaderboard() {
    let leaderboard = {};
    history.forEach(h => {
        if (h.team) {
            leaderboard[h.team] = (leaderboard[h.team] || 0) + 1;
        }
    });

    return Object.entries(leaderboard).map(([team, wins], index) => ({
        teamNo: index + 1,
        team,
        wins
    }));
}

// Helper: current state
function getData() {
    return {
        teams,
        history,
        currentRoundBids,
        roundNumber,
        timerRunning,
        timeLeft,
        highestTeam: Object.keys(currentRoundBids).length
            ? Object.entries(currentRoundBids).sort((a,b)=>b[1]-a[1])[0][0]
            : null,
        basePrice,
        leaderboard: calculateLeaderboard()
    };
}

// Timer countdown
setInterval(() => {
    if (timerRunning && timeLeft > 0) {
        timeLeft--;
        io.emit("update", getData());
        if (timeLeft === 0) {
            endRoundLogic();
        }
    }
}, 1000);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
