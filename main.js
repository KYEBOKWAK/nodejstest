const exprieTimeMS = 60000;
// const phoneRandNumExpire = 180;
const phoneRandNumExpire = 180;


const EXPIRE_REFRESH_TOKEN = '365d';
const EXPIRE_ACCESS_TOKEN = '1h';
// const EXPIRE_REFRESH_TOKEN = '5m';
// const EXPIRE_ACCESS_TOKEN = 10;
// const REFRESH_TOKEN_RENEW_LAST_DAT_MIL_SEC = 180000; //밀리초 단위 refresh 재갱신 기준값.
const REFRESH_TOKEN_RENEW_LAST_DAT_MIL_SEC = 0; //밀리초 단위 refresh 재갱신 기준값.
const REFRESH_TOKEN_RENEW_LAST_DAT_DAY = 30; //일단위 //refresh 재갱신 기준값. 사용시 밀리초를 0으로 해야함. 예: 4 = 기간이 4일 남았을때 재갱신. refresh expire 시간보다 짧아야한다.

var express = require('express');
var app = express();

const use = require('abrequire');

var path = require('path');
let favicon = require('serve-favicon');
app.use(favicon(path.join(__dirname, 'public/img', 'favicon.ico')))
// app.use(favicon(path.join(__dirname, 'public/img', 'favicon.ico')))

//var template = require('./lib/template.js');
const cors = require('cors');
const env = require('dotenv');

require('dotenv').config();

const uuidv4 = require('uuid/v4');

var db = require('./lib/db_sql.js');
var db_redis = require('./lib/db_redis.js');

const _jwt = require('./lib/jwt.js');
const jwtType = require('./lib/jwt_type.js');

//var flash = require('connect-flash');
//app.use(flash());

var bcrypt = require('bcrypt');

var jwt = require('jsonwebtoken');

const axios = require('axios');

// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const util = require('./lib/util.js');

const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

var mysql = require('mysql');

var cron = require('node-cron');

var AppKeys = use('lib/AppKeys.js');

var Types = use('lib/types.js');
const res_state = use('lib/res_state.js');

const Global_Func = use("lib/global_func.js");
var types = use('lib/types.js');

process.setMaxListeners(15);
/////상단 새로운 코드 START////
// const bodyParser = require('body-parser');

//app.use('/main', main);
/////상단 새로운 코드 END////
//const redis = require('redis');
//redis 세션관리
//var client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_URL);
app.use(express.json({ limit : "50mb" }));

// app.use(bodyParser.json());
app.use(cors());

// app.use(express.json({ limit : "50mb" }));
// app.use(express.urlencoded({ limit:"50mb", extended: false }));

//middleware start
/*
app.use('/user', function(req, res, next){
  console.log('middel');
  const token = req.headers['x-access-token'] || req.query.token;
  // token does not exist
  if(!token || token === 'undefined') {
    console.log('ttt');
    return res.send({
        state: 'error',
        message: '토큰 정보가 없음'
    });
  }

  next();
});
*/
//middleware end

//여기서부터 새로운 코드 간다!! START

function makeRefreshToken(id, data, before_refresh_token, res){
  console.log('makeRefreshToken and AccessToken');
  _jwt.CREATE(jwtType.TYPE_JWT_REFRESH_TOKEN, 
    {
      id: id,
      type: jwtType.TYPE_JWT_REFRESH_TOKEN
    }, 
    EXPIRE_REFRESH_TOKEN, function(value){
    if(value.state === 'error'){
      return res.json({
        result: {
          state: 'error',
          message: value.message
        }
      })
    }else{
      console.log('정상 리프래시 토큰 재발급!!');
      let _refresh_token = value.token;

      _jwt.CREATE(jwtType.TYPE_JWT_ACCESS_TOKEN, 
        {
          id: id,
          type: jwtType.TYPE_JWT_ACCESS_TOKEN
        }, 
        EXPIRE_ACCESS_TOKEN, function(value){
        if(value.state === 'error'){
          return res.json({
            result: {
              state: 'error',
              message: value.message
            }
          })
        }else{
          console.log('리프래시 and 액세스 재발급 성공!!');
          //db update 해야함.
          var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
          db.UPDATE("UPDATE devices SET refresh_token=?, updated_at=? WHERE refresh_token=? AND user_id=?", 
          [_refresh_token, date, before_refresh_token, id],
          function(result){
            return res.json({
              result: {
                ...data,
                access_token: value.token,
                refresh_token: _refresh_token
              }
            });
          }, function(error){
            return res.json({
              state: res_state.error,
              message: error,
              result: {}
            })
          });
        }
      });
      /*
      res.json({
        result: {
          ...data,
          access_token: value.token
        }
      });
      */
    }
  });
}

function makeAccessToken(id, data, res){
  //console.log('maekadsf', id);
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
      console.log('정상발급!!');
      res.json({
        result: {
          ...data,
          access_token: value.token
        }
      });
    }
  });
}

