/* eslint no-console: 0 */
const express = require('express');
const { Client } = require('pg');
const Router = require('express-promise-router');
const dotenv = require('dotenv');

const app = express();
const router = new Router();

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../.env' });
}

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('./'));
  app.get('/', (req, res) => {
    res.sendFile('./index.html');
  });
}

app.set('port', process.env.PORT || 3001);

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

client.connect();

router.get('/api/:fn/:ln', async (req, res) => {
  const voterTable = 'voters';
  const pollingTable = 'polling_places';
  const query = `SELECT ${voterTable}.*,
    polling_place_id,
    polling_place_name,
    precinct_name as "polling_place_precinct_name",
    house_num     as "polling_place_house_num",
    street_name   as "polling_place_street_name",
    city          as "polling_place_city",
    state         as "polling_place_state",
    zip           as "polling_place_zip"
    FROM ${voterTable}
    INNER JOIN ${pollingTable} ON ${voterTable}.precinct_abbrv = ${pollingTable}.precinct_name 
      AND ${voterTable}.county_desc = ${pollingTable}.county_name
    WHERE voter_status_desc NOT LIKE 'REMOVED'
      AND first_name ilike $1::text
      AND last_name ilike $2::text`;
  const { rows } = await client.query(query, [req.params.fn, req.params.ln]);
  res.send(rows);
});

app.use(router);

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`);
});
