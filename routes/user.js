var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');
var mysql = require('mysql');

const types = use('lib/types.js');

const res_state = use('lib/res_state.js');

const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

// const moment = require('moment');

const Util = use('lib/util.js');

let bcrypt = require('bcrypt');

var jwt = require('jsonwebtoken');
const _jwt = use('lib/jwt.js');
const jwtType = use('lib/jwt_type.js');

var validator = require("email-validator");

// const axios = require('axios');
// const Global_Func = use("lib/global_func.js");
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var Iamport = require('iamport');
var iamport = new Iamport({
  impKey: process.env.IAMPORT_API_KEY,
  impSecret: process.env.IAMPORT_SECRET_KEY
});

const EXPIRE_REFRESH_TOKEN = '365d';
const EXPIRE_ACCESS_TOKEN = '1h';

/*
router.get('/:id/introduce', function(req, res) {
  db.SELECT("SELECT id, name, profile_photo_url, introduce FROM users" + 
            " WHERE id=?", [req.params.id], function(result){
              res.json({
                result
              });
            });
});
*/

function makeAccessToken(id, data, res){
  _jwt.CREATE(jwtType.TYPE_JWT_ACCESS_TOKEN, 
    {
      id: id,
      type: jwtType.TYPE_JWT_ACCESS_TOKEN
    }, 
    EXPIRE_ACCESS_TOKEN, function(value){
    if(value.state === 'error'){
      res.json({
        result: {
          state: 'error',
          message: value.message
        }
      })
    }else{
      res.json({
        result: {
          ...data,
          access_token: value.token
        }
      });
    }
  });
}

//router.post("/any/login/sns", function(req, res){
router.post("/any/login", function(req, res){
  const user_id = req.body.data.id;
  // const email = req.body.data.id;
  // const sns_id = req.body.data.sns_id;
  // const sns_type = req.body.data.sns_type;
  const deviceOS = req.body.data.os;
  let push_token = null;

  if(req.body.data.push_token !== ""){
    push_token = req.body.data.push_token;
  }

  let userQuery = mysql.format("SELECT id FROM users WHERE id=?", [user_id]);

  db.SELECT(userQuery, {}, (result_select_user) => {

    var data = {
      state : 'error',
      message : 'none'
    };

    if(result_select_user.length === 0){
      return res.json({
        state: res_state.error,
        message: '유저 정보 조회 오류',
        result:{}
      })
    }

    var user = result_select_user[0];
    jwt.sign({
      id: user.id,
      type: jwtType.TYPE_JWT_REFRESH_TOKEN
      // email: user.email
    }, 
    process.env.TOKEN_SECRET, 
    { 
      // expiresIn: '60m',
      expiresIn: EXPIRE_REFRESH_TOKEN,
      issuer: process.env.JWT_TOKEN_ISSUER,
      //issuer: 'localhost:8000',
      subject: 'userRefresh'
    }, function(err, token){
      if (err) 
      {
        data.state = 'error';
        data.message = err;
  
        //return res.send(data);
        return res.json({
          result: {
            ...data
          }
        })
      }
      else
      {
        data.state = 'success';
        data.refresh_token = token;
  
        //insert db start
        var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
        const inactive_at = moment_timezone(date).add(1, 'years').format('YYYY-MM-DD HH:mm:ss');
  
        var refreshTokenObject = {
          user_id : user.id,
          refresh_token : token,
          os : deviceOS,
          push_token: push_token,
          created_at : date,
          updated_at: date
        };
  
        let updateUserInfo = {
          updated_at: date,
          inactive_at: inactive_at,
          inactive: false//이건 추후 ui 붙일때 조건으로 작업 해야함 일단 로그인하면 무조건 false 만들게 수정
        }

        db.UPDATE("UPDATE users SET ? WHERE id=?", [updateUserInfo, user_id], (result_user_update) => {
          db.INSERT("INSERT INTO devices SET ? ", refreshTokenObject, function(result){
            makeAccessToken(user.id, data, res);
          }, (error) => {
            return res.json({
              state: res_state.error,
              message: error,
              result:{}
            })
          });
        }, (result_user_update_error) => {
          return res.json({
            state: res_state.error,
            message: '유저 정보 업데이트 오류',
            result:{}
          })
        })
      }
    });
  })
});

router.post("/info", function(req, res){
  const user_id = req.body.data.user_id;
  let queryMyInfo = mysql.format("SELECT is_adult_certification, id AS user_id, email, name, nick_name, profile_photo_url, gender, age, facebook_v1_id, google_id, kakao_id, contact, is_withdrawal, is_certification, advertising FROM users WHERE id=?", user_id);
  db.SELECT(queryMyInfo, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        userInfo: result[0]
      }
    })
  })
});

router.post('/info/userid', function(req, res){
  const target_user_id = req.body.data.target_user_id;
  let queryMyInfo = mysql.format("SELECT id AS user_id, email, name, nick_name, profile_photo_url, contact FROM users WHERE id=?", target_user_id);
  db.SELECT(queryMyInfo, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        userInfo: result[0]
      }
    })
  })
})

router.post('/any/info/userid', function(req, res){
  //공개 api 이기 때문에 데이터를 조심해야함
  const target_user_id = req.body.data.target_user_id;
  let queryMyInfo = mysql.format("SELECT name, nick_name, profile_photo_url FROM users WHERE id=?", target_user_id);
  db.SELECT(queryMyInfo, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        userInfo: result[0]
      }
    })
  })
})

router.post("/get/nickname", function(req, res){
  const user_id = req.body.data.user_id;
  const query = mysql.format("SELECT nick_name, name FROM users WHERE id=?", user_id);
  db.SELECT(query, {}, function(result_select){
    return res.json({
      result: {
        state: res_state.success,
        ...result_select[0]
      }
    })
  })
});

