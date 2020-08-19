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

router.post("/make", function(req, res){

});

router.post("/request", function(req, res){
  //만나요 요청
  const mannayo_id = req.body.data.mannayo_id;
  const user_id = req.body.data.user_id;

  let mannayoQuery = mysql.format("SELECT meetup_user.id AS meetup_user_id FROM meetup_users AS meetup_user WHERE meetup_user.meetup_id=? AND meetup_user.user_id=? AND meetup_user.deleted_at IS NULL", [mannayo_id, user_id]);

  db.SELECT(mannayoQuery, [], function(result_mannayo){
    if(result_mannayo.length > 0){
      return res.json({
        state: res_state.error,
        message: '이미 만나요를 요청했습니다.',
        result: {
        }
      })
    }

    var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

    const insertMeetupUserData = {
      meetup_id: mannayo_id,
      user_id: user_id,
      created_at: date,
      updated_at: date
    }
    //만나요 없음 만나요 요청 간다!!
    db.INSERT("INSERT INTO meetup_users SET ?;", insertMeetupUserData, function(result_insert_meetup_users){
      return res.json({
        result:{
          state: 'success'
        }
      });
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: error,
        result:{}
      })
    });
  });
});

router.post("/cancel", function(req, res){
  const mannayo_id = req.body.data.mannayo_id;
  const user_id = req.body.data.user_id;

  var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  db.SELECT("UPDATE meetup_users AS meetup_user SET deleted_at=? WHERE meetup_user.meetup_id=? AND meetup_user.user_id=? AND deleted_at IS NULL", [date, mannayo_id, user_id], function(result_cancel){

    //취소 했는데, 요청수가 0개면 meetup 도 취소한다.
    let mannayoQuery = mysql.format("SELECT count(id) AS count FROM meetup_users WHERE meetup_id=? AND deleted_at IS NULL", mannayo_id);

    db.SELECT(mannayoQuery, [], function(result_mannayo){
      
      if(result_mannayo[0].count === 0){
        //0개 일경우 meetup 도 deleted 한다.
        db.SELECT("UPDATE meetups AS meetup SET deleted_at=? WHERE id=? AND deleted_at IS NULL", [date, mannayo_id], function(result_meetup_cancel){
          return res.json({
            result:{
              state: 'success',
              meetup_count: result_mannayo[0].count
            }
          });
        })
      }else{
        return res.json({
          result:{
            state: 'success',
            meetup_count: result_mannayo[0].count
          }
        });
      }
    })
  });
})

router.post("/collect", function(req, res){
  let creatorQuery = mysql.format("SELECT title, thumbnail_url, id, channel_id FROM creators ORDER BY id DESC;", []);
  let mcnQuery = mysql.format("SELECT title, thumbnail_url, id, channel_id FROM creators ORDER BY id DESC;", []);
  let localQuery = mysql.format("SELECT city.name, COUNT(meetup.id) AS local_meetup_count, meetup.deleted_at FROM cities AS city LEFT JOIN meetups AS meetup ON city.name=meetup.where AND meetup.deleted_at IS NULL GROUP BY city.name ORDER BY local_meetup_count DESC;", []);
  // db.SELECT("")
  db.SELECT_MULITPLEX(creatorQuery+mcnQuery+localQuery, 
    (result) => {

      const _result_data = {
        collect_creator: result[0].concat(),
        collect_mcn: result[1].concat(),
        collect_local: result[2].concat(),
      }
      
      return res.json({
        result: {
          state: res_state.success,
          ..._result_data
        }
      });
  });
});

router.post("/creator/list", function(req, res){
  let creatorQuery = mysql.format("SELECT id, title, thumbnail_url, channel_id FROM creators ORDER BY id DESC;", []);
  db.SELECT(creatorQuery, [], (result) => {
    return res.json({
      result: {
        state: res_state.success,
        creators: result
      }
    })
  })
});


