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

// let bcrypt = require('bcrypt');

// var jwt = require('jsonwebtoken');
// const _jwt = use('lib/jwt.js');
// const jwtType = use('lib/jwt_type.js');

// var validator = require("email-validator");

// const axios = require('axios');
// const Global_Func = use("lib/global_func.js");
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var apn = require('apn');
var admin = require("firebase-admin");

var serviceAccount = use("crowdticket-master-firebase-adminsdk-oms6b-4b5db85099.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
  // databaseURL: "https://crowdticket-master.firebaseio.com"
});

var apnOptions = {
  token: {
    key: process.env.APPLE_APNS_KEY_FILE_NAME,
    keyId: process.env.APPLE_APNS_KEY_ID,
    teamId: process.env.APPLE_TEAM_ID
  },
  production: false
};

router.post("/any/android", function(req, res){
  /*
  let fcm_target_token = "dLAHuokSzeI:APA91bHYxf5DvxRpERw0P2d252OAPAk5O0jljomdaBUtZUGlqSCZiAlPVbZYIAZSHJmS5Dq471HZhl8lTUGaYXzpg56s05dUezo0xNZLeg2DP3Zd7spTJrutNBnqPVnjo05Fek3SZNy6";
  
  let fcm_message = {
    
    // data: {
    //   'abc': 'aa'
    // }, // OBJECT: The push data
    notification: {
       title: "타이틀",
       body: '바디내용',
       image: 'https://s3-ap-northeast-1.amazonaws.com/crowdticket0/newtest/posters/626/title_img_file_1-2.jpg'
    },
    token: fcm_target_token,
  };

  admin.messaging().send(fcm_message).then((response) => {
    console.log("보내기 성공!!");
    console.log(response);
    return res.json({});
  }).catch((error) => {
    console.log("보내기 실패!!");
    console.log(error);
    return res.json({});
  })
  */
});

router.post("/any/ios", function(req, res){

  /*
  var apnProvider = new apn.Provider(apnOptions);

  var note = new apn.Notification();

  let deviceToken = "a2674985f6ad4f2e4941279fadee7f46484db159f4005c4a59f48e441966112b"

  // note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  note.badge = 1;
  note.sound = "default";
  note.alert = {
    title: "밋업",
    body: "<<공대생과 함께 예쓰예쓰>> 가 곧 오픈됍니다!!",
    // "image-url": "https://i.ytimg.com/vi/7qkbRYM7YP8/maxresdefault.jpg"
  //   // 'launch-image': 'https://i.ytimg.com/vi/7qkbRYM7YP8/maxresdefault.jpg'
  }
  
  note.payload = 
  {
    'messageFrom': 'John Appleseed',
    'aaa': 'abc'
  };
  // note.topic = "com.nineam.crowdticket";
  note.topic = process.env.APP_BUNDLE_ID;
  

  apnProvider.send(note, deviceToken).then( (result) => {
    // see documentation for an explanation of result
    apnProvider.shutdown();

    let fcm_target_token = "dLAHuokSzeI:APA91bHYxf5DvxRpERw0P2d252OAPAk5O0jljomdaBUtZUGlqSCZiAlPVbZYIAZSHJmS5Dq471HZhl8lTUGaYXzpg56s05dUezo0xNZLeg2DP3Zd7spTJrutNBnqPVnjo05Fek3SZNy6";
  
    let fcm_message = {
      
      // data: {
      //   'abc': 'aa'
      // }, // OBJECT: The push data
      notification: {
        title: "밋업",
        body: "<<공대생과 함께 예쓰예쓰>> 가 곧 오픈됍니다!!",
        image: 'https://s3-ap-northeast-1.amazonaws.com/crowdticket0/newtest/posters/626/title_img_file_1-2.jpg'
      },
      token: fcm_target_token,
    };

    admin.messaging().send(fcm_message).then((response) => {
      console.log("보내기 성공!!");
      console.log(response);
      return res.json({});
    }).catch((error) => {
      console.log("보내기 실패!!");
      console.log(error);
      return res.json({});
    })
  });
  */
})

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



module.exports = router;