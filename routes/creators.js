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

router.post("/find/list", function(req, res){
  const creatorName = req.body.data.creatorName;
  // console.log(creatorName);
  // mysql.format("%?%")
  let queryCreatorFind = mysql.format("SELECT id AS creator_id, channel_id, title, thumbnail_url, created_at FROM creators WHERE title LIKE ?", ["%"+creatorName+"%"]);
  // console.log(queryCreatorFind);
  db.SELECT(queryCreatorFind, [], function(result){
    // console.log(result);
    return res.json({
      result: {
        creators: result
      }
    })
  });
});

router.post("/search/youtubeapi/list", function(req, res){
  // process.env.CROWDTICKET_WEB_API_URL
  let search_value = req.body.data.search_value;
  search_value = urlencode(search_value);
  let getURL = process.env.CROWDTICKET_WEB_API_URL+"api/search/creator/api/list?search_value="+search_value;
  
  axios({
    method: 'get',
    url: getURL
  })
  .then(function (response) {
    // console.log(response.data);
    return res.json({
      result: {
        state: res_state.success,
        data:{
          ...response.data
        }
      }
    });
  });
});

router.post("/search/crolling/channels", function(req, res){
  let search_channel_id = req.body.data.search_channel_id;
  // let channel_all_count = req.body.data.channel_all_count;

  // search_value = urlencode(search_value);
  // let getURL = process.env.CROWDTICKET_WEB_API_URL+"api/search/creator/find/crolling?search_channel_id="+search_channel_id+"&channel_all_count="+channel_all_count;
  let getURL = process.env.CROWDTICKET_WEB_API_URL+"api/search/creator/find/crolling?search_channel_id="+search_channel_id;
  
  axios({
    method: 'get',
    url: getURL
  })
  .then(function (response) {
    return res.json({
      result: {
        state: res_state.success,
        data:{
          ...response.data
        }
      }
    });
  });
});

router.post("/search/crolling/channels/channelid", function(req, res){
  let channelURL = req.body.data.channelURL;
  // let channel_all_count = req.body.data.channel_all_count;

  // search_value = urlencode(search_value);
  // let getURL = process.env.CROWDTICKET_WEB_API_URL+"api/search/creator/find/crolling?search_channel_id="+search_channel_id+"&channel_all_count="+channel_all_count;
  let getURL = process.env.CROWDTICKET_WEB_API_URL+"api/search/creator/find/crolling/channel?url="+channelURL;

  axios({
    method: 'get',
    url: getURL
  })
  .then(function (response) {
    if(response.data.state === res_state.error){
      return res.json({
        state: res_state.error,
        message: response.data.message,
        result: {
        }
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        ...response.data
      }
    });
  });

  /*
  axios({
    method: 'get',
    url: getURL
  })
  .then(function (response) {
    return res.json({
      result: {
        state: res_state.success,
        data:{
          ...response.data
        }
      }
    });
  });
  */
});

router.post("/example/list", function(req, res){
  let creator_id = req.body.data.creator_id;
  
  let queryCreatorsExampleList = mysql.format("SELECT meetup.what FROM meetup_users AS meetup_user LEFT JOIN meetups AS meetup ON meetup_user.meetup_id=meetup.id WHERE meetup.creator_id=? AND meetup_user.deleted_at IS NULL ORDER BY meetup.id DESC", [creator_id]);
  // console.log(queryCreatorFind);

  db.SELECT(queryCreatorsExampleList, [], function(result){
    // console.log(result);
    return res.json({
      result: {
        state: res_state.success,
        meetups: result        
      }
    })
  });
});

router.post("/create", function(req, res){
  const channel_id = req.body.data.channel_id;
  const creator_id = req.body.data.creator_id;
  const title = req.body.data.title;
  const thumbnail_url = req.body.data.thumbURL;
  const social_channel = 'youtube';

  if(creator_id >= 0){
    //creator id가 있으면 우리 db에 있음.
    return res.json({
      result: {
        state: res_state.success,
        creator_id: creator_id
      }
    })
  }

  let queryCreator = mysql.format("SELECT id AS creator_id FROM creators WHERE channel_id=?", channel_id)
  db.SELECT(queryCreator, [], (result_select_creators) => {
    if(result_select_creators.length > 0){
      //데이터가 이씀
      return res.json({
        result: {
          state: res_state.success,
          creator_id: result_select_creators[0].creator_id
        }
      })
    }

    const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

    let creatorData = {
      channel_id: channel_id,
      title: title,
      thumbnail_url: thumbnail_url,
      social_channel: social_channel,
      channel_user_id: '',
      subscriber_count: '',
      created_at: date,
      updated_at: date
    }
  
    db.INSERT("INSERT INTO creators SET ?", creatorData, function(result_insert_creators){
      return res.json({
        result:{
          state: res_state.success,
          creator_id: result_insert_creators.insertId
        }
      })
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: error,
        result:{}
      })
    });
  })
/*
  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let creatorData = {
    channel_id: channel_id,
    title: title,
    thumbnail_url: thumbnail_url,
    social_channel: social_channel,
    created_at: date,
    updated_at: date
  }

  db.INSERT("INSERT INTO creators SET ?", creatorData, function(result_insert_creators){
    res.json({
      result:{
        state: res_state,
        creator_id: result_insert_creators.insertId
      }
    })
  });
  */
});

module.exports = router;