// imageURL: string,
// what: string,
// who: string,
// where: string,
// like: number,
// commentCount: number

router.post("/request/users", function(req, res){
  const meetup_id = req.body.data.meetup_id;

  const meetupUserQuery = mysql.format("SELECT anonymity, user.nick_name, user.name, user.profile_photo_url FROM meetup_users AS meetup_user LEFT JOIN users AS user ON user.id=meetup_user.user_id WHERE meetup_user.meetup_id=? AND meetup_user.deleted_at IS NULL ORDER BY meetup_user.id DESC", [meetup_id]);
  db.SELECT(meetupUserQuery, [], (result_meetup) => {
    return res.json({
      result: {
        state: res_state.success,
        meetup_users: result_meetup,
        meetup_user_length: result_meetup.length
      }
    })
  });
});

router.post("/popualer/thisweek", function(req, res){
  let mannayoQuery = "SELECT meetup.id AS meetup_id FROM meetups AS meetup WHERE deleted_at IS NULL ORDER BY meet_count DESC, meetup.id DESC LIMIT 4";
  // let mannayoQuery = "SELECT * FROM meetups AS meetup";
  db.SELECT(mannayoQuery, [], (result_mannayo_popular) => {
    return res.json({
      result: {
        state: res_state.success,
        result_mannayo_popular
      }
    })
  });
});

router.post("/create/cover/list", function(req, res){
  let mannayoQuery = "SELECT meetup.id AS meetup_id FROM meetups AS meetup WHERE deleted_at IS NULL ORDER BY meet_count DESC, meetup.id DESC LIMIT 4";
  // let mannayoQuery = "SELECT * FROM meetups AS meetup";
  db.SELECT(mannayoQuery, [], (result_mannayo_popular) => {
    return res.json({
      result: {
        state: res_state.success,
        result_mannayo_popular
      }
    })
  });
});



