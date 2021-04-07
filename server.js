'use strict';
const express = require('express');
require('dotenv').config();

const cors = require('cors');
const pg = require('pg');
const app = express();

const superagent = require('superagent');

app.use(cors());

const PORT = process.env.PORT || 4000;

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});


app.get('/', mainRout);
app.get('/location', locationRoute);
app.get('/weather', weatherRoute);
app.get('/parks', parksRoute);
app.get('/movies', moviesRout);
app.get('/yelp', yelpRout);
app.get('*', errorRoute);



// Main Route:// done
function mainRout(request, response) {
  response.status(200).send('Your server is working');
}

// Location Route:
// http://localhost:4000/location?city=amman
function locationRoute(req, res) {
  let cityName = req.query.city;

  let SQL = `SELECT * FROM locations WHERE search_query='${cityName}';`;

  client.query(SQL)
    .then(results => {
      if (results.rows.length > 0) {
        res.send(results.rows[0]);
      } else {

        let GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
        let locUrl = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${cityName}&format=json`;
        superagent.get(locUrl)
          .then(locationData => {
            let locData = locationData.body;
            const dataLoc = new Location(cityName, locData);
            let SQL = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4) RETURNING *;`;
            let safeValues = [dataLoc.search_query, dataLoc.formatted_query, dataLoc.latitude, dataLoc.longitude];
            client.query(SQL, safeValues)
              .then(results => {
                return results.rows;
              });
            res.send(dataLoc);

          })
          .catch(error => {
            res.send(error);
          });
      }
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

// https://mohammad-city-explorer.herokuapp.com/movies?search_query=seattle&formatted_query=Seattle%2C%20King%20County%2C%20Washington%2C%20USA&latitude=47.60383210000000&longitude=-122.33006240000000&page=1
function moviesRout(req, res) {

  let cityName = req.query.search_query;
  let MOVIE_API_KEY = process.env.MOVIE_API_KEY;
  let moviesUrl = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&query=${cityName}`;
  superagent.get(moviesUrl)
    .then(value => {
      let movieData = value.body.results;

      let arr = movieData.map((val) => {

        return new Movie(val);
      });
      res.send(arr);
    })
    .catch(error => {
      res.send(error);
    });

}
function Movie(data) {
  this.title = data.original_title;
  this.overview = data.overview;
  this.average_votes = data.vote_average;
  this.total_votes = data.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
  this.popularity = data.popularity;
  this.released_on = data.release_date;
}
function yelpRout(req, res) {

  let cityName = req.query.search_query;
  let page = req.query.page;
  let YELP_API_KEY = process.env.YELP_API_KEY;
  let numberOfPage = 5;
  let start = ((page - 1) * numberOfPage);
  let yelpUrl = `https://api.yelp.com/v3/businesses/search?location=${cityName}&limit=${numberOfPage}&offset=${start}`;
  superagent.get(yelpUrl)
    .set('Authorization', `Bearer ${YELP_API_KEY}`)
    .then(value => {
      let yelpData = value.body;
      console.log(yelpData);
      let arr = yelpData.businesses.map((val) => {

        return new Yelp(val);
      });
      res.send(arr);
    })
    .catch(error => {
      res.send(error);
    });

}
function Yelp(data) {
  this.name = data.name;
  this.image_url = data.image_url;
  this.price = data.price;
  this.rating = data.rating;
  this.url = data.url;
}


// Error Route:
function errorRoute(req, res) {
  res.status(404).send('Sorry, something went wrong');
}


// listening to PORT
client.connect()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`listening on ${PORT}`)
    );
  });
