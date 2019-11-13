'use strict';

//load Environtment Variable from the .env
require('dotenv').config();

//declare Application Dependancies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

//Application Setup
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

// Database Connection Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => {throw err;});


//API routes
app.get('/location', getLocation);
app.get('/weather', weatherHandler);
app.get('/trails', getTrails);


app.get('*', (request, response) => {
  response.status(404).send('This route does not exist');
});

// get info from a user
Location.fetchLocation = (request, response) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
    superagent.get(url)
      .then(data => {
        const geoData = data.body;
        const location = (new Location(request.query.data, geoData));
        let SQL = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES($1, $2, $3, $4) RETURNING *';
        let values = [request.query.data, location.formatted_query, location.latitude, location.longitude];
        return client.query(SQL, values);
      })
      .then (results => {
        response.status(200).send(results.rows[0]);
      });
  }
  catch (error) {
    //some function or error message
    errorHandler('So sorry, something went wrong', request, response);
  }
};

// get data from database if exists else get from a user
function getLocation(request, response) {
  const SQL = `SELECT * FROM locations WHERE search_query='${request.query.data}'`;
  client.query(SQL)
    .then( result => {
      if (result.rowCount > 0) {
        console.log('Location data from SQL');
        response.status(200).send(result.rows[0]);
      }
      else {
        Location.fetchLocation(request, response);
      }
    })
    .catch( error => errorHandler(error));
}

//API routes
function weatherHandler(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  // console.log('lat/long', request.query.data.latitude);
  superagent.get(url)
    .then(data => {
      const weatherSummaries = data.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.status(200).send(weatherSummaries);
    })
    .catch(() => {
      errorHandler('Something went wrong', request, response);
    });
}

// Trails handler

function getTrails(request, response) {
  const url = `https://www.hikingproject.com/data/get-trails?lat=${request.query.data.latitude}&lon=${request.query.data.longitude}&key=${process.env.TRAILS_API_KEY}`;
  // console.log('lat/long', request.query.data.latitude);
  superagent.get(url)
    .then(data => {
      const trailsSummaries = data.body.trails.map(element => {
        return new Trails(element);
      });
      response.status(200).send(trailsSummaries);
    })
    .catch(() => {
      errorHandler('Something went wrong', request, response);
    });
}


// error handler
function errorHandler(error, request, response) {
  response.status(500).send(error);
}

//Helper Funcitons
function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lng;
}

//Helper Funcitons
function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

// trails constructor
function Trails(trail){
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.stars = trail.stars;
  this.star_votes = trail.starVotes;
  this.summary = trail.summary;
  this.trail_url = trail.url;
  this.conditions = trail.conditionStatus;
  this.condition_date = trail.conditionDate.slice(0, 10);
  this.condition_time = trail.conditionDate.slice(11);
}
// Connect to DB and Start the Web Server
client.connect()
  .then( () => {
    app.listen(PORT, () => {
      console.log('Server up on', PORT);
    });
  })
  .catch(err => {
    throw `PG Startup Error: ${err.message}`;
  });