router.post("/get", function(req, res){
  const skip = req.body.data.skip;
  const TAKE = 3;

  const sortType = req.body.data.sortType;

  const listType = req.body.data.listType;
  const target_id = req.body.data.target_id;
  const localTitle = req.body.data.localTitle;

  const user_id = req.body.data.user_id;

  let mannayoQuery = "";

  if(listType === types.mannayo_list.TYPE_MANNAYO_LIST_COLLECT_CREATOR){
    mannayoQuery = mysql.format("SELECT meetup.id AS meetup_id FROM meetups AS meetup WHERE deleted_at IS NULL AND creator_id=? ORDER BY meetup.id DESC LIMIT ? OFFSET ?", [target_id, TAKE, skip]);
  }else if(listType === types.mannayo_list.TYPE_MANNAYO_LIST_COLLECT_MCN){
    mannayoQuery = mysql.format("SELECT meetup.id AS meetup_id FROM meetups AS meetup WHERE deleted_at IS NULL AND creator_id=? ORDER BY meetup.id DESC LIMIT ? OFFSET ?", [target_id, TAKE, skip]);
  }else if(listType === types.mannayo_list.TYPE_MANNAYO_LIST_COLLECT_LOCAL){
    mannayoQuery = mysql.format("SELECT meetup.id AS meetup_id FROM meetups AS meetup WHERE deleted_at IS NULL AND meetup.where=? ORDER BY meetup.id DESC LIMIT ? OFFSET ?", [localTitle, TAKE, skip]);
  }else if(listType === types.mannayo_list.TYPE_MANNAYO_LIST_LIKE_MORE_BUTTON){

    mannayoQuery = mysql.format("SELECT _like.id, meetup.id AS meetup_id FROM likes AS _like LEFT JOIN meetups AS meetup ON _like.target_id=meetup.id WHERE _like.like_type=? AND _like.user_id=? GROUP BY _like.id DESC LIMIT ? OFFSET ?", [types.like.LIKE_MANNAYO, user_id, TAKE, skip]);

  }else if(listType === types.mannayo_list.TYPE_MANNAYO_LIST_FIND_MORE_BUTTON){
    const findWord = "%"+req.body.data.findWord+"%";

    mannayoQuery = mysql.format("SELECT meetup.id AS meetup_id FROM meetups AS meetup LEFT JOIN creators AS creator ON meetup.creator_id=creator.id WHERE meetup.deleted_at IS NULL AND (meetup.what LIKE ? OR meetup.where LIKE ? OR creator.title LIKE ?) ORDER BY meetup.id DESC LIMIT ? OFFSET ?", [findWord, findWord, findWord, TAKE, skip]);

  }else{
    mannayoQuery = mysql.format("SELECT meetup.id AS meetup_id FROM meetups AS meetup WHERE deleted_at IS NULL ORDER BY meetup.id DESC LIMIT ? OFFSET ?", [TAKE, skip]);

    if(sortType === types.mannayo_sort.MANNAYO_SORT_TYPE_POPUALER){
      // mannayoQuery = mysql.format("SELECT meetup.id AS meetup_id FROM meetups AS meetup WHERE deleted_at IS NULL ORDER BY meet_count DESC, meetup.id DESC LIMIT ? OFFSET ?", [TAKE, skip]);
      // mannayoQuery = mysql.format("SELECT meetup.id AS meetup_id, count(meetup_user.meetup_id) AS meetup_user_count FROM meetups AS meetup LEFT JOIN meetup_users as meetup_user ON meetup_user.meetup_id=meetup.id AND meetup_user.deleted_at IS NULL WHERE meetup.deleted_at IS NULL ORDER BY meetup_user_count DESC, meetup.id DESC GROUP BY meetup_id LIMIT ? OFFSET ?", [TAKE, skip]);

      mannayoQuery = mysql.format("SELECT meetup.id AS meetup_id, count(meetup_user.meetup_id) AS meetup_user_count FROM meetups AS meetup LEFT JOIN meetup_users as meetup_user ON meetup_user.meetup_id=meetup.id AND meetup_user.deleted_at IS NULL WHERE meetup.deleted_at IS NULL GROUP BY meetup_id ORDER BY meetup_user_count DESC, meetup.id DESC LIMIT ? OFFSET ?", [TAKE, skip]);
    }
  }

  

  db.SELECT(mannayoQuery, [], (result_mannayo) => {
    return res.json({
      result: {
        state: res_state.success,
        result_mannayo
      }
    })
  });
});

router.post("/get/my/all", function(req, res){
  
  const user_id = req.body.data.user_id;
  const skip = req.body.data.skip;
  const sortType = req.body.data.sortType;
  const TAKE = 3;


  // meetup.id AS meetup_id, creator_id, meet_count, creator.title, creator.thumbnail_url, comments_count, what, meetup.where, deleted_at 

  let mannayoQuery = mysql.format("SELECT meetup.id AS meetup_id, creator_id, meet_count, creator.title, creator.thumbnail_url, comments_count, what, meetup.where FROM meetup_users AS meetup_user LEFT JOIN meetups AS meetup ON meetup_user.meetup_id=meetup.id LEFT JOIN creators AS creator ON creator.id=meetup.creator_id WHERE meetup_user.user_id=? AND meetup.deleted_at IS NULL AND meetup_user.deleted_at IS NULL GROUP BY meetup_user.id ORDER BY meetup.id DESC LIMIT ? OFFSET ?", [user_id, TAKE, skip]);

  // let mannayoQuery = "SELECT * FROM meetups AS meetup";
  db.SELECT(mannayoQuery, [], (result_mannayo) => {
    return res.json({
      result: {
        state: res_state.success,
        sortType: sortType,
        skip: skip,
        result_mannayo
      }
    })
  })
});

