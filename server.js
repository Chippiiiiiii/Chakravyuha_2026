const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================= AUCTION DATA =================

let auction = {
    basePrice: 0,
    highestBid: 0,
    highestTeam: null,
    teams: {},
    initialCapital: 0,
    roundTime: 60,
    timeLeft: 60,
    timerRunning: false,
    history: [],
    roundDetails: [],
    roundNumber: 0
};

// ================= ROUTES =================

// Team Page
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// Admin Page
app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/public/admin.html");
});

// ================= REGISTER TEAM =================

app.post("/register", (req, res) => {

    const { teamName } = req.body;

    if (!teamName) {
        return res.json({ error: "Team name required" });
    }

    if (!auction.teams[teamName]) {
        auction.teams[teamName] = {
            capital: auction.initialCapital,
            bid: 0
        };
    }

    res.json({ success: true });
});

// ================= SETTINGS =================

app.post("/settings", (req, res) => {

    const { basePrice, capital, roundTime } = req.body;

    auction.basePrice = basePrice;
    auction.initialCapital = capital;
    auction.roundTime = roundTime;
    auction.timeLeft = roundTime;

    res.json({ success: true });
});

// ================= START ROUND =================

app.post("/start", (req, res) => {

    if (auction.timerRunning) {
        return res.json({ error: "Round already running" });
    }

    auction.roundNumber++;
    auction.highestBid = 0;
    auction.highestTeam = null;
    auction.timeLeft = auction.roundTime;
    auction.timerRunning = true;

    const interval = setInterval(() => {

        auction.timeLeft--;

        if (auction.timeLeft <= 0) {
            clearInterval(interval);
            auction.timerRunning = false;
            endRound();
        }

    }, 1000);

    res.json({ success: true });
});

// ================= PLACE BID =================

app.post("/bid", (req, res) => {

    const { teamName, amount } = req.body;

    if (!auction.timerRunning)
        return res.json({ error: "Round not active" });

    if (!auction.teams[teamName])
        return res.json({ error: "Team not registered" });

    if (amount < auction.basePrice)
        return res.json({ error: "Below base price" });

    if (amount <= auction.highestBid)
        return res.json({ error: "Bid must be higher than current highest bid" });

    if (amount > auction.teams[teamName].capital)
        return res.json({ error: "Not enough capital" });

    auction.highestBid = amount;
    auction.highestTeam = teamName;
    auction.teams[teamName].bid = amount;

    res.json({ success: true });
});

// ================= END ROUND =================

function endRound() {

    if (!auction.highestTeam) return;

    // Save winner summary
    auction.history.push({
        team: auction.highestTeam,
        bid: auction.highestBid
    });

    // Save full round details
    let roundData = {
        round: auction.roundNumber,
        bids: []
    };

    let teamNo = 1;

    for (let team in auction.teams) {

        roundData.bids.push({
            teamNo: teamNo,
            team: team,
            bid: auction.teams[team].bid
        });

        teamNo++;
    }

    auction.roundDetails.push(roundData);

    // Deduct winner capital
    auction.teams[auction.highestTeam].capital -= auction.highestBid;

    // Reset bids
    for (let team in auction.teams) {
        auction.teams[team].bid = 0;
    }

    auction.highestBid = 0;
    auction.highestTeam = null;
}

app.post("/end", (req, res) => {
    endRound();
    auction.timerRunning = false;
    res.json({ success: true });
});

// ================= GET DATA =================

app.get("/data", (req, res) => {
    res.json(auction);
});

// ================= START SERVER =================

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
