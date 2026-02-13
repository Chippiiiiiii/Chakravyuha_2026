async function register() {
    const teamName = document.getElementById("teamName").value;

    await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName })
    });

    alert("Registered!");
}

async function bid() {
    const teamName = document.getElementById("teamName").value;
    const amount = parseInt(document.getElementById("bidAmount").value);

    const res = await fetch("/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, amount })
    });

    const data = await res.json();
    if (data.error) alert(data.error);
}

async function saveSettings() {
    const basePrice = parseInt(document.getElementById("basePrice").value);
    const capital = parseInt(document.getElementById("capital").value);
    const roundTime = parseInt(document.getElementById("roundTime").value);

    await fetch("/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basePrice, capital, roundTime })
    });

    alert("Settings Saved");
}

async function startRound() {
    await fetch("/start", { method: "POST" });
}

async function endRound() {
    await fetch("/end", { method: "POST" });
}

async function loadData() {
    const res = await fetch("/data");
    const data = await res.json();

    // ADMIN PAGE
    if (document.getElementById("teamsAdmin")) {
        document.getElementById("timer").innerText =
            "Time Left: " + data.timeLeft + "s";

        let html = "";
        for (let team in data.teams) {
            html += `
                <div class="team-box">
                    <h3>${team}</h3>
                    <p>Capital: ₹${data.teams[team].capital}</p>
                    <p>Current Bid: ₹${data.teams[team].bid}</p>
                </div>
            `;
        }

        document.getElementById("teamsAdmin").innerHTML =
            `<div class="row-container">${html}</div>`;
    }

    // TEAM PAGE
    if (document.getElementById("teamsRow")) {

        let html = "";
        for (let team in data.teams) {
            html += `
                <div class="team-box">
                    <h3>${team}</h3>
                    <p>Capital: ₹${data.teams[team].capital}</p>
                    <p>Your Current Bid: ₹${data.teams[team].bid}</p>
                </div>
            `;
        }

        document.getElementById("teamsRow").innerHTML =
            `<div class="row-container">${html}</div>`;

        if (data.roundEnded) {
            document.getElementById("resultBox").innerHTML = `
                <h2>Winner: ${data.lastWinner || "No Winner"}</h2>
                <h3>Winning Bid: ₹${data.lastWinningBid}</h3>
            `;
        } else {
            document.getElementById("resultBox").innerHTML = "";
        }
    }
}

setInterval(loadData, 1000);