router.post("/get/my/register", function(req, res){
  
  const user_id = req.body.data.user_id;
  const skip = req.body.data.skip;
  const sortType = req.body.data.sortType;
  const TAKE = 3;

  let mannayoQuery = mysql.format("SELECT meetup.id AS meetup_id, creator_id, meet_count, creator.title, creator.thumbnail_url, comments_count, what, meetup.where FROM meetup_users AS meetup_user LEFT JOIN meetups AS meetup ON meetup_user.meetup_id=meetup.id LEFT JOIN creators AS creator ON creator.id=meetup.creator_id WHERE meetup.user_id=? AND meetup.deleted_at IS NULL AND meetup_user.deleted_at IS NULL GROUP BY meetup.id ORDER BY meetup.id DESC LIMIT ? OFFSET ?", [user_id, TAKE, skip]);

  // let mannayoQuery = mysql.format("SELECT meetup.id AS meetup_id, creator_id, meet_count, creator.title, creator.thumbnail_url, comments_count, what, meetup.where FROM meetup_users AS meetup_user LEFT JOIN meetups AS meetup ON meetup_user.meetup_id=meetup.id LEFT JOIN creators AS creator ON creator.id=meetup.creator_id WHERE meetup_user.user_id=? AND meetup.deleted_at IS NULL GROUP BY meetup_user.id ORDER BY meetup.id DESC LIMIT ? OFFSET ?", [user_id, TAKE, skip]);

  // let mannayoQuery = "SELECT * FROM meetups AS meetup";
  db.SELECT(mannayoQuery, [], (result_mannayo) => {
    return res.json({
      result: {
        state: res_state.success,
        sortType: sortType,
        skip: skip,
        result_mannayo
      }
    })
  })
});

router.post("/info", function(req, res){
  const mannayo_id = req.body.data.mannayo_id;
  let mannayoQuery = mysql.format("SELECT creator_id, meet_count, creator.title, creator.thumbnail_url, comments_count, what, meetup.where FROM meetups AS meetup LEFT JOIN creators AS creator ON creator.id=meetup.creator_id WHERE meetup.id=?", [mannayo_id]);
  // let mannayoQuery = "SELECT * FROM meetups AS meetup";
  db.SELECT(mannayoQuery, [], (result_mannayo_info) => {
    let mannayoInfoData = result_mannayo_info[0];
    return res.json({
      result: {
        state: res_state.success,
        ...mannayoInfoData
      }
    })
  });

});

router.post("/detail", function(req, res){
  const meetup_id = req.body.data.mannayo_id;
  const user_id = req.body.data.user_id;

  const mannayoQuery = mysql.format("SELECT meetup_user.id AS already_meetup_user_id, meet_count, what, meetup.where, creator.title, creator.thumbnail_url, user.name, user.nick_name FROM meetups AS meetup LEFT JOIN creators AS creator ON meetup.creator_id=creator.id LEFT JOIN users AS user ON user.id=meetup.user_id LEFT JOIN meetup_users AS meetup_user ON meetup_user.meetup_id=? AND meetup_user.user_id=? AND meetup_user.deleted_at IS NULL WHERE meetup.id=? AND meetup.deleted_at IS NULL", [meetup_id, user_id, meetup_id]);

  db.SELECT(mannayoQuery, [], function(result_mannayo){
    if(result_mannayo.length === 0){
      return res.json({
        state: res_state.error,
        message: '만나요가 없습니다.',
        result: {

        }
      })
    }

    const mannayoData = result_mannayo[0];
    return res.json({
      result: {
        state: res_state.success,
        ...mannayoData,
        what: mannayoData.what+"를 하고 싶어요!"
      }
    })
  });
  /*
  const meetup_id = req.body.data.mannayo_id;
  const mannayoQuery = mysql.format("SELECT meet_count, what, meetup.where, creator.title, creator.thumbnail_url, user.name, user.nick_name FROM meetups AS meetup LEFT JOIN creators AS creator ON meetup.creator_id=creator.id LEFT JOIN users AS user ON user.id=meetup.user_id WHERE meetup.id=?", [meetup_id]);

  db.SELECT(mannayoQuery, [], function(result_mannayo){
    console.log(result_mannayo);
    if(result_mannayo.length === 0){
      return res.json({
        state: res_state.error,
        message: '만나요 조회 오류',
        result: {

        }
      })
    }

    const mannayoData = result_mannayo[0];
    return res.json({
      result: {
        state: res_state.success,
        ...mannayoData,
        what: mannayoData.what+"를 하고 싶어요!"
      }
    })
  });
  */
});