router.post("/get/profileurl", function(req, res){
  const user_id = req.body.data.user_id;
  const query = mysql.format("SELECT profile_photo_url FROM users WHERE id=?", user_id);
  db.SELECT(query, {}, function(result_select){
    return res.json({
      result: {
        state: res_state.success,
        ...result_select[0]
      }
    })
  })
});

router.post("/save/profile", function(req, res){
  const user_id = req.body.data.user_id;
  const nick_name = req.body.data.nick_name;

  db.UPDATE("UPDATE users AS user SET nick_name=? WHERE user.id=?;", [nick_name, user_id], function(result_update_user){
    return res.json({
      result:{
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: error,
      result:{}
    })
  });
});

router.post("/order/count", function(req, res){
  const user_id = req.body.data.user_id;
  // console.log(nowDate);
  // return res.json({});

  //ORDER_STATE_PAY
  //ORDER_STATE_APP_PAY_COMPLITE

  // let queryOrder = mysql.format("SELECT COUNT(_order.id) AS order_count FROM orders AS _order LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id WHERE _order.user_id=? AND _order.ticket_id IS NOT NULL AND ticket.show_date <> ? AND (_order.state=? OR _order.state=?) GROUP BY _order.id ORDER BY ticket.show_date ASC", [user_id, '0000-00-00 00:00:00', types.order.ORDER_STATE_PAY, types.order.ORDER_STATE_APP_PAY_COMPLITE]);

  let queryOrder = mysql.format("SELECT _order.id, project.title, ticket.show_date, _order.project_id FROM orders AS _order LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN tickets AS ticket ON _order.ticket_id=ticket.id WHERE _order.user_id=? AND _order.ticket_id IS NOT NULL AND ticket.show_date <> ? AND (_order.state=? OR _order.state=?) GROUP BY _order.id ORDER BY ticket.show_date ASC", [user_id, '0000-00-00 00:00:00', types.order.ORDER_STATE_PAY, types.order.ORDER_STATE_APP_PAY_COMPLITE]);

  db.SELECT(queryOrder, {}, (result_select_order) => {
    let _orders = [];
    // console.log(result_select_order);
    for(let i = 0 ; i < result_select_order.length ; i++){
      const _data = result_select_order[i];
      let lostShowDate = moment_timezone(_data.show_date).format('YYYY-MM-DD 23:59:59');
      // console.log(_data);
      // console.log(lostShowDate);
      if(!Util.isTicketShowFinished(lostShowDate)){
        _orders.push(_data);
      }
    }

    return res.json({
      result:{
        list: _orders,
        order_count: _orders.length
      }
    });
  })
  
});

// router.post("/any/check/user", function(req, res){
//   const contact = req.body.data.contact;
//   const email = req.body.data.email;
  
// });

router.post("/any/callback/naverlogin", function(req, res){
  return res.json({
    state: res_state.success
  })
})

router.get("/any/callback/kakaologin", function(req, res){
  return res.json({
    state: res_state.success
  })
})

router.post("/any/email/validator", function(req, res){
  const email = req.body.data.email;
  let validate = validator.validate(email);
  return res.json({
    result:{
      state: types.success,
      validate: validate
    }
  });
  // console.log("bbbbbbb");
});

router.post("/any/find/email", function(req, res){
  const name = req.body.data.name;
  const contact = req.body.data.contact;

  let queryUser = mysql.format("SELECT email, facebook_v1_id, google_id, kakao_id, apple_id FROM users WHERE name=? AND contact=? AND deleted_at IS NULL", [name, contact]);
  db.SELECT(queryUser, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          type: types.find_email.none
        }
      })
    }

    const userData = result[0];

    let type = "";
    let snsName = "";
    let email = userData.email;
    if(email.indexOf("_crowdticket_app") >= 0){
      type = types.find_email.sns;
      if(userData.facebook_v1_id){
        snsName = "페이스북";
      }else if(userData.google_id){
        snsName = "구글";
      }else if(userData.kakao_id){
        snsName = "카카오";
      }else if(userData.apple_id){
        snsName = "애플";
      }
    }else{
      const hideEmail = Util.replaceEmail(email);
      console.log(hideEmail);
      type = types.find_email.email;
      email = hideEmail;
    }

    return res.json({
      result:{
        state: res_state.success,
        type: type,
        email: email,
        snsName: snsName
      }
    })
  });
});

router.post("/push_token/update", function(req, res){
  const user_id = req.body.data.user_id;
  const refresh_token = req.body.data.refresh_token_push_check;
  const push_token = req.body.data.push_token;

  
  // console.log(refresh_token);
  // console.log(push_token);

  db.UPDATE("UPDATE devices SET push_token=? WHERE user_id=? AND refresh_token=?", [push_token, user_id, refresh_token], (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  });
  // const 
});

router.post("/logout", function(req, res){
  const user_id = req.body.data.user_id;
  const refresh_token = req.body.data.token;

  // console.log("@#$@#$#@$");
  // console.log(req.body.data);
  // console.log(refresh_token);

  db.DELETE("DELETE FROM devices WHERE user_id=? AND refresh_token=?", [user_id, refresh_token], 
  (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    });
  })
  
});

router.post("/any/logout", function(req, res){
  // const user_id = req.body.data.user_id;
  const refresh_token = req.body.data.token;

  // console.log("@#$@#$#@$");
  // console.log(req.body.data);
  // console.log(refresh_token);

  db.DELETE("DELETE FROM devices WHERE refresh_token=?", [refresh_token], 
  (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    });
  })
})

