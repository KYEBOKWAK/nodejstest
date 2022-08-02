const env = require('dotenv');
require('dotenv').config();
var mysql = require('mysql');

// const moment_timezone = require('moment-timezone');
// moment_timezone.tz.setDefault("Asia/Seoul");

const DB_WRITE_TYPE_UPDATE = "DB_WRITE_TYPE_UPDATE";
const DB_WRITE_TYPE_INSERT = "DB_WRITE_TYPE_INSERT";
const DB_WRITE_TYPE_DELETE = "DB_WRITE_TYPE_DELETE";

var readDB = function(query, options, callbackFunc, errorFunc){
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
    charset: 'utf8mb4'
  });

  connection.connect(function(err) {
    if (err) {
      console.error('test error connecting: ' + err.stack);
      // result.state = 'error';
      // result.message = err.stack;
      
      connection.end();
      // return callbackFunc(result);
      return errorFunc(err);
    }
    
    // console.log('read connected as id ' + connection.threadId);
  });
  
  connection.query(query, options, function (error, results, fields) {
    if (error)
    {
      console.log('?????');
      console.log(error);
      result.state = 'error';
      result.message = error;

      connection.end();
      return errorFunc(error);
    }else{
      connection.end();
      return callbackFunc(results);
    }
  });
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
    multipleStatements: true,
    charset: 'utf8mb4'
  });

  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      result.state = 'error';
      result.message = err.stack;
      
      callbackFunc(result);
    }
    
    // console.log('read connected as id ' + connection.threadId);
  });
  
  connection.query(query, function (error, results, fields) {
    if (error)
    {
      console.log(error);
      result.state = 'error';
      result.message = error;

      callbackFunc(result);
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
    database  : process.env.DB_DATABASE,
    charset: 'utf8mb4'
  });

  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      result.state = 'error';
      result.message = err.stack;
      
      callbackFunc(result);
    }
    
    // console.log('read connected as id ' + connection.threadId);
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

      callbackFunc(result);
      
    }else{
      callbackFunc(results);
    }
  });
  connection.end();
};

//query와 옵션에 키 밸류로 넘어와야 함.
var writeDB_MULITPLEX = function(querys, options, callbackFunc, errorFunc){
  var result = {
    state: '',
    message: '',
    data: ''
  };

  if(querys.length === 0){
    result.state = 'error';
    result.message = 'query multiplex error';
      
    callbackFunc(result);
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
      
    callbackFunc(result);
    return 
  }

  // console.log(query);
  // return;

  var connection = mysql.createConnection({
    host      : process.env.DB_HOST_WRITE,
    user      : process.env.DB_USERNAME,
    password  : process.env.DB_PASSWORD,
    database  : process.env.DB_DATABASE,
    multipleStatements: true,
    charset: 'utf8mb4'
  });

  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      result.state = 'error';
      result.message = err.stack;
      
      callbackFunc(result);
    }
    
    // console.log('connected as id ' + connection.threadId);
  });
  
  connection.query(query, function (error, results, fields) {
    if (error)
    {
      console.log(error);
      let result = {
        state: "error",
        message: error.code,
        error_code: error.code
      }
      
      errorFunc(result);
    }else{
      callbackFunc(results);
    }
  });
  connection.end();
};

var writeDB = function(query, options, write_type, callbackFunc, errorFunc){
  var result = {
    state: '',
    message: '',
    data: ''
  };

  var connection = mysql.createConnection({
    host      : process.env.DB_HOST_WRITE,
    user      : process.env.DB_USERNAME,
    password  : process.env.DB_PASSWORD,
    database  : process.env.DB_DATABASE,
    charset: 'utf8mb4'
  });

  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      result.state = 'error';
      result.message = err.stack;
      
      callbackFunc(result);
    }
    
    // console.log('connected as id ' + connection.threadId);
  });
  
  // var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  // let _options = {}
  // if(write_type === DB_WRITE_TYPE_UPDATE){
  //   _options = {
  //     ...options,
  //     updated_at: date
  //   }
  // }else if(write_type === DB_WRITE_TYPE_INSERT){
  //   _options = {
  //     ...options,
  //     created_at: date,
  //     updated_at: date
  //   }
  // }else{
  //   _options = options;
  // }

  
  connection.query(query, options, function (error, results, fields) {
    if (error)
    {
      console.log(error);
      let result = {
        state: "error",
        message: error.code,
        error_code: error.code
      }
      
      errorFunc(result);
    }else{
      callbackFunc(results);
    }
  });
  connection.end();
};

module.exports = {
    SELECT: function(query, options, callbackFunc, errorFunc = function(error){}){
      readDB(query, options, callbackFunc, errorFunc);
        //return {state: 'success'}
    },
    SELECT_LIKE_PARAMETER: function(queryStringArray, likeOption, options, callbackFunc){
      read_Like_param_DB(queryStringArray, likeOption, options, callbackFunc);
    },
    SELECT_MULITPLEX: function(query, callbackFunc){
      readDB_MULITPLEX(query, callbackFunc);
    },
    UPDATE: function(query, options, callbackFunc, errorFunc){
      //console.log(query);
      //writeDB(query, callbackFunc)
      writeDB(query, options, DB_WRITE_TYPE_UPDATE, callbackFunc, errorFunc);
    },
    UPDATE_MULITPLEX: function(query, options, callbackFunc, errorFunc){
      //멀티 insert는 자동으로 created_at을 안해줌.
      writeDB_MULITPLEX(query, options, callbackFunc, errorFunc);
    },
    INSERT: function(query, options, callbackFunc, errorFunc){
      // writeDB(query, options, DB_WRITE_TYPE_INSERT, callbackFunc);
      writeDB(query, options, DB_WRITE_TYPE_INSERT, callbackFunc, errorFunc);
    },
    INSERT_MULITPLEX: function(query, options, callbackFunc, errorFunc){
      //멀티 insert는 자동으로 created_at을 안해줌.
      writeDB_MULITPLEX(query, options, callbackFunc, errorFunc);
    },
    DELETE: function(query, options, callbackFunc, errorFunc){
      //console.log(query);
      writeDB(query, options, DB_WRITE_TYPE_DELETE, callbackFunc, errorFunc)
    },
    DELETE_MULITPLEX: function(query, options, callbackFunc, errorFunc){
      //console.log(query);
      writeDB_MULITPLEX(query, options, callbackFunc, errorFunc)
    }
};