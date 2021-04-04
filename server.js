'use strict';
const express = require( 'express' );
require( 'dotenv' ).config();

const cors = require( 'cors' );

const server = express();

server.use( cors() );

const PORT = process.env.PORT || 4000;

// Main Route:
server.get( '/',( req,res )=>{
  res.send( 'Your server is working' );
} );


// Location Route:
server.get( '/location', ( req,res )=>{
  let loc = require( './data/location.json' );
  let locData = new Location ( loc );
  res.send( locData );
} );

function Location( locationData ){
  this.search_query = 'Seattle';
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
}

// Weather Route:
server.get( '/weather', ( req,res )=>{
  let wetherDataArr =[];
  let weth = require( './data/weather.json' );
  weth.data.forEach( eachArr=>{
    let wethData = new Weather ( eachArr );
    wetherDataArr.push( wethData );
  } );
  res.send( wetherDataArr );
} );

function Weather( wethData ){
  this.time = wethData.valid_date;
  this.forecast = wethData.weather.description;
}


// Error Route:
server.get( '*',( req,res )=>{
  let errorObject = {
    status: 500,
    responseText: 'Sorry, something went wrong'
  };
  res.status( 500 ).send( errorObject );
} );


// listening to PORT
server.listen( PORT, ()=>{
  console.log( `Listening to PORT ${PORT}` );
} );