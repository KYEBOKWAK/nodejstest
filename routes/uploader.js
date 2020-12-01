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

const PATH_USERS = "users";
const PATH_ITEMS = "items";

var aws = require('aws-sdk');
var multer = require('multer')
var multerS3 = require('multer-s3');
var s3 = new aws.S3({ 
  accessKeyId: process.env.AWS_S3_KEY,
  secretAccessKey: process.env.AWS_S3_SECRET,
  region: process.env.AWS_S3_REGION,
});

// const userProfileUpload = multer({
// const upload = multer({
//   storage: multerS3({
//       s3,
//       acl: 'public-read',
//       // acl: "public-read-write",
//       bucket: process.env.AWS_S3_BUCKET,
//       key: function(req, file, cb) {
//         console.log("####");
//         // console.log(req.file);
//         console.log(file.fieldname);

//         var newFileName = Date.now() + "-" + file.originalname + ".jpg";

//         // console.log(process.env.APP_TYPE);
//         let path = "";
//         if(process.env.APP_TYPE === undefined){
//           // console.log("없어!!!");
//           path = "newtest/"
//         }else{
//           path = process.env.APP_TYPE+"/";
//         }

//         var fullPath = path+'users/'+file.originalname+"/"+ newFileName;

//         console.log(fullPath);
//         cb(null, fullPath);
//           // cb(null, Date.now().toString());
//       }
//   })
// });

const uploadUserProfileImg = multer({
  storage: multerS3({
      s3,
      acl: 'public-read',
      // acl: "public-read-write",
      bucket: process.env.AWS_S3_BUCKET,
      key: function(req, file, cb) {
        let path = "";
        if(process.env.APP_TYPE === undefined){
          // console.log("없어!!!");
          path = "newtest/"
        }else{
          path = process.env.APP_TYPE+"/";
        }
        var fullPath = path+'test/'+file.originalname;
        cb(null, fullPath);
      }
  })
});


getS3URL = () => {

  return;
}

/*
router.post("/any/img/profile/save", uploadUserProfileImg.single('file'), function(req, res){
  // console.log(req);
  // console.log(req.file);
  // console.log(req.body.nick_name);
  // console.log(req.body.user_id);

  let _data = {
    nick_name: req.body.nick_name,
    user_id: req.body.user_id,
    profile_photo_url: req.file.location
  }
  
  db.UPDATE("UPDATE users AS user SET nick_name=?, profile_photo_url=? WHERE user.id=?;", [_data.nick_name, _data.profile_photo_url, _data.user_id], function(result_update_user){
    return res.json({
      result:{
        state: res_state.success
      }
    })
  });
});
*/

getKeyUrl = (middlePath) => {
  let path = "";
  if(process.env.APP_TYPE === undefined){
    // console.log("없어!!!");
    path = "newtest/";
  }else{
    path = process.env.APP_TYPE+"/"+middlePath+"/";
  }

  return path;
};

removeImageS3 = (key, callback) => {
  var params = {  
    Bucket: process.env.AWS_S3_BUCKET, 
    Key: key
  };

  s3.deleteObject(params, function(err, data) {
    if (err) { 
      return callback({
        state : 'error',
        message : err
      })
    } else {
      return callback({
        state : 'success',
        ...data
      })
    }
  });
}

saveImageS3 = (user_id, contentType, imageBinary, callback) => {
  let imgTypes = ["png", "jpg", "jpeg", "bmp", "gif"];
  let extension = "jpg";

  //확장자를 찾는다.
  for(let i = 0 ; i < imgTypes.length ; i++){
    typeStr = imgTypes[i];
    strIdx = contentType.indexOf(typeStr);
    if(strIdx >= 0){
      extension = typeStr;
      break;
    }
  }

  let fileName = Date.now().toString()+"-"+user_id+"."+extension;
  let _key = getKeyUrl(PATH_USERS)+user_id+"/"+fileName;
  
  let buf = Buffer.from(imageBinary.replace(/^data:image\/\w+;base64,/, ""),'base64');

  let _data = {
    Key: _key, 
    Body: buf,
    Bucket: process.env.AWS_S3_BUCKET,
    ContentEncoding: 'base64',
    ContentType: contentType
  }

  //upload
  s3.upload(_data, function(err, data){
    if (err) { 
      return callback({
        state : 'error',
        message : err
      })
    } else {
      return callback({
        state : 'success',
        ...data
      })
    }
  });
}