app.use(function (req, res, next) {
  // console.log(req.headers.origin);
  // console.log(process.env.CROWDTICKET_WEB_REFERER);

  if(req.headers.origin){
    if(
        process.env.APP_TYPE === 'local' ||
        process.env.CROWDTICKET_WEB_REFERER === req.headers.origin ||
        process.env.CROWDTICKET_WEB_REFERER_WEB === req.headers.origin ||
        process.env.CROWDTICKET_WEB_REFERER_WEB_QA_R === req.headers.origin ||
        process.env.CROWDTICKET_WEB_REFERER_WEB_QA === req.headers.origin
      ){
        //통과
      }else{
        return res.json({
          state: 'error',
          message: '정상접근이 아닙니다.'
        });      
      }
  }
  
  let url = req.url;
  let indexAnyString = url.indexOf('/any/');
  if(indexAnyString < 0){
    //any가 없으면 무조건 token 체크를 한다.
    if(req.body.data === undefined){
      return res.json({
        result: {
          state: 'error',
          message: '토큰 정보가 없음.'
        }
      })
    }
    else if(!req.body.data.access_token){
      // console.log('none!!');
      //엑세스토큰이 없다면 완전 오류임!!
      return res.json({
        result: {
          state: 'error',
          message: '토큰 정보가 없음. 재설치 해주세요.'
        }
      })
    }else if(req.body.data.refresh_token && req.body.data.refresh_token !== ''){
      //console.log("리프레시 토큰 체크중");
      //console.log(req.body.data.refresh_token);
      _jwt.READ(req.body.data.refresh_token, function(result){
        //console.log(result);
        if(result.state === 'success'){
          if(result.iss === process.env.JWT_TOKEN_ISSUER){
            //리프레시 토큰 자체는 정상. 

            //리프레시 안에 내용 점검.
            db.SELECT("SELECT user_id, refresh_token, created_at FROM devices WHERE refresh_token=? AND user_id=?", [req.body.data.refresh_token, result.id], function(db_result){
              if(db_result.length === 0){
                return res.json({
                  result: {
                    state: 'error',
                    message: '토큰 정보가 올바르지 않습니다.'
                  }
                })
              }
              //console.log(db_result[0].user_id);
              //DB와 일치하는 토큰 정보가 있다. 기간이 지났는지 확인
            
              util.getExpTimer(result.exp);
              
              let nowDate = new Date();
              let expireDate = new Date(result.exp * 1000);
              let gapMiliSec = expireDate.getTime() - nowDate.getTime();

              let renewLastMiliSec = REFRESH_TOKEN_RENEW_LAST_DAT_MIL_SEC;
              let renowLastDay = REFRESH_TOKEN_RENEW_LAST_DAT_DAY;

              let get_day = Math.floor((((gapMiliSec/1000)/60)/60)/24);

              if(renewLastMiliSec === 0){
                //day로 비교할때
                if(get_day <= renowLastDay){
                  //refresh, access토큰 재갱신
                  //console.log("Refresh access 재갱신!");
                  let _data = {
                    state: 'setAllAccessToken'
                  }
                  makeRefreshToken(db_result[0].user_id, _data, db_result[0].refresh_token, res);
                }else{
                  //access토큰만 갱신
                  //console.log("access 재갱신!!");
                  let _data = {
                    state: 'setReAccessToken'
                  }
                  makeAccessToken(db_result[0].user_id, _data, res);
                }
              }else{
                //밀리초로 비교할때
                if(gapMiliSec <= renewLastMiliSec){
                  //refresh, access토큰 재갱신
                  console.log("Refresh access 재갱신!");
                  let _data = {
                    state: 'setAllAccessToken'
                  }
                  makeRefreshToken(db_result[0].user_id, _data, db_result[0].refresh_token, res);
                }else{
                  //access토큰만 갱신
                  //console.log("access 재갱신!!");
                  let _data = {
                    state: 'setReAccessToken'
                  }
                  makeAccessToken(db_result[0].user_id, _data, res);
                }
              }
              /*
              if(get_day <= renowLastDay){
                //refresh, access토큰 재갱신
                //console.log("Refresh access 재갱신!");
                let _data = {
                  state: 'setAllAccessToken'
                }
                makeRefreshToken(db_result[0].user_id, _data, db_result[0].refresh_token, res);
              }else{
                //access토큰만 갱신
                //console.log("access 재갱신!!");
                let _data = {
                  state: 'setReAccessToken'
                }
                makeAccessToken(db_result[0].user_id, _data, res);
              }
              */
              
            });
            // const user_id = result.data.id;
          }
          // makeAccessToken(user.id, res);
          //리프레스 토큰이 만료 날짜가 거의 다 왔는지 확인한다.
          //리프레시 토큰과 sql 리프레시 토큰이 일치하는지 확인한다.
          //만약 리프레시 토큰 만료날짜가 1주일 남았으면 리프레시 토큰과 엑세스토큰 재발급
          //만약 리프레시 토큰 만료날짜가 1주일 이상 남았으면 액세스토큰만 재발급
          
        }else if(result.state === 'error' && result.error.name === 'TokenExpiredError'){
          //만기일 경우 refresh 를 요청해야함.
          //console.log('refresh도 만기!!');
          return res.json({
            result: {
              state: 'expireRefreshToken'
            }
          })
        }else{
          //console.log('알수 없는 에러지만 우선 토큰 익스파이어로 넘긴다.');
          return res.json({
            result: {
              state: 'expireRefreshToken'
            }
          })
        }
        
        // //console.log(dec.format('YYYY-MM-DD HH:mm:ss'));
      });
    }else if(req.body.data.access_token && req.body.data.access_token !== ''){
      _jwt.READ(req.body.data.access_token, function(result){
        //console.log(result);
        if(result.state === 'success'){
          if(result.iss === process.env.JWT_TOKEN_ISSUER){
            req.body.data.user_id = result.id;
            //console.log("$$$$$$" + result.id);
            util.getExpTimer(result.exp);
            next();
          }
        }else if(result.state === 'error' && result.error.name === 'TokenExpiredError'){
          //만기일 경우 refresh 를 요청해야함.
          //console.log('만기!!');
          return res.json({
            result: {
              state: 'call_refresh_token'
            }
          })
        }
        
      });
    }
    // //console.log(req.body.data);

    ////console.log(req.body.data.access_token);
    // next();
  }else{
    next();
  }
  // //console.log(indexAnyString);

  // //console.log('Time:', Date.now());
  
});

let main = require('./routes/main');
app.use('/main', main);

let projects = require('./routes/projects');
app.use('/projects', projects);

let user = require('./routes/user');
app.use('/user', user);

let payView = require('./routes/pay');
app.use('/pay', payView);

let mannayo = require('./routes/mannayo');
app.use('/mannayo', mannayo);

let comments = require('./routes/comments');
app.use('/comments', comments);

let creators = require('./routes/creators');
app.use('/creators', creators);

let orders = require('./routes/orders');
app.use('/orders', orders);

let uploader = require('./routes/uploader');
app.use('/uploader', uploader);

let likes = require('./routes/likes');
app.use('/likes', likes);

let find = require('./routes/find');
app.use('/find', find);

let routerPassword = require('./routes/password');
app.use('/password', routerPassword);

let routerNotice = require('./routes/notice');
app.use('/notice', routerNotice);

let routerRooms = require('./routes/rooms');
app.use('/rooms', routerRooms);

let chstUsers = require('./routes/chatusers');
app.use('/chatusers', chstUsers);

let routerMagazine = require('./routes/magazine');
app.use('/magazine', routerMagazine);

let routerStore = require('./routes/stores');
app.use('/store', routerStore);