router.post('/test', function(req, res){
  return res.json({
    result: {
      state: res_state.success,
      message: '오ㅓ옙'
    }
  })
})

router.post("/device/list", function(req, res){
  const user_id = req.body.data.user_id;
  
  const queryDevices = mysql.format("SELECT COUNT(id) AS device_count FROM devices WHERE user_id=?", [user_id]);

  db.SELECT(queryDevices, {}, (result) => {

    return res.json({
      result: {
        state: res_state.success,
        device_count: result[0].device_count
      }
    })
  })
});

router.post("/device/other/logout", function(req, res){
  const user_id = req.body.data.user_id;
  const refresh_token = req.body.data.token;

  db.DELETE("DELETE FROM devices WHERE user_id=? AND refresh_token NOT IN (?)", [user_id, refresh_token], 
  (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    });
  })

});

router.post("/out", function(req, res){
  const user_id = req.body.data.user_id;
  
  let querySelectUser = mysql.format("SELECT email FROM users WHERE id=?", user_id);

  db.SELECT(querySelectUser, {}, (result_select_user) => {
    if(result_select_user.length === 0){
      return res.json({
        state: res_state.error,
        message: "유저 정보가 없습니다."
      })
    }

    const user = result_select_user[0];
    var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

    db.DELETE("DELETE FROM devices WHERE user_id=?", [user_id], 
    (result_delete_devices) => {

      let updateUserData = {
        email: "delete"+user_id,
        facebook_v1_id: null,
        google_id: null,
        kakao_id: null,
        apple_id: null,
        name: '',
        contact: '',
  
        deleted_at: date
      };

      db.UPDATE("UPDATE users SET email=?, facebook_v1_id=?, google_id=?, kakao_id=?, apple_id=?, name=?, contact=?, deleted_at=?", [updateUserData.email, updateUserData.facebook_v1_id, updateUserData.google_id, updateUserData.kakao_id, updateUserData.apple_id, updateUserData.name, updateUserData.contact, updateUserData.deleted_at], (result_update) => {
        return res.json({
          result:{
            state: res_state.success
          }
        });
      })
    })
  });  
});

router.post("/chat/room/info", function(req, res){
  const room_id = req.body.data.room_id;
  // const user_id = req.body.data.user_id;

  let selectQuery = mysql.format("SELECT room.target_id AS target_id, room.id AS room_id, room.expire, room.room_name, project.title, project.poster_renew_url FROM rooms AS room LEFT JOIN projects AS project ON room.target_id=project.id WHERE room.id=?", [room_id]);

  db.SELECT(selectQuery, {}, (result) => {
    // console.log("###########");
    // console.log(result);
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: "채팅방 정보 조회 에러",
        result:{}
      })
    }

    let data = result[0];
    data.room_title = data.title + " 오픈 채팅방";
    data.room_item_title = data.title + " 기간한정 채팅방";

    return res.json({
      result: {
        state: res_state.success,
        ...data
      }
    })
  })
})

router.post("/chat/room/isenter", function(req, res){
  const user_id = req.body.data.user_id;
  const room_id = req.body.data.room_id;

  let selectQuery = mysql.format("SELECT id AS chat_user_id FROM chat_users WHERE room_id=? AND user_id=?", [room_id, user_id]);

  db.SELECT(selectQuery, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result:{
          state: res_state.success,
          chat_user_id: null
        }
      })
    }

    let data = result[0];
    return res.json({
      result:{
        state: res_state.success,
        chat_user_id: data.chat_user_id
      }
    })
  })

})

router.post("/chat/list", function(req, res){
  const user_id = req.body.data.user_id;

  const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  // let selectQuery = mysql.format("SELECT chat_user.id AS chat_user_id, room.id, room.id AS room_id, room.expire, target_id, room_name, project.title, project.poster_renew_url FROM rooms AS room LEFT JOIN orders AS _order ON room.target_id=_order.project_id LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN chat_users AS chat_user ON chat_user.user_id=_order.user_id AND chat_user.room_id=room.id WHERE _order.user_id=? AND (_order.state=? OR _order.state=? OR _order.state=? OR _order.state=? OR _order.state=?) GROUP BY room.id", [user_id, types.order.ORDER_STATE_PAY, types.order.ORDER_STATE_PAY_NO_PAYMENT, types.order.ORDER_STATE_PAY_SCHEDULE, types.order.ORDER_STATE_APP_PAY_COMPLITE, types.order.ORDER_STATE_APP_PAY_IAMPORT_WEBHOOK_VERIFY_COMPLITE]);

  let selectQuery = mysql.format("SELECT chat_user.id AS chat_user_id, room.id, room.id AS room_id, room.expire, target_id, room_name, project.title, project.poster_renew_url FROM rooms AS room LEFT JOIN orders AS _order ON room.target_id=_order.project_id LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN chat_users AS chat_user ON chat_user.user_id=_order.user_id AND chat_user.room_id=room.id WHERE _order.user_id=? AND room.expire > ? AND (_order.state=? OR _order.state=? OR _order.state=? OR _order.state=? OR _order.state=?) GROUP BY room.id", [user_id, date, types.order.ORDER_STATE_PAY, types.order.ORDER_STATE_PAY_NO_PAYMENT, types.order.ORDER_STATE_PAY_SCHEDULE, types.order.ORDER_STATE_APP_PAY_COMPLITE, types.order.ORDER_STATE_APP_PAY_IAMPORT_WEBHOOK_VERIFY_COMPLITE]);

  db.SELECT(selectQuery, {}, (result) => {
    // console.log("###########");
    // console.log(result);

    for(let i = 0 ; i < result.length ; i++){
      result[i].room_title = result[i].title + " 오픈 채팅방";

      result[i].room_item_title = result[i].title + " 기간한정 채팅방";
    }
    
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })

  /*
  const user_id = req.body.data.user_id;

  let selectQuery = mysql.format("SELECT chat_user.id AS chat_user_id, room.id, room.id AS room_id, room.expire, target_id, room_name, project.title, project.poster_renew_url FROM rooms AS room LEFT JOIN orders AS _order ON room.target_id=_order.project_id LEFT JOIN projects AS project ON _order.project_id=project.id LEFT JOIN chat_users AS chat_user ON chat_user.user_id=_order.user_id AND chat_user.room_id=room.id WHERE _order.user_id=? AND (_order.state=? OR _order.state=? OR _order.state=? OR _order.state=? OR _order.state=?) GROUP BY room.id", [user_id, types.order.ORDER_STATE_PAY, types.order.ORDER_STATE_PAY_NO_PAYMENT, types.order.ORDER_STATE_PAY_SCHEDULE, types.order.ORDER_STATE_APP_PAY_COMPLITE, types.order.ORDER_STATE_APP_PAY_IAMPORT_WEBHOOK_VERIFY_COMPLITE]);

  db.SELECT(selectQuery, {}, (result) => {
    // console.log("###########");
    // console.log(result);

    for(let i = 0 ; i < result.length ; i++){
      result[i].room_title = result[i].title + " 오픈 채팅방";

      result[i].room_item_title = result[i].title + " 기간한정 채팅방";
    }
    
    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
  */
});

