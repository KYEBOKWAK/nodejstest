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

const EXPIRE_JWT_FIND_PASSWORD_TOKEN = '1d';

router.post("/any/reset", function(req, res){
  const token = req.body.token;
  const password = req.body.password;
  const passwordConfirm = req.body.passwordConfirm;

  if(password !== passwordConfirm){
    return res.json({
      state: res_state.error,
      message: "비밀번호가 서로 다릅니다. 다시 입력해주세요.",
      result:{}
    })
  }

  _jwt.READ(req.body.token, function(result){
    if(result.state === 'success'){
      if(result.iss === process.env.JWT_TOKEN_ISSUER){
        const email = result.email;
        let queryUser = mysql.format("SELECT id, email FROM users WHERE email=?", email);
        db.SELECT(queryUser, {}, (result_select_user) => {
          if(result_select_user.length === 0){
            return res.json({
              state: res_state.error,
              message: 'DB에 없는 이메일 입니다.',
              result:{}
            })
          }

          const saltRounds = 10 ;   
          const myPlaintextPassword = password ;   
          const someOtherPlaintextPassword = ' not_bacon ' ;

          bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
            // Store hash in your password DB.
            let convertToPhpHash = hash;
            if(convertToPhpHash.indexOf('$2b$') === 0)
            {
              convertToPhpHash = convertToPhpHash.replace('$2b$', '$2y$');
            }

            
            db.UPDATE("UPDATE users SET password=? WHERE email=?", [convertToPhpHash, email], 
            (result) => {
              return res.json({
                state: res_state.success,
                result:{
                  state: res_state.success
                }
              })

            }, (error) => {
              return res.json({
                state: res_state.error,
                message: "패스워드 업데이트 실패",
                result:{}
              })
            })
          });
        });
      }
    }else{
      if(result.state === 'error' && result.error.name === 'TokenExpiredError'){
        //만기일 경우 refresh 를 요청해야함.
        //console.log('refresh도 만기!!');
        return res.json({
          state: res_state.error,
          message: "기간이 만료되었습니다.",
          result: {}
        })
      }else{
        //console.log('알수 없는 에러지만 우선 토큰 익스파이어로 넘긴다.');
        return res.json({
          state: res_state.error,
          message: "토큰 에러",
          result: {}
        })
      }
    }
  });

  // return res.json({});
});