app.post("/init/user", function(req, res){
  let userInfoQuery = "SELECT age, gender, email, name, contact, id, nick_name, profile_photo_url FROM users WHERE id=?";
  // console.log(req.body.data);

  // let userInfoQuery = "SELECT user.age, user.gender, user.email, user.name, user.contact, user.id, user.nick_name, user.profile_photo_url, device.push_token FROM users AS user LEFT JOIN devices AS device ON device.user_id=user.id WHERE user.id=?";

  userInfoQuery = mysql.format(userInfoQuery, req.body.data.user_id);

  db.SELECT(userInfoQuery, [], (result) => {
    if(result.state === 'error'){
      return res.json({
        result: {
          state: 'error',
          message: '유저 정보를 불러오지 못했습니다.'
        }
      })
    };

    return res.json({
      result: {
        state: 'success',
        email: result[0].email,
        name: result[0].name,
        contact: result[0].contact,
        user_id: result[0].id,
        nick_name: result[0].nick_name,
        age: result[0].age,
        gender: result[0].gender,
        profile_photo_url: result[0].profile_photo_url,
        stateApp: AppKeys.STATE_APP_MAIN,
        // iamport_IMP: process.env.IAMPORT_IMP,
        // iamport_PG: process.env.IAMPORT_PG,
        // app_scheme: process.env.IAMPORT_APP_SCHEME,
        // findPlaceHolder: '그날의 이슈!'
        // toastMessage: '오잇!'
      }
    });
  });
});

app.post('/any/init', function(req, res){
  //console.log("init!");
  let accessToken = req.body.data.access_token;

  let _findPlaceHolder = "그날의 이슈!";
  let _recommendWord = ["아프리카", "유튜브", "인스타그램", "페이스북"];

  if(accessToken === ''){
    return res.json({
      result: {
        state: 'success',
        iamport_IMP: process.env.IAMPORT_IMP,
        iamport_PG: process.env.IAMPORT_PG,
        app_scheme: process.env.IAMPORT_APP_SCHEME,
        stateApp: AppKeys.STATE_APP_INIT,
        findPlaceHolder: _findPlaceHolder,
        recommendWord: _recommendWord
        // toastMessage: '오잇!'
      }
    });
  }else{
    return res.json({
      result: {
        state: 'success',
        iamport_IMP: process.env.IAMPORT_IMP,
        iamport_PG: process.env.IAMPORT_PG,
        app_scheme: process.env.IAMPORT_APP_SCHEME,
        stateApp: AppKeys.STATE_APP_MAIN,
        findPlaceHolder: _findPlaceHolder,
        recommendWord: _recommendWord
        // toastMessage: '오잇!'
      }
    });
  }

  /*
  let userInfoQuery = "SELECT email, name, contact, id, nick_name, profile_photo_url FROM users WHERE id=?";
  userInfoQuery = mysql.format(userInfoQuery, req.body.data.user_id);

  db.SELECT(userInfoQuery, [], (result) => {
    if(result.state === 'error'){
      return res.json({
        result: {
          state: 'error',
          message: '유저 정보를 불러오지 못했습니다.'
        }
      })
    };

    return res.json({
      result: {
        state: 'success',
        email: result[0].email,
        name: result[0].name,
        contact: result[0].contact,
        user_id: result[0].id,
        nick_name: result[0].nick_name,
        profile_photo_url: result[0].profile_photo_url,
        iamport_IMP: process.env.IAMPORT_IMP,
        iamport_PG: process.env.IAMPORT_PG,
        app_scheme: process.env.IAMPORT_APP_SCHEME,
        findPlaceHolder: '그날의 이슈!'
        // toastMessage: '오잇!'
      }
    });
  });
  */

  /*
  let userInfoQuery = "SELECT email, name, contact, id, nick_name, profile_photo_url FROM users WHERE id=?";
  userInfoQuery = mysql.format(userInfoQuery, req.body.data.user_id);

  db.SELECT(userInfoQuery, [], (result) => {
    if(result.state === 'error'){
      return res.json({
        result: {
          state: 'error',
          message: '유저 정보를 불러오지 못했습니다.'
        }
      })
    };

    return res.json({
      result: {
        state: 'success',
        email: result[0].email,
        name: result[0].name,
        contact: result[0].contact,
        user_id: result[0].id,
        nick_name: result[0].nick_name,
        profile_photo_url: result[0].profile_photo_url,
        iamport_IMP: process.env.IAMPORT_IMP,
        iamport_PG: process.env.IAMPORT_PG,
        app_scheme: process.env.IAMPORT_APP_SCHEME,
        findPlaceHolder: '그날의 이슈!'
        // toastMessage: '오잇!'
      }
    });
  });
  */
});

// app.post("")

app.post('/login', function(req, res){
  
  res.json({
    result: {
      state: 'success',
      user_id: req.body.data.user_id

    }
  })
});
//여기서부터 새로운 코드 간다!! END

//token START
app.post('/token/uuid', function(req, res){
  
  _jwt.CREATE(jwtType.TYPE_JWT_CREATE_UUID, 
    {
      token_uuid: uuidv4(),
      type: jwtType.TYPE_JWT_CREATE_UUID
    }, 
  '1y', function(value){
    res.send({
      ...value
    });
  });

  return;
});
//token END

//phone certify check START

