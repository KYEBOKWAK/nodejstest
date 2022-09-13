const exprieTimeMS = 60000;
// const phoneRandNumExpire = 180;
const phoneRandNumExpire = 180;
// const phoneRandNumExpire = 30;


const EXPIRE_REFRESH_TOKEN = '365d';
const EXPIRE_ACCESS_TOKEN = '10m'; //php에서 발급하는 accesstoken과 동일한 시간으로 해야함. TOKEN_EXPIRED_PLUS_TIME_SECOND

const EXPIRE_DOWNLOAD_FILE_TOKEN = '2h';
// const EXPIRE_REFRESH_TOKEN = '5m';
// const EXPIRE_ACCESS_TOKEN = 10;
// const REFRESH_TOKEN_RENEW_LAST_DAT_MIL_SEC = 180000; //밀리초 단위 refresh 재갱신 기준값.
const REFRESH_TOKEN_RENEW_LAST_DAT_MIL_SEC = 0; //밀리초 단위 refresh 재갱신 기준값.
const REFRESH_TOKEN_RENEW_LAST_DAT_DAY = 30; //일단위 //refresh 재갱신 기준값. 사용시 밀리초를 0으로 해야함. 예: 4 = 기간이 4일 남았을때 재갱신. refresh expire 시간보다 짧아야한다.

const TIME_DUE_ONE_TO_ONE_CONFIRM_CHECK_PLAY_AFTER_HOUR = 2;//1:1 플레이 2시간 후 확인 요청
const TIME_DUE_AUTO_CONFIRM_DAY = 3;//자동 확인 대기 시간 3일
const TIME_DUE_CONFIRM_CHECK_DAY = 2; //TIME_DUE_AUTO_CONFIRM_DAY 보다 작아야 한다.// 구매 미확인 체크 알림 예: 3일 후 자동 확전 전 24시간 전인 2일에 구매 확인 알림을 보낸다. ** 해당 부분이 변경될경우 time_due 를 꼭 확인 해야함 **

const TIME_DUE_WAIT_APPROVE_DAY = 7;//7일뒤 승인 기간 만료
const TIME_DUE_WAIT_APPROVE_FIRST_CHECK_DAY = 3;  //TIME_DUE_WAIT_APPROVE_DAY 전 첫번째 경고 알림 day **TIME_DUE_WAIT_APPROVE_DAY, TIME_DUE_WAIT_APPROVE_SECOND_CHECK_DAY 보다 무조건 작아야 한다.**
//** 해당 부분이 변경될경우 time_due 를 꼭 확인 해야함 **
const TIME_DUE_WAIT_APPROVE_SECOND_CHECK_DAY = 6; //TIME_DUE_WAIT_APPROVE_DAY 전 두번째 경고 알림 day **TIME_DUE_WAIT_APPROVE_DAY 보다 무조건 작아야 하고 TIME_DUE_WAIT_APPROVE_FIRST_CHECK_DAY 보다는 무조건 커야 한다.**
//** 해당 부분이 변경될경우 time_due 를 꼭 확인 해야함 **

const TIME_DUE_WAIT_RELAY_CONTENT_CHECK_DAY = 7;// 승인 후 콘텐츠 전달이 7일동안 이루어지지 않았을 경우 알림 보냄

const TIME_DUE_ONE_TO_ONE_PLAYING_WAIT_CHECK_FIRST_DAY = 2; //1:1 승인 후 2일뒤에 진행 요청 알림
const TIME_DUE_ONE_TO_ONE_PLAYING_WAIT_CHECK_SECOND_DAY = 7;  //1:1 승인 후 7일뒤에 진행 요청 알림

const ALARM_DOWNLOAD_ORDER_CHECK_HOUR = 19;
const ALARM_DOWNLOAD_ORDER_CHECK_MIN = 0;

var express = require('express');
var app = express();

const use = require('abrequire');

var bodyParser = require('body-parser');

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
// var types = use('lib/types.js');

const slack = use("lib/slack.js");

var Iamport = require('iamport');
var iamport = new Iamport({
  impKey: process.env.IAMPORT_API_KEY,
  impSecret: process.env.IAMPORT_SECRET_KEY
});

process.setMaxListeners(15);
/////상단 새로운 코드 START////

app.use(express.json({ limit : "50mb" }));

app.use(bodyParser.json());
app.use(cors());

// app.use(express.json({ limit : "50mb" }));
// app.use(express.urlencoded({ limit:"50mb", extended: false }));

