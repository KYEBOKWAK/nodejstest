const env = require('dotenv');
require('dotenv').config();
var mysql = require('mysql');

let mysql2_r = require('./db_sql2_r');
let mysql2_w = require('./db_sql2_w');

const slack = require('./slack');

var readDB = function(query, options, callbackFunc){  
  mysql2_r.query(query, options, function(error, rows, fields) {
    if(error){
      console.error('CT_READ_QUERY: ' + query);
      console.error('CT_READ_ERROR: ' + error);

      slack.webhook({
        channel: "#bot-서버오류",
        username: "bot",
        text: `[CT_READ_ERROR]\n${query}\n${error}`
      }, function(err, response) {
      });

      return callbackFunc([]);
    }else{
      return callbackFunc(rows)
    }
  });
};

//query와 옵션에 키 밸류로 넘어와야 함.
var writeDB_MULITPLEX = function(querys, options, callbackFunc, errorFunc){
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
    query += rowQuery;
  }

  if(query === ''){
    let result = {
      state: "error",
      message: '쿼리문이 비어있습니다.',
      error_code: '쿼리문이 비어있습니다.'
    }
      
    return errorFunc(result);
  }

  mysql2_w.query(query, [], function(error, rows, fields) {
    if(error){
      console.error('CT_MULTI_WRITE_QUERY: ' + query);
      console.error('CT_MULTI_ERROR: ' + error);

      slack.webhook({
        channel: "#bot-서버오류",
        username: "bot",
        text: `[CT_MULTI_WRITE_ERROR]\n${query}\n${error}`
      }, function(err, response) {
      });      

      let result = {
        state: "error",
        message: 'DB Multi Write Error',
        error_code: 'DB Multi Write Error'
      }
      
      return errorFunc(result);
    }else{
      return callbackFunc(rows);
    }
  });
};

var writeDB = function(query, options, callbackFunc, errorFunc){
  mysql2_w.query(query, options, function(error, rows, fields) {
    if(error){
      console.error('CT_WRITE_QUERY: ' + query);
      console.error('CT_WRITE_ERROR: ' + error);

      slack.webhook({
        channel: "#bot-서버오류",
        username: "bot",
        text: `[CT_WRITE_ERROR]\n${query}\n${error}`
      }, function(err, response) {
      });
            
      let result = {
        state: "error",
        message: 'DB Write Error',
        error_code: 'DB Write Error'
      }
      
      return errorFunc(result);
    }else{
      return callbackFunc(rows);
    }
  });
};

module.exports = {
    SELECT: function(query, options, callbackFunc){
      readDB(query, options, callbackFunc);
    },
    UPDATE: function(query, options, callbackFunc, errorFunc){
      //console.log(query);
      //writeDB(query, callbackFunc)
      writeDB(query, options, callbackFunc, errorFunc);
    },
    UPDATE_MULITPLEX: function(query, options, callbackFunc, errorFunc){
      //멀티 insert는 자동으로 created_at을 안해줌.
      writeDB_MULITPLEX(query, options, callbackFunc, errorFunc);
    },
    INSERT: function(query, options, callbackFunc, errorFunc){
      writeDB(query, options, callbackFunc, errorFunc);
    },
    INSERT_MULITPLEX: function(query, options, callbackFunc, errorFunc){
      //멀티 insert는 자동으로 created_at을 안해줌.
      writeDB_MULITPLEX(query, options, callbackFunc, errorFunc);
    },
    DELETE: function(query, options, callbackFunc, errorFunc){
      //console.log(query);
      writeDB(query, options, callbackFunc, errorFunc)
    },
    DELETE_MULITPLEX: function(query, options, callbackFunc, errorFunc){
      //console.log(query);
      writeDB_MULITPLEX(query, options, callbackFunc, errorFunc)
    }
};