const env = require('dotenv');
require('dotenv').config();
var mysql = require('mysql');

var readDB = function(query, callbackFunc){
  var result = {
    state: '',
    message: '',
    data: ''
  };

  var connection = mysql.createConnection({
    host      : process.env.DB_HOST_READ,
    user      : process.env.DB_USERNAME,
    password  : process.env.DB_PASSWORD,
    database  : process.env.DB_DATABASE
  });

  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      result.state = 'error';
      result.message = err.stack;
      
      callbackFunc(results);
    }
    
    console.log('read connected as id ' + connection.threadId);
  });
  
  connection.query(query, function (error, results, fields) {
    if (error)
    {
      console.log(error);
      result.state = 'error';
      result.message = error;

      callbackFunc(results);
      return;
    }

    callbackFunc(results);
  });
  connection.end();
};

var writeDB = function(query, value, callbackFunc){
  var result = {
    state: '',
    message: '',
    data: ''
  };

  var connection = mysql.createConnection({
    host      : process.env.DB_HOST_WRITE,
    user      : process.env.DB_USERNAME,
    password  : process.env.DB_PASSWORD,
    database  : process.env.DB_DATABASE
  });

  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      result.state = 'error';
      result.message = err.stack;
      
      callbackFunc(results);
    }
    
    console.log('connected as id ' + connection.threadId);
  });
  
  connection.query(query, value, function (error, results, fields) {
    if (error)
    {
      console.log(error);
      result.state = 'error';
      result.message = error;

      callbackFunc(error, results, fields);
      return;
    }

    callbackFunc(error, results, fields);
  });
  connection.end();
};

module.exports = {
    SELECT: function(query, callbackFunc){
      readDB(query, callbackFunc);
        //return {state: 'success'}
    },
    UPDATE: function(query, callbackFunc){
      //console.log(query);
      //writeDB(query, callbackFunc)
    },
    INSERT: function(query, value, callbackFunc){
      //console.log(query);
      //value.created_at = 
      writeDB(query, value, callbackFunc)
    },
    DELETE: function(query, callbackFunc){
      //console.log(query);
      //writeDB(query, callbackFunc)
    }
};