app.post("/any/call/certify/number", function(req, res){

  const contact = req.body.data.contact;
  
  // return res.json({});
  //6자리수 생성
  let randVal = '';
  for(i = 0 ; i < 6 ; i++){
    randVal += String(util.getRandomNumber(0, 9));
  }

  
  //심의용 코드 START
  if(contact === '00000000000'){
    randVal = '123456'
  }
  //심의용 코드 END

  

  db_redis.save(contact, randVal, phoneRandNumExpire, function(_result){
    if(_result.state === 'success'){
      //레디스 저장 성공      
      
      if(process.env.APP_TYPE === 'local'){
        console.log(randVal);
        return res.json({
          result:{
              state: res_state.success,
              waitSec: _result.expire
          }
        })
        // return res.json({
        //   state: res_state.error,
        //   message: "개발로컬에선 이렇게 옵니당 " + randVal,
        //   result:{}
        // })
      }else{
        if(contact === '00000000000'){
          return res.json({
            result:{
                state: res_state.success,
                waitSec: _result.expire
            }
          })
        }else{
          let content = "[크티] 인증번호 [ " + randVal + " ]를 입력해주세요.";
          Global_Func.sendSMS(contact, content, (result) => {
              // console.log(result);
              if(result.status === '200'){
                  return res.json({
                      result:{
                          state: res_state.success,
                          waitSec: _result.expire
                      }
                  })
              }else{
                  return res.json({
                      state: 'error',
                      message: '인증번호 전송 오류',
                      result:{
                      }
                  })
              }
          })
        }
      }
    }
    else{
      //레디스 저장 실패
      //console.log('redis fail');
      return res.json({
          result:{
              state: 'error',
              message: '레디스 저장 실패'
          }
      })
    }
  });

  /*
  db_redis.save(contact, randVal, phoneRandNumExpire, function(_result){
    if(_result.state === 'success'){
      //레디스 저장 성공
      //console.log('redis success');

      // console.log(_result);
      // return res.json({
      //     waitSec: _result.expire
      //     // ..._result
      // })

      //test//
      db_redis.load(contact, function(result_load){
          console.log(result_load);
      })
      ///////

      // let content = "[크티] 인증번호 [ " + randVal + " ]를 입력해주세요." 
      // this.sendSMS(contact, content, (result) => {
      //     // console.log(result);
      //     if(result.status === '200'){
      //         res.json({
      //             // result:{
      //             //     state: 'success'
      //             // }
      //             waitSec: _result.expire
      //         })
      //     }else{
      //         res.json({
      //             state: 'error',
      //             message: '인증번호 전송 오류',
      //             result:{
      //             }
      //         })
      //     }
      // })

      
    }
    else{
      //레디스 저장 실패
      //console.log('redis fail');
      return res.json({
          result:{
              state: 'error',
              message: '레디스 저장 실패'
          }
      })
    }
  });
  */
});

app.post('/any/call/certify/confirm', function(req, res){

  const contact = req.body.data.contact;
  const certify_number = req.body.data.certify_number;

  // console.log(contact);
  // console.log(certify_number);

  db_redis.load(contact, function(_result){

      // console.log(_result);
      // return res.json({
      //   _result
      // })
      if(_result.state === 'error'){
          //console.log('없음!!');
          if(_result.error === 'noData'){
            return res.json({
                state: 'error',
                message: '인증시간이 지났습니다.'
            });
          }
          else{
            return res.json({
                state: 'error',
                message: '알 수 없는 에러'
            });
          }
      }
      else if(_result.data === certify_number){
          //console.log('일치!!');
          return res.json({
            result: {
              state: res_state.success,

            }
              // state: 'success',
              // phone: req.body.phone
          });
      }
      else{
          //console.log('불일치!!');
            return res.json({
            state: 'error',
            message: '인증번호가 다릅니다.',
            result: {}
          });
      }
  });
});

/*
app.post("/call/certify/number", function(req, res){
  _jwt.READ(req.body.token_uuid, function(result){
    if(result.state === 'success'){
      //6자리수 생성
      let randVal = '';
      for(i = 0 ; i < 6 ; i++){
        randVal += String(util.getRandomNumber(0, 9));
      }

      db_redis.save(result.data.token_uuid, randVal, phoneRandNumExpire, function(_result){
        if(_result.state === 'success'){
          //레디스 저장 성공
          //console.log('redis success');
          return res.send({
            ..._result
          });
        }
        else{
          //레디스 저장 실패
          //console.log('redis fail');
          return res.send({
            ..._result
          });
        }
      });
    }
    else{
      //jwt 인증 실패
      return res.send({
        ...result
      });
      
    }
  })
});
*/

/*
app.post('/call/certify/confirm', function(req, res){
  new Promise(function(resolve, reject){
    _jwt.READ(req.body.token_uuid, function(result){
      if(result.state === 'success'){
        //6자리수 생성
        //req.body.certify_number
        db_redis.load(result.data.token_uuid, function(_result){

          if(_result.state === 'error'){
            //console.log('없음!!');
            if(_result.error === 'noData'){
              return resolve({
                state: 'error',
                message: '인증시간이 지났습니다.'
              });
            }
            else{
              return resolve({
                state: 'error',
                message: '알 수 없는 에러'
              });
            }
          }
          else if(_result.data === req.body.certify_number){
            //console.log('일치!!');
            return resolve({
              state: 'success',
              phone: req.body.phone
            });
          }
          else{
            //console.log('불일치!!');
            return resolve({
              state: 'error',
              message: '인증번호가 다릅니다.'
            });
          }
        });
        //console.log(result.data.token_uuid);
      }
      else{
        //jwt 인증 실패
        return res.send({
          ...result
        });
      }
    });
  }).then(function(result){
    res.send({
      ...result
    })
  }).catch(function(error){
    res.send({
      state: 'error',
      ...error
    })
  });
});
*/
//phone certify check END
//phone check sms START
/*
app.post("/sms/send", function(req, res){
  axios({
    headers: 
    {
      'Content-Type': 'application/json; charset=utf-8',
      'x-ncp-auth-key': 'FW9vySa6hapMOgZszYKo',
      'x-ncp-service-secret': '0d9f3bc215f745cdbcb2c3bba1fb9191'
    },
    method: 'post',
    url: 'https://api-sens.ncloud.com/v1/sms/services/ncp:sms:kr:256960042991:crowdticket_test/messages',
    data: {
      type:"SMS",
      contentType:"COMM",
      countryCode:"82",
      from:"01096849880",
      to:[
        req.body.phonenumber
      ],
      content:"내용테스트"
    }
  }).then(function (response) {
    // console.log(response);
    //res.data.messages
  });
  return res.send({aaa:'aaa'});
});
*/

app.post('/any/email/send', function(req, res){
  // const msg = {
  //   to: 'bogame@naver.com',
  //   from: '크라우드티켓<contact@crowdticket.kr>',
  //   subject: '새로운 서버에서 이메일 테스트입니다',
  //   text: '본문 내용',
  //   html: '<strong>이거슨 HTML!!</strong>',
  // };
  // sgMail.send(msg);

  // return res.send({aaa:'bbb'});
});
//phone check sms END