router.post("/update", function(req, res){
  const user_id = req.body.data.user_id;
  const name = req.body.data.name;
  const nick_name = req.body.data.nick_name;

  const password_now = req.body.data.password_now;
  const password_new = req.body.data.password_new;
  const password_new_check = req.body.data.password_new_check;

  if(password_now !== ''){
    //패스워드 값이 있을때
    if(password_new !== password_new_check){
      return res.json({
        state: res_state.error,
        message: '새 비밀번호가 일치하지 않습니다.',
        result:{}
      })
    }

    const myPlaintextPassword = password_now;
    let querySelectUser = mysql.format("SELECT password FROM users WHERE id=?", user_id);
    db.SELECT(querySelectUser, {}, function(result){
      //var finalNodeGeneratedHash = result[0].password.replace('$2y$', '$2b$');
      var data = {
        state : 'error',
        message : 'none'
      };
      
      if(result.length <= 0)
      {
        return res.json({
          state: res_state.error,
          message: "아이디가 존재하지 않습니다.",
          result:{}
        })
      }

      var user = result[0];

      var finalNodeGeneratedHash = user.password;
      if(finalNodeGeneratedHash.indexOf('$2y$') === 0)
      {
        finalNodeGeneratedHash = finalNodeGeneratedHash.replace('$2y$', '$2b$');
      }

      bcrypt.compare(myPlaintextPassword, finalNodeGeneratedHash, function(error, result){
        if(result){

          const saltRounds = 10 ;   
          // const myPlaintextPassword = password_now ;   
          const someOtherPlaintextPassword = ' not_bacon ' ;

          bcrypt.hash(password_new, saltRounds, function(err, hash) {
            // Store hash in your password DB.
            let convertToPhpHash = hash;
            if(convertToPhpHash.indexOf('$2b$') === 0)
            {
              convertToPhpHash = convertToPhpHash.replace('$2b$', '$2y$');
            }            
            
            db.UPDATE("UPDATE users AS user SET nick_name=?, name=?, password=? WHERE user.id=?", [nick_name, name, convertToPhpHash, user_id], 
            (result) => {
              return res.json({
                result:{
                  state: res_state.success
                }
              })
            });
          });
        }else{
          return res.json({
            state: res_state.error,
            message: '비밀번호가 틀렸습니다.',
            result:{}
          })
        }
      });
    });
  }else{

    //패스워드 수정은 아님.
    db.UPDATE("UPDATE users AS user SET nick_name=?, name=? WHERE user.id=?", [nick_name, name, user_id], 
    (result) => {
      return res.json({
        result:{
          state: res_state.success
        }
      })
    });
  }
});

router.post("/contact", function(req, res){

  let ask = req.body.data.ask;
  let from = req.body.data.from;

  let content = Util.getReplaceBRTagToEnter(ask);
  
  let _html = 
  `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>크티 문의 내용</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    </head>
    <body style="margin:0%">
      ${content}
    </body>
  </html>
  `


  const msg = {
    to: process.env.EMAIL_FROM,
    from: from,
    subject: '크티 앱 문의 메일',
    html: _html,
  };
  
  sgMail.send(msg).then((result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  }).catch((error) => {
    return res.json({
      state: res_state.error,
      message: '메일 전송 오류.', 
      result:{}
    })
  });
  
});

router.post("/push/get", function(req, res){
  const user_id = req.body.data.user_id;
  const querySelectPush = mysql.format("SELECT chatting, notice, advertising FROM pushs WHERE user_id=?", user_id);
  db.SELECT(querySelectPush, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '푸시 정보가 없습니다.',
        result:{}
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        ...data
      }
    })
  })
});

