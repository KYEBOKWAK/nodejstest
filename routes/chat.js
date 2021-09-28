var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
const res_state = use('lib/res_state.js');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

var mysql = require('mysql');
const Util = use('lib/util.js');

router.post('/any/list', function(req, res){

  let store_id = req.body.data.store_id;
  let limit = req.body.data.limit;
  let skip = req.body.data.skip
  
  const selectQuery = mysql.format('SELECT id, user_id, message FROM chats WHERE store_id=? ORDER BY id DESC LIMIT ? OFFSET ?', [store_id, limit, skip]);

  
  db.SELECT(selectQuery, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post('/any/count', function(req, res){
  let store_id = req.body.data.store_id;
  const selectQuery = mysql.format('SELECT COUNT(id) AS count FROM chats WHERE store_id=?', [store_id]);

  db.SELECT(selectQuery, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        count: result[0].count
      }
    })
  })
})

module.exports = router;