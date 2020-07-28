var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');
var mysql = require('mysql');

const types = use('lib/types.js');

const res_state = use('lib/res_state.js');

const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const moment = require('moment');

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

const EXPIRE_REFRESH_TOKEN = '7d';
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

router.post("/any/info/update", function(req, res){
  const user_id = req.body.data.id;
  const sns_id = req.body.data.sns_id;
  const sns_type = req.body.data.sns_type;
  const email = req.body.data.email;

  const age = req.body.data.age;
  const gender = req.body.data.gender;
  const contact = req.body.data.contact;

  let queryString = "";
  if(sns_type === types.login.facebook){
    queryString = "UPDATE users SET age=?, gender=?, contact=?, facebook_id=? WHERE id=? AND email=?";
  }else if(sns_type === types.login.google){
    queryString = "UPDATE users SET age=?, gender=?, contact=?, google_id=? WHERE id=? AND email=?";
  }else if(sns_type === types.login.kakao){
    queryString = "UPDATE users SET age=?, gender=?, contact=?, kakao_id=? WHERE id=? AND email=?";
  }else if(sns_type === types.login.apple){
    queryString = "UPDATE users SET age=?, gender=?, contact=?, apple_id=? WHERE id=? AND email=?";
  }else{
    queryString = "UPDATE users SET age=?, gender=?, contact=? WHERE id=? AND email=?";
  }

  if(sns_type === types.login.email){
    db.UPDATE(queryString, [age, gender, contact, user_id, email], (result_update) => {
      return res.json({
        result: {
          state: res_state.success
        }
      })
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: error.message,
        result: {
        }
      })
    })
  }else{
    db.UPDATE(queryString, [age, gender, contact, sns_id, user_id, email], (result_update) => {
      return res.json({
        result: {
          state: res_state.success
        }
      })
    }, (error) => {
      return res.json({
        state: res_state.error,
        message: error.message,
        result: {
        }
      })
    })
  }
});

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

  
  // if(sns_type === types.login.facebook){
  //   queryString+="facebook_id=?";
  // }else if(sns_type === types.login.google){
  //   queryString+="google_id=?;";
  // }else if(sns_type === types.login.kakao){
  //   queryString+="kakao_id=?;";
  // }else if(sns_type === types.login.apple){
  //   queryString+="apple_id=?;";
  // }

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
        var date = moment().format('YYYY-MM-DD HH:mm:ss');
  
        var refreshTokenObject = {
          user_id : user.id,
          refresh_token : token,
          os : deviceOS,
          push_token: push_token,
          created_at : date,
          updated_at: date
        };
  
        
        db.INSERT("INSERT INTO devices SET ? ", refreshTokenObject, function(result){
          makeAccessToken(user.id, data, res);
        }, (error) => {
          return res.json({
            state: res_state.error,
            message: error,
            result:{}
          })
        });
      }
    });
  })

  /*
  const user_id = req.body.data.id;
  // const email = req.body.data.id;
  const sns_id = req.body.data.sns_id;
  const sns_type = req.body.data.sns_type;
  const device = req.body.data.device;

  let queryString = "SELECT id FROM users WHERE id=? AND ";
  if(sns_type === types.login.facebook){
    queryString+="facebook_id=?";
  }else if(sns_type === types.login.google){
    queryString+="google_id=?;";
  }else if(sns_type === types.login.kakao){
    queryString+="kakao_id=?;";
  }else if(sns_type === types.login.apple){
    queryString+="apple_id=?;";
  }

  let userQuery = mysql.format(queryString, [user_id, sns_id]);

  db.SELECT(userQuery, {}, (result_select_user) => {

    var data = {
      state : 'error',
      message : 'none'
    };

    if(result_select_user.length === 0){
      return res.json({
        state: res_state.error,
        message: 'SNS 정보 조회 오류',
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
        // console.log('jwt error : ' + err);
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
        var date = moment().format('YYYY-MM-DD HH:mm:ss');
  
        var refreshTokenObject = {
          user_id : user.id,
          refresh_token : token,
          os : device,
          created_at : date,
          updated_at: date
        };
  
        
        db.INSERT("INSERT INTO devices SET ? ", refreshTokenObject, function(result){
          // console.log(result);
          makeAccessToken(user.id, data, res);
        }, (error) => {
          return res.json({
            state: res_state.error,
            message: error,
            result:{}
          })
        });
      }
    });
  })
  */
});

