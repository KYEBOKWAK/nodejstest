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
const axios = require('axios');

var urlencode = require('urlencode');

router.post("/ticketing", function(req, res){
  const findWord = "%"+req.body.data.findWord+"%";

  var nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let queryFind = mysql.format("SELECT poster_url, project.title, project.id AS project_id, poster_renew_url, project.title, funding_closing_at FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id WHERE project.funding_closing_at > ? AND project.state=? AND (project.title LIKE ? OR hash_tag1 LIKE ? OR hash_tag2 LIKE ? OR categorie.title LIKE ? OR detailed_address LIKE ?) ORDER BY project.id DESC", [nowDate, types.project.STATE_APPROVED, findWord, findWord, findWord, findWord, findWord]);

  db.SELECT(queryFind, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post("/meetup", function(req, res){
  const findWord = "%"+req.body.data.findWord+"%";

  let queryFind = mysql.format("SELECT poster_url, project.title, project.id AS project_id, poster_renew_url, project.title, funding_closing_at FROM projects AS project LEFT JOIN categories AS categorie ON categorie.id=project.category_id WHERE project.state=? AND (project.title LIKE ? OR hash_tag1 LIKE ? OR hash_tag2 LIKE ? OR categorie.title LIKE ? OR detailed_address LIKE ?) ORDER BY project.id DESC", [types.project.STATE_APPROVED, findWord, findWord, findWord, findWord, findWord]);

  db.SELECT(queryFind, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post("/mannayo", function(req, res){
  const findWord = "%"+req.body.data.findWord+"%";

  let queryFind = mysql.format("SELECT meetup.id AS meetup_id FROM meetups AS meetup LEFT JOIN creators AS creator ON meetup.creator_id=creator.id WHERE meetup.deleted_at IS NULL AND (meetup.what LIKE ? OR meetup.where LIKE ? OR creator.title LIKE ?) ORDER BY meetup.id DESC", [findWord, findWord, findWord]);

  db.SELECT(queryFind, {}, (result) => {
    return res.json({
      result:{
        state: res_state.success,
        list: result
      }
    })
  })

});

module.exports = router;