saveImageS3New = (path_type, target_id, contentType, imageBinary, callback) => {
  let imgTypes = ["png", "jpg", "jpeg", "bmp", "gif"];
  let extension = "jpg";

  //확장자를 찾는다.
  for(let i = 0 ; i < imgTypes.length ; i++){
    typeStr = imgTypes[i];
    strIdx = contentType.indexOf(typeStr);
    if(strIdx >= 0){
      extension = typeStr;
      break;
    }
  }

  let fileName = Date.now().toString()+"-"+target_id+"."+extension;
  let _key = getKeyUrl(path_type)+target_id+"/"+fileName;
  
  // let buf = Buffer.from(imageBinary.replace(/^data:image\/\w+;base64,/, ""),'base64');
  // let buf = Buffer.from(imageBinary.replace(/^data:image\/\w+;base64,/, ""),'base64');

  let buf = Buffer.from(imageBinary.split("base64,")[1], 'base64');

  let _data = {
    Key: _key, 
    Body: buf,
    // Body: imageBinary,
    Bucket: process.env.AWS_S3_BUCKET,
    ContentEncoding: 'base64',
    ContentType: contentType
  }

  //upload
  s3.upload(_data, function(err, data){
    if (err) { 
      return callback({
        state : 'error',
        message : err
      })
    } else {
      return callback({
        state : 'success',
        ...data
      })
    }
  });
}

