const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const { response } = require('express');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const crypto = require('crypto');

const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const use = require('abrequire');
const Util = use('lib/util.js');

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

    if(_templateCode === 'CTSTORE01a'){
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

        // _content = `[크티 주문완료]\n크티 콘텐츠 상점을 이용해주셔서 감사합니다!\n${data.customer_name}님의 콘텐츠 주문이 정상적으로 처리되었습니다.\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n■ 결제금액: ${Util.getNumberWithCommas(data.item_price)}원\n■ 요청일시: ${data.requested_at}\n\n주문하신 콘텐츠는 크리에이터가 확인 후 승인을 하면 제작이 시작됩니다.\n요청사항이 부적절하거나 크리에이터의 사정에 의해 콘텐츠 전달이 어려울 경우 요청이 반려될 수도 있습니다.\n\n자세한 내용은 상세 주문내역을 확인해주세요.`;

        _content = `[크티 주문완료]\n크티 콘텐츠 상점을 이용해주셔서 감사합니다!\n${data.customer_name}님의 콘텐츠 주문이 정상적으로 처리되었습니다.\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n■ 결제금액: ${Util.getNumberWithCommas(data.item_price)}\n■ 요청일시: ${data.requested_at}\n\n주문하신 콘텐츠는 크리에이터가 확인 후 승인을 하면 준비가 시작됩니다.\n요청사항이 부적절하거나 크리에이터의 사정에 의해 콘텐츠 전달이 어려울 경우 요청이 반려될 수도 있습니다.\n\n자세한 내용은 주문 상세내역을 확인해주세요.`;

        // _smsContent = '이거 확인 필요';
        _useSmsFailover = false;

        buttons = [
            {
                type: "WL",
                name: "주문 확인하기",
                linkMobile: `https://${data.content_url}`,
                linkPc: `https://${data.content_url}`,
            }
        ]
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

        _content = `[크티 주문반려]\n죄송합니다, ${data.customer_name}님이 주문하신 콘텐츠 요청이 반려되었습니다.\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n■ 반려사유: ${data.refund_reason}\n■ 환불금액: ${Util.getNumberWithCommas(data.refund_price)}원\n\n주문 시 결제하신 금액은 전액 환불됩니다. (카드사에 따라 최대 2~3일 소요)\n아쉽게 이번 요청은 반려되었지만, 반려사유에 맞춰 추후 다시 시도하거나 다른 콘텐츠를 주문해보세요!\n\n크티 콘텐츠 상점을 이용해주셔서 감사합니다.`

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

        _content = `[콘텐츠상점 주문알림]\n${data.creator_name} 콘텐츠 상점에 주문이 들어왔습니다!\n\n■ 상품명: ${data.item_title}\n■ 구매금액: ${Util.getNumberWithCommas(data.item_price)}원\n■ 구매자: ${data.customer_name}\n■ 요청일시: ${data.requested_at}\n\n들어온 콘텐츠 요청에 대한 주문 승인 여부를 선택해주세요! 아래 버튼을 통해 자세한 주문 내용을 확인하실 수 있습니다.\n\n승인 후 완성된 콘텐츠는 event@crowdticket.kr로 보내주시면 되며, 기타 문의사항이 있으실 경우 언제든지 카카오톡 답장을 남겨주세요!`;

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
    else if(_templateCode === 'CTSTORE06a'){
        // _content = `[콘텐츠상점 주문알림]\n${data.creator_name} 콘텐츠 상점에 주문이 들어왔습니다!\n\n■ 상품명: ${data.item_title}\n■ 구매금액: ${Util.getNumberWithCommas(data.item_price)}\n■ 구매자: ${data.customer_name}\n■ 요청일시: ${data.requested_at}\n\n들어온 콘텐츠 요청에 대한 주문 승인 여부를 선택해주세요! 아래 버튼을 통해 자세한 주문 내용을 확인하실 수 있습니다.\n승인 후 콘텐츠가 완성되면 상점 관리 페이지에서 콘텐츠를 업로드 해주시고, 기타 문의사항이 있으실 때는 언제든지 카카오톡 답장을 남겨주세요!`

        _content = `[콘텐츠상점 주문알림]\n${data.creator_name} 콘텐츠 상점에 주문이 들어왔습니다!\n\n■ 상품명: ${data.item_title}\n■ 구매금액: ${Util.getNumberWithCommas(data.item_price)}\n■ 구매자: ${data.customer_name}\n■ 요청일시: ${data.requested_at}\n\n들어온 콘텐츠 주문에 대해 승인 여부를 선택해주세요!\n아래 버튼을 통해 자세한 주문 내용을 확인하실 수 있습니다.\n\n추후 준비된 콘텐츠는 형태에 따라 크티에서 구매자에게 제공해주세요.\n문의사항이 있을 때는 언제든지 카톡을 남겨주시면 안내 드리겠습니다.`

        buttons = [
            {
                type: "WL",
                name: "주문 확인하기",
                linkMobile: `https://${data.store_manager_url}`,
                linkPc: `https://${data.store_manager_url}`,
            }
        ];

        _smsContent = '[크티] 콘텐츠 요청이 들어왔습니다. 크티 웹사이트에서 요청을 승인해주세요.'
    }
    else if(_templateCode === 'CTSTORE05'){
        _content = `[콘텐츠 준비완료]\n${data.customer_name}님이 요청하신 콘텐츠가 준비됐습니다.\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n\n아래 버튼을 눌러 준비된 콘텐츠를 지금 바로 확인해보세요!\n\n콘텐츠 확인 후 크리에이터를 위한 답변과 구매 완료 버튼 누르기도 부탁드려요.\n\n크티 콘텐츠 상점을 이용해주셔서 감사합니다!`;

        buttons = [
            {
                type: "WL",
                name: "콘텐츠 확인하기",
                linkMobile: `https://${data.content_url}`,
                linkPc: `https://${data.content_url}`,
            }
        ];

        _smsContent = `[크티] 주문하신 콘텐츠가 도착했습니다! '나의 콘텐츠' 에서 확인해보세요!`;
    }
    else if(_templateCode === 'CTSTORE02b'){
        _content = `[크티 주문승인]\n크리에이터에게 요청하신 콘텐츠가 승인되었습니다!\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n\n지금부터 크리에이터가 ${data.customer_name}님을 위한 콘텐츠 준비를 시작합니다.\n곧 콘텐츠가 제공될 예정이니 조금만 더 기다려주세요!`;

        buttons = [
            {
                type: "WL",
                name: "주문 확인하기",
                linkMobile: `https://${data.content_url}`,
                linkPc: `https://${data.content_url}`,
            }
        ];

        _smsContent = '[크티] 크리에이터가 요청한 콘텐츠 준비를 시작했습니다! 상세내용은 웹사이트에서 확인하세요.';
    }
    else if(_templateCode === 'Sbuy02v2'){

        _content = `[크티 주문승인]\n크리에이터에게 요청하신 콘텐츠가 승인되었습니다!\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n\n${data.creator_name}님이 이번주 안에 실시간 콘텐츠 진행을 위한 연락을 드릴거예요. 함께 약속 시간을 먼저 정하고 콘텐츠를 진행하시면 됩니다.\n\n만약 일주일이 지나도 크리에이터의 연락이 안 오거나 콘텐츠 진행을 위한 소통이 어려울 경우에는 언제든지 저희 크티에게 문의해주세요!`;

        buttons = [
            {
                type: "WL",
                name: "주문상태 확인하기",
                linkMobile: `https://${data.content_url}`,
                linkPc: `https://${data.content_url}`,
            }
        ];

        _smsContent = '[크티] 실시간콘텐츠 요청이 승인됐어요! 콘텐츠 진행을 위해 크리에이터가 곧 연락을 드립니다.';
    }
    else if(_templateCode === 'CTSTORE07'){
        _content = `[크티 콘텐츠 진행알림]\n크리에이터와의 실시간 콘텐츠가 2시간 뒤 시작됩니다!\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n■ 진행일시: ${data.select_time}\n\n크티에서 콘텐츠 진행 방법을 다시 확인하고 제 시간에 시작할 수 있도록 미리 준비해주세요!`;

        buttons = [
            {
                type: "WL",
                name: "콘텐츠 일정 확인하기",
                linkMobile: `https://${data.content_url}`,
                linkPc: `https://${data.content_url}`,
            }
        ];

        _smsContent = '[크티] 주문하신 콘텐츠가 2시간 뒤 시작됩니다! 실시간 콘텐츠 진행을 준비해주세요.';
    }
    else if(_templateCode === 'CTSTORE08b'){
        // _content = `[크티 콘텐츠 진행알림]\n크리에이터와의 실시간 콘텐츠가 2시간 뒤 시작됩니다!\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n■ 진행일시: ${data.select_time}\n\n크티에서 콘텐츠 진행 방법을 다시 확인하고 제 시간에 시작할 수 있도록 미리 준비해주세요!`;

        _content = `[크티 콘텐츠 알림]\n${data.customer_name}님, 주문하신 콘텐츠는 확인하셨나요?\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n\n아직 콘텐츠 확인을 안 하셨다면 아래 링크를 통해 지금바로 확인해주세요.\n전달된 콘텐츠는 ${data.time_due} 뒤에 자동으로 구매가 완료될 예정입니다.\n\n콘텐츠 확인이 완료되기 전 크리에이터를 위한 후기도 남겨보세요!`;

        buttons = [
            {
                type: "WL",
                name: "콘텐츠 확인하기",
                linkMobile: `https://${data.content_url}`,
                linkPc: `https://${data.content_url}`,
            }
        ];

        _smsContent = '[크티] 지금바로 크티 웹사이트에서 주문하신 콘텐츠의 구매를 완료해주세요!';
    }
    else if(_templateCode === 'CTSTORE08c'){
        // _content = `[크티 콘텐츠 진행알림]\n크리에이터와의 실시간 콘텐츠가 2시간 뒤 시작됩니다!\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n■ 진행일시: ${data.select_time}\n\n크티에서 콘텐츠 진행 방법을 다시 확인하고 제 시간에 시작할 수 있도록 미리 준비해주세요!`;

        _content = `[크티 콘텐츠 알림]\n${data.customer_name}님, 크리에이터와 함께한 콘텐츠는 어떠셨나요?\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n\n정상적으로 콘텐츠를 즐기셨다면 아래 링크를 통해 콘텐츠 진행을 확인해주세요.\n콘텐츠 완료와 함께 크리에이터를 위한 후기도 남기실 수 있습니다!\n\n구매자 확인이 없을 경우 콘텐츠 진행은 ${data.time_due} 뒤에 자동으로 완료됩니다.\n크티 콘텐츠 상점을 이용해주셔서 감사합니다!`;

        buttons = [
            {
                type: "WL",
                name: "콘텐츠 완료하기",
                linkMobile: `https://${data.content_url}`,
                linkPc: `https://${data.content_url}`,
            }
        ];

        _smsContent = '[크티] 지금바로 크티 웹사이트에서 구매하신 콘텐츠의 진행을 확인해주세요! ';
    }
    else if(_templateCode === 'CTSTORE10'){
        // _content = `[크티 콘텐츠 진행알림]\n크리에이터와의 실시간 콘텐츠가 2시간 뒤 시작됩니다!\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n■ 진행일시: ${data.select_time}\n\n크티에서 콘텐츠 진행 방법을 다시 확인하고 제 시간에 시작할 수 있도록 미리 준비해주세요!`;

        _content = `[콘텐츠상점 주문알림]\n승인 기간이 만료되어 아래 주문이 자동으로 반려되었습니다.\n\n■ 상품명: ${data.item_title}\n■ 구매금액: ${Util.getNumberWithCommas(data.item_price)}\n■ 구매자: ${data.customer_name}\n■ 요청일시: ${data.requested_at}\n\n콘텐츠 상점 이용에 불편이 있다면 언제든지 문의를 남겨주세요.\n효율적으로 상점을 운영하실 수 있도록 최선을 다해 도와드리겠습니다!`;

        buttons = [
            {
                type: "WL",
                name: "상점 관리하기",
                linkMobile: `https://${data.store_manager_url}`,
                linkPc: `https://${data.store_manager_url}`,
            }
        ];

        _useSmsFailover = false;
    }
    else if(_templateCode === 'CTSTORE12'){
        _content = `[콘텐츠상점 주문알림]\n예정된 실시간 콘텐츠 진행이 있습니다!\n\n■ 상품명: ${data.item_title}\n■ 구매자: ${data.customer_name}\n■ 진행일시: ${data.select_time}\n\n2시간 뒤에 ${data.customer_name}님과 진행하는 실시간 콘텐츠가 약속되어 있습니다. \n정해진 시간에 진행이 시작 될 수 있도록 미리 준비해주세요.`;

        buttons = [
            {
                type: "WL",
                name: "주문 확인하기",
                linkMobile: `https://${data.store_manager_url}`,
                linkPc: `https://${data.store_manager_url}`,
            }
        ];

        _smsContent = '[크티] 2시간 뒤 진행 예정인 콘텐츠가 있습니다! 시간에 맞춰 실시간 콘텐츠를 시작해주세요.';
    }
    else if(_templateCode === 'CTSTORE09a'){
        // _content = `[크티 콘텐츠 진행알림]\n크리에이터와의 실시간 콘텐츠가 2시간 뒤 시작됩니다!\n\n■ 크리에이터: ${data.creator_name}\n■ 상품명: ${data.item_title}\n■ 진행일시: ${data.select_time}\n\n크티에서 콘텐츠 진행 방법을 다시 확인하고 제 시간에 시작할 수 있도록 미리 준비해주세요!`;

        _content = `[콘텐츠상점 주문알림]\n${data.creator_name} 콘텐츠 상점에 승인을 기다리는 주문이 있습니다.\n\n■ 상품명: ${data.item_title}\n■ 구매금액: ${Util.getNumberWithCommas(data.item_price)}\n■ 구매자: ${data.customer_name}\n■ 요청일시: ${data.requested_at}\n\n승인되지 않은 주문은 ${data.time_due} 뒤에 자동으로 반려됩니다.\n들어온 콘텐츠 주문에 대해 승인 여부를 선택해주세요!\n\n아래 버튼을 통해 자세한 주문 내용을 확인하실 수 있습니다.`;

        buttons = [
            {
                type: "WL",
                name: "주문 확인하기",
                linkMobile: `https://${data.store_manager_url}`,
                linkPc: `https://${data.store_manager_url}`,
            }
        ];

        _smsContent = '[크티] 곧 만료되는 콘텐츠 주문이 있습니다. 지금바로 크티 웹사이트에서 확인해주세요!';
    }
    else if(_templateCode === 'CTSTORE11'){
        _content = `[콘텐츠상점 주문알림]\n크리에이터님의 콘텐츠 전달을 기다리는 주문이 있습니다!\n\n■ 상품명: ${data.item_title}\n■ 구매금액: ${Util.getNumberWithCommas(data.item_price)}\n■ 구매자: ${data.customer_name}\n■ 요청일시: ${data.requested_at}\n\n콘텐츠 준비에 어려움은 없으신가요?\n제작을 위한 시간이 부족하시거나 상점 운영에 어려움을 느끼고 계시다면 언제든지 카톡 답장을 남겨주세요.\n보다 효율적으로 상점을 운영하실 수 있도록 최선을 다해 도와드리겠습니다!`;

        buttons = [
            {
                type: "WL",
                name: "주문 확인하기",
                linkMobile: `https://${data.store_manager_url}`,
                linkPc: `https://${data.store_manager_url}`,
            }
        ];

        _useSmsFailover = false;
    }
    else if(_templateCode === 'CTSTORE13'){
        _content = `[콘텐츠상점 주문알림]\n콘텐츠 판매가 완료되었습니다!\n\n■ 상품명: ${data.item_title}\n■ 구매자: ${data.customer_name}\n■ 판매완료일시: ${data.select_time}\n\n구매자가 제공받은 콘텐츠에 대한 구매를 최종 확인했습니다.\n구매자 확인이 끝난 주문은 판매완료 처리되어 정산에 반영됩니다.\n\n상점 관리 페이지에서 판매 내용을 확인하고 구매자가 남긴 후기도 있는지 체크해보세요!\n\n크티 콘텐츠 상점을 이용해주셔서 감사합니다.`;

        buttons = [
            {
                type: "WL",
                name: "주문 확인하기",
                linkMobile: `https://${data.store_manager_url}`,
                linkPc: `https://${data.store_manager_url}`,
            }
        ];

        _useSmsFailover = false;
    }
    else if(_templateCode === 'Ssell12v2'){
        _content = `[콘텐츠상점 주문알림]\n크리에이터님의 실시간 진행을 기다리는 주문이 있습니다!\n\n■ 상품명: ${data.item_title}\n■ 구매금액: ${data.item_price}\n■ 구매자: ${data.customer_name}\n■ 요청일시: ${data.requested_at}\n\n- 아직 구매자와 콘텐츠 진행시간을 정하지 않으셨나요?\n지금 크티 상점관리 페이지의 '요청된 콘텐츠'에서 구매자 연락처를 보실 수 있습니다.\n\n- 구매자와의 연락을 통해 약속시간을 정하고 콘텐츠 진행까지 마치셨다면 반드시 '콘텐츠 진행완료' 버튼을 눌러주세요!\n(콘텐츠 진행확인이 되어야만 주문이 정산 과정으로 넘어갈 수 있습니다.)\n\n콘텐츠 진행에 대한 도움이나 궁금한 점은 언제든지 저희 크티에게 문의해주세요!`;

        buttons = [
            {
                type: "WL",
                name: "주문 확인하기",
                linkMobile: `https://${data.store_manager_url}`,
                linkPc: `https://${data.store_manager_url}`,
            }
        ];

        _smsContent = '[크티] 진행을 기다리는 실시간콘텐츠 요청이 있습니다! 사이트에서 주문상태를 확인해주세요.';
    }
    else if(_templateCode === 'Ssell13v2'){
        _content = `[콘텐츠상점 주문알림]\n콘텐츠 판매가 완료되었습니다!\n\n■ 상품명: ${data.item_title}\n■ 구매자: ${data.customer_name}\n■ 판매완료일시: ${data.select_time}\n\n구매자로부터 실시간 콘텐츠 진행 확인을 받았습니다.\n구매자의 확인이 끝난 주문은 판매완료 처리되어 정산에 반영됩니다.\n\n상점 관리 페이지에서 판매 내용을 확인하고 구매자가 남긴 후기도 있는지 체크해보세요!\n\n크티 콘텐츠 상점을 이용해주셔서 감사합니다.`;

        buttons = [
            {
                type: "WL",
                name: "주문 확인하기",
                linkMobile: `https://${data.store_manager_url}`,
                linkPc: `https://${data.store_manager_url}`,
            }
        ];

        _useSmsFailover = false;
    }
    else if(_templateCode === 'Kalarm14v1'){
        _content = `[주문 알림]\n${data.creator_name} 님, 오늘의 신규 주문 건을 확인해보세요!\n\n■ 주문 건수 : ${data.order_count}\n■ 누적 주문액 : ${data.order_total_price}`;

        buttons = [
            {
                type: "WL",
                name: "확인하기",
                linkMobile: `https://${data.store_manager_url}`,
                linkPc: `https://${data.store_manager_url}`,
            }
        ];

        _useSmsFailover = false;
    }
    else if(_templateCode === 'Kalarm15v1'){
        _content = `[크티] 크리에이터 가입 안내\n열정이 돈이 되는 곳, 크티 가입을 환영합니다 (행복)\n\n콘텐츠상점부터 팬이벤트, 광고까지! 크티의 다양한 서비스를 이용하여 추가 수익을 창출해 보세요.\n\n문의사항은 카카오톡 크티 크리에이터스(@ctee_creators)로 연락 주시면 친절히 안내해 드리겠습니다.`;

        buttons = [
            {
                type: "WL",
                name: "크리에이터 가이드 확인하기",
                linkMobile: `https://bit.ly/3zDxB7I`,
                linkPc: `https://bit.ly/3zDxB7I`,
            }
        ];

        _useSmsFailover = false;
    }
    else if(_templateCode === 'Kalarm16v1'){
      _content = `[후원 알림]\n${data.donation_user_name} 님이 크티에서 ${data.creator_name} 님에게 커피 ${data.coffee_count} 잔을 후원했어요!`;

      buttons = [
          {
              type: "WL",
              name: "지금 바로 확인하기",
              linkMobile: `https://${data.place_manager_url}`,
              linkPc: `https://${data.place_manager_url}`,
          }
      ];
      _useSmsFailover = false;

      console.log(_content);
      console.log(data.to);
      console.log(buttons);
      return;
  }

    // const time = Date.now().toString();
    const time = moment_timezone().format("x");
    // const time = moment_timezone().format("X");
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
        // console.log(response);
    }).catch((error) => {
        // console.log(error.response.data.error);
    })
    
  },
  sendSMS: (to, countryCode, content, callback) => {
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
            countryCode:countryCode,
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
    //         from: '크라우드티켓<contact@ctee.kr>',
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