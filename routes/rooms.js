var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var types = use('lib/types.js');
const res_state = use('lib/res_state.js');
const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const moment = require('moment');

var mysql = require('mysql');
const Util = use('lib/util.js');

const global = use('lib/global_const.js');


const ROOM_INFO_TEMP = [
  {
      id: 1,
      target_id: 237,
      target_type: 'project',
      expire: '2020-07-20 00:00:00',
      room_name: 'room_project_237'
  },
  {
    id: 2,
    target_id: 238,
    target_type: 'project',
    expire: '2020-07-21 00:00:00',
    room_name: 'room_project_238'
  }
]

router.post("/list", function(req, res){
  return res.json({
    result: ROOM_INFO_TEMP.concat()
    
  })
});

module.exports = router;