router.post("/howisit", function(req, res){
  // let mannayoQuery = "SELECT creator_id, meet_count, creator.title, creator.thumbnail_url, comments_count, what, meetup.where FROM meetups AS meetup LEFT JOIN creators AS creator ON creator.id=meetup.creator_id ORDER BY meet_count DESC Limit 4";
  let mannayoQuery = "SELECT meetup.id AS meetup_id, creator_id, meet_count, creator.title, creator.thumbnail_url, comments_count, what, meetup.where, deleted_at FROM meetups AS meetup LEFT JOIN creators AS creator ON creator.id=meetup.creator_id WHERE deleted_at IS NULL ORDER BY rand() LIMIT 3";
  // let mannayoQuery = "SELECT * FROM meetups AS meetup";
  db.SELECT(mannayoQuery, [], (result_mannayo) => {
    // console.log()
    return res.json({
      result: {
        state: res_state.success,
        result_mannayo
      }
    })
  })
});

// router.post("/create/creator", function(req, res){
//   const channel_id = req.body.data.channel_id;
//   db.SELECT("SELECT")
// })

router.post("/check/overlap", function(req, res){
  const creator_id = req.body.data.creator_id;
  const what = req.body.data.what;
  const where = req.body.data.where;

  let queryMannayoSelect = mysql.format("SELECT id FROM meetups WHERE creator_id=? AND what=? AND `where`=? AND deleted_at IS NULL", [creator_id, what, where]);
  db.SELECT(queryMannayoSelect, [], (result) => {
    if(result.length === 0){
      //0개면 중복된 만나요 없음!!
      return res.json({
        result: {
          state: res_state.success,
          mannayo_id: -1
        }
      })
    }else{
      //중복된 만나요가 있음!!
      return res.json({
        result: {
          state: res_state.success,
          mannayo_id: result[0].id
        }
      })
    }
  });
});

router.post("/create", function(req, res){
  // const creator_id = req.body.data.creator_id;

  // db.INSERT_MULITPLEX(goodsInsertQueryArray, goodsInsertOptionArray, function(result_goods_insert){
  // }
  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
  const user_id = req.body.data.user_id;
  const creator_id = req.body.data.creator_id;
  const state = 1;
  const anonymity = 0;
  const meet_count = 1;
  const comments_count = 0;
  const what = req.body.data.what;
  const where = req.body.data.where;
  const created_at = date;
  const updated_at = date;

  let _data = {
    user_id: user_id,
    creator_id: creator_id,
    state: state,
    anonymity: anonymity,
    meet_count: meet_count,
    comments_count: comments_count,
    what: what,
    where : where,
    created_at: created_at,
    updated_at: updated_at  
  }

  db.INSERT("INSERT INTO meetups SET ?", _data, (result_insert_meetup) => {

    let meetup_id = result_insert_meetup.insertId;

    const meetupUserData = {
      meetup_id: meetup_id,
      user_id: user_id,
      anonymity: 0,
      created_at: date,
      updated_at: date
    };

    db.INSERT("INSERT INTO meetup_users SET ?", meetupUserData, (result_insert_meetup_users) => {
      return res.json({
        result: {
          state: res_state.success,
          meetup_id: meetup_id
        }
      })
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: error,
        result:{}
      })
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: error,
      result:{}
    })
  });
  
});


module.exports = router;