//middleware star
//middleware end

//여기서부터 새로운 코드 간다!! START

app.use(function (req, res, next) {
  // console.log(req.headers.origin);
  // console.log(process.env.CROWDTICKET_WEB_REFERER);

  if(req.headers.origin){
    if(
        process.env.APP_TYPE === 'local' ||
        process.env.CROWDTICKET_WEB_REFERER === req.headers.origin ||
        process.env.CROWDTICKET_WEB_REFERER_WEB === req.headers.origin ||
        process.env.CROWDTICKET_WEB_REFERER_WEB_QA_R === req.headers.origin ||
        process.env.CROWDTICKET_WEB_REFERER_WEB_QA === req.headers.origin ||
        process.env.CTEE_WEB_REFERER_WEB === req.headers.origin ||
        process.env.CTEE_WEB_REFERER_WEB_QA_R === req.headers.origin ||
        process.env.CTEE_WEB_REFERER_WEB_QA === req.headers.origin
      ){
        //통과
      }else{
        return res.json({
          state: 'error',
          message: '정상 접근이 아닙니다. access is abnormal'
        });      
      }
  }
  
  let url = req.url;
  let indexAnyString = url.indexOf('/any/');
  if(indexAnyString < 0){
    //any가 없으면 무조건 token 체크를 한다.
    if(req.body.data === undefined){
      return res.json({
        state: 'error',
        message: '데이터 없음. 다시 로그인 해주세요.',
        result: {}
      })
    }
    else if(!req.body.data.access_token){
      // console.log('none!!');
      //엑세스토큰이 없다면 완전 오류임!!
      return res.json({
        state: 'error',
        message: '토큰 정보가 없음. 다시 로그인 해주세요.',
        result: {}
      })
    }
    else{
      _jwt.READ(req.body.data.access_token, function(result){
        //console.log(result);
        if(result.state === 'success'){
          req.body.data.user_id = Number(result.id);
          return next();
        }else{
          //만기이거나 에러인 경우 임시 토큰을 발급한다.
          if(req.body.__user_id === 0 || req.body.__user_id === undefined){
            return res.json({
              state: 'error',
              message: '유저 ID 0, 토큰 생성 오류. 해당 오류가 반복 되는 경우 재로그인 해주세요.',
              result: {}
            })
          }

          _jwt.CREATE(jwtType.TYPE_JWT_ACCESS_TOKEN, 
          {
            id: req.body.__user_id,
            type: jwtType.TYPE_JWT_ACCESS_TOKEN
          }, 
          EXPIRE_ACCESS_TOKEN, function(value){
            let access_token = value.token;
            return res.json({
              state: 'access_token_reset',
              result: {
                user_id: req.body.__user_id,
                access_token: access_token
              }
            })
          });
        }
      });
    }
  }else{
    //any가 붙은 url 이지만 로그인을 했으면, 로그인 정보를 넘겨준다.
    if(req.body.data && req.body.data.access_token && req.body.data.access_token !== ''){
      _jwt.READ(req.body.data.access_token, function(result){
        //console.log(result);
        if(result.state === 'success'){
          //지금까진 any에 user_id를 체크 하진 않았지만, 어딘가에서 user_id를 보낼수도 있으므로, any를 붙여준다.
          req.body.data.user_id_any = Number(result.id);
          return next();          
        }else{

          if(req.body.__user_id === 0 || req.body.__user_id === undefined){
            return res.json({
              state: 'error',
              message: '유저 ID 0, 토큰 생성 오류. 해당 오류가 반복 되는 경우 재로그인 해주세요.',
              result: {}
            })
          }

          _jwt.CREATE(jwtType.TYPE_JWT_ACCESS_TOKEN, 
          {
            id: req.body.__user_id,
            type: jwtType.TYPE_JWT_ACCESS_TOKEN
          }, 
          EXPIRE_ACCESS_TOKEN, function(value){
            let access_token = value.token;
            return res.json({
              state: 'access_token_reset',
              result: {
                user_id: req.body.__user_id,
                access_token: access_token
              }
            })
          });
        }
      });
    }else{
      return next();
    }
  }
});

let main = require('./routes/main');
app.use('/main', main);

let projects = require('./routes/projects');
app.use('/projects', projects);

let user = require('./routes/user');
app.use('/user', user);

let payView = require('./routes/pay');
app.use('/pay', payView);

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