router.post("/push/update", function(req, res){
  const user_id = req.body.data.user_id;

  const querySelectPush = mysql.format("SELECT id, chatting, notice, advertising FROM pushs WHERE user_id=?", user_id);
  db.SELECT(querySelectPush, {}, (result_select_push) => {
    if(result_select_push.length === 0){
      let advertising = false;
      if(req.body.data.advertising){
        advertising = req.body.data.advertising;
      }

      let date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

      //insert
      const insertData = {
        user_id: user_id,
        chatting: true,
        notice: true,
        advertising: advertising,
        advertising_at: date,
        created_at: date,
        updated_at: date
      }

      db.INSERT("INSERT INTO pushs SET ?", insertData, (result_insert) => {
        return res.json({
          result:{
            state: res_state.success
          }
        })
      }, (error) => {
        
      })
    }else{
      //update
      let date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

      const resultSelectPushData = result_select_push[0];

      let chatting = resultSelectPushData.chatting? true : false;
      let notice = resultSelectPushData.notice? true : false;
      let advertising = resultSelectPushData.advertising? true : false;

      let isChangeAdvertising = false;
      let isChangeChatting = false;

      if(req.body.data.chatting !== undefined){
        if(chatting !== req.body.data.chatting){
          isChangeChatting = true;
        }

        chatting = req.body.data.chatting;
      }
    
      if(req.body.data.notice !== undefined){
        notice = req.body.data.notice;
      }

      if(req.body.data.advertising !== undefined){
        if(advertising !== req.body.data.advertising){
          isChangeAdvertising = true;
        }
        advertising = req.body.data.advertising;
      }
      
      db.UPDATE("UPDATE pushs SET chatting=?, notice=?, advertising=?, updated_at=?, advertising_at=? WHERE user_id=?", [chatting, notice, advertising, date, date, user_id], (result_update) => {

        if(isChangeChatting){
          //채팅이 바꼈을경우 채팅 푸시 업데이트 해준다.
          db.UPDATE("UPDATE chat_users SET push=? WHERE user_id=?", [chatting, user_id], (result_update_chatting) => {
            return res.json({
              result:{
                state: res_state.success,
                isChangeAdvertising: isChangeAdvertising,
                advertising_at: date,
                advertising: advertising
              }
            })
          })
        }else{
          return res.json({
            result:{
              state: res_state.success,
              isChangeAdvertising: isChangeAdvertising,
              advertising_at: date,
              advertising: advertising
            }
          })
        }

      });
    }
  })
});

router.post("/push/notice", function(req, res){
  const user_id = req.body.data.user_id;

  const querySelectPush = mysql.format("SELECT notice FROM pushs WHERE user_id=?", user_id);
  db.SELECT(querySelectPush, {}, (result_select_push) => {
    if(result_select_push.length === 0){
      return res.json({
        state: res_state.error,
        message: '공지 푸시 에러',
        result:{}
      })
    }

    return res.json({
      result:{
        state: res_state.success,
        notice: result_select_push[0].notice
      }
    })
  });
});

router.post("/push/chatting/room", function(req, res){
  const chat_user_id = req.body.data.chat_user_id;

  const querySelectChatUsers = mysql.format("SELECT push FROM chat_users WHERE id=?", chat_user_id);
  db.SELECT(querySelectChatUsers, {}, (result_select_chat_user) => {
    if(result_select_chat_user.length === 0){
      return res.json({
        state: res_state.error,
        message: '채팅룸 푸시 셋팅 에러',
        result:{}
      })
    }

    return res.json({
      result:{
        state: res_state.success,
        push: result_select_chat_user[0].push
      }
    })
  });
});

router.post("/push/chatting/room/update", function(req, res){
  const chat_user_id = req.body.data.chat_user_id;
  const isPush = req.body.data.isPush;
  db.UPDATE("UPDATE chat_users SET push=? WHERE id=?", [isPush, chat_user_id], (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  });
});

router.post("/isadmin", function(req, res){
  const user_id = req.body.data.user_id;
  if(!user_id){
    return res.json({
      result: {
        state: res_state.success,
        isAdmin: false
      }
    })
  }

  const querySelect = mysql.format("SELECT id FROM admins WHERE user_id=?", user_id);

  db.SELECT(querySelect, {}, (result) => {
    let isAdmin = false;
    if(!result || result.length === 0){
      isAdmin = false;
    }else{
      isAdmin = true;
    }

    return res.json({
      result: {
        state: res_state.success,
        isAdmin: isAdmin
      }
    })

  })
})

router.post("/any/login/email/web", function(req, res){
  var userEmail = req.body.data.email;
  const saltRounds = 10 ;   
  const myPlaintextPassword = req.body.data.password;
  
  if(userEmail === ""){
    return res.json({
      state: res_state.error,
      message: "이메일을 입력해주세요",
      result:{}
    })
  }

  if(myPlaintextPassword === ""){
    return res.json({
      state: res_state.error,
      message: "비밀번호를 입력해주세요",
      result:{}
    })
  }

  db.SELECT("SELECT email, password, id, nick_name, name, age, gender, facebook_v1_id, google_id, kakao_id, apple_id, contact, inactive, profile_photo_url FROM users WHERE email = BINARY(?)", [userEmail], function(result){
      //var finalNodeGeneratedHash = result[0].password.replace('$2y$', '$2b$');
      
      // var data = {
      //   state : 'error',
      //   message : 'none'
      // };
      
      if(result.length <= 0)
      {
        return res.json({
          result:{
            state: res_state.success,
            state_login: 'error',
            message: '아이디가 없습니다. 아이디를 확인해주세요.',
            sns_array: [],
            data: {}
          }
        });
      }

      var user = result[0];

      var finalNodeGeneratedHash = user.password;
      if(finalNodeGeneratedHash.indexOf('$2y$') === 0)
      {
        finalNodeGeneratedHash = finalNodeGeneratedHash.replace('$2y$', '$2b$');
      }

      bcrypt.compare(myPlaintextPassword, finalNodeGeneratedHash, function(error, result){
        if(result){
          return res.json({
            result:{
              state: res_state.success,
              state_login: 'success',
              sns_array: [],
              data: {
                ...user
              }
              
            }
          });
        }else{
          // data.state = 'error';
          // data.message = '비밀번호가 틀렸습니다.';

          //혹시 sns로 가입되어 있는지 확인해준다.
          let sns_array = [];
          if(user.facebook_v1_id === null && user.google_id === null && user.kakao_id === null && user.apple_id === null){
            // _message = "비밀번호가 틀렸습니다."
          }else{
            // _message = "비밀번호가 틀렸습니다. 해당 이메일은";

            if(user.kakao_id){
              sns_array.push(types.login.kakao)
            }

            if(user.google_id){
              sns_array.push(types.login.google)
            }

            if(user.facebook_v1_id){
              sns_array.push(types.login.facebook)
            }
  
            // if(user.apple_id){
            //   _message+= " 애플";
            // }
          }

          return res.json({
            result:{
              state: res_state.success,
              state_login: 'error',
              message: '비밀번호가 틀렸습니다. 비밀번호를 확인해주세요',
              sns_array: sns_array,
              data: {
                
              }
            }
          });
        }
      });
  });
});