//redis 세션관리
// var client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_URL);
//var client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_URL);
//console.log('redis client : ' + JSON.stringify(client));
/*
app.use(session({
  secret: process.env.TOKEN_SECRET,
  //Redis서버의 설정정보//
  
  store: new redisStore({
    client: client,
    ttl: 120
  }),
  
  //store: new FileStore(),
  resave: false,
  saveUninitialized: true
}));
*/

//var passport = require('passport'), 
//LocalStrategy = require('passport-local').Strategy;

//app.use(passport.initialize());
//app.use(passport.session());


/*
app.post('/login',
        passport.authenticate('local-login', {  successRedirect: '/login/success',
                                          failureRedirect: '/login/fail', failureFlash: true, successFlash: true})
);
*/
/*
app.post('/login',
        passport.authenticate('local', {  successRedirect: '/login/success',
                                          failureRedirect: '/login/fail', failureFlash: true, successFlash: true})
);
*/
/*
passport.use(new LocalStrategy({
    usernameField: 'user_id',
    passwordField: 'user_password'
  },
  function (username, password, done) {
    console.log('iun!!');

    const saltRounds = 10 ;   
    const myPlaintextPassword = password ;   
    const someOtherPlaintextPassword = ' not_bacon ' ;

    db.SELECT("SELECT * FROM users WHERE email = '"+username+"'", function(result){
        //var finalNodeGeneratedHash = result[0].password.replace('$2y$', '$2b$');
        var user = result[0];
        if(!user)
        {
          //return done(err);
        }
        var finalNodeGeneratedHash = user.password;
        if(finalNodeGeneratedHash.indexOf('$2y$') === 0)
        {
          finalNodeGeneratedHash = finalNodeGeneratedHash.replace('$2y$', '$2b$');
        }

        bcrypt.compare(myPlaintextPassword, finalNodeGeneratedHash, function(error, result){
          console.log('compare : ' + result);
          if(result){
            console.log('로그인 성공! in result');
            jwt.sign({
              id: user.id,
              email: user.email
            }, 
            process.env.TOKEN_SECRET, 
            { 
              expiresIn: '5m',
              issuer: 'crowdticket.kr',
              subject: 'userInfo'
            }, function(err, token){
              if (err) 
              {
                //reject(err)
                console.log('jwt error : ' + err);
                
              }
              else
              {
                user.access_token = token;
                console.log('token : ' + token);
                return done(null, user);
              }
                            
            });
            //req.session.key = user.id;

            //
          }
          else{
            //console.log(JSON.stringify(error));
            //console.log((error['IncomingMessage']));


           //error['test'] = 'aa';
           console.log('go!');
           //flash('test', 'aaa');
           //return done(null, false, req.flash('error', 'aaaa'));
           //req.flash('testtest', 'Flash is back!');
           //return done(null, false);
           return done(null, false, {message: 'Unauthorized user!'});
          }
        });
    });
  }
));
*/

/*
app.post('/join',
        passport.authenticate('local-join', {  successRedirect: '/join/success',
                                          failureRedirect: '/join/fail', failureFlash: true, successFlash: true})
);
*/

//로그인 START
/*
passport.use('local-login', new LocalStrategy({
  usernameField : 'user_id',
  passwordField : 'user_password',
  //session: false, // 세션에 저장 여부
  passReqToCallback: true,
  failureFlash: true,
  badRequestMessage : 'Missing username or password.',
},
  function(req, username, password, done) {
  //function(username, password, done) {
    const saltRounds = 10 ;   
    const myPlaintextPassword = password ;   
    const someOtherPlaintextPassword = ' not_bacon ' ;

    db.SELECT("SELECT * FROM users WHERE email = '"+username+"'", function(result){
        //var finalNodeGeneratedHash = result[0].password.replace('$2y$', '$2b$');
        var user = result[0];
        if(!user)
        {
          //return done(err);
        }
        var finalNodeGeneratedHash = user.password;
        if(finalNodeGeneratedHash.indexOf('$2y$') === 0)
        {
          finalNodeGeneratedHash = finalNodeGeneratedHash.replace('$2y$', '$2b$');
        }

        bcrypt.compare(myPlaintextPassword, finalNodeGeneratedHash, function(error, result){
          console.log('compare : ' + result);
          if(result){
            console.log('로그인 성공! in result');
            jwt.sign({
              id: user.id,
              email: user.email
            }, 
            process.env.TOKEN_SECRET, 
            { 
              expiresIn: '5m',
              issuer: 'crowdticket.kr',
              subject: 'userInfo'
            }, function(err, token){
              if (err) 
              {
                //reject(err)
                console.log('jwt error : ' + err);
                
              }
              else
              {
                user.access_token = token;
                console.log('token : ' + token);
                return done(null, user);
              }
                            
            });
            //req.session.key = user.id;

            //
          }
          else{
            //console.log(JSON.stringify(error));
            //console.log((error['IncomingMessage']));


           //error['test'] = 'aa';
           console.log('go!');
           //flash('test', 'aaa');
           //return done(null, false, req.flash('error', 'aaaa'));
           //req.flash('testtest', 'Flash is back!');
           //return done(null, false);
           return done(null, false, {message: 'Unauthorized user!'});
          }
        });
    });
  }
));
*/
//로그인 END
/*
//회원가입 START
passport.use('local-join', new LocalStrategy({
  usernameField : 'user_id',
  passwordField : 'user_password',
  passReqToCallback : true
},
  function(req, username, password, done) {
    const saltRounds = 10 ;   
    const myPlaintextPassword = password ;   
    const someOtherPlaintextPassword = ' not_bacon ' ;

    bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
      // Store hash in your password DB.
      console.log('make hash!!');
      var convertToPhpHash = hash;
      if(convertToPhpHash.indexOf('$2b$') === 0)
      {
        convertToPhpHash = convertToPhpHash.replace('$2b$', '$2y$');
      }

      var post  = {email : username, name : 'name', nick_name : 'nick', password : convertToPhpHash, introduce : 'ㅇㅇㅇ', website : '', bank : '', account : '', account_holder : '', like_meta : ''};
      db.INSERT('INSERT INTO users SET ?', post, function (error, results, fields) {
        if (error){
          console.log('insert error : ' + error);
          return;
        }

        console.log(results);
        // Neat!
      });
    });
  }
));
//회원가입 end
*/
//test start///
/*
app.post('/login', function(req, res, next) {
  console.log(req.body);
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err); // will generate a 500 error
    }
    // Generate a JSON response reflecting authentication status
    if (! user) {
      return res.send({ success : false, message : 'authentication failed' });
    }
    // ***********************************************************************
    // "Note that when using a custom callback, it becomes the application's
    // responsibility to establish a session (by calling req.login()) and send
    // a response."
    // Source: http://passportjs.org/docs
    // ***********************************************************************
    req.login(user, loginErr => {
      if (loginErr) {
        return next(loginErr);
      }
      return res.send({ success : true, message : 'authentication succeeded' });
    });      
  })(req, res, next);
});
*/
///test end//////
/*
app.get("/token/check", function(req, res){
  //var token = req.cookies.user;
  //var token = req.cookies.user;
  console.log(req.body);
  res.json('asdf');

  var decoded = jwt.verify(token, secretObj.secret);
  if(decoded){
    res.send("권한이 있어서 API 수행 가능")
  }
  else{
    res.send("권한이 없습니다.")
  }
});
*/

