const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initial = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("running at http://localhost:3000/");
    });
  } catch (e) {
    console.log("error");
    process.exit(1);
  }
};
initial();
const convertPlayer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatch = (dbObject) => {
  return {
    playerNatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const query = `select * from player_details;`;
  const res = await db.all(query);
  response.send(res.map((eachplayer) => convertPlayer(eachplayer)));
});
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const query = `select * from player_details where player_id=${playerId};`;
  const res = await db.get(query);
  response.send(convertPlayer(res));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const query = `update player_details set player_name='${playerName}' where 
    player_id=${playerId};`;
  await db.run(query);
  response.send("Player Details Updated");
});
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const query = `select * from match_details where match_id=${matchId};`;
  const res = await db.get(query);
  response.send(convertMatch(res));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `select match_details.match_id,
    match_details.match,
    match_details.year
     from match_details inner join player_match_score on match_details.match_id=player_match_score.match_id
    where player_match_score.player_id=${playerId};`;
  const res = await db.all(query);
  response.send(res.map((eachquery) => convertMatch(eachquery)));
});
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `select player_details.player_id,
    player_details.player_name from player_details inner join player_match_score 
    on player_details.player_id=player_match_score.player_id where 
    player_match_score.match_id=${matchId};`;
  const res = await db.all(query);
  response.send(res.map((eachquery) => convertPlayer(eachquery)));
});
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const query = `select player_details.player_id as playerId,
    player_details.player_name as playerName,sum(player_match_score.score) as totalScore,
    sum(player_match_score.fours) as totalFours,
    sum(player_match_score.sixes)as totalSixes  from player_details inner join player_match_score on 
    player_details.player_id=player_match_score.player_id where player_details.player_id=${playerId};`;
  const res = await db.get(query);
  response.send(res);
});
module.exports = app;