let routerEvent = require('./routes/events');
app.use('/event', routerEvent);

let routerCategory = require('./routes/category');
app.use('/category', routerCategory);

let routerTags = require('./routes/tags');
app.use('/tag', routerTags);

let routerViewCount = require('./routes/view_count');
app.use('/viewcount', routerViewCount);

let routerBanner = require('./routes/banner');
app.use('/banner', routerBanner);

let routerChat = require('./routes/chat');
app.use('/chat', routerChat);

let routerAd = require('./routes/advertisement');
app.use('/advertisement', routerAd);

let routerPlace = require('./routes/place');
app.use('/place', routerPlace);


let routerDonation = require('./routes/donation');
app.use('/donation', routerDonation);

let routerReport = require('./routes/report');
app.use('/report', routerReport);

let routerPost = require('./routes/post');
app.use('/post', routerPost);

let routerSlack = require('./routes/slack');
app.use('/slack', routerSlack);

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
  let countryCode = req.body.data.countryCode;
  if(countryCode === undefined || countryCode === null || countryCode === ''){
    countryCode = '82';
  }
  
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
          if(countryCode === '82' || countryCode === 82){
            content = "[크티] 인증번호 [ " + randVal + " ]를 입력해주세요.";
          }else{
            content = `[NINEAM] verification: ${randVal}`;
          }

          Global_Func.sendSMS(contact, countryCode, content, (result) => {
              if(result.statusCode === '202'){
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

          //일치 하다면 기존에 중복된 번호가 있는지 확인 한다.
          db.UPDATE('UPDATE users SET contact=?, country_code=?, is_certification=? WHERE contact=?', ['', null, false, contact], 
          (result_update) => {
            return res.json({
              result: {
                state: res_state.success,
              }
            });
          }, (error_update) => {
            console.log('#### 번호 초기화 오류 : ' + contact);
            return res.json({
              state: 'error',
              message: '중복 초기화 오류',
              result: {}
            });
          })
          
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
  const querySelect = mysql.format("SELECT id, created_at, state FROM orders WHERE state=?", [Types.order.ORDER_STATE_APP_PAY_WAIT]);

  db.SELECT(querySelect, {}, (result) => {
    for(let i = 0 ; i < result.length ; i++){
      const orderData = result[i];

      const waitSec = util.getWaitTimeSec(orderData.created_at);
      if(waitSec <= 0){
        //0보다 작으면 값을 바꿔줘야함.
        //이거 주석 풀어줘야 함. 일단 테스트로 8 고정
        
        db.UPDATE("UPDATE orders AS _order SET _order.state=? WHERE _order.id=?", [Types.order.ORDER_STATE_CANCEL_WAIT_PAY, orderData.id], (result_order_update) => {
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

function storePayWaitTimeExpireCheck(){
  // console.log(moment_timezone().format('YYYY-MM-DD HH:mm:ss'));
  const querySelect = mysql.format("SELECT id, created_at, state FROM orders_items WHERE state=?", [Types.order.ORDER_STATE_APP_STORE_STANBY]);

  db.SELECT(querySelect, {}, (result) => {
    for(let i = 0 ; i < result.length ; i++){
      const orderData = result[i];

      const waitSec = util.getStoreOrderWaitTimeSec(orderData.created_at);
      if(waitSec <= 0){
        //0보다 작으면 값을 바꿔줘야함.
        //이거 주석 풀어줘야 함. 일단 테스트로 8 고정
        
        db.UPDATE("UPDATE orders_items AS _order SET _order.state=? WHERE _order.id=?", [Types.order.ORDER_STATE_APP_STORE_STANBY_FAIL, orderData.id], (result_order_update) => {
          // console.log(orderData.id + ' changed' + ' ORDER_STATE_APP_STORE_STANBY_FAIL');
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

function alarmTalkCTSTORE07CTSTORE12(){
  let nowDate = moment_timezone().format("YYYY-MM-DD HH:mm:00");

  let afterHourTime = moment_timezone(nowDate).add(2, 'hours').format("YYYY-MM-DD HH:mm:00");

  const querySelect = mysql.format("SELECT orders_item.user_id, orders_item.name AS customer_name, store.contact AS store_contact, orders_item.contact, select_time, store.title AS creator_name, item.title AS item_title, store_order_id FROM event_play_times AS event_play_time LEFT JOIN orders_items AS orders_item ON event_play_time.store_order_id=orders_item.id LEFT JOIN stores AS store ON orders_item.store_id=store.id LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE event_play_time.select_time IS NOT NULL AND event_play_time.select_time=? AND orders_item.state=?", [afterHourTime, Types.order.ORDER_STATE_APP_STORE_READY]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return;
    }

    let _default_url = 'ctee.kr';
    if(process.env.APP_TYPE === 'local'){
      _default_url = 'localhost:8000';
    }else if(process.env.APP_TYPE === 'qa'){
      _default_url = 'qa.ctee.kr';
    }

    for(let i = 0 ; i < result.length ; i++){
      const data = result[i];

      const content_url = _default_url + `/users/store/`+ data.user_id + '/orders';
      const store_manager_url = _default_url+"/manager/store";

      Global_Func.sendKakaoAlimTalk({
        templateCode: 'CTSTORE07',
        to: data.contact,
        creator_name: data.creator_name,
        item_title: data.item_title,
        select_time: moment_timezone(data.select_time).format("YYYY-MM-DD HH:mm"),
        content_url: content_url
      })

      Global_Func.sendKakaoAlimTalk({
        templateCode: 'CTSTORE12',
        to: data.store_contact,
        customer_name: data.customer_name,
        item_title: data.item_title,
        select_time: moment_timezone(data.select_time).format("YYYY-MM-DD HH:mm"),
        store_manager_url: store_manager_url
      })
    }
  })
}

function alarmTalkCTSTORE08c(){
  // let nowDate = moment_timezone().format("YYYY-MM-DD HH:mm:00");

  // let afterHourTime = moment_timezone(nowDate).add(2, 'hours').format("YYYY-MM-DD HH:mm:00");

  const querySelect = mysql.format("SELECT orders_item.name AS customer_name, orders_item.contact, select_time, store.title AS creator_name, item.title AS item_title, store_order_id FROM event_play_times AS event_play_time LEFT JOIN orders_items AS orders_item ON event_play_time.store_order_id=orders_item.id LEFT JOIN stores AS store ON orders_item.store_id=store.id LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE event_play_time.select_time IS NOT NULL AND orders_item.state=?", [Types.order.ORDER_STATE_APP_STORE_PLAYING_DONE_CONTENTS]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return;
    }

    let _default_url = 'ctee.kr';
    if(process.env.APP_TYPE === 'local'){
      _default_url = 'localhost:8000';
    }else if(process.env.APP_TYPE === 'qa'){
      _default_url = 'qa.ctee.kr';
    }

    let nowDate = moment_timezone().format("YYYY-MM-DD HH:mm:00");

    for(let i = 0 ; i < result.length ; i++){
      const data = result[i];

      const content_url = _default_url + `/store/content/`+ data.store_order_id;

      const afterHourTime = moment_timezone(data.select_time).add(TIME_DUE_ONE_TO_ONE_CONFIRM_CHECK_PLAY_AFTER_HOUR, 'hours').format("YYYY-MM-DD HH:mm:00");

      if(nowDate === afterHourTime){
        Global_Func.sendKakaoAlimTalk({
          templateCode: 'CTSTORE08c',
          to: data.contact,
          creator_name: data.creator_name,
          item_title: data.item_title,
          customer_name: data.customer_name,
          content_url: content_url,
          time_due: TIME_DUE_AUTO_CONFIRM_DAY + '일'
        })
      } 
    }
  })
}

function alarmTalkCTSTORE08b(){
  //(구매자) 콘텐츠 전달 후 2일까지 구매 확인이 안됐을 경우 [구매 확인 요청 알림] (CTSTORE08b)
  const querySelect = mysql.format("SELECT orders_item.relay_at, orders_item.id AS store_order_id, orders_item.name AS customer_name, orders_item.created_at, orders_item.contact, store.title AS creator_name, item.title AS item_title FROM orders_items AS orders_item LEFT JOIN stores AS store ON orders_item.store_id=store.id LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE relay_at IS NOT NULL AND orders_item.state=?", [Types.order.ORDER_STATE_APP_STORE_RELAY_CUSTOMER]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return;
    }

    let _default_url = 'ctee.kr';
    if(process.env.APP_TYPE === 'local'){
      _default_url = 'localhost:8000';
    }else if(process.env.APP_TYPE === 'qa'){
      _default_url = 'qa.ctee.kr';
    }

    let nowDate = moment_timezone().format("YYYY-MM-DD HH:mm:00");

    for(let i = 0 ; i < result.length ; i++){
      const data = result[i];

      const content_url = _default_url + `/store/content/`+ data.store_order_id;

      const afterHourday = moment_timezone(data.relay_at).add(TIME_DUE_CONFIRM_CHECK_DAY, 'days').format("YYYY-MM-DD HH:mm:00");

      if(nowDate === afterHourday){
        Global_Func.sendKakaoAlimTalk({
          templateCode: 'CTSTORE08b',
          to: data.contact,
          customer_name: data.customer_name,
          creator_name: data.creator_name,
          item_title: data.item_title,
          content_url: content_url,
          time_due: '24시간'
        })
      } 
    }
  })
}

function alarmTalkCTSTORE08b_oneToOneCheck(){
  //(구매자) 콘텐츠 전달 후 2일까지 구매 확인이 안됐을 경우 [구매 확인 요청 알림] (CTSTORE08b)
  const querySelect = mysql.format("SELECT orders_item.relay_at, orders_item.id AS store_order_id, orders_item.name AS customer_name, orders_item.created_at, orders_item.contact, store.title AS creator_name, item.title AS item_title FROM orders_items AS orders_item LEFT JOIN stores AS store ON orders_item.store_id=store.id LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE relay_at IS NOT NULL AND orders_item.state=?", [Types.order.ORDER_STATE_APP_STORE_PLAYING_DONE_CONTENTS]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return;
    }

    let _default_url = 'ctee.kr';
    if(process.env.APP_TYPE === 'local'){
      _default_url = 'localhost:8000';
    }else if(process.env.APP_TYPE === 'qa'){
      _default_url = 'qa.ctee.kr';
    }

    let nowDate = moment_timezone().format("YYYY-MM-DD HH:mm:00");

    for(let i = 0 ; i < result.length ; i++){
      const data = result[i];

      const content_url = _default_url + `/store/content/`+ data.store_order_id;

      const afterHourday = moment_timezone(data.relay_at).add(TIME_DUE_CONFIRM_CHECK_DAY, 'days').format("YYYY-MM-DD HH:mm:00");

      if(nowDate === afterHourday){
        Global_Func.sendKakaoAlimTalk({
          templateCode: 'CTSTORE08b',
          to: data.contact,
          customer_name: data.customer_name,
          creator_name: data.creator_name,
          item_title: data.item_title,
          content_url: content_url,
          time_due: '24시간'
        })
      } 
    }
  })
}

function alarmTalkCTSTORE09a(){
  //구매 후 승인/반려 안할 시 3일 , 6일 체크 기능 (CTSTORE09)
  const querySelect = mysql.format("SELECT orders_item.name AS customer_name, item.price AS item_price, orders_item.id, orders_item.created_at, store.contact, store.title AS creator_name, item.title AS item_title FROM orders_items AS orders_item LEFT JOIN stores AS store ON orders_item.store_id=store.id LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.state=?", [Types.order.ORDER_STATE_APP_STORE_PAYMENT]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return;
    }

    let _default_url = 'ctee.kr';
    if(process.env.APP_TYPE === 'local'){
      _default_url = 'localhost:8000';
    }else if(process.env.APP_TYPE === 'qa'){
      _default_url = 'qa.ctee.kr';
    }

    const store_manager_url = _default_url+"/manager/store";

    let nowDate = moment_timezone().format("YYYY-MM-DD HH:mm:00");

    for(let i = 0 ; i < result.length ; i++){
      const data = result[i];

      // const content_url = _default_url + `/store/content/`+ data.store_order_id;

      const afterThreeday = moment_timezone(data.created_at).add(TIME_DUE_WAIT_APPROVE_FIRST_CHECK_DAY, 'days').format("YYYY-MM-DD HH:mm:00");
      const afterSixday = moment_timezone(data.created_at).add(TIME_DUE_WAIT_APPROVE_SECOND_CHECK_DAY, 'days').format("YYYY-MM-DD HH:mm:00");

      if(nowDate === afterThreeday){
        //3일
        // console.log('3일남음');
        // console.log(data.id);
        Global_Func.sendKakaoAlimTalk({
          templateCode: 'CTSTORE09a',
          to: data.contact,
          creator_name: data.creator_name,
          customer_name: data.customer_name,
          item_title: data.item_title,
          item_price: data.item_price,
          requested_at: moment_timezone(data.created_at).format("YYYY-MM-DD HH:mm"),
          time_due: '4일',
          store_manager_url: store_manager_url
        })
      }else if(nowDate === afterSixday){
        // console.log('6일남음');
        Global_Func.sendKakaoAlimTalk({
          templateCode: 'CTSTORE09a',
          to: data.contact,
          creator_name: data.creator_name,
          customer_name: data.customer_name,
          item_title: data.item_title,
          item_price: data.item_price,
          requested_at: moment_timezone(data.created_at).format("YYYY-MM-DD HH:mm"),
          time_due: '1일',
          store_manager_url: store_manager_url
        })
      }
    }
  })
}

function alarmTalkCTSTORE11(){
  const querySelect = mysql.format("SELECT orders_item.apporve_at, orders_item.name AS customer_name, item.price AS item_price, orders_item.id, orders_item.created_at, store.contact, store.title AS creator_name, item.title AS item_title FROM orders_items AS orders_item LEFT JOIN stores AS store ON orders_item.store_id=store.id LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE orders_item.apporve_at IS NOT NULL AND orders_item.state=? AND item.product_state<>?", [Types.order.ORDER_STATE_APP_STORE_READY, Types.product_state.ONE_TO_ONE]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return;
    }

    let _default_url = 'ctee.kr';
    if(process.env.APP_TYPE === 'local'){
      _default_url = 'localhost:8000';
    }else if(process.env.APP_TYPE === 'qa'){
      _default_url = 'qa.ctee.kr';
    }

    const store_manager_url = _default_url+"/manager/store";

    let nowDate = moment_timezone().format("YYYY-MM-DD HH:mm:00");

    for(let i = 0 ; i < result.length ; i++){
      const data = result[i];

      const afterSevenday = moment_timezone(data.apporve_at).add(TIME_DUE_WAIT_RELAY_CONTENT_CHECK_DAY, 'days').format("YYYY-MM-DD HH:mm:00");

      if(nowDate === afterSevenday){
        //3일
        // console.log('7일지남');
        // console.log(data.id);
        Global_Func.sendKakaoAlimTalk({
          templateCode: 'CTSTORE11',
          to: data.contact,
          creator_name: data.creator_name,
          customer_name: data.customer_name,
          item_title: data.item_title,
          item_price: data.item_price,
          requested_at: moment_timezone(data.apporve_at).format("YYYY-MM-DD HH:mm"),
          store_manager_url: store_manager_url
        })
      }
    }
  })
}

function alarmTalkSsell12v2_oneToOneReminder(){
  const querySelect = mysql.format("SELECT orders_item.created_at, item.price AS item_price, orders_item.apporve_at, orders_item.id AS store_order_id, orders_item.name AS customer_name, orders_item.created_at, store.contact, store.title AS creator_name, item.title AS item_title FROM orders_items AS orders_item LEFT JOIN stores AS store ON orders_item.store_id=store.id LEFT JOIN items AS item ON orders_item.item_id=item.id WHERE apporve_at IS NOT NULL AND orders_item.state=? AND item.product_state=?", [Types.order.ORDER_STATE_APP_STORE_READY, Types.product_state.ONE_TO_ONE]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return;
    }

    let _default_url = 'ctee.kr';
    if(process.env.APP_TYPE === 'local'){
      _default_url = 'localhost:8000';
    }else if(process.env.APP_TYPE === 'qa'){
      _default_url = 'qa.ctee.kr';
    }

    const store_manager_url = _default_url+"/manager/store";

    let nowDate = moment_timezone().format("YYYY-MM-DD HH:mm:00");

    for(let i = 0 ; i < result.length ; i++){
      const data = result[i];

      const firstSendCheckDay = moment_timezone(data.apporve_at).add(TIME_DUE_ONE_TO_ONE_PLAYING_WAIT_CHECK_FIRST_DAY, 'days').format("YYYY-MM-DD HH:mm:00");

      const secondSendCheckDay = moment_timezone(data.apporve_at).add(TIME_DUE_ONE_TO_ONE_PLAYING_WAIT_CHECK_SECOND_DAY, 'days').format("YYYY-MM-DD HH:mm:00");

      if(nowDate === firstSendCheckDay ||
        nowDate === secondSendCheckDay){
        Global_Func.sendKakaoAlimTalk({
          templateCode: 'Ssell12v2',
          to: data.contact,
          customer_name: data.customer_name,
          item_price: data.item_price,
          requested_at: moment_timezone(data.created_at).format("YYYY-MM-DD HH:mm"),
          item_title: data.item_title,
          store_manager_url: store_manager_url,
        })
      } 
    }
  })
}

function alarmTalkSendTimeCheck(){

  alarmTalkCTSTORE07CTSTORE12();
  // alarmTalkCTSTORE08c();
  alarmTalkCTSTORE08b();
  alarmTalkCTSTORE09a();
  alarmTalkCTSTORE11();


  alarmTalkCTSTORE08b_oneToOneCheck();
  alarmTalkSsell12v2_oneToOneReminder();
}

function inactiveUserCheck(){
  //휴면 계정으로 만들어주는 쿼리
  const nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
  db.UPDATE("UPDATE users SET inactive=?, is_certification=? WHERE inactive=? AND inactive_at<=? AND is_withdrawal=? AND inactive_at IS NOT NULL", [true, false, false, nowDate, false], (result) => {
    return;
  }, (error) => {
    console.log('#### 휴면 유저 셋팅 에러');
  })
}

function removeTagHOT(){
  const nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
  db.DELETE("DELETE FROM items_thumb_tags WHERE type=? AND end_date <= ?", [Types.thumb_tags_type.HOT, nowDate], (result) => {
  }, (error) => {
    console.log('####ERROR TAG HOT DELETE ' + error);
  })
}

function setTagHOT(){
  const nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  const today = moment_timezone(nowDate);
  const from_date = today.startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss');
  const to_date = today.endOf('isoWeek').format('YYYY-MM-DD HH:mm:ss');

  const queryThumbTagSelect = mysql.format("SELECT target_id, type FROM items_thumb_tags WHERE type=? AND end_date>=?", [Types.thumb_tags_type.HOT, nowDate]);
  db.SELECT(queryThumbTagSelect, {}, (result_tag_select) => {
    // console.log(result_tag_select);

    let isHaveTaglist = [];
    for(let i = 0 ; i < result_tag_select.length ; i++){
      const data = result_tag_select[i];
      isHaveTaglist.push(data.target_id);
    }

    if(isHaveTaglist.length === 0){
      isHaveTaglist.push(0);
    }

    const querySelect = mysql.format("SELECT item_id, COUNT(id) AS count FROM orders_items WHERE state < 99 AND created_at >= ? AND created_at < ? AND item_id NOT IN (?) GROUP BY item_id HAVING COUNT(id) >= 5", [from_date, to_date, isHaveTaglist]);

    db.SELECT(querySelect, {}, (result_select) => {
      let isHOTItemList = [];
      for(let i = 0 ; i < result_select.length ; i++){
        const data = result_select[i];
        isHOTItemList.push(data.item_id);
      }

      let _dataInsertQueryArray = [];
      let _dataInsertOptionArray = [];

      const start_date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');
      const end_date = moment_timezone(start_date).add(7, 'days').format('YYYY-MM-DD HH:mm:ss');


      for(let i = 0 ; i < isHOTItemList.length ; i++){
        const data = isHOTItemList[i];
        let queryObject = {
          key: i,
          value: "INSERT INTO items_thumb_tags SET ?;"
        }

        let data_object = {
          target_id: data,
          thumb_tag_id: 1,
          type: Types.thumb_tags_type.HOT,
          start_date: start_date,
          end_date: end_date
        };

        let insertDataObject = {
          key: i,
          value: data_object
        }

        _dataInsertQueryArray.push(queryObject);
        _dataInsertOptionArray.push(insertDataObject);
      }

      if(_dataInsertQueryArray.length > 0){
        db.INSERT_MULITPLEX(_dataInsertQueryArray, _dataInsertOptionArray, (result) => {
          // console.log('HOT 태그 추가 성공');
        }, (error) => {
          console.log('HOT 태그 추가 실패');
        })
      }
    });

  })
}

function alarmDownloadOrderCheck() {
  const nowDate = moment_timezone().format(`YYYY-MM-DD ${ALARM_DOWNLOAD_ORDER_CHECK_HOUR}:00:00`);

  const startDate = moment_timezone(nowDate).add(-1, 'days').format(`YYYY-MM-DD ${ALARM_DOWNLOAD_ORDER_CHECK_HOUR}:00:00`);


  // console.log(nowDate);
  // console.log(startDate);

  const querySelect = mysql.format("SELECT store.title, store.contact AS store_contact, COUNT(CASE WHEN orders_item.state<99 THEN 1 END) AS order_count, SUM(orders_item.total_price) AS order_total_price FROM stores AS store LEFT JOIN orders_items AS orders_item ON store.id=orders_item.store_id LEFT JOIN items AS item ON item.id=orders_item.item_id WHERE item.type_contents=? AND orders_item.state < 99 AND orders_item.created_at >= ? AND orders_item.created_at <= ? GROUP BY store.id HAVING COUNT(CASE WHEN orders_item.state<99 THEN 1 END)>0 AND SUM(orders_item.total_price) > 0", [Types.contents.completed, startDate, nowDate]);

  db.SELECT(querySelect, {}, (result) => {
    if(result.length === 0){
      return;
    }

    let _default_url = 'ctee.kr';
    if(process.env.APP_TYPE === 'local'){
      _default_url = 'localhost:8000';
    }else if(process.env.APP_TYPE === 'qa'){
      _default_url = 'qa.ctee.kr';
    }

    for(let i = 0 ; i < result.length ; i++){
      const data = result[i];
      // const content_url = _default_url + `/users/store/`+ data.user_id + '/orders';
      const store_manager_url = _default_url+"/manager/store";


      Global_Func.sendKakaoAlimTalk({
        templateCode: 'Kalarm14v1',
        to: data.store_contact,
        creator_name: data.title,
        order_count: data.order_count + ' 건',
        order_total_price: data.order_total_price + '원 1일 기준',
        store_manager_url: store_manager_url
      })
    }
  })

  // const today = moment_timezone(nowDate);
  // const from_date = today.startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss');
  // const to_date = today.endOf('isoWeek').format('YYYY-MM-DD HH:mm:ss');
}

/*
cron.schedule('* * * * *', function(){
  
});
*/
/*
cron.schedule('0 0 * * Mon', function(){
  //특정 시간에 체크한다. 월요일 0시 0분
  
});
*/
/*
cron.schedule(`${ALARM_DOWNLOAD_ORDER_CHECK_MIN} ${ALARM_DOWNLOAD_ORDER_CHECK_HOUR} * * *`, function(){
  //특정 시간에 체크한다. 매일 19시 0분에 다운로드 주문이 있을경우 알림을 보내준다.
  alarmDownloadOrderCheck();
});
*/

app.post('/filedownload/token/make', function(req, res){
  const user_id = req.body.data.user_id;
  const file_id = req.body.data.file_id;
  if(user_id === undefined){
    return res.json({
      state: res_state.error,
      message: '유저 정보가 없습니다. 재로그인 후 다시 이용해주세요',
      result: {}
    });
  }

  if(file_id === undefined){
    return res.json({
      state: res_state.error,
      message: '파일 ID 정보가 없습니다. 새로고침 후 다시 이용해주세요',
      result: {}
    })
  }


  _jwt.CREATE(jwtType.TYPE_JWT_FILEDOWNLOAD, 
    {
      user_id: user_id,
      file_id: file_id
    }, 
    EXPIRE_DOWNLOAD_FILE_TOKEN, function(value){
    if(value.state === 'error'){
      console.log('#### 토큰 생성 실패 File id: ' + file_id);
      return res.json({
        state: 'error',
        message: value.message,
        result: {}
      })
    }else{
      let filedownloadtoken = value.token;
      return res.json({
        result: {
          filedownloadtoken: filedownloadtoken
        }
      });
    }
  });
})

app.listen(3000, '0.0.0.0', function () {
  console.log('Example app listening on port 3000!');

  if(process.env.APP_TYPE !== 'local'){
    slack.webhook({
      channel: "#bot-서버오류",
      username: "bot",
      text: `[CT_SERVER]\n서버 부팅됨(or 재부팅)`
    }, function(err, response) {
    });
  }
});

app.use(function(err, req, res, next) {
  console.error(`[CT_SERVER_ERROR]\nURL: ${req.url}\nMes: ${err.message} || \n${err.stack}`);

  if(process.env.APP_TYPE !== 'local'){
    slack.webhook({
      channel: "#bot-서버오류",
      username: "bot",
      text: `[CT_SERVER_ERROR]\nURL: ${req.url}\nMes: ${err.message}`
    }, function(err, response) {
    });
  }

  return res.json({
    state: res_state.error,
    message: err.message,
    result: {}
  })
  
});

// app.listen(3000, "0.0.0.0", function () {
//   console.log('Example app listening on port 3000!');
// })
