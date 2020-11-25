const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const { response } = require('express');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const crypto = require('crypto');

module.exports = {
  orderCancel: function(query, options, callbackFunc){
      //return {state: 'success'}
  },

  makeSignature : (time) => {
    var space = ' '; // one space 
    var newLine = '\n'; // new line 
    var method = 'POST'; // method 
    var timestamp = time; // current timestamp (epoch) 
    var accessKey = process.env.NAVER_API_ACCESS_KEY; // access key id 
    var secretKey = process.env.NAVER_API_SECRET_KEY; // secret key 
    const url2 = `/alimtalk/v2/services/${process.env.NAVER_BIZ_MESSAGE_SERVICE_ID}/messages`; 
    let message = []; 
    let hmac = crypto.createHmac('sha256', secretKey); 
    message.push(method); 
    message.push(space); 
    message.push(url2); 
    message.push(newLine); 
    message.push(timestamp); 
    message.push(newLine);
    message.push(accessKey); 

    return hmac.update(message.join('')).digest('base64').toString();
  },

  sendKakaoAlimTalk(datas){
    const data = {
        ...datas
    }

    if(data.to === ''){
        return;
    }

    let _content = '';
    let _smsContent = '';
    let _templateCode = data.templateCode;

    let buttons = [];

    let _useSmsFailover = true;

    if(_templateCode === 'CTSTORE01'){
        /**
         {
             templateCode: ,
             to: ,
             order_url: ,
             creator_name: ,
             item_title: ,
             item_price: ,
             requested_at: ,
             customer_name: ,
         }
         */

        _content = `[크티 주문완료]\n크티 콘텐츠 상점을 이용해주셔서 감사합니다!\n${data.customer_name}님의 콘텐츠 주문이 정상적으로 처리되었습니다.\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n■ 결제금액: ${data.item_price}\n■ 요청일시: ${data.requested_at}\n\n주문하신 콘텐츠는 크리에이터가 확인 후 승인을 하면 제작이 시작됩니다.\n요청사항이 부적절하거나 크리에이터의 사정에 의해 콘텐츠 전달이 어려울 경우 요청이 반려될 수도 있습니다.\n\n자세한 내용은 상세 주문내역을 확인해주세요.`;

        // _smsContent = '이거 확인 필요';
        _useSmsFailover = false;

        buttons = [
            {
                type: "WL",
                name: "상세보기",
                linkMobile: `https://${data.order_url}`,
                linkPc: `https://${data.order_url}`,
            }
        ]
    }
    else if(_templateCode === 'CTSTORE02'){
        /**
         {
             templateCode: ,
             to: ,
             creator_name: ,
             item_title: ,
             approved_at: ,
             customer_name: ,
         }
         */
        _content = `[크티 주문승인]\n\n크리에이터에게 요청하신 콘텐츠가 승인되었습니다!\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n■ 승인일시: ${data.approved_at} \n\n지금부터 크리에이터가 ${data.customer_name}님을 위한 콘텐츠 제작을 시작합니다. 콘텐츠 전달이 준비되면 다시 안내를 드리겠습니다!`;

        _smsContent = '[크티] 크리에이터가 요청된 콘텐츠 준비를 시작했습니다! 상세내용은 웹사이트에서 확인하세요.';
    }
    else if(_templateCode === 'CTSTORE03'){
        /**
         {
             templateCode: ,
             to: ,
             order_url: ,
             customer_name: ,
             creator_name: ,
             item_title: ,
             refund_reason: ,
             refund_price: 
         }
         */

        _content = `[크티 주문반려]\n죄송합니다, ${data.customer_name}님이 주문하신 콘텐츠 요청이 반려되었습니다.\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n■ 반려사유: ${data.refund_reason}\n■ 환불금액: ${data.refund_price}\n\n주문 시 결제하신 금액은 전액 환불됩니다. (카드사에 따라 최대 2~3일 소요)\n아쉽게 이번 요청은 반려되었지만, 반려사유에 맞춰 추후 다시 시도하거나 다른 콘텐츠를 주문해보세요!\n\n크티 콘텐츠 상점을 이용해주셔서 감사합니다.`

        buttons = [
            {
                type: "WL",
                name: "상세보기",
                linkMobile: `https://${data.order_url}`,
                linkPc: `https://${data.order_url}`,
            }
        ];

        _smsContent = '[크티] 크리에이터에게 요청하신 콘텐츠가 반려됐습니다. 상세내용은 웹사이트에서 확인하세요.'
    }
    else if(_templateCode === 'CTSTORE04'){
        /**
         {
             templateCode: ,
             to: ,
             store_manager_url: ,
             creator_name: ,
             item_title: ,
             item_price: ,
             customer_name: ,
             requested_at: ,
         }
         */

        _content = `[콘텐츠상점 주문알림]\n${data.creator_name} 콘텐츠 상점에 주문이 들어왔습니다!\n\n■ 상품명: ${data.item_title}\n■ 구매금액: ${data.item_price}\n■ 구매자: ${data.customer_name}\n■ 요청일시: ${data.requested_at}\n\n들어온 콘텐츠 요청에 대한 주문 승인 여부를 선택해주세요! 아래 버튼을 통해 자세한 주문 내용을 확인하실 수 있습니다.\n\n승인 후 완성된 콘텐츠는 event@crowdticket.kr로 보내주시면 되며, 기타 문의사항이 있으실 경우 언제든지 카카오톡 답장을 남겨주세요!`;

        buttons = [
            {
                type: "WL",
                name: "주문 상세보기",
                linkMobile: `https://${data.store_manager_url}`,
                linkPc: `https://${data.store_manager_url}`,
            }
        ];

        _smsContent = '[크티] 콘텐츠 요청이 들어왔습니다. 크티 웹사이트에서 요청을 승인해주세요.'
    }

    const time = Date.now().toString();
    axios({
    headers: 
    {
        'Content-Type': 'application/json; charset=UTF-8',
        'x-ncp-iam-access-key': process.env.NAVER_API_ACCESS_KEY,
        'x-ncp-apigw-timestamp': time,
        'x-ncp-apigw-signature-v2': this.makeSignature(time)
    },
    method: 'POST',
    url: `https://sens.apigw.ntruss.com/alimtalk/v2/services/${process.env.NAVER_BIZ_MESSAGE_SERVICE_ID}/messages`,
    data: {
        templateCode: _templateCode,
        plusFriendId: process.env.KAKAO_CHANNEL_ID,
        messages: [
                    {
                        countryCode: "82",
                        to: data.to,
                        content: _content,
                        buttons: buttons,
                        useSmsFailover: _useSmsFailover,
                        failoverConfig: {
                            type: "SMS",
                            from: process.env.NAVER_SMS_FROM,
                            subject: "",
                            content: _smsContent
                        }
                    }
            ]
    }
    
    }).then((response) => {
        console.log(response);
    }).catch((error) => {
        console.log(error);
    })
    
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