router.get("/any/reset/form", function(req, res){
  _jwt.READ(req.query.token, function(result){
    if(result.state === 'success'){
      if(result.iss === process.env.JWT_TOKEN_ISSUER){
        const email = result.email;
        let token = req.query.token;
        const hostname = req.headers.host;
        // let passwordResetURL = hostname+"/password/any/reset?token="+token;
        // let passwordResetURL = hostname+"/password/any/reset";
        let html = `
          <!doctype html>
          <html>
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <title>크티 : 크라우드티켓 - 팬 중심 크리에이터 밋업 플랫폼</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <link href="https://crowdticket.kr/css/base.css?version=0" rel="stylesheet">
            <link href="https://crowdticket.kr/css/app.css?version=0')" rel="stylesheet"/>
            <link href="https://crowdticket.kr/css/main.css?version=0')" rel="stylesheet"/>
            <link href="https://crowdticket.kr/css/global.css?version=0')" rel="stylesheet"/>
          </head>
          <body>
          <style>
              .first-container .panel {
                  margin-top: 5em;
              }

              .pass-container {
                width: 100%;
                margin-left: auto;
                margin-right: auto;
                padding-left: 20px;
                padding-right: 20px;
              }

              .password_label {
                margin-top: 8px;
                color:#7f7f7f;
              }

              @media (max-width:1030px) {
                
              }
          </style>
          <input type="hidden" id="token" name="token" value="${token}">
            <div class="first-container container">
              <div class="row">
                <div class="pass-container">
                    <div class="panel panel-default">
                        <div class="panel-heading">비밀번호 초기화</div>
                        <div class="panel-body">
                            <div class="form-horizontal">
                                <div class="form-group">
                                    
                                    <label class="col-md-4 control-label">새로운 비밀번호</label>
                                    <div class="col-md-6">
                                        <input type="password" id="password" class="form-control" name="password">
                                        <p id="password-label" class="password_label"></p>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-md-4 control-label">비밀번호 확인</label>
                                    <div class="col-md-6">
                                        <input type="password" id="password-confirm" class="form-control" name="password_confirmation">
                                        <p id="password-re-label" class="password_label"></p>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <div class="col-md-6 col-md-offset-4">
                                        <button type="button" id="buttonChangePassword" class="btn btn-primary">
                                            비밀번호 변경
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            <script src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
            <script src="https://crowdticket.kr/js/util.js?version=0"></script>
            <script>
            $(document).ready(function() {
              var callAjax = function(url, method, data, success, error){
                var base_url = window.location.origin;
                url = base_url + url;
                $.ajax({
                  'url': url,
                  'method': method,
                  'data' : data,
                  'contentType': "application/json; charset=utf-8",
                  'success': success,
                  'error': error
                });
              };

              var requestPasswordReset = function(){
                loadingProcess($("#buttonChangePassword"));
                const token = $("#token").val();
                const password = $("#password").val();
                const passwordConfirm = $("#password-confirm").val();

                var url = '/password/any/reset';
                var method = 'post';
                var data =
                {
                  "token": token,
                  "password": password,
                  "passwordConfirm": passwordConfirm
                }

                data = JSON.stringify(data);
                
                var success = function(result) {
                  loadingProcessStop($("#buttonChangePassword"));
                  if(result.state === 'error'){
                    alert(result.message);
                  }else{
                    alert("변경완료!");
                  }
                };
                var error = function(result) {
                  loadingProcessStop($("#buttonChangePassword"));
                  alert(result.message);
                };
          
                callAjax(url, method, data, success, error);
              }

              $("#password").keyup(function(){
                let passwordLength = $("#password").val().length;

                if(passwordLength >= 6){
                  $("#password-label").text("");
                }else{
                  $("#password-label").text("6자 이상 입력해주세요");
                }
              });

              $("#password-confirm").keyup(function(){
                if($("#password").val() !== $("#password-confirm").val()){
                  $("#password-re-label").text("비밀번호가 다릅니다.");
                }else{
                  $("#password-re-label").text("");
                }
              });

              $("#buttonChangePassword").click(function(){
                let passwordLength = $("#password").val().length;
                if(passwordLength < 6){
                  alert("비밀번호는 6자 이상 입력해주세요");
                  return;
                }

                if($("#password-confirm").val() !== $("#password").val()){
                  alert("비밀번호가 다릅니다.");
                  return;
                }

                requestPasswordReset();
              })

            });
            </script>
          </body>
          </html>
        `
        res.writeHead(200);
        res.end(html);
      }
      
    }else{
      let message = "";
      if(result.state === 'error' && result.error.name === 'TokenExpiredError'){
        //만기일 경우 refresh 를 요청해야함.
        //console.log('refresh도 만기!!');
        message = "기간이 만료되었습니다.";
      }else{
        //console.log('알수 없는 에러지만 우선 토큰 익스파이어로 넘긴다.');
        message = "토큰 에러";
      }

      let html = `
        <!doctype html>
        <html>
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>크티 : 크라우드티켓 - 팬 중심 크리에이터 밋업 플랫폼</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body>
          <p>${message}</p>
        </body>
        </html>
        `
      res.writeHead(200);
      res.end(html);
    }
  });
});