router.post("/any/email/check/web", function(req, res){
  const email = req.body.data.email;

  let queryUser = mysql.format("SELECT id, email, facebook_v1_id, google_id, kakao_id, apple_id FROM users WHERE email=BINARY(?)", email);

  db.SELECT(queryUser, {}, (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: '가입되어 있지 않는 이메일 입니다.',
        result: {
        }
      })
    }

    const userData = result[0];
    return res.json({
      result: {
        state: res_state.success
      }
    })
  });
});

router.post("/any/check/email/sns/web", function(req, res){  
  const email = req.body.data.email;
  //여기 facebook_id 는 이메일이 Null일때 체크 하므로 지우면 안됨
  let queryUser = mysql.format("SELECT id, email, facebook_id, facebook_v1_id, google_id, kakao_id, apple_id FROM users WHERE email=BINARY(?)", email);
  db.SELECT(queryUser, {}, (result) => {
    if(result.length === 0){
      //없는 email
      return res.json({
        result: {
          id: null,
          state: res_state.success
        }
      })
    }

    const userData = result[0];
    let sns_array = [];
    if(userData.facebook_v1_id){
      sns_array.push(types.login.facebook);
    }

    if(userData.google_id){
      sns_array.push(types.login.google);
    }

    if(userData.kakao_id){
      sns_array.push(types.login.kakao);
    }

    if(sns_array.length === 0){
      if(userData.facebook_id){
        //예전 facebook 가입자면 걍 통과 
        return res.json({
          result: {
            id: null,
            state: res_state.success
          }
        })
      }
    }

    return res.json({
      result: {
        id: userData.id,
        state: res_state.success,
        sns_array: sns_array
      }
    })
    
  })
});

router.post("/any/check/snsid", function(req, res){
  const sns_id = req.body.data.sns_id;
  const sns_type = req.body.data.sns_type;

  let queryUser = '';
  if(sns_type === 'FACEBOOK'){
    queryUser = mysql.format("SELECT id, inactive FROM users WHERE facebook_v1_id=?", sns_id);
  }else if(sns_type === 'GOOGLE'){
    queryUser = mysql.format("SELECT id, inactive FROM users WHERE google_id=?", sns_id);
  }else if(sns_type === 'KAKAO'){
    queryUser = mysql.format("SELECT id, inactive FROM users WHERE kakao_id=?", sns_id);
  }

  if(queryUser === ''){
    return res.json({
      state: res_state.error,
      message: 'sns id 조회 에러',
      result: {}
    })
  }

  db.SELECT(queryUser, {}, (result) => {
    if(result.length === 0){
      //없는 email
      return res.json({
        result: {
          id: null,
          inactive: false,
          state: res_state.success
        }
      })
    }

    const userData = result[0];
    return res.json({
      result: {
        id: userData.id,
        inactive: userData.inactive,
        state: res_state.success
      }
    })
    
  })
})

router.post("/any/email/join/check/web", function(req, res){
  const email = req.body.data.email;

  let queryUser = mysql.format("SELECT id, email, facebook_v1_id, google_id, kakao_id, apple_id FROM users WHERE email=BINARY(?)", email);

  db.SELECT(queryUser, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          id: null,
          state: res_state.success,
          sns_array: []
        }
      })
    }

    const user = result[0];

    let sns_array = [];
    if(user.facebook_v1_id === null && user.google_id === null && user.kakao_id === null && user.apple_id === null){
      // _message = "비밀번호가 틀렸습니다."
    }else{
      // _message = "비밀번호가 틀렸습니다. 해당 이메일은";

      if(user.kakao_id){
        sns_array.push(types.login.kakao)
      }

      if(user.google_id){
        sns_array.push(types.login.google)
      }

      if(user.facebook_v1_id){
        sns_array.push(types.login.facebook)
      }

      // if(user.apple_id){
      //   _message+= " 애플";
      // }
    }

    return res.json({
      // state: res_state.error,
      // message: '이미 가입되어 있는 이메일 입니다.',
      
      result: {
        state: res_state.success,
        id: user.id,
        sns_array: sns_array,
      }
    })
  });
});