router.post("/img/profile/save", function(req, res){  
  //저장할때 우선 지워줌.

  const user_id = req.body.data.user_id;

  let query_user = mysql.format("SELECT profile_photo_s3_key, id AS user_id FROM users WHERE id=?", user_id);
  db.SELECT(query_user, {}, (result_select_user) => {
    if(result_select_user.length === 0){
      return res.json({
        state: res_state.error,
        message: '유저 정보 조회 오류',
        result: {
        }
      })
    }

    const userData = result_select_user[0];

    if(userData.profile_photo_s3_key === null){
      //null이면 아직 없음. //바로 save

      saveImageS3(user_id, req.body.data.contentType, req.body.data.imageBinary, function(result_s3){
        // console.log("#########");
        // console.log(result_s3);
        if(result_s3.state === 'error'){
          return res.json({
            state: res_state.error,
            message: result.message,
            result:{
            }
          })
        }

        let _data = {
          user_id: userData.user_id,
          profile_photo_url: result_s3.Location,
          profile_photo_s3_key: result_s3.key
        }
        
        db.UPDATE("UPDATE users AS user SET profile_photo_url=?, profile_photo_s3_key=? WHERE user.id=?;", [_data.profile_photo_url, _data.profile_photo_s3_key, _data.user_id], function(result_update_user){
          return res.json({
            result:{
              state: res_state.success,
              profile_photo_url: _data.profile_photo_url
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
    }else{
      //delete 후 save

      removeImageS3(userData.profile_photo_s3_key, function(result_removeS3){
        if(result_removeS3.state === 'error'){
          return res.json({
            state: res_state.error,
            message: result_removeS3.message,
            result:{
            }
          })
        }

        saveImageS3(user_id, req.body.data.contentType, req.body.data.imageBinary, function(result_s3){
          if(result_s3.state === 'error'){
            return res.json({
              state: res_state.error,
              message: result.message,
              result:{
              }
            })
          }
  
          let _data = {
            user_id: userData.user_id,
            profile_photo_url: result_s3.Location,
            profile_photo_s3_key: result_s3.key
          }
          
          db.UPDATE("UPDATE users AS user SET profile_photo_url=?, profile_photo_s3_key=? WHERE user.id=?;", [_data.profile_photo_url, _data.profile_photo_s3_key, _data.user_id], function(result_update_user){
            return res.json({
              result:{
                state: res_state.success,
                profile_photo_url: _data.profile_photo_url
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
      });
    }
  });
});

// router.post("/profile/save", function(req, res){
//   const user_id = req.body.data.user_id;
//   const nick_name = req.body.data.nick_name;

//   db.UPDATE("UPDATE users AS user SET nick_name=? WHERE user.id=?;", [nick_name, user_id], function(result_update_user){
//     return res.json({
//       result:{
//         state: res_state.success
//       }
//     })
//   });
// });

router.post("/any/img/profile/delete", function(req, res){
  // req.body.data.user_id
  // s3.deleteObject({
  //   Bucket: process.env.AWS_S3_BUCKET,
  //   Key: 'some/subfolders/nameofthefile1.extension'
  // },function (err,data){

  // })
});

router.post("/file/save", function(req, res){
  console.log(req.body.data);
  return res.json({
    result: {
      state: res_state.success,
    }
  })
})

router.post("/file/delete", function(req, res){
  console.log(req.body.data);
  return res.json({
    result: {
      state: res_state.success,
    }
  })
})

router.post("/save/img", function(req, res){
  const type = req.body.data.type;
  const target_id = req.body.data.target_id;

  let querySelect = '';
  let path_type = '';
  if(type === types.save_img.item){
    querySelect = mysql.format("SELECT img_s3_key FROM items WHERE id=?", target_id);
    path_type = PATH_ITEMS;
  }

  db.SELECT(querySelect, {}, (result_select) => {
    if(!result_select || result_select.length === 0){
      return res.json({
        state: res_state.error,
        message: '이미지 저장 실패. 아이템 정보를 찾을 수 없습니다.',
        result: {}
      })
    }

    const result_select_data = result_select[0];

    if(result_select_data.img_s3_key === ''){
      //null이면 아직 없음. //바로 save
  
      saveImageS3New(path_type, target_id, req.body.data.contentType, req.body.data.imageBinary, function(result_s3){
        // console.log("#########");
        // console.log(result_s3);
        if(result_s3.state === 'error'){
          return res.json({
            state: res_state.error,
            message: result.message,
            result:{
            }
          })
        }

        // let _data = {
        //   user_id: userData.user_id,
        //   profile_photo_url: result_s3.Location,
        //   profile_photo_s3_key: result_s3.key
        // }
  
        let queryUpdate = ''
        if(type === types.save_img.item){
          queryUpdate = 'UPDATE items AS item SET img_url=?, img_s3_key=? WHERE id=?;'
        }
        
        db.UPDATE(queryUpdate, [result_s3.Location, result_s3.key, target_id], function(result_update){
          return res.json({
            result:{
              state: res_state.success,
              img_url: result_s3.Location
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
    }else{
      //delete 후 save
  
      removeImageS3(result_select_data.img_s3_key, function(result_removeS3){
        if(result_removeS3.state === 'error'){
          return res.json({
            state: res_state.error,
            message: result_removeS3.message,
            result:{
            }
          })
        }
  
        saveImageS3New(path_type, target_id, req.body.data.contentType, req.body.data.imageBinary, function(result_s3){
          if(result_s3.state === 'error'){
            return res.json({
              state: res_state.error,
              message: result.message,
              result:{
              }
            })
          }
          
          let queryUpdate = ''
          if(type === types.save_img.item){
            queryUpdate = 'UPDATE items AS item SET img_url=?, img_s3_key=? WHERE id=?;'
          }
          
          db.UPDATE(queryUpdate, [result_s3.Location, result_s3.key, target_id], function(result_update){
            return res.json({
              result:{
                state: res_state.success,
                img_url: result_s3.Location
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
      });
    }
  })
})

router.post("/delete/img", function(req, res){
  const type = req.body.data.type;
  const target_id = req.body.data.target_id;

  let querySelect = '';
  let path_type = '';
  if(type === types.save_img.item){
    querySelect = mysql.format("SELECT img_s3_key FROM items WHERE id=?", target_id);
    path_type = PATH_ITEMS;
  }

  db.SELECT(querySelect, {}, (result_select) => {
    if(!result_select || result_select.length === 0){
      return res.json({
        state: res_state.error,
        message: '이미지 삭제 실패. 아이템 정보를 찾을 수 없습니다.',
        result: {}
      })
    }

    const result_select_data = result_select[0];

    if(result_select_data.img_s3_key === ''){
      return res.json({
        result: {
          state: res_state.success
        }
      })
    }

    removeImageS3(result_select_data.img_s3_key, function(result_removeS3){
      if(result_removeS3.state === 'error'){
        return res.json({
          state: res_state.error,
          message: '썸네일 이미지 삭제 실패',
          result:{
          }
        })
      }

      return res.json({
        result: {
          state: res_state.success
        }
      })
    });

  });
});

module.exports = router;