router.post("/any/find", function(req, res){
  // process.env.CROWDTICKET_WEB_API_URL
  let email = req.body.data.email;

  let queryUser = mysql.format("SELECT id, email FROM users WHERE email=?", [email]);
  db.SELECT(queryUser, {}, (result_select_user) => {
    if(result_select_user.length === 0){
      return res.json({
        state: res_state.error,
        message: '가입되어 있지 않는 이메일 입니다.',
        result:{}
      })
    }

    _jwt.CREATE(jwtType.TYPE_JWT_FIND_PASSWORD, 
      {
        email: email
      }, 
      EXPIRE_JWT_FIND_PASSWORD_TOKEN, function(value){
      if(value.state === 'error'){
        res.json({
          result: {
            state: 'error',
            message: value.message
          }
        })
      }else{  
        let hostname = req.headers.host;
        if(hostname.indexOf("http://") === -1 && hostname.indexOf("https://") === -1){
          if(process.env.APP_TYPE === 'local'){
            hostname = "http://"+req.headers.host;
          }else{
            hostname = "https://"+req.headers.host;
          }
          
        }
        
        let querystring = hostname+"/password/any/reset/form?token="+value.token;

        // console.log("#### RESET PASSWORD ###");
        // console.log(querystring);
      
        let _html = 
        `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <title>크티 비밀번호 재설정 안내</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          </head>
          <body style="margin:0%">
            <table class="full-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0;padding:0;width:100%;background:none">
              <tbody><tr>
                <td style="width:100%;height:100%">
                  <table class="main-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0px auto;padding:40px 0;width:100%;max-width:630px;background:rgb(255,255,255)">
                    <tbody><tr style="margin:0;padding:0">
                      <td style="width:100%;max-width:630px;border-collapse:separate;padding:0 20px;overflow:hidden">
                        <table class="symbol-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:4px 0px 48px;width:100%;max-width:630px;clear:both;background:none;">
                          <tbody><tr>
                            <td>
                              <img alt="크티 로고" src="https://crowdticket0.s3-ap-northeast-1.amazonaws.com/admin/mail/rebrand/ic-cti-symbol%403x.png" class="ic_cti_symbol" style="width:32px; height:36px; object-fit: contain;" />
                            </td>
                          </tr></tbody>
                        </table>
                        <table class="email-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                          <tbody><tr>
                            <td style="font-family:'Noto Sans KR',sans-serif;font-size:24px;;font-weight:bold;font-stretch:normal;font-style:normal;line-height:normal;letter-spacing:normal;color:#212121">
                              <div style="text-align:left">비밀번호 재설정 안내</div>
                            </td>
                          </tr></tbody>
                        </table>
                        <table class="email-content" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:32px 0px;width:100%;max-width:630px;clear:both;background:none">
                          <tr>
                            <td>
                              <table class="attention" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;width:100%;height:24px;padding:12px;margin-bottom:20px;align:left;background-color:#ecf9fd">
                                <tr>
                                  <td height="24px" width="24px" style="padding:0px;border:0px">
                                    <img src="https://crowdticket0.s3-ap-northeast-1.amazonaws.com/admin/mail/rebrand/ic-circle-error-fill-24@3x.png" alt="!" style="width:24px;height:24px;margin-right:8px;display:block;border-width:0px"/>
                                  </td>
                                  <td style="vertical-align:middle;padding:3px 0px;font-family:'Noto Sans KR',sans-serif;font-size:12px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:normal;letter-spacing:normal;color:#212121;word-break:keep-all">
                                    비밀번호를 재설정 하시려면 아래 버튼을 눌러주세요.
                                  </td>
                                </tr>
                                
                              </table>
                              <table class="explain-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                                <tr>
                                  <td style="padding:0px 0px;font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757;word-break:keep-all">
                                    <div style="text-align:left">링크를 통해 비밀번호를 변경하실 수 있는 페이지로 이동되며, 입력하신 비밀번호는 암호화되어 저장되므로 크라우드티켓 운영진에게도 공개되지 않습니다.</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                          <tbody><tr>
                            <td style="padding:0 0;border:0px;" width="100%">
                              <table class="cti-button" border="0" cellpadding="0" cellspacing="0" width="" style="border-collapse:separate!important;background:#43c9f0;border-radius:5px;border:0;margin:0 auto;table-layout:fixed" align="left">
                                <tbody><tr>
                                  <td style="padding:12px 20px;" align="center">
                                    <a href="${querystring}" target="_blank" style="font-size:14px;display:block;color:#ffffff;text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">비밀번호 재설정하기</a>
                                  </td>
                                </tr>
                              </tbody>
                              </table>
                            </td>
                          </tr></tbody>
                          <tbody><tr>
                            <td style="vertical-align:middle;padding:12px 0px;font-family:'Noto Sans KR',sans-serif;font-size:12px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:normal;letter-spacing:normal;color:#7f7f7f;word-break:keep-all;">
                              비밀번호 변경 가능 기간은 1일 입니다.
                            </td>
                          </tr></tbody>
                        </table>
                      </td>
                    </tr></tbody>
                  </table>
                  <table class="email-footer" border="0" cellpadding="0" cellspacing="0" align="center" style="overflow:hidden;margin:0 0 0 0;width:100%;clear:both;background-color:#f9f9f9">
                    <tbody><tr>
                      <td>
                        <table class="footer-container" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:40px auto;width:100%;max-width:630px;background:none">
                          <tbody><tr style="margin:0;padding:0">
                            <td style="width:100%;max-width:630px;border-collapse:collapse;padding:0 20px;overflow:hidden">
                              <table class="sns-block" border="0" cellpadding="0" cellspacing="0" align="left" style="overflow:hidden;margin:0px auto;padding:0;max-width:630px;clear:both;background:none">
                                <tbody><tr>
                                  <td style="padding:0;align:left;margin:0 auto 0 auto">
                                    <div class="wrap-sns" style="margin:0 auto">
                                      <span style="list-style:none;padding:0;margin:0px">
                                        <a href="https://facebook.com/crowdticket" style="padding:0;border-width:0px;display:inline-block" title="페이스북" target="_blank"><span style="display:inline-block"><img height="28px" src="https://crowdticket0.s3-ap-northeast-1.amazonaws.com/admin/mail/rebrand/ic-footer-social-01-facebook%403x.png" alt="페이스북" style="width:18px;height:28px;display:block;border-width:0px"/></span></a>
                                      </span>
                                      <span style="list-style:none;padding:0;margin:0px">
                                        <a href="https://instagram.com/k.haem" style="padding:0;border-width:0px;display:inline-block" title="인스타그램" target="_blank"><span style="display:inline-block"><img height="28px" src="https://crowdticket0.s3-ap-northeast-1.amazonaws.com/admin/mail/rebrand/ic-footer-social-02-instagram%403x.png" alt="인스타그램" style="width:28px;height:28px;display:block;border-width:0px"/></span></a>
                                      </span>
                                      <span style="list-style:none;padding:0;margin:0px">
                                        <a href="http://blog.naver.com/crowdticket" style="padding:0;border-width:0px;display:inline-block" title="블로그" target="_blank"><span style="display:inline-block"><img height="28px" src="https://crowdticket0.s3-ap-northeast-1.amazonaws.com/admin/mail/rebrand/ic-footer-social-03-naver%403x.png" alt="블로그" style="width:28px;height:28px;display:block;border-width:0px"/></span></a>
                                      </span>
                                      <span style="list-style:none;padding:0;margin:0px">
                                        <a href="http://pf.kakao.com/_JUxkxjM" style="padding:0;border-width:0px;display:inline-block" title="카카오채널" target="_blank"><span style="display:inline-block"><img height="28px" src="https://crowdticket0.s3-ap-northeast-1.amazonaws.com/admin/mail/rebrand/ic-footer-social-04-kakao-channel%403x.png" alt="카톡채널" style="width:28px;height:28px;display:block;border-width:0px"/></span></a>
                                      </span>
                                    </div>
                                  </td>
                                </tr></tbody>
                              </table>
                              <table class="contact-info-block" border="0" cellpadding="0" cellspacing="0" align="left" style="padding:20px 0;table-layout:fixed" width="100%">
                                <tbody><tr>
                                  <td style="width:100%">
                                    <div style="text-align:left;line-height:1.71;font-size:14px;font-family:'Apple SD Gothic Neo','AppleSDGothicNeo','Noto Sans KR',sans-serif;font-weight:500;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#808080;">
                                      (주)나인에이엠 / 서울시 마포구 백범로 31길 21 서울창업허브 본관 611호 / 고객센터 <a href="tel:070-8819-4308" style="color:#43c9f0" target="_blank"><font color="#43c9f0">070-8819-4308</font></a> / 이메일 <a href="mailto:contact@crowdticket.kr" style="color:#43c9f0;text-decoration:underline" target="_blank">contact@crowdticket.kr</a> / 카카오톡 <a href="http://pf.kakao.com/_JUxkxjM/chat" style="color:#43c9f0;text-decoration:underline">@크라우드티켓</a>
                                    </div>
                                  </td>
                                </tr></tbody>
                              </table>
                              <table class="customer-service-block" border="0" cellpadding="0" cellspacing="0" align="left" style="padding:0;table-layout:fixed" width="100%">
                                <tbody><tr>
                                  <td>
                                    <div style="text-align:left;line-height:1.67;font-size:12px;font-family:'Apple SD Gothic Neo','AppleSDGothicNeo','Noto Sans KR',sans-serif;font-weight:500;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#808080">
                                      카카오톡을 통한 실시간 상담이 가능하며, 영업시간 외에도 최대한 빠른 시간 내에 답변 드리도록 하겠습니다.(영업시간 10:00-19:00)
                                    </div>
                                  </td>
                                </tr></tbody>
                              </table>
                              <table class="copyright-block" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:20px 0 0 0">
                                <tbody><tr>
                                  <td>
                                    <div style="text-align:left;line-height:2;font-size:12px;font-family:'Apple SD Gothic Neo','AppleSDGothicNeo','Noto Sans KR',sans-serif;font-weight:500;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#808080">
                                      COPYRIGHT ⓒ CROWDTICKET ALL RIGHTS RESERVED.
                                    </div>
                                  </td>
                                </tr></tbody>
                              </table>
                            </td>
                          </tr></tbody>
                        </table>
                      </td>
                    </tr></tbody>
                  </table>
                </td>
              </tr></tbody>
            </table>
          </body>
        </html>
        `
     
     
        const msg = {
          // to: 'cyan@crowdticket.kr',
          to: email,
          from: process.env.EMAIL_FROM,
          subject: '크티 비밀번호 재설정',
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
      }
    });
  });
});

module.exports = router;