/*
$_param['userid'] = '******';           // [필수] 뿌리오 아이디
$_param['callback'] = '010********';    // [필수] 발신번호 - 숫자만
$_param['phone'] = '010********';       // [필수] 수신번호 - 여러명일 경우 |로 구분 '010********|010********|010********'
$_param['msg'] = '테스트 발송입니다';   // [필수] 문자내용 - 이름(names)값이 있다면 [*이름*]가 치환되서 발송됨
$_param['names'] = '홍길동';            // [선택] 이름 - 여러명일 경우 |로 구분 '홍길동|이순신|김철수'
$_param['appdate'] = '20190502093000';  // [선택] 예약발송 (현재시간 기준 10분이후 예약가능)
$_param['subject'] = '테스트';          // [선택] 제목 (30byte)
*/

app.post("/token/check", function(req, res){
  /*
  var token = req.body.access_token;
  //var decoded = jwt.verify(token, secretObj.secret);
  //console.log('check:'+token);
  if(!token || token === 'undefined')
  {
    return res.send({
      state : 'error',
      message : '로그인 정보 없음.'
    })
  }
  //console.log(req.headers['x-access-token']);
  try{
    var decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    //시간을 비교해서 30초 이하면 30초씩 계속 연장해준다.
    console.log(decoded);

    var nowDate = new Date();
    var expireDate = new Date(decoded.exp * 1000);
    var gap = expireDate.getTime() - nowDate.getTime();
    var gap_sec = gap/1000;
    console.log("timer : " + gap_sec);

    var data = {
      state : 'error',
      message : 'none'
    };

    if(gap_sec < 30)
    {
      jwt.sign({
        id: decoded.id,
        email: decoded.email
      }, 
      process.env.TOKEN_SECRET, 
      { 
        expiresIn: exprieTimeMS+'ms',
        issuer: process.env.JWT_TOKEN_ISSUER,
        subject: 'userWebAccess'
      }, function(err, token){
        if (err) 
        {
          console.log('jwt error : ' + err);
          data.state = 'error';
          data.message = err;

          return res.send(data);
        }
        else
        {
          console.log('access token:'+token);
          data.state = 'refresh';
          data.access_token = token;
          data.expiresIn = exprieTimeMS;
          return res.send(data);
        }            
      });
    }
    else
    {
      data.state = 'success';
      data.message = '';

      return res.send(data);
    }
  }catch(error){
    //console.log(error);
    var data = {
      state : 'error',
      type : 'none',
      message : 'none'
    };
    
    if(error.name === 'TokenExpiredError')
    {
      data.state = 'error';
      data.message = '장시간 미사용으로 로그아웃 되었습니다. 로그인을 해주세요!!!';
      //expired!! 
      return res.send(data);
    }
    else
    {
    }
  }
  */
})

app.get('/login/success', function(req, res){
  console.log('로그인 성공! /login/success');
  //res.send(`로그인 성공!!`);
  res.send({state:'success'});
});

app.get('/login/fail', function(req, res){
  res.send({state:'fail'});
});
//route, routing
app.get('/', function (req, res) {
  res.send(`크티 api 서버 해당 페이지를 보면 아니아니아니됨 `);
  //console.log(uuidv4());
});

/*
app.post('/login', function (req, res) {
  //db.SELECT(success);
  //db.INSERT('aa');
  
  //console.log(req);

  //var msg = req.body;
  //msg = '[에코]' + msg;
  //var test = JSON.parse(req.body);
  //var obj = JSON.parse(req.body);

  req.body.user_id

  console.log(req.body);

  //res.send({result:true, msg:'msg'});
  //console.log(req.body);

  
  res.send(req.body);
  
});
*/

// var makeAccessToken = function(id, email){
//   console.log('dafsdfdsf');
// };

app.get('/any/healthcheck', function(req, res)
{
	res.writeHead(200, { "Content-Type": "text/html" });
	res.write("Health Check Page");
	res.end();
});

app.post('/any/login', function(req, res){
  /*
  var userEmail = req.body.data.user_email;
  // var userPassword = req.body.data.user_p;
  const saltRounds = 10 ;   
  const myPlaintextPassword = req.body.data.user_p;   
  const someOtherPlaintextPassword = ' not_bacon ' ;
  console.log(myPlaintextPassword);

  db.SELECT("SELECT * FROM users WHERE email = BINARY(?)", [userEmail], function(result){
      //var finalNodeGeneratedHash = result[0].password.replace('$2y$', '$2b$');
      
      var data = {
        state : 'error',
        message : 'none'
      };
      
      if(result.length <= 0)
      {
        // console.log('아이디 없음!!');
        data.state = 'error';
        data.message = '아이디가 존재하지 않습니다.';

        // return res.send(data);
        return res.json({
          result: {
            ...data
          }
        })
      }

      var user = result[0];

      var finalNodeGeneratedHash = user.password;
      if(finalNodeGeneratedHash.indexOf('$2y$') === 0)
      {
        finalNodeGeneratedHash = finalNodeGeneratedHash.replace('$2y$', '$2b$');
      }

      bcrypt.compare(myPlaintextPassword, finalNodeGeneratedHash, function(error, result){
        console.log(result);
        if(result){
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
              var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

              var refreshTokenObject = {
                user_id : user.id,
                refresh_token : token,
                os : 'deviceinfo',
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
        }
        else{
          data.state = 'error';
          data.message = '비밀번호가 틀렸습니다.';
          return res.json({
            result: {
              ...data
            }
          });
        }
      });
  });
  */
});