router.post("/any/login/email", function(req, res){
  var userEmail = req.body.data.user_email;
  const saltRounds = 10 ;   
  const myPlaintextPassword = req.body.data.user_p;
  
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

  db.SELECT("SELECT email, password, id, nick_name, name, age, gender, facebook_id, google_id, kakao_id, apple_id, contact FROM users WHERE email = BINARY(?)", [userEmail], function(result){
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
          return res.json({
            result:{
              state: res_state.success,
              ...user
            }
          });
        }else{
          data.state = 'error';
          data.message = '비밀번호가 틀렸습니다.';

          //혹시 sns로 가입되어 있는지 확인해준다.

          let _message = "";
          if(user.facebook_id === null && user.google_id === null && user.kakao_id === null && user.apple_id === null){
            _message = "비밀번호가 틀렸습니다."
          }else{
            _message = "비밀번호가 틀렸습니다. 해당 이메일은";
            if(user.facebook_id){
              _message+= " 페이스북";
            }
  
            if(user.google_id){
              _message+= " 구글";
            }
  
            if(user.kakao_id){
              _message+= " 카카오";
            }
  
            if(user.apple_id){
              _message+= " 애플";
            }

            _message+="로 연동되어 있습니다."
          }

          return res.json({
            state: res_state.error,
            message: _message,
            result:{}
          })
          // return res.json({
          //   result: {
          //     ...data
          //   }
          // });
        }
      });
  });
});

router.post("/any/register", function(req, res){
  //
  let userData = {
    ...req.body.data
  }

  var date = moment().format('YYYY-MM-DD HH:mm:ss');

  let setUserData = {
    email: userData.email,
    name: userData.name,
    nick_name: userData.nick_name,
    age: userData.age,
    gender: userData.gender,
    profile_photo_url: userData.profile_photo_url,
    contact: userData.contact,
    introduce: '',
    bank: '',
    account: '',
    account_holder: '',
    like_meta: '',
    created_at: date,
    updated_at: date
    // password: 
  }


  // let nowDate = new Date();
  // let snsTempPW = nowDate.getTime() + req.body.data.sns_id;
  let nowPassword = userData.password;

  if(userData.sns_type === types.login.email){
    //패스워드 셋팅
    nowPassword = userData.password;
  }else{
    //sns 패스워드는 임시
    let nowDate = new Date();
    let snsTempPW = nowDate.getTime() + userData.sns_id;
    nowPassword = snsTempPW;
  }


  const saltRounds = 10 ;   
  const myPlaintextPassword = nowPassword ;   
  const someOtherPlaintextPassword = ' not_bacon ' ;

  bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    let convertToPhpHash = hash;
    if(convertToPhpHash.indexOf('$2b$') === 0)
    {
      convertToPhpHash = convertToPhpHash.replace('$2b$', '$2y$');
    }

    setUserData = {
      ...setUserData,
      password: convertToPhpHash
    }
    
    if(userData.sns_type === types.login.email){
      //email 로 가입
      setUserData = {
        ...setUserData
      }
    }else{
      if(userData.sns_email === null){
        //snsid가 널이면 전용 주소를 만들어준다.
        let emailString = userData.sns_type+"_"+userData.sns_id+"_crowdticket_app";
        setUserData.email = emailString;
      }

      if(userData.sns_type === types.login.facebook){
        setUserData = {
          ...setUserData,
          facebook_id: userData.sns_id
          // password: 
        }
      }else if(userData.sns_type === types.login.google){
        setUserData = {
          ...setUserData,
          google_id: userData.sns_id
        }
      }else if(userData.sns_type === types.login.kakao){
        setUserData = {
          ...setUserData,
          kakao_id: userData.sns_id
        }
      }else if(userData.sns_type === types.login.apple){
        setUserData = {
          ...setUserData,
          apple_id: userData.sns_id
        }
      }
    }
    
    db.INSERT("INSERT INTO users SET ?", setUserData, 
    (result) => {
      return res.json({
        result:{
          state: res_state.success,
          user_id: result.insertId
        }
      })

    }, (error) => {
      if(error.error_code === "ER_DUP_ENTRY"){
        let _message = "";
        if(userData.sns_type === types.login.email){
          _message = "이미 가입된 EMIL 입니다.."
        }else{
          _message = "중복된 SNS ID가 있습니다. 재시도 해주세요."
        }
        return res.json({
          state: res_state.error,
          message: _message
        })
      }else{
        return res.json({
          state: res_state.error,
          message: error.error_code
        })
      }
    })
  });

  /*
  let userData = {
    ...req.body.data
  }

  var date = moment().format('YYYY-MM-DD HH:mm:ss');

  let setUserData = {
    email: userData.email,
    name: userData. name,
    nick_name: userData.nick_name,
    age: userData.age,
    gender: userData.gender,
    profile_photo_url: userData.profile_photo_url,
    contact: userData.contact,
    introduce: '',
    bank: '',
    account: '',
    account_holder: '',
    like_meta: '',
    created_at: date,
    updated_at: date
    // password: 
  }


  // let nowDate = new Date();
  // let snsTempPW = nowDate.getTime() + req.body.data.sns_id;
  let nowPassword = userData.password;

  if(userData.sns_type === types.login.email){
    //패스워드 셋팅
  }else{
    //sns 패스워드는 임시
    let nowDate = new Date();
    let snsTempPW = nowDate.getTime() + userData.sns_id;
    nowPassword = snsTempPW;
  }

  // console.log(userData);
  // return res.json({
  //   result:{}
  // })

  // console.log(snsTempPW);

  const saltRounds = 10 ;   
  const myPlaintextPassword = nowPassword ;   
  const someOtherPlaintextPassword = ' not_bacon ' ;

  bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    console.log('make hash!!');
    let convertToPhpHash = hash;
    if(convertToPhpHash.indexOf('$2b$') === 0)
    {
      convertToPhpHash = convertToPhpHash.replace('$2b$', '$2y$');
    }

    setUserData = {
      ...setUserData,
      password: convertToPhpHash
    }
    
    if(userData.sns_type === types.login.email){
      //email 로 가입
      setUserData = {
        ...setUserData
      }
    }else if(userData.sns_type === types.login.facebook){
      
      setUserData = {
        ...setUserData,
        facebook_id: userData.sns_id
        // password: 
      }
    }else if(userData.sns_type === types.login.google){
      setUserData = {
        ...setUserData,
        google_id: userData.sns_id
      }
    }else if(userData.sns_type === types.login.kakao){
      setUserData = {
        ...setUserData,
        kakao_id: userData.sns_id
      }
    }else if(userData.sns_type === types.login.apple){
      setUserData = {
        ...setUserData,
        apple_id: userData.sns_id
      }
    }
  
    db.INSERT("INSERT INTO users SET ?", setUserData, 
    (result) => {
      // console.log(result.insertId);
      return res.json({
        result:{
          state: res_state.success,
          user_id: result.insertId
        }
      })

    }, (error) => {
      if(error.error_code === "ER_DUP_ENTRY"){
        let _message = "";
        if(userData.sns_type === types.login.email){
          _message = "중복된 EMIL이 있습니다. 재시도 해주세요."
        }else{
          _message = "중복된 SNS ID가 있습니다. 재시도 해주세요."
        }
        return res.json({
          state: res_state.error,
          message: _message
        })
      }else{
        return res.json({
          state: res_state.error,
          message: error.error_code
        })
      }
    })
  });
  */
})

