const axios = require('axios');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {
  orderCancel: function(query, options, callbackFunc){
      //return {state: 'success'}
  },
  sendSMS: (to, content, callback) => {
    axios({
        headers: 
        {
            'Content-Type': 'application/json; charset=utf-8',
            'x-ncp-auth-key': process.env.NAVER_API_ACCESS_KEY,
            'x-ncp-service-secret': process.env.NAVER_SMS_SECRET_KEY
        },
        method: 'post',
        url: process.env.NAVER_SMS_URL,
        data: {
            type:"SMS",
            contentType:"COMM",
            countryCode:"82",
            from: process.env.NAVER_SMS_FROM,
            to:[
            to
            ],
            content:content
        }
        }).then(function (response) {
            // console.log(response);
            //res.data.messages
            callback(response.data);
        }).catch(function(error){
            console.log(error);
            callback({
                data: {
                    state: 'error',
                    message: '인증번호 전송 오류'
                }
            })
        });
    }
    // sendMail: (to, subject, text, html, successFunc, errorFunc) => {
    //     const msg = {
    //         to: to,
    //         from: '크라우드티켓<contact@crowdticket.kr>',
    //         subject: subject,
    //         text: text,
    //         html: html,
    //     };
    //     sgMail.send(msg).then((result) => {
    //         successFunc(result);
    //     }).catch((error) => {
    //         errorFunc(error);
    //     });
    // }
};