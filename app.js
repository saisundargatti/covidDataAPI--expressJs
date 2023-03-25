const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const app = express();
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//API 1

const convertSnakeCaseToCamelCase = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStateListQuery = `select * from state`;
  const getStateListDbResponse = await db.all(getStateListQuery);

  response.send(
    getStateListDbResponse.map((eachItem) =>
      convertSnakeCaseToCamelCase(eachItem)
    )
  );
});

//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateObjQuery = `select * from state where state_id = ${stateId}`;
  const getStateObjDBResponse = await db.get(getStateObjQuery);

  const formattedObj = {
    stateId: getStateObjDBResponse.state_id,
    stateName: getStateObjDBResponse.state_name,
    population: getStateObjDBResponse.population,
  };

  response.send(formattedObj);
});

//API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const createDistrictObjQuery = `insert into 
  district(district_name,state_id,cases,cured,active,deaths) 
  values ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;

  const createDBResponse = await db.run(createDistrictObjQuery);

  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictObjQuery = `select * from district where district_id = ${districtId}`;
  const getDistrictObjDBResponse = await db.get(getDistrictObjQuery);

  const formattedDistrictObj = {
    districtId: getDistrictObjDBResponse.district_id,
    districtName: getDistrictObjDBResponse.district_name,
    stateId: getDistrictObjDBResponse.state_id,
    cases: getDistrictObjDBResponse.cases,
    cured: getDistrictObjDBResponse.cured,
    active: getDistrictObjDBResponse.active,
    deaths: getDistrictObjDBResponse.deaths,
  };
  response.send(formattedDistrictObj);
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictObjQuery = `delete from district where district_id =${districtId}`;
  await db.run(deleteDistrictObjQuery);
  response.send("District Removed");
});

//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictObjQuery = `
  update 
  district 
  set 
  district_name= '${districtName}',
  state_id ='${stateId}',
  cases ='${cases}',
  cured = '${cured}',
  active ='${active}',
  deaths = '${deaths}' 
  where district_id ='${districtId}';`;

  await db.run(updateDistrictObjQuery);
  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
  select 
  cases as totalCases,
  cured as totalCured,
  active as totalActive,
  deaths as totalDeaths
  from district where state_id ='${stateId}';`;
  const getDBResponse = await db.all(getStateStatsQuery);
  response.send(getDBResponse);
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailsQuery = `select state_name as stateName 
  from state inner join district on state.state_id = district.state_id where district_id = ${districtId}`;
  const getDistrictDetails = await db.get(getDistrictDetailsQuery);
  response.send(getDistrictDetails);
});

module.exports = app;