router.post("/info", function(req, res){
  const user_id = req.body.data.user_id;
  let queryMyInfo = mysql.format("SELECT id AS user_id, email, name, nick_name, profile_photo_url FROM users WHERE id=?", user_id);
  db.SELECT(queryMyInfo, {}, (result) => {
    return res.json({
      result: {
        state: res_state.success,
        userInfo: result[0]
      }
    })
  })
});

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
  // var nowDate = moment().format('YYYY-MM-DD HH:mm:ss');
  // var nowDate = moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss');
  // let nextDate = moment(nowDate).add(1, 'days');
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
      let lostShowDate = moment(_data.show_date).format('YYYY-MM-DD 23:59:59');
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

// router.post("/any/get/info/sns", function(req, res){

// })

router.post("/any/check/email/sns", function(req, res){
  /*
  const email = req.body.data.email;
  const sns_type = req.body.data.sns_type;
  const sns_id = req.body.data.sns_id;

  if(sns_type !== types.login.facebook && 
    sns_type !== types.login.google &&
    sns_type !== types.login.kakao &&
    sns_type !== types.login.apple){
      return res.json({
        state: res_state.error,
        message: 'sns 타입 에러',
        result:{}
      })
  }

  let queryString = "SELECT email, facebook_id, google_id, kakao_id, apple_id FROM users WHERE ";
  if(sns_type === types.login.facebook){
    queryString+="facebook_id=?;";
  }else if(sns_type === types.login.google){
    queryString+="google_id=?;";
  }else if(sns_type === types.login.kakao){
    queryString+="kakao_id=?;";
  }else if(sns_type === types.login.apple){
    queryString+="apple_id=?;";
  }

  let queryUser = mysql.format(queryString, sns_id);

  db.SELECT(queryUser, {}, (result) => {
    if(result.length === 0){
      //없는 email
      return res.json({
        result: {
          state: res_state.success
        }
      })
    }

    let state = types.res.RES_SUCCESS;
    let message = "";

    const userData = result[0];
    if(sns_type === types.login.facebook){
    }
    if(userData.email !== email){
      "가입되어 있는 이메일과  이메일이 다릅니다."
    }

  })
  */

  
  const email = req.body.data.email;
  const sns_type = req.body.data.sns_type;
  const sns_id = req.body.data.sns_id;

  if(sns_type !== types.login.facebook && 
    sns_type !== types.login.google &&
    sns_type !== types.login.kakao &&
    sns_type !== types.login.apple){
      return res.json({
        state: res_state.error,
        message: 'sns 타입 에러',
        result:{}
      })
    }

  let queryUser = mysql.format("SELECT email, facebook_id, google_id, kakao_id, apple_id FROM users WHERE email=?", email);
  db.SELECT(queryUser, {}, (result) => {
    if(result.length === 0){
      //없는 email
      return res.json({
        result: {
          state: res_state.success
        }
      })
    }

    const userData = result[0];

    // let state = res_state.success;
    let state = types.res.RES_SUCCESS;
    // let error_type = types.res.RES_ERROR;
    let message = "";

    if(sns_type === types.login.facebook){
      if(userData.facebook_id === null){
        // state = res_state.error;
        state = types.res.RES_ERROR_ALREADY_EMAIL_REGISTER;
        // error_type = types.res.RES_ERROR_ALREADY_EMAIL_REGISTER;
        message = "해당 이메일은 이미 가입되어 있는 이메일 입니다. 이메일로 시작 후 설정에서 SNS 연동 하세요."
      }else if(userData.facebook_id !== sns_id){
        state = types.res.RES_ERROR;
        // error_type = types.res.RES_ERROR;
        message = "해당 이메일은 이미 페이스북으로 가입되어 있습니다. 로그인 되어있는 페이스북 이메일을 확인해주세요.";
      }
      // message = "해당 이메일은 이미 페이스북으로 가입되어 있습니다. 로그인 되어있는 페이스북 이메일을 확인해주세요.";
    }else if(sns_type === types.login.google){
      // state = res_state.error;
      // message = "해당 이메일은 이미 구글로 가입되어 있습니다. 로그인 되어있는 구글 이메일을 확인해주세요.";
      if(userData.google_id === null){
        state = types.res.RES_ERROR_ALREADY_EMAIL_REGISTER;
        // error_type = types.res.RES_ERROR_ALREADY_EMAIL_REGISTER;
        message = "해당 이메일은 이미 가입되어 있는 이메일 입니다. 이메일로 시작 후 설정에서 SNS 연동 하세요."
      }else if(userData.google_id !== sns_id){
        state = types.res.RES_ERROR;
        // error_type = types.res.RES_ERROR;
        message = "해당 이메일은 이미 구글로 가입되어 있습니다. 로그인 되어있는 구글 이메일을 확인해주세요.";
      }
    }else if(sns_type === types.login.kakao){
      // state = res_state.error;
      // message = "해당 이메일은 이미 카카오로 가입되어 있습니다. 로그인 되어있는 카카오 이메일을 확인해주세요.";
      if(userData.kakao_id === null){
        state = types.res.RES_ERROR_ALREADY_EMAIL_REGISTER;
        // error_type = types.res.RES_ERROR_ALREADY_EMAIL_REGISTER;
        message = "해당 이메일은 이미 가입되어 있는 이메일 입니다. 이메일로 시작 후 설정에서 SNS 연동 하세요."
      }else if(userData.kakao_id !== sns_id){
        state = types.res.RES_ERROR;
        // error_type = types.res.RES_ERROR;
        message = "해당 이메일은 이미 카카오로 가입되어 있습니다. 로그인 되어있는 카카오 이메일을 확인해주세요.";
      }

    }else if(sns_type === types.login.apple){
      // state = res_state.error;
      // message = "해당 이메일은 이미 애플 가입되어 있습니다. 로그인 되어있는 애플 이메일을 확인해주세요.";
      if(userData.apple_id === null){
        state = types.res.RES_ERROR_ALREADY_EMAIL_REGISTER;
        // error_type = types.res.RES_ERROR_ALREADY_EMAIL_REGISTER;
        message = "해당 이메일은 이미 가입되어 있는 이메일 입니다. 이메일로 시작 후 설정에서 SNS 연동 하세요."
      }else if(userData.apple_id !== sns_id){
        state = types.res.RES_ERROR;
        // error_type = types.res.RES_ERROR;
        message = "해당 이메일은 이미 애플로 가입되어 있습니다. 로그인 되어있는 애플 이메일을 확인해주세요.";
      }
    }
    

    /*
    if(sns_type === types.login.facebook && userData.facebook_id !== null && userData.facebook_id !== sns_id){
      state = res_state.error;
      if(userData.facebook_id === null){
        message = "해당 이메일은 이미 가입되어 있는 이메일 입니다. 이메일로 시작 후 설정에서 SNS 연동 하세요."
      }else if(userData.facebook_id !== sns_id){
        message = "해당 이메일은 이미 페이스북으로 가입되어 있습니다. 로그인 되어있는 페이스북 이메일을 확인해주세요.";
      }else{

      }
      // message = "해당 이메일은 이미 페이스북으로 가입되어 있습니다. 로그인 되어있는 페이스북 이메일을 확인해주세요.";
    }else if(sns_type === types.login.google && userData.google_id !== null && userData.google_id !== sns_id){
      state = res_state.error;
      message = "해당 이메일은 이미 구글로 가입되어 있습니다. 로그인 되어있는 구글 이메일을 확인해주세요.";
    }else if(sns_type === types.login.kakao && userData.kakao_id !== null && userData.kakao_id !== sns_id){
      state = res_state.error;
      message = "해당 이메일은 이미 카카오로 가입되어 있습니다. 로그인 되어있는 카카오 이메일을 확인해주세요.";
    }else if(sns_type === types.login.apple && userData.apple_id !== null && userData.apple_id !== sns_id){
      state = res_state.error;
      message = "해당 이메일은 이미 애플 가입되어 있습니다. 로그인 되어있는 애플 이메일을 확인해주세요.";
    }
    */

    

    return res.json({
      state: state,
      message: message,
      result: {
        state: state
      }
    })
    /*
    let state = res_state.success;
    let message = "";
    if(userData.facebook_id === null && 
      userData.google_id === null && 
      userData.kakao_id === null && 
      userData.apple_id === null){
      state = res_state.success;
      // message = "해당 이메일은 "
    }else{
      state = res_state.error;
      message = "해당 메일은 [";
      if(userData.facebook_id){
        message += "페이스북 ";
      }

      if(userData.google_id){
        message += "구글 ";
      }

      if(userData.kakao_id){
        message += "카카오 ";
      }

      if(userData.apple_id){
        message += "애플 ";
      }

      message+="] 으로 가입되어 있습니다."
    }

    return res.json({
      state: state,
      message: message,
      result: {
        state: state
      }
    })
    */
  })
});

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

