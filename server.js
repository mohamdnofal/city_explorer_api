'use strict';
const express = require('express');
require('dotenv').config();

const cors = require('cors');

const app = express();

const superagent = require('superagent');

app.use(cors());

const PORT = process.env.PORT || 4000;

app.use(cors());

app.get('/', mainRout);
app.get('/location', locationRoute);
app.get('/weather', weatherRoute);
app.get('/parks', parksRoute);
app.get('*', errorRoute);



// Main Route:// done
function mainRout(request, response) {
  response.status(200).send('Your server is working');
}

// Location Route:
// http://localhost:4000/location?city=amman
function locationRoute(req, res) {
  let cityName = req.query.city;
  let GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
  let locUrl = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${cityName}&format=json`;
  superagent.get(locUrl)
    .then(locationData => {
      let locData = locationData.body;
      const dataLoc = new Location(cityName, locData);
      res.send(dataLoc);

    })
    .catch(error => {
      res.send(error);
    });
}

function Location(cityName, locationData) {
  this.search_query = cityName;
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
}


// Weather Route:
function weatherRoute(req, res) {
  // let wetherDataArr = [];
  let cityName = req.query.search_query;
  let WEATHER_API_KEY = process.env.WEATHER_API_KEY;
  let wetherUrl = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName},&key=${WEATHER_API_KEY}`;

  superagent.get(wetherUrl)
    .then(val => {
      let weatherData = val.body.data;
      let arr = weatherData.map((val) => {

        return new Weather(val);
      });
      res.send(arr);
    })

    .catch(error => {
      res.send(error);
    });
}

function Weather(wethData) {
  this.time = wethData.valid_date;
  this.forecast = wethData.weather.description;
}

function parksRoute(req, res) {
  let city = req.query.search_query;
  let PARKS_API_KEY = process.env.PARKS_API_KEY;
  let parksUrl = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${PARKS_API_KEY}`;

  superagent.get(parksUrl)
    .then(value => {
      let parkData = value.body.data;

      // console.log(parkData);
      let arr = parkData.map((val) => {

        return new Park(val);
      });
      res.send(arr);
    })
    .catch(error => {
      res.send(error);
    });
}
function Park(data) {
  this.name = data.fullName;
  this.address = `${data.addresses[0].postalCode}, ${data.addresses[0].city}, ${data.addresses[0].stateCode}, ${data.addresses[0].line1}`;
  this.fee = data.entranceFees[0].cost;
  this.description = data.description;
  this.url = data.url;
}

// Error Route:
function errorRoute(req, res) {
  res.status(404).send('Sorry, something went wrong');
}


// listening to PORT
app.listen(PORT, () => {
  console.log(`Listening to PORT ${PORT}`);
});
