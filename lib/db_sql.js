const env = require('dotenv');
require('dotenv').config();
var mysql = require('mysql');

var readDB = function(query, options, callbackFunc){
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
  
  connection.query(query, options, function (error, results, fields) {
    if (error)
    {
      console.log(error);
      result.state = 'error';
      result.message = error;

      callbackFunc(results);
    }else{
      callbackFunc(results);
    }
  });
  connection.end();
};

var readDB_MULITPLEX = function(query, callbackFunc){
  var result = {
    state: '',
    message: '',
    data: ''
  };

  var connection = mysql.createConnection({
    host      : process.env.DB_HOST_READ,
    user      : process.env.DB_USERNAME,
    password  : process.env.DB_PASSWORD,
    database  : process.env.DB_DATABASE,
    multipleStatements: true
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
    }else{
      callbackFunc(results);
    }
  });
  connection.end();
};

var read_Like_param_DB = function(queryStringArray, likeOption, options, callbackFunc){
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

  let query = '';
  for(let i = 0 ; i < queryStringArray.length ; i++ ){
    let string = queryStringArray[i];
    // console.log(string.indexOf("LIKE"));
    if(string.indexOf("LIKE") >= 0){
      //LIKE가 있는 문자열
      query = query + string + connection.escape('%'+likeOption+'%');
      // console.log(query);
    }else{
      query+=string;
    }
  }
  
  connection.query(query, options, function (error, results, fields) {
    if (error)
    {
      console.log(error);
      result.state = 'error';
      result.message = error;

      callbackFunc(results);
      
    }else{
      callbackFunc(results);
    }
  });
  connection.end();
};

//query와 옵션에 키 밸류로 넘어와야 함.
var writeDB_MULITPLEX = function(querys, options, callbackFunc){
  var result = {
    state: '',
    message: '',
    data: ''
  };

  if(querys.length === 0){
    result.state = 'error';
    result.message = 'query multiplex error';
      
    callbackFunc(results);
    return;
  }

  let query = '';
  for(let i = 0 ; i < querys.length ; i++){
    const queryObject = querys[i];
    const optionObject = options.find((value) => {
      return value.key === queryObject.key;
    });

    if(optionObject === undefined){
      break;
    };

    let rowQuery = mysql.format(queryObject.value, optionObject.value);
    // console.log(rowQuery);
    query += rowQuery;
  }

  if(query === ''){
    result.state = 'error';
    result.message = '쿼리문이 비어있습니다.';
      
    callbackFunc(results);
    return 
  }

  console.log(query);
  // return;

  var connection = mysql.createConnection({
    host      : process.env.DB_HOST_WRITE,
    user      : process.env.DB_USERNAME,
    password  : process.env.DB_PASSWORD,
    database  : process.env.DB_DATABASE,
    multipleStatements: true
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
  
  connection.query(query, function (error, results, fields) {
    if (error)
    {
      console.log(error);
      result.state = 'error';
      result.message = error;

      callbackFunc(results);
    }else{
      callbackFunc(results);
    }
  });
  connection.end();
};

var writeDB = function(query, options, callbackFunc){
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
  
  connection.query(query, options, function (error, results, fields) {
    if (error)
    {
      console.log(error);
      result.state = 'error';
      result.message = error;

      callbackFunc(results);
    }else{
      callbackFunc(results);
    }
  });
  connection.end();
};

module.exports = {
    SELECT: function(query, options, callbackFunc){
      readDB(query, options, callbackFunc);
        //return {state: 'success'}
    },
    SELECT_LIKE_PARAMETER: function(queryStringArray, likeOption, options, callbackFunc){
      read_Like_param_DB(queryStringArray, likeOption, options, callbackFunc);
    },
    SELECT_MULITPLEX: function(query, callbackFunc){
      readDB_MULITPLEX(query, callbackFunc);
    },
    UPDATE: function(query, options, callbackFunc){
      //console.log(query);
      //writeDB(query, callbackFunc)
      writeDB(query, options, callbackFunc);
    },
    INSERT: function(query, options, callbackFunc){
      //console.log(query);
      //value.created_at = 
      writeDB(query, options, callbackFunc);
    },
    INSERT_MULITPLEX: function(query, options, callbackFunc){
      writeDB_MULITPLEX(query, options, callbackFunc);
    },
    DELETE: function(query, options, callbackFunc){
      //console.log(query);
      writeDB(query, options, callbackFunc)
    }
};