router.post("/info/update/web", function(req, res){
  const user_id = req.body.data.user_id;
  if(user_id === undefined || user_id === null){
    return res.json({
      state: res_state.error,
      message: '유저 id가 없습니다. 새로고침 후 이용 바랍니다.',
      result:{}
    })
  }
  
  let name = req.body.data.name;
  let nick_name = req.body.data.nick_name;
  // let contact = req.body.data.contact;
  let gender = req.body.data.gender;
  let age = req.body.data.age;

  const ori_advertising = req.body.data.ori_advertising;

  let data = {
    name: name,
    nick_name: nick_name,
    gender: gender,
    age: age,
  }

  if(ori_advertising !== undefined){
    let advertising = req.body.data.advertising;

    if(ori_advertising !== advertising){
      data = {
        ...data,
        advertising: advertising,
        advertising_at: moment_timezone().format('YYYY-MM-DD HH:mm:ss')
      }
    }
  }  

  db.UPDATE("UPDATE users AS user SET ? WHERE user.id=?;", [data, user_id], 
  (result) => {
    return res.json({
      result: {
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '유저 정보 업데이트 에러',
      result: {}
    })
  })

})

router.post("/update/password", function(req, res){
  const user_id = req.body.data.user_id;
  // const name = req.body.data.name;
  // const nick_name = req.body.data.nick_name;

  const password_now = req.body.data.password_now;
  const password_new = req.body.data.password_new;
  const password_new_check = req.body.data.password_new_check;

  //패스워드 값이 있을때
  if(password_new !== password_new_check){
    return res.json({
      state: res_state.error,
      message: '새 비밀번호가 일치하지 않습니다.',
      result:{}
    })
  }

  const myPlaintextPassword = password_now;
  let querySelectUser = mysql.format("SELECT password FROM users WHERE id=?", user_id);
  db.SELECT(querySelectUser, {}, function(result){
    //var finalNodeGeneratedHash = result[0].password.replace('$2y$', '$2b$');
    var data = {
      state : 'error',
      message : 'none'
    };
    
    if(result.length <= 0)
    {
      return res.json({
        state: res_state.error,
        message: "아이디가 존재하지 않습니다.",
        result:{}
      })
    }

    var user = result[0];

    var finalNodeGeneratedHash = user.password;
    if(finalNodeGeneratedHash.indexOf('$2y$') === 0)
    {
      finalNodeGeneratedHash = finalNodeGeneratedHash.replace('$2y$', '$2b$');
    }

    bcrypt.compare(myPlaintextPassword, finalNodeGeneratedHash, function(error, result){
      if(result){

        const saltRounds = 10 ;   
        // const myPlaintextPassword = password_now ;   
        const someOtherPlaintextPassword = ' not_bacon ' ;

        bcrypt.hash(password_new, saltRounds, function(err, hash) {
          // Store hash in your password DB.
          let convertToPhpHash = hash;
          if(convertToPhpHash.indexOf('$2b$') === 0)
          {
            convertToPhpHash = convertToPhpHash.replace('$2b$', '$2y$');
          }            
          
          db.UPDATE("UPDATE users AS user SET password=? WHERE user.id=?", [convertToPhpHash, user_id], 
          (result) => {
            return res.json({
              result:{
                state: res_state.success
              }
            })
          });
        });
      }else{
        return res.json({
          state: res_state.error,
          message: '비밀번호가 틀렸습니다.',
          result:{}
        })
      }
    });
  });
});

router.post("/update/sns/id/delete", function(req, res){
  const user_id = req.body.data.user_id;
  const sns_type = req.body.data.sns_type;

  if(user_id === undefined || user_id === null || user_id === ''){
    return res.json({
      state: res_state.error,
      message: '유저 정보 없음. 새로고침 후 다시 시도바랍니다.',
      result:{}
    })
  }

  let target_id = '';
  if(sns_type === 'KAKAO'){
    target_id = 'kakao_id';
  }
  else if(sns_type === 'GOOGLE'){
    target_id = 'google_id';
  }
  else if(sns_type === 'FACEBOOK'){
    target_id = 'facebook_v1_id';
  }

  if(target_id === ''){
    return res.json({
      state: res_state.error,
      message: 'sns type 오류',
      result:{}
    })
  }

  db.UPDATE(`UPDATE users AS user SET ${target_id}=? WHERE user.id=?`, [null, user_id], 
  (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: 'user id 가 없음.',
        result:{}
      })
    }

    return res.json({
      result: {
        state: res_state.success
      }
    })

  }, (error) => {
    return res.json({
      state: res_state.error,
      message: 'sns id update 해제 오류',
      result:{}
    })
  })
})

router.post("/update/sns/id", function(req, res){
  const user_id = req.body.data.user_id;
  const sns_type = req.body.data.sns_type;
  const sns_id = req.body.data.sns_id;

  if(user_id === undefined || user_id === null || user_id === ''){
    return res.json({
      state: res_state.error,
      message: '유저 정보 없음. 새로고침 후 다시 시도바랍니다.',
      result:{}
    })
  }

  let target_id = '';
  if(sns_type === 'KAKAO'){
    target_id = 'kakao_id';
  }
  else if(sns_type === 'GOOGLE'){
    target_id = 'google_id';
  }
  else if(sns_type === 'FACEBOOK'){
    target_id = 'facebook_v1_id';
  }

  if(target_id === ''){
    return res.json({
      state: res_state.error,
      message: 'sns type 오류',
      result:{}
    })
  }

  db.UPDATE(`UPDATE users AS user SET ${target_id}=? WHERE user.id=?`, [sns_id, user_id], 
  (result) => {
    if(result.length === 0){
      return res.json({
        state: res_state.error,
        message: 'user id 가 없음.',
        result:{}
      })
    }

    return res.json({
      result: {
        state: res_state.success
      }
    })

  }, (error) => {
    if(error.error_code === 'ER_DUP_ENTRY'){
      return res.json({
        state: res_state.error,
        message: '이미 동기화된 계정이 있습니다. 해당 SNS로 로그인 해주세요.',
        result:{}
      })
    }else{
      return res.json({
        state: res_state.error,
        message: 'sns id update 오류',
        result:{}
      })  
    }
  })
})

