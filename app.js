const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const InitializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`server is running on http://localhost:3000`);
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
    process.exit(1);
  }
};

InitializeDBAndServer();

app.get("/states", async (request, response) => {
  const getStatesQuery = `select * from state order by state_id;`;
  const dbStates = await db.all(getStatesQuery);
  response.send(dbStates);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailQuery = `select * from state where state_id = ?;`;
  const dbStateDetail = await db.get(getStateDetailQuery, [stateId]);
  response.send(dbStateDetail);
});

app.post("/districts", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
                            values(?,?,?,?,?,?);`;
  const district = await db.run(
    addDistrictQuery,
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths
  );
  response.send("District Added Successfully");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `select * from district where district_id=?;`;
  const district = await db.get(getDistrictQuery, districtId);
  response.send(district);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `delete from district where district_id=?;`;
  await db.run(deleteDistrictQuery, districtId);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrictQuery = `
    UPDATE district
    SET 
      district_name = ?, 
      state_id = ?, 
      cases = ?, 
      cured = ?, 
      active = ?, 
      deaths = ?
    WHERE 
      district_id = ?;
  `;

  await db.run(updateDistrictQuery, [
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
    districtId,
  ]);

  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getStatsQuery = `
    SELECT 
      SUM(cases) AS totalCases,
      SUM(cured) AS totalCured,
      SUM(active) AS totalActive,
      SUM(deaths) AS totalDeaths
    FROM 
      district
    WHERE 
      state_id = ?;
  `;

  const stats = await db.get(getStatsQuery, [stateId]);
  response.send(stats);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateName = `select state.state_name as stateName from state inner join district on state.state_id=district.state_id where district_id=?;`;
  const stateName = await db.get(getStateName, [districtId]);
  response.send(stateName);
});