app.post('/login/access', function(req, res){
  var token = req.body.refresh_token;
  //var decoded = jwt.verify(token, secretObj.secret);
  try{
    var data = {
      state : 'error',
      message : 'none'
    };

    var decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    jwt.sign({
      id: decoded.id,
      email: decoded.email
    }, 
    process.env.TOKEN_SECRET, 
    { 
      expiresIn: '5m',
      issuer: process.env.JWT_TOKEN_ISSUER,
      subject: 'userAccess'
    }, function(err, token){
      if (err) 
      {
        // console.log('jwt error : ' + err);
        data.state = 'error';
        data.message = err;

        return res.send(data);
      }
      else
      {
        data.state = 'success';
        data.access_token = token;
        return res.send(data);
      }            
    });

    //return res.send(decoded);
  }catch(error){
    // console.log(error);
    var data = {
      state : 'error',
      type : 'none',
      message : 'none'
    };
    
    if(error.name === 'TokenExpiredError')
    {
      data.state = 'error';
      data.type = error.name;
      data.message = error.message
      //expired!! 
      return res.send(data);
    }
    else
    {
    }
  }
});

app.post('/init/web', function (req, res) {
  //처음 접속시 uuid가 있는지 확인 해준다.
  //console.log('init!!');
  /*
  db_redis.save('mainkey1', 'name', 'aaa', function(result){
    console.log(result);
  });
  */
  /*
  db_redis.load('mainkey1', function(result){
    console.log(result);
  });
  */
  /*
  db_redis.save('mainkey1', 'name', 'aaa', function(result){
    console.log(result);
  });
  db_redis.save('mainkey2', 'name', 'bbb', function(result){
    console.log(result);
  });
  */
  //db_redis.load();
  //console.log(db_redis.read());
  return res.send({
    abc : 'adf'
  });
});