router.post("/withdrawal", function(req, res){
  const user_id = req.body.data.user_id;
  const reason = req.body.data.reason;

  if(user_id === undefined || user_id === null || user_id === ''){
    return res.json({
      state: res_state.error,
      message: '유저 id 에러. 해당 문제가 지속될 경우 크티에 연락주세요!',
      result:{}
    })
  }

  //상점주 인지 확인한다.
  const querySelect = mysql.format("SELECT id FROM stores WHERE user_id=?", [user_id]);
  db.SELECT(querySelect, {}, (result_store) => {
    if(result_store.length > 0){
      return res.json({
        state: res_state.error,
        message: '회원님은 상점주 이십니다. 탈퇴를 원하시면 고객센터로 문의 바랍니다.',
        result: {}
      })
    }

    var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
    var withdrawal = {
      user_id : user_id,
      reason : reason,
      created_at : date,
    };

    db.INSERT("INSERT INTO withdrawals SET ? ", withdrawal, function(result){

      const userInfo = {
        email: `delete_${user_id}`,
        facebook_id: null,
        facebook_v1_id: null,
        google_id: null,
        kakao_id: null,
        apple_id: null,

        name: '',
        nick_name: '',
        contact: '',
        age: null,
        gender: null,
        profile_photo_url: null,
        profile_photo_s3_key: null,
        bank: '',
        account: '',
        account_holder: '',
        introduce: '',
        updated_at: date,
        is_withdrawal: true,
        inactive_at: null,
        inactive: false,
        is_certification: false
      }



      db.UPDATE("UPDATE users AS user SET ? WHERE user.id=?;", [userInfo, user_id], function(result_update_user){
        return res.json({
          result:{
            state: res_state.success
          }
        })
      }, (error_user) => {
        return res.json({
          state: res_state.error,
          message: '유저정보 초기화 실패',
          result:{}
        })
      });
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: '탈퇴 사유 셋팅 에러',
        result:{}
      })
    });
  })
});

router.post("/any/certification", function(req, res){
  const user_id = req.body.data._user_id;
  const contact = req.body.data.contact;
  const country_code = req.body.data.country_code;

  const userInfo = {
    contact: contact,
    country_code: country_code,
    is_certification: true
  }

  db.UPDATE("UPDATE users AS user SET ? where user.id=?", [userInfo, user_id], (result) => {
    return res.json({
      result:{
        state: res_state.success
      }
    })
  }, (error) => {
    return res.json({
      state: res_state.error,
      message: '연락처 인증 업데이트 오류',
      result:{}
    })
  })
})

router.post("/any/ismanager", function(req, res){
  const user_id = req.body.data._user_id;

  if(!user_id){
    return res.json({
      result: {
        state: res_state.success,
        isManager: false
      }
    })
  }
  
  const selectQuery = mysql.format('SELECT id FROM stores WHERE user_id=?', user_id);
  db.SELECT(selectQuery, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          isManager: false
        }
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        isManager: true
      }
    })
  })
})

router.post('/is_adult_certification', function(req, res){
  const user_id = req.body.data.user_id;

  if(user_id === undefined || user_id === null || user_id === '' || user_id === 0){
    return res.json({
      state: res_state.error,
      message: '유저 정보 조회 에러(cerification)',
      result: {}
    })
  }

  const querySelect = mysql.format('SELECT id, is_adult_certification, inactive_at FROM users WHERE id=?', user_id);
  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        state: res_state.error,
        message: '유저 정보 조회 에러(cerification)',
        result: {}
      })
    }

    const data = result[0];

    let isExpired = true;
    if(data.inactive_at){
      isExpired = Util.isExpireTime(data.inactive_at);
    }

    return res.json({
      result: {
        state: res_state.success,
        user_id: data.id,
        is_adult_certification: data.is_adult_certification,
        inactive_at: data.inactive_at,
        isExpired: isExpired
      }
    })
  })
})

router.post('/certification/set', function(req, res){
  const user_id = req.body.data.user_id;
  const imp_uid = req.body.data.imp_uid;
  const merchant_uid = req.body.data.merchant_uid;
  var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
  let adult_expired_at = moment_timezone(date).add(1, 'years').format('YYYY-MM-DD HH:mm:ss'); 

  const adult_certification_data = {
    user_id: user_id,
    imp_uid: imp_uid,
    merchant_uid: merchant_uid,
    created_at: date
  }
  db.INSERT("INSERT INTO adult_certifications SET ?", adult_certification_data, (result_insert_certification) => {
    
    iamport.certification.get({
      imp_uid: imp_uid
    }).then((result) => {
      // result.response
      const birthday_array = result.birthday.split('-');
      const age = birthday_array[0];
  
      let gender = 'm';
      if(result.gender === 'male'){
        gender = 'm';
      }else{
        gender = 'f';
      }

      const update_user_data = {
        is_adult_certification: true,
        adult_expired_at: adult_expired_at,
        gender: gender,
        age: age
      }

      db.UPDATE("UPDATE users SET ? WHERE id=?", [update_user_data, user_id], (result) => {
        return res.json({
          result: {
            state: res_state.success
          }
        })
      }, (error) => {
        return res.json({
          state: res_state.error,
          message: '유저 정보 업데이트 에러(인증)',
          result:{}
        })
      })
    }).catch((error) => {
      return res.json({
        state: res_state.error,
        message: '인증 겲과를 찾을 수 없음.',
        result:{}
      })
    })
  }, (error_insert_certification) => {
    return res.json({
      state: res_state.error,
      message: '인증 정보 추가 에러',
      result:{}
    })
  })
});

function getUserIP(req) {
  const addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  return addr;
}

router.post('/any/location/get', function(req, res){
  console.log(getUserIP(req));
  return res.json({
    result: {
      state: res_state.success
    }
  })
});

module.exports = router;