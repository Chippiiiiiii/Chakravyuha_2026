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

    if (data.error) {
        alert(data.error);
    } else {
        alert("Bid placed!");
    }
}

async function loadData() {
    const res = await fetch("/data");
    const data = await res.json();

    if (document.getElementById("highest")) {
        document.getElementById("highest").innerText =
            "Highest Bid: ₹" + data.highestBid + " (" + data.highestTeam + ")";

        const teamsDiv = document.getElementById("teams");
        teamsDiv.innerHTML = "";

        for (let team in data.teams) {
            teamsDiv.innerHTML += `
                <div class="team-box">
                    <h3>${team}</h3>
                    <p>Capital: ₹${data.teams[team].capital}</p>
                    <p>Current Bid: ₹${data.teams[team].bid}</p>
                </div>
            `;
        }
    }

    if (document.getElementById("teamInfo")) {
        const teamName = document.getElementById("teamName").value;
        if (data.teams[teamName]) {
            document.getElementById("teamInfo").innerHTML = `
                <h3>${teamName}</h3>
                <p>Remaining Capital: ₹${data.teams[teamName].capital}</p>
                <p>Highest Bid: ₹${data.highestBid}</p>
            `;
        }
    }
}

async function endAuction() {
    await fetch("/end", { method: "POST" });
    alert("Auction ended!");
}

setInterval(loadData, 1000);