app.post("/any/check/email/sns", function(req, res){

  //현재 문제: 이메일이 다를경우 
  const sns_email = req.body.data.sns_email;
  const sns_type = req.body.data.sns_type;
  const sns_id = req.body.data.sns_id;
  const isOtherSnsLogin = req.body.data.isOtherSnsLogin;

  let queryString = "SELECT email, id, nick_name, name, age, gender, facebook_id, google_id, kakao_id, apple_id, contact, profile_photo_url FROM users WHERE ";
  if(sns_type === Types.login.facebook){
    queryString += "facebook_id=?";
    // queryUser = mysql.format("SELECT email, id, nick_name, name, age, gender, contact FROM users WHERE facebook_id=?", sns_id);
  }else if(sns_type === Types.login.google){
    queryString += "google_id=?";
    // queryUser = mysql.format("SELECT email, id, nick_name, name, age, gender, contact FROM users WHERE google_id=?", sns_id);
  }else if(sns_type === Types.login.kakao){
    queryString += "kakao_id=?";
    // queryUser = mysql.format("SELECT email, id, nick_name, name, age, gender, contact FROM users WHERE kakao_id=?", sns_id);
  }else if(sns_type === Types.login.apple){
    queryString += "apple_id=?";
    // queryUser = mysql.format("SELECT email, id, nick_name, name, age, gender, contact FROM users WHERE apple_id=?", sns_id);
  }

  let queryUser = mysql.format(queryString, [sns_id]);

  db.SELECT(queryUser, {}, (result) => {
    // console.log(result);
    if(result.length === 0){
      //sns_id는 없는데, email은 있을 수 있음.
      if(sns_email === null){
        return res.json({
          result:{
            state: res_state.login_no_user
          }
        })
      }

      //sns_email 이 널이 아니면 검색 한번 해본다.
      let queryUserEmail = mysql.format("SELECT email, id, nick_name, name, age, gender, facebook_id, google_id, kakao_id, apple_id, contact, profile_photo_url FROM users WHERE email=BINARY(?)", [sns_email]);

      db.SELECT(queryUserEmail, {}, (result_select_user_email) => {
        if(result_select_user_email.length === 0){
          return res.json({
            result:{
              state: res_state.login_no_user
            }
          })
        }

        const userData = result_select_user_email[0];

        let _state = Types.res.RES_SUCCESS;
        if(isOtherSnsLogin){
          return res.json({
            result:{
              state: _state,
              ...userData
            }
          })
        }
        
        if(sns_type === Types.login.facebook){
          if(userData.google_id != null){
            _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_GOOGLE;
          }else if(userData.kakao_id != null){
            _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_KAKAO;
          }else if(userData.apple_id != null){
            _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_APPLE;
          }
        }else if(sns_type === Types.login.google){
          if(userData.facebook_id != null){
            _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_FACEBOOK;
          }else if(userData.kakao_id != null){
            _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_KAKAO;
          }else if(userData.apple_id != null){
            _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_APPLE;
          }
        }else if(sns_type === Types.login.kakao){
          if(userData.facebook_id != null){
            _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_FACEBOOK;
          }else if(userData.google_id != null){
            _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_GOOGLE;
          }else if(userData.apple_id != null){
            _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_APPLE;
          }
        }else if(sns_type === Types.login.apple){
          // db_sns_id = userData.apple_id;
          if(userData.facebook_id != null){
            _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_FACEBOOK;
          }else if(userData.google_id != null){
            _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_GOOGLE;
          }else if(userData.kakao_id != null){
            _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_KAKAO;
          }
        }

        return res.json({
          result:{
            state: _state,
            ...userData
          }
        })
      });

      return;
    }

    const userData = result[0];

    
    // let db_sns_id = null;
    let _state = Types.res.RES_SUCCESS;
    if(isOtherSnsLogin){
      return res.json({
        result:{
          state: _state,
          ...userData
        }
      })
    }

    if(sns_type === Types.login.facebook){
      if(userData.google_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_GOOGLE;
      }else if(userData.kakao_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_KAKAO;
      }else if(userData.apple_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_APPLE;
      }
    }else if(sns_type === Types.login.google){
      if(userData.facebook_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_FACEBOOK;
      }else if(userData.kakao_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_KAKAO;
      }else if(userData.apple_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_APPLE;
      }
    }else if(sns_type === Types.login.kakao){
      if(userData.facebook_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_FACEBOOK;
      }else if(userData.google_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_GOOGLE;
      }else if(userData.apple_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_APPLE;
      }
    }else if(sns_type === Types.login.apple){
      // db_sns_id = userData.apple_id;
      if(userData.facebook_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_FACEBOOK;
      }else if(userData.google_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_GOOGLE;
      }else if(userData.kakao_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_KAKAO;
      }
    }
    

    return res.json({
      result:{
        state: _state,
        ...userData
      }
    })
  })
  
  /*
  //현재 문제: 이메일이 다를경우 
  const sns_email = req.body.data.sns_email;
  const sns_type = req.body.data.sns_type;
  const sns_id = req.body.data.sns_id;

  let queryUser = "";
  if(sns_email === null || sns_email === undefined || sns_email === ""){
    if(sns_type === Types.login.facebook){
      queryUser = mysql.format("SELECT email, id, nick_name, name, age, gender, contact FROM users WHERE facebook_id=?", sns_id);
    }else if(sns_type === Types.login.google){
      queryUser = mysql.format("SELECT email, id, nick_name, name, age, gender, contact FROM users WHERE google_id=?", sns_id);
    }else if(sns_type === Types.login.kakao){
      queryUser = mysql.format("SELECT email, id, nick_name, name, age, gender, contact FROM users WHERE kakao_id=?", sns_id);
    }else if(sns_type === Types.login.apple){
      queryUser = mysql.format("SELECT email, id, nick_name, name, age, gender, contact FROM users WHERE apple_id=?", sns_id);
    }
  }else{
    queryUser = mysql.format("SELECT email, id, nick_name, name, age, gender, facebook_id, google_id, kakao_id, apple_id, contact FROM users WHERE email=?", sns_email);
  }

  db.SELECT(queryUser, {}, (result) => {
    console.log(result);
    if(result.length === 0){
      return res.json({
        result:{
          state: res_state.login_no_user
        }
      })
    }

    const userData = result[0];
    // let db_sns_id = null;
    let _state = Types.res.RES_SUCCESS;
    if(sns_type === Types.login.facebook){
      if(userData.google_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_GOOGLE;
      }else if(userData.kakao_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_KAKAO;
      }else if(userData.apple_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_APPLE;
      }
    }else if(sns_type === Types.login.google){
      if(userData.facebook_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_FACEBOOK;
      }else if(userData.kakao_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_KAKAO;
      }else if(userData.apple_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_APPLE;
      }
    }else if(sns_type === Types.login.kakao){
      if(userData.facebook_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_FACEBOOK;
      }else if(userData.google_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_GOOGLE;
      }else if(userData.apple_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_APPLE;
      }
    }else if(sns_type === Types.login.apple){
      // db_sns_id = userData.apple_id;
      if(userData.facebook_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_FACEBOOK;
      }else if(userData.google_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_GOOGLE;
      }else if(userData.kakao_id != null){
        _state = Types.res.RES_SUCCESS_LOGIN_SNS_ALREADY_KAKAO;
      }
    }

    return res.json({
      result:{
        state: _state,
        ...userData
      }
    })
  })

  */
});
app.post('/any/login/sns', function(req, res){
  var userEmail = req.body.data.sns_email;
  // var userPassword = req.body.data.user_p;
  // const saltRounds = 10 ;   
  // const myPlaintextPassword = req.body.data.user_p;   
  // const someOtherPlaintextPassword = ' not_bacon ' ;

  // type === kakao
/*
  db.SELECT("SELECT * FROM users WHERE email = BINARY(?)", [userEmail], function(result){
      //var finalNodeGeneratedHash = result[0].password.replace('$2y$', '$2b$');
      
      var data = {
        state : 'error',
        message : 'none'
      };
      
      if(result.length <= 0)
      {
        // console.log('아이디 없음!!');
        data.state = 'error';
        data.message = '아이디가 존재하지 않습니다.';

        // return res.send(data);
        return res.json({
          result: {
            ...data
          }
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
              var date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

              var refreshTokenObject = {
                user_id : user.id,
                refresh_token : token,
                device : 'deviceinfo',
                created_at : date,
                updated_at: date
              };

              
              db.INSERT("INSERT INTO devices SET ? ", refreshTokenObject, function(result){
                // console.log(result);
                makeAccessToken(user.id, data, res);
              });
            }            
          });
        }
        else{
          data.state = 'error';
          data.message = '비밀번호가 틀렸습니다.';
          return res.json({
            result: {
              ...data
            }
          });
        }
      });
  });
  */
});

app.get("/any/sns/callback/apple", function(req, res){
  return res.json({
    result: {
      state: res_state.success
    }
  })
})

function payWaitTimeExpireCheck(){
  // console.log(moment_timezone().format('YYYY-MM-DD HH:mm:ss'));
  const querySelect = mysql.format("SELECT id, created_at, state FROM orders WHERE state=?", [types.order.ORDER_STATE_APP_PAY_WAIT]);

  db.SELECT(querySelect, {}, (result) => {
    for(let i = 0 ; i < result.length ; i++){
      const orderData = result[i];

      const waitSec = util.getWaitTimeSec(orderData.created_at);
      if(waitSec <= 0){
        //0보다 작으면 값을 바꿔줘야함.
        //이거 주석 풀어줘야 함. 일단 테스트로 8 고정
        
        db.UPDATE("UPDATE orders AS _order SET _order.state=? WHERE _order.id=?", [types.order.ORDER_STATE_CANCEL_WAIT_PAY, orderData.id], (result_order_update) => {
          console.log(orderData.id + ' changed' + ' ORDER_STATE_CANCEL_WAIT_PAY');
          // return res.json({
          //   state: res_state.none,
          //   result: {
          //   }
          // });
        }, (error) => {
            
        });
      }
    }
  });
  
}

cron.schedule('* * * * *', function(){
  payWaitTimeExpireCheck();
  //
});

// cron.schedule('1,2,4,5 * * * *', () => {
//   console.log('running every minute 1, 2, 4 and 5');
// });

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

// app.listen(3000, "0.0.0.0", function () {
//   console.log('Example app listening on port 3000!');
// })