router.post("/any/email/check", function(req, res){
  const email = req.body.data.email;

  let queryUser = mysql.format("SELECT id, email, facebook_id, google_id, kakao_id, apple_id FROM users WHERE email=?", email);

  db.SELECT(queryUser, {}, (result) => {
    if(result.length === 0){
      return res.json({
        result: {
          state: res_state.success
        }
      })
    }

    const userData = result[0];
    let message = "";
    if(userData.facebook_id === null && userData.google_id === null && userData.kakao_id === null && userData.apple_id === null){
      message = "해당 이메일은 이미 가입되어 있습니다."
    }else{
      message = "해당 이메일은 이미 가입되어 있으며, SNS ";
      
      if(userData.facebook_id){
        message+=" 페이스북"
      }

      if(userData.google_id){
        message+=" 구글"
      }

      if(userData.kakao_id){
        message+=" 카카오"
      }

      if(userData.apple_id){
        message+=" 애플"
      }

      message += "로 연동 되어있습니다."
    }

    return res.json({
      state: res_state.error,
      message: message,
      result: {}
    })
  });
});

router.post("/any/find/email", function(req, res){
  const name = req.body.data.name;
  const contact = req.body.data.contact;

  let queryUser = mysql.format("SELECT email, facebook_id, google_id, kakao_id, apple_id FROM users WHERE name=? AND contact=? AND deleted_at IS NULL", [name, contact]);
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
      if(userData.facebook_id){
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

// router.post("/push_token/check", function(req, res){
//   const refresh_token = req.body.data.refresh_token;
//   let queryDevice = mysql.format("SELECT push_token")
//   db.SELECT("")
// });

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

module.exports = router;