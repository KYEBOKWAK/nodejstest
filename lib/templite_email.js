const Util = require('./util');

let URL = function(url) {
  let _default_url = 'https://ctee.kr';
  if(process.env.APP_TYPE === 'local'){
    _default_url = 'http://localhost:8000';
  }else if(process.env.APP_TYPE === 'qa'){
    _default_url = 'http://qa.ctee.kr:8080';
  }

  return _default_url + url;
}

function replaceBrTag(str){
    if (str == undefined || str == null)
    {
        return "";
    }

    str = str.replace(/\r\n/ig, '<br>');
    str = str.replace(/\\n/ig, '<br>');
    str = str.replace(/\n/ig, '<br>');
    return str;
}

let footer_dom = function (language_code = 'kr') {
  return `<table class="email-footer" border="0" cellpadding="0" cellspacing="0" align="center" style="overflow:hidden;margin:0 0 0 0;width:100%;clear:both;background-color:#ffffff">
  <tbody><tr>
    <td>
      <table class="footer-container" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0px auto 0px auto;width:100%;max-width:630px;background:none;border-top: 1px solid #f4f4f4; padding-top: 40px; padding-bottom: 50px;">
        <tbody><tr style="margin:0;padding:0">
          <td style="width:100%;max-width:630px;border-collapse:collapse;padding:0 20px;overflow:hidden">
            <table class="sns-block" border="0" cellpadding="0" cellspacing="0" align="left" style="overflow:hidden;margin:0px auto;padding:0;max-width:630px;clear:both;background:none">
              <tbody><tr>
                <td style="padding:0;align:left;margin:0 auto 0 auto">
                  <div class="wrap-sns" style="margin:0 auto">
                    <span style="list-style:none;padding:0;margin:0px">
                      <a href="https://facebook.com/cteeofficial" style="padding:0;border-width:0px;display:inline-block" title="페이스북" target="_blank"><span style="display:inline-block"><img src="https://crowdticket0.s3.ap-northeast-1.amazonaws.com/admin/mail/rebrand/icon/sns/ic-footer-facebook.png" alt="페이스북" style="width: 32px; height: 32px;display:block;border-width:0px"/></span></a>
                    </span>
                    <span style="list-style:none;padding:0;margin:0px">
                      <a href="https://instagram.com/ctee_official" style="padding:0;border-width:0px;display:inline-block" title="인스타그램" target="_blank"><span style="display:inline-block"><img src="https://crowdticket0.s3.ap-northeast-1.amazonaws.com/admin/mail/rebrand/icon/sns/ic-footer-instagram.png" alt="인스타그램" style="width: 32px; height: 32px;display:block;border-width:0px"/></span></a>
                    </span>
                    <span style="list-style:none;padding:0;margin:0px">
                      <a href="https://www.youtube.com/channel/UCdD6uPaV3eR95r06R1VgaAA" style="padding:0;border-width:0px;display:inline-block" title="유투브" target="_blank"><span style="display:inline-block"><img src="https://crowdticket0.s3.ap-northeast-1.amazonaws.com/admin/mail/rebrand/icon/sns/ic-footer-youtube.png" alt="유투브" style="width: 32px; height: 32px;display:block;border-width:0px"/></span></a>
                    </span>
                    <span style="list-style:none;padding:0;margin:0px">
                      <a href="https://blog.naver.com/crowdticket" style="padding:0;border-width:0px;display:inline-block" title="블로그" target="_blank"><span style="display:inline-block"><img src="https://crowdticket0.s3.ap-northeast-1.amazonaws.com/admin/mail/rebrand/icon/sns/ic-footer-naver.png" alt="블로그" style="width: 32px; height: 32px;display:block;border-width:0px"/></span></a>
                    </span>
                    <!-- <span style="list-style:none;padding:0;margin:0px">
                      <a href="http://pf.kakao.com/_JUxkxjM" style="padding:0;border-width:0px;display:inline-block" title="카카오채널" target="_blank"><span style="display:inline-block"><img height="28px" src="" alt="카톡채널" style="width:28px;height:28px;display:block;border-width:0px"/></span></a>
                    </span> -->
                  </div>
                </td>
              </tr></tbody>
            </table>
            <table class="contact-info-block" border="0" cellpadding="0" cellspacing="0" align="left" style="padding: 16px 0 40px 0;table-layout:fixed" width="100%">
              <tbody><tr>
                <td style="width:100%">
                  <div style="font-size: 10px; color: #999999;">
                    ${Util.getStr('es1', language_code)}
                  </div>
                </td>
              </tr></tbody>
            </table>
            <table class="customer-service-title-block" border="0" cellpadding="0" cellspacing="0" align="left" style="padding:0;table-layout:fixed;padding-bottom: 16px;" width="100%">
              <tbody><tr>
                <td>
                  <div style="text-align:left;line-height:1.67;font-size: 16px;font-family:'Apple SD Gothic Neo','AppleSDGothicNeo','Noto Sans KR',sans-serif;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#191919">
                    ${Util.getStr('es2', language_code)}
                  </div>
                </td>
              </tr></tbody>
            </table>

            <table class="customer-service-button-block" border="0" cellpadding="0" cellspacing="0" align="left" style="padding:0;table-layout:fixed;padding-bottom: 8px;" width="100%">
              <tbody><tr>
                <td>
                  <a style="text-decoration: none;" href="http://pf.kakao.com/_JUxkxjM/chat">
                  <div style="padding: 8px 0;text-align: center; width: 100%;font-size: 12px; font-weight: bold;border-radius: 4px;background-color: #fafafa; color: #191919;">
                    ${Util.getStr('es3', language_code)}
                  </div>
                  </a>
                </td>
              </tr></tbody>
            </table>

            <table class="customer-service-time-block" border="0" cellpadding="0" cellspacing="0" align="left" style="padding:0;table-layout:fixed;padding-bottom: 24px;" width="100%">
              <tbody><tr>
                <td>  
                  <div style="padding: 8px 0;text-align: center; width: 100%;font-size: 12px; color: #999999">
                    ${Util.getStr('es4', language_code)}
                  </div>
                </td>
              </tr></tbody>
            </table>

            <table class="customer-service-kakao-block" border="0" cellpadding="0" cellspacing="0" align="left" style="padding:0;table-layout:fixed; padding-bottom: 8px;" width="100%">
              <tbody><tr>
                <td>
                  
                  <div style="width: 100%;font-size: 10px; color: #191919;">
                    ${Util.getStr('es5', language_code)}
                    <a style="text-decoration: none; color: #191919;" href="http://pf.kakao.com/_gJyNK/chat">
                      <div style="width:14px;height:14px;line-height:14px;display:inline-block;">
                        <img style="width:14px;height:14px;vertical-align:middle;" src="https://crowdticket0.s3.ap-northeast-1.amazonaws.com/admin/mail/rebrand/icon/sns/ic-kakao-channel.png">
                      </div>
                      ${Util.getStr('es6', language_code)}
                    </a>
                  </div>
                  
                </td>
              </tr></tbody>
            </table>

            <table class="customer-service-tel-block" border="0" cellpadding="0" cellspacing="0" align="left" style="padding:0;table-layout:fixed;padding-bottom: 8px;" width="100%">
              <tbody><tr>
                <td>
                  <div style="width: 100%;font-size: 10px; color: #191919;">
                    T: <a style="text-decoration: none; color: #191919;" href="tel:1522-1946">1522-1946</a>
                  </div>
                </td>
              </tr></tbody>
            </table>

            <table class="customer-service-email-block" border="0" cellpadding="0" cellspacing="0" align="left" style="padding:0;table-layout:fixed" width="100%">
              <tbody><tr>
                <td>
                  <div style="width: 100%;font-size: 10px; color: #191919;">
                    E: <a style="text-decoration: none; color: #191919;" href="mailto:contact@ctee.kr">contact@ctee.kr</a>
                  </div>
                </td>
              </tr></tbody>
            </table>
          </td>
        </tr></tbody>
      </table>
    </td>
  </tr></tbody>
</table>`
}

let logo_dom = function() {
  return `<table class="symbol-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:4px 0px 40px;width:100%;max-width:630px;clear:both;background:none;">
  <tbody><tr>
    <td>
      <img alt="크티 로고" src="https://crowdticket0.s3.ap-northeast-1.amazonaws.com/admin/mail/rebrand/logo-ctee-horizon.png" class="ic_cti_symbol" style="width:92px; height:34px; object-fit: contain;" />
    </td>
  </tr></tbody>
</table>`
}

module.exports = {
  from: function(language_code){
    return Util.getStr('es19', language_code);
  },
  email_confirm_ok: {
    subject: function(language_code){
      return Util.getStr('es66', language_code)
    },
    html: function(store_title, order_name, item_title, item_price, confirm_at, language_code){
      return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="line-height: 1.43;margin:0%;font-family:'Noto Sans KR'; line-height:1.71;">
          <table class="full-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0;padding:0;width:100%;background:none">
            <tbody><tr>
              <td style="width:100%;height:100%">
                <!-- main Container start -->
                <table class="main-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0px auto;padding:40px 0 60px 0;width:100%;max-width:630px;background:rgb(255,255,255)">
                  <tbody><tr style="margin:0;padding:0">
                    <td style="width:100%;max-width:630px;border-collapse:separate;padding:0 20px;overflow:hidden">
                      <!-- symbol start -->
                      ${logo_dom()}
                      <!-- symbol end -->
                      <!-- title start -->
                      <table class="email-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:24px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es67', language_code)}                          
                          </td>
                        </tr></tbody>
                      </table>
                      <!-- title end -->
      
                      <!-- box contents start -->
                      <table class="email-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:40px 0px 30px 0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#262626;word-break:keep-all;padding: 20px 0px;border-radius: 4px;background-color: #fafafa;text-align: center;font-weight: 500;">
                            ${Util.getStr('es68', language_code, [store_title])}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:16px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es10', language_code)}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-contents" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;border-top: 2px solid #191919;padding-bottom: 30px;">
                        <tbody>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es11', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${item_title}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es12', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${item_price}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es13', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${order_name}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es69', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${confirm_at}
                            </td>
                          </tr>
                        </tbody>
                      </table>
      
                      <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 40px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#191919">
                            <div style="text-align:left">${Util.getStr('es70', language_code)}</div>
                          </td>
                        </tr></tbody>
                      </table>
      
                      <!-- box contents end -->
                      <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="padding:0 0;border:0px" width="100%">
                            <a href="${URL(`/manager/place/?top=TAB_CONTENTS_STORE&sub=TAB_CONTENTS_STORE_SUB_ASK_LIST`)}" target="_blank" style="text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">
                              <div style="width: 100%;padding: 12px 0px;background:#191919;border-radius: 4px;font-size: 14px;font-weight: bold;color:#ffffff;">
                                ${Util.getStr('es71', language_code)}
                              </div>
                            </a>
                          </td>
                        </tr></tbody>
                      </table>
                    </td>
                  </tr></tbody>
                </table>
                <!-- main Container end -->
      
                <!-- footer start -->
                ${footer_dom(language_code)}
                <!-- footer end -->
              </td>
            </tr></tbody>
          </table>
        </body>
      </html>`
    }
  },
  email_wait_convey_master: {
    //콘텐츠 전달을 기다리는 주문이 있습니다.
    subject: function(language_code){
      return Util.getStr('es61', language_code)
    },
    html: function(store_title, order_name, item_title, item_price, created_at, requestContent, language_code){
      return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="line-height: 1.43;margin:0%;font-family:'Noto Sans KR'; line-height:1.71;">
          <table class="full-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0;padding:0;width:100%;background:none">
            <tbody><tr>
              <td style="width:100%;height:100%">
                <!-- main Container start -->
                <table class="main-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0px auto;padding:40px 0 60px 0;width:100%;max-width:630px;background:rgb(255,255,255)">
                  <tbody><tr style="margin:0;padding:0">
                    <td style="width:100%;max-width:630px;border-collapse:separate;padding:0 20px;overflow:hidden">
                      <!-- symbol start -->
                      ${logo_dom()}
                      <!-- symbol end -->
                      <!-- title start -->
                      <table class="email-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:24px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es62', language_code)}                          
                          </td>
                        </tr></tbody>
                      </table>
                      <!-- title end -->
      
                      <!-- box contents start -->
                      <table class="email-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:40px 0px 30px 0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#262626;word-break:keep-all;padding: 20px 0px;border-radius: 4px;background-color: #fafafa;text-align: center;font-weight: 500;">
                            ${Util.getStr('es63', language_code, [store_title])}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:16px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es10', language_code)}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-contents" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;border-top: 2px solid #191919;padding-bottom: 30px;">
                        <tbody>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es11', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${item_title}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es12', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${item_price}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es13', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${order_name}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es14', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${created_at}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es15', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${requestContent}
                            </td>
                          </tr>
                        </tbody>
                      </table>
      
                      <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 40px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#191919">
                            <div style="text-align:left">${Util.getStr('es64', language_code)}</div>
                          </td>
                        </tr></tbody>
                      </table>
      
                      <!-- box contents end -->
                      <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="padding:0 0;border:0px" width="100%">
                            <a href="${URL(`/manager/place/?top=TAB_CONTENTS_STORE&sub=TAB_CONTENTS_STORE_SUB_ASK_LIST`)}" target="_blank" style="text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">
                              <div style="width: 100%;padding: 12px 0px;background:#191919;border-radius: 4px;font-size: 14px;font-weight: bold;color:#ffffff;">
                                ${Util.getStr('es65', language_code)}
                              </div>
                            </a>
                          </td>
                        </tr></tbody>
                      </table>
                    </td>
                  </tr></tbody>
                </table>
                <!-- main Container end -->
      
                <!-- footer start -->
                ${footer_dom(language_code)}
                <!-- footer end -->
              </td>
            </tr></tbody>
          </table>
        </body>
      </html>`
    }
  },
  email_expire_master: {
    //승인이 만료 되었습니다.//es56
    subject: function(language_code){
      return Util.getStr('es56', language_code)
    },
    html: function(store_title, order_name, item_title, item_price, created_at, requestContent, language_code){
      return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="line-height: 1.43;margin:0%;font-family:'Noto Sans KR'; line-height:1.71;">
          <table class="full-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0;padding:0;width:100%;background:none">
            <tbody><tr>
              <td style="width:100%;height:100%">
                <!-- main Container start -->
                <table class="main-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0px auto;padding:40px 0 60px 0;width:100%;max-width:630px;background:rgb(255,255,255)">
                  <tbody><tr style="margin:0;padding:0">
                    <td style="width:100%;max-width:630px;border-collapse:separate;padding:0 20px;overflow:hidden">
                      <!-- symbol start -->
                      ${logo_dom()}
                      <!-- symbol end -->
                      <!-- title start -->
                      <table class="email-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:24px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es57', language_code)}                          
                          </td>
                        </tr></tbody>
                      </table>
                      <!-- title end -->
      
                      <!-- box contents start -->
                      <table class="email-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:40px 0px 30px 0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#262626;word-break:keep-all;padding: 20px 0px;border-radius: 4px;background-color: #fafafa;text-align: center;font-weight: 500;">
                            ${Util.getStr('es58', language_code, [store_title])}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:16px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es10', language_code)}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-contents" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;border-top: 2px solid #191919;padding-bottom: 30px;">
                        <tbody>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es11', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${item_title}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es12', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${item_price}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es13', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${order_name}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es14', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${created_at}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es15', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${requestContent}
                            </td>
                          </tr>
                        </tbody>
                      </table>
      
                      <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#191919">
                            ${Util.getStr('es59', language_code, [store_title])}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 40px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#191919">
                            <div style="text-align:left">${Util.getStr('es60', language_code)}</div>
                          </td>
                        </tr></tbody>
                      </table>
      
                      <!-- box contents end -->
                      <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="padding:0 0;border:0px" width="100%">
                            <a href="${URL(`/manager/place/?top=TAB_CONTENTS_STORE&sub=TAB_CONTENTS_STORE_SUB_ASK_LIST`)}" target="_blank" style="text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">
                              <div style="width: 100%;padding: 12px 0px;background:#191919;border-radius: 4px;font-size: 14px;font-weight: bold;color:#ffffff;">
                                ${Util.getStr('es18', language_code)}
                              </div>
                            </a>
                          </td>
                        </tr></tbody>
                      </table>
                    </td>
                  </tr></tbody>
                </table>
                <!-- main Container end -->
      
                <!-- footer start -->
                ${footer_dom(language_code)}
                <!-- footer end -->
              </td>
            </tr></tbody>
          </table>
        </body>
      </html>`
    }
  },
  email_expire_warning_master: {
    //승인되지 않은 콘텐츠상품이 있습니다.
    subject: function(language_code){
      return Util.getStr('es51', language_code)
    },
    html: function(store_title, order_name, item_title, item_price, created_at, requestContent, language_code){
      return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="line-height: 1.43;margin:0%;font-family:'Noto Sans KR'; line-height:1.71;">
          <table class="full-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0;padding:0;width:100%;background:none">
            <tbody><tr>
              <td style="width:100%;height:100%">
                <!-- main Container start -->
                <table class="main-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0px auto;padding:40px 0 60px 0;width:100%;max-width:630px;background:rgb(255,255,255)">
                  <tbody><tr style="margin:0;padding:0">
                    <td style="width:100%;max-width:630px;border-collapse:separate;padding:0 20px;overflow:hidden">
                      <!-- symbol start -->
                      ${logo_dom()}
                      <!-- symbol end -->
                      <!-- title start -->
                      <table class="email-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:24px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es52', language_code)}                          
                          </td>
                        </tr></tbody>
                      </table>
                      <!-- title end -->
      
                      <!-- box contents start -->
                      <table class="email-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:40px 0px 30px 0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#262626;word-break:keep-all;padding: 20px 0px;border-radius: 4px;background-color: #fafafa;text-align: center;font-weight: 500;">
                            ${Util.getStr('es53', language_code, [store_title])}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:16px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es10', language_code)}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-contents" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;border-top: 2px solid #191919;padding-bottom: 30px;">
                        <tbody>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es11', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${item_title}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es12', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${item_price}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es13', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${order_name}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es14', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${created_at}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es15', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${requestContent}
                            </td>
                          </tr>
                        </tbody>
                      </table>
      
                      <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#191919">
                            ${Util.getStr('es54', language_code)}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 40px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#191919">
                            <div style="text-align:left">${Util.getStr('es55', language_code)}</div>
                          </td>
                        </tr></tbody>
                      </table>
      
                      <!-- box contents end -->
                      <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="padding:0 0;border:0px" width="100%">
                            <a href="${URL(`/manager/place/?top=TAB_CONTENTS_STORE&sub=TAB_CONTENTS_STORE_SUB_ASK_LIST`)}" target="_blank" style="text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">
                              <div style="width: 100%;padding: 12px 0px;background:#191919;border-radius: 4px;font-size: 14px;font-weight: bold;color:#ffffff;">
                                ${Util.getStr('es50', language_code)}
                              </div>
                            </a>
                          </td>
                        </tr></tbody>
                      </table>
                    </td>
                  </tr></tbody>
                </table>
                <!-- main Container end -->
      
                <!-- footer start -->
                ${footer_dom(language_code)}
                <!-- footer end -->
              </td>
            </tr></tbody>
          </table>
        </body>
      </html>`
    }
  },
  email_confirm_check: {
    //전달받은 콘텐츠상품을 확인해주세요!
    subject: function(language_code){
      return Util.getStr('es41', language_code)
    },
    html: function(store_manager_name, order_name, item_title, store_order_id, language_code){
      return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="line-height: 1.43;margin:0%;font-family:'Noto Sans KR'; line-height:1.71;">
          <table class="full-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0;padding:0;width:100%;background:none">
            <tbody><tr>
              <td style="width:100%;height:100%">
                <!-- main Container start -->
                <table class="main-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0px auto;padding:40px 0 60px 0;width:100%;max-width:630px;background:rgb(255,255,255)">
                  <tbody><tr style="margin:0;padding:0">
                    <td style="width:100%;max-width:630px;border-collapse:separate;padding:0 20px;overflow:hidden">
                      <!-- symbol start -->
                      ${logo_dom()}
                      <!-- symbol end -->
                      <!-- title start -->
                      <table class="email-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:24px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es42', language_code)}                          
                          </td>
                        </tr></tbody>
                      </table>
                      <!-- title end -->
      
                      <!-- box contents start -->
                      <table class="email-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:40px 0px 30px 0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#262626;word-break:keep-all;padding: 20px 0px;border-radius: 4px;background-color: #fafafa;text-align: center;font-weight: 500;">
                            ${Util.getStr('es43', language_code, [order_name])}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:16px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es10', language_code)}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-contents" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;border-top: 2px solid #191919;padding-bottom: 30px;">
                        <tbody>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es31', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${store_manager_name}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es11', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${item_title}
                            </td>
                          </tr>
                        </tbody>
                      </table>
      
                      <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 40px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es44', language_code)}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <!-- box contents end -->
                      <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="padding:0 0;border:0px" width="100%">
                            <a href="${URL(`/store/content/${store_order_id}`)}" target="_blank" style="text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">
                              <div style="width: 100%;padding: 12px 0px;background:#191919;border-radius: 4px;font-size: 14px;font-weight: bold;color:#ffffff;">
                                ${Util.getStr('es45', language_code)}
                              </div>
                            </a>
                          </td>
                        </tr></tbody>
                      </table>
                    </td>
                  </tr></tbody>
                </table>
                <!-- main Container end -->
      
                <!-- footer start -->
                ${footer_dom(language_code)}
                <!-- footer end -->
              </td>
            </tr></tbody>
          </table>
        </body>
      </html>`
    }
  },
  email_join_place: {
    subject: '[크티] 크리에이터 가입 안내',
    html: function(title){
      return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin:0%">
          <div><div><b><font size="4"><br>축하합니다!&nbsp;</font></b></div><div><b><font size="4">크리에이터 가입이 완료되었습니다!</font></b></div><div><br></div><div>안녕하세요, ${title} 님! 열정이 돈이 되는 곳, 크티입니다.&nbsp;</div><div>크티는 크리에이터가 본인의 콘텐츠를 활용해 다양한 방법으로 수익을 창출할 수 있는 다양한 서비스를 제공하고 있습니다.</div><div><br></div><div>지금 로그인 하셔서 크티의 다양한 서비스를 이용해 보세요!</div><div><div><br></div><div>-</div><div><b>아래 서비스들을 이용하실 수 있어요.</b></div><div><ul><li style="margin-left:15px">나만의 콘텐츠를 판매하고 수익을 창출할 수 있는&nbsp;<b><u>콘텐츠상점</u></b></li><li style="margin-left:15px">팬밋업부터 강연까지, 팬들과 온/오프라인에서 즐기는&nbsp;<b><u>팬이벤트</u></b></li><li style="margin-left:15px">단가만 입력하면 손쉽게 진행할 수 있는&nbsp;<b><u>크티 광고 캠페인</u></b></li></ul><div><br></div><div>-</div><div>문의사항은&nbsp;&nbsp;<b><a href="http://pf.kakao.com/_gJyNK/chat" style="background-color:rgb(255,255,0)" target="_blank" data-saferedirecturl="https://www.google.com/url?q=http://pf.kakao.com/_gJyNK/chat&amp;source=gmail&amp;ust=1638437001141000&amp;usg=AOvVaw06J5d-O040MQLuPN1nQYbh">카카오톡 크티 크리에이터스(@ctee_creators)</a></b>로 연락 주시면 친절히 안내해 드리겠습니다. 감사합니다.</div></div><div>크리에이터 비즈니스 플랫폼, 크티</div></div><div><br></div></div>
        </body>
      </html>`   
    }
  },
  email_store_arrive_product: {
    subject: function(language_code){
      return Util.getStr('es28', language_code)
    },
    html: function(store_manager_name, order_name, item_title, requestContent, store_order_id, language_code){
      return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="line-height: 1.43;margin:0%;font-family:'Noto Sans KR'; line-height:1.71;">
          <table class="full-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0;padding:0;width:100%;background:none">
            <tbody><tr>
              <td style="width:100%;height:100%">
                <!-- main Container start -->
                <table class="main-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0px auto;padding:40px 0 60px 0;width:100%;max-width:630px;background:rgb(255,255,255)">
                  <tbody><tr style="margin:0;padding:0">
                    <td style="width:100%;max-width:630px;border-collapse:separate;padding:0 20px;overflow:hidden">
                      <!-- symbol start -->
                      ${logo_dom()}
                      <!-- symbol end -->
                      <!-- title start -->
                      <table class="email-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:24px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es29', language_code)}                          
                          </td>
                        </tr></tbody>
                      </table>
                      <!-- title end -->
      
                      <!-- box contents start -->
                      <table class="email-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:40px 0px 30px 0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#262626;word-break:keep-all;padding: 20px 0px;border-radius: 4px;background-color: #fafafa;text-align: center;font-weight: 500;">
                            ${Util.getStr('es30', language_code, [order_name, store_manager_name])}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:16px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es10', language_code)}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <table class="email-order-contents" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;border-top: 2px solid #191919;padding-bottom: 30px;">
                        <tbody>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es31', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${store_manager_name}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es11', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${item_title}
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                              ${Util.getStr('es15', language_code)}
                            </td>
                            <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                              ${requestContent}
                            </td>
                          </tr>
                        </tbody>
                      </table>
      
                      <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 40px;">
                        <tbody><tr>
                          <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                            ${Util.getStr('es32', language_code)}
                          </td>
                        </tr></tbody>
                      </table>
      
                      <!-- box contents end -->
                      <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="padding:0 0;border:0px" width="100%">
                            <a href="${URL(`/store/content/${store_order_id}`)}" target="_blank" style="text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">
                              <div style="width: 100%;padding: 12px 0px;background:#191919;border-radius: 4px;font-size: 14px;font-weight: bold;color:#ffffff;">
                                ${Util.getStr('es33', language_code)}
                              </div>
                            </a>
                          </td>
                        </tr></tbody>
                      </table>
                    </td>
                  </tr></tbody>
                </table>
                <!-- main Container end -->
      
                <!-- footer start -->
                ${footer_dom(language_code)}
                <!-- footer end -->
              </td>
            </tr></tbody>
          </table>
        </body>
      </html>`
    }
  },
 email_store_order_rejected: {
  subject: function(language_code){
    return Util.getStr('es34', language_code)
  },
  html: function(store_manager_name, order_name, item_title, refund_reason, language_code, alias){
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="line-height: 1.43;margin:0%;font-family:'Noto Sans KR'; line-height:1.71;">
        <table class="full-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0;padding:0;width:100%;background:none">
          <tbody><tr>
            <td style="width:100%;height:100%">
              <!-- main Container start -->
              <table class="main-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0px auto;padding:40px 0 60px 0;width:100%;max-width:630px;background:rgb(255,255,255)">
                <tbody><tr style="margin:0;padding:0">
                  <td style="width:100%;max-width:630px;border-collapse:separate;padding:0 20px;overflow:hidden">
                    <!-- symbol start -->
                    ${logo_dom()}
                    <!-- symbol end -->
                    <!-- title start -->
                    <table class="email-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:24px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es35', language_code)}                          
                        </td>
                      </tr></tbody>
                    </table>
                    <!-- title end -->
    
                    <!-- box contents start -->
                    <table class="email-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:40px 0px 30px 0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#262626;word-break:keep-all;padding: 20px 0px;border-radius: 4px;background-color: #fafafa;text-align: center;font-weight: 500;">
                          ${Util.getStr('es36', language_code, [store_manager_name])}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <table class="email-order-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 30px;">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es37', language_code, [store_manager_name])}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <table class="email-order-contents" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;border-top: 2px solid #191919;padding-bottom: 30px;">
                      <tbody>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es40', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${refund_reason}
                          </td>
                        </tr>
                      </tbody>
                    </table>

    
                    <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 40px;">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#999999">
                          <div style="text-align:left">${Util.getStr('es38', language_code, [order_name])}</div>
                        </td>
                      </tr></tbody>
                    </table>
    
                    <!-- box contents end -->
                    <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="padding:0 0;border:0px" width="100%">
                          <a href="${URL(`/place/${alias}`)}" target="_blank" style="text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">
                            <div style="width: 100%;padding: 12px 0px;background:#191919;border-radius: 4px;font-size: 14px;font-weight: bold;color:#ffffff;">
                              ${Util.getStr('es39', language_code)}
                            </div>
                          </a>
                        </td>
                      </tr></tbody>
                    </table>
                  </td>
                </tr></tbody>
              </table>
              <!-- main Container end -->
    
              <!-- footer start -->
              ${footer_dom(language_code)}
              <!-- footer end -->
            </td>
          </tr></tbody>
        </table>
      </body>
    </html>`
  }
 },
 email_store_order_approved: {
  subject: function(language_code){
    return Util.getStr('es23', language_code)
  },
  html: function(store_manager_name, order_name, item_title, user_id, requestContent, created_at, language_code){
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="line-height: 1.43;margin:0%;font-family:'Noto Sans KR'; line-height:1.71;">
        <table class="full-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0;padding:0;width:100%;background:none">
          <tbody><tr>
            <td style="width:100%;height:100%">
              <!-- main Container start -->
              <table class="main-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0px auto;padding:40px 0 60px 0;width:100%;max-width:630px;background:rgb(255,255,255)">
                <tbody><tr style="margin:0;padding:0">
                  <td style="width:100%;max-width:630px;border-collapse:separate;padding:0 20px;overflow:hidden">
                    <!-- symbol start -->
                    ${logo_dom()}
                    <!-- symbol end -->
                    <!-- title start -->
                    <table class="email-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:24px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es22', language_code)}                          
                        </td>
                      </tr></tbody>
                    </table>
                    <!-- title end -->
    
                    <!-- box contents start -->
                    <table class="email-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:40px 0px 30px 0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#262626;word-break:keep-all;padding: 20px 0px;border-radius: 4px;background-color: #fafafa;text-align: center;font-weight: 500;">
                          ${Util.getStr('es24', language_code, [order_name, store_manager_name])}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <table class="email-order-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:16px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es10', language_code)}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <table class="email-order-contents" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;border-top: 2px solid #191919;padding-bottom: 30px;">
                      <tbody>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es11', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${item_title}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es14', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${created_at}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es15', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${requestContent}
                          </td>
                        </tr>
                      </tbody>
                    </table>
    
                    <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es25', language_code)}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 40px;">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#999999">
                          <div style="text-align:left">${Util.getStr('es26', language_code)}</div>
                        </td>
                      </tr></tbody>
                    </table>
    
                    <!-- box contents end -->
                    <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="padding:0 0;border:0px" width="100%">
                          <a href="${URL(`/users/store/${user_id}/orders`)}" target="_blank" style="text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">
                            <div style="width: 100%;padding: 12px 0px;background:#191919;border-radius: 4px;font-size: 14px;font-weight: bold;color:#ffffff;">
                              ${Util.getStr('es27', language_code)}
                            </div>
                          </a>
                        </td>
                      </tr></tbody>
                    </table>
                  </td>
                </tr></tbody>
              </table>
              <!-- main Container end -->
    
              <!-- footer start -->
              ${footer_dom(language_code)}
              <!-- footer end -->
            </td>
          </tr></tbody>
        </table>
      </body>
    </html>`
  }
 },
 email_store_order_requested: {
  subject: function(language_code){
    return Util.getStr('es8', language_code)
  },
  html: function(user_id, order_name, item_title, item_price, created_at, requestContent, language_code){
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="line-height: 1.43;margin:0%;font-family:'Noto Sans KR'; line-height:1.71;">
        <table class="full-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0;padding:0;width:100%;background:none">
          <tbody><tr>
            <td style="width:100%;height:100%">
              <!-- main Container start -->
              <table class="main-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0px auto;padding:40px 0 60px 0;width:100%;max-width:630px;background:rgb(255,255,255)">
                <tbody><tr style="margin:0;padding:0">
                  <td style="width:100%;max-width:630px;border-collapse:separate;padding:0 20px;overflow:hidden">
                    <!-- symbol start -->
                    ${logo_dom()}
                    <!-- symbol end -->
                    <!-- title start -->
                    <table class="email-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:24px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es7', language_code)}                          
                        </td>
                      </tr></tbody>
                    </table>
                    <!-- title end -->
    
                    <!-- box contents start -->
                    <table class="email-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:40px 0px 30px 0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#262626;word-break:keep-all;padding: 20px 0px;border-radius: 4px;background-color: #fafafa;text-align: center;font-weight: 500;">
                          ${Util.getStr('es9', language_code, [order_name])}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <table class="email-order-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:16px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es10', language_code)}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <table class="email-order-contents" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;border-top: 2px solid #191919;padding-bottom: 30px;">
                      <tbody>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es11', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${item_title}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es12', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${item_price}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es13', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${order_name}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es14', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${created_at}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es15', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${requestContent}
                          </td>
                        </tr>
                      </tbody>
                    </table>
    
                    <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es16', language_code)}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 40px;">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#999999">
                          <div style="text-align:left">${Util.getStr('es17', language_code)}</div>
                        </td>
                      </tr></tbody>
                    </table>
    
                    <!-- box contents end -->
                    <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="padding:0 0;border:0px" width="100%">
                          <a href="${URL(`/users/store/${user_id}/orders`)}" target="_blank" style="text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">
                            <div style="width: 100%;padding: 12px 0px;background:#191919;border-radius: 4px;font-size: 14px;font-weight: bold;color:#ffffff;">
                              ${Util.getStr('es18', language_code)}
                            </div>
                          </a>
                        </td>
                      </tr></tbody>
                    </table>
                  </td>
                </tr></tbody>
              </table>
              <!-- main Container end -->
    
              <!-- footer start -->
              ${footer_dom(language_code)}
              <!-- footer end -->
            </td>
          </tr></tbody>
        </table>
      </body>
    </html>`
  }
 },
 email_store_creator_order: {
  subject: function(language_code){
    return Util.getStr('es46', language_code)
  },
  html: function(store_manager_name, order_nick_name, item_title, total_price, created_at, requestContent, language_code){
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="line-height: 1.43;margin:0%;font-family:'Noto Sans KR'; line-height:1.71;">
        <table class="full-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0;padding:0;width:100%;background:none">
          <tbody><tr>
            <td style="width:100%;height:100%">
              <!-- main Container start -->
              <table class="main-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0px auto;padding:40px 0 60px 0;width:100%;max-width:630px;background:rgb(255,255,255)">
                <tbody><tr style="margin:0;padding:0">
                  <td style="width:100%;max-width:630px;border-collapse:separate;padding:0 20px;overflow:hidden">
                    <!-- symbol start -->
                    ${logo_dom()}
                    <!-- symbol end -->
                    <!-- title start -->
                    <table class="email-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:24px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es47', language_code)}                          
                        </td>
                      </tr></tbody>
                    </table>
                    <!-- title end -->
    
                    <!-- box contents start -->
                    <table class="email-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:40px 0px 30px 0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#262626;word-break:keep-all;padding: 20px 0px;border-radius: 4px;background-color: #fafafa;text-align: center;font-weight: 500;">
                          ${Util.getStr('es48', language_code, [store_manager_name])}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <table class="email-order-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:16px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es10', language_code)}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <table class="email-order-contents" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;border-top: 2px solid #191919;padding-bottom: 30px;">
                      <tbody>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es11', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${item_title}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es12', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${total_price}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es13', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${order_nick_name}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es14', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${created_at}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es15', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${requestContent}
                          </td>
                        </tr>
                      </tbody>
                    </table>
    
                    <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 40px;">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es49', language_code)}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <!-- box contents end -->
                    <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="padding:0 0;border:0px" width="100%">
                          <a href="${URL(`/manager/place/?top=TAB_CONTENTS_STORE&sub=TAB_CONTENTS_STORE_SUB_ASK_LIST`)}" target="_blank" style="text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">
                            <div style="width: 100%;padding: 12px 0px;background:#191919;border-radius: 4px;font-size: 14px;font-weight: bold;color:#ffffff;">
                              ${Util.getStr('es50', language_code)}
                            </div>
                          </a>
                        </td>
                      </tr></tbody>
                    </table>
                  </td>
                </tr></tbody>
              </table>
              <!-- main Container end -->
    
              <!-- footer start -->
              ${footer_dom(language_code)}
              <!-- footer end -->
            </td>
          </tr></tbody>
        </table>
      </body>
    </html>`
  }
 },

 email_add_answer_requested: {
  subject: function(language_code){
    return Util.getStr('es73', language_code)
  },
  html: function(user_id, ask_name, item_title, store_title, ask_title, ask_date, ask_contents, answer_contents, language_code){
    let _ask_contents = replaceBrTag(ask_contents);
    let _answer_contents = replaceBrTag(answer_contents);
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="line-height: 1.43;margin:0%;font-family:'Noto Sans KR'; line-height:1.71;">
        <table class="full-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0;padding:0;width:100%;background:none">
          <tbody><tr>
            <td style="width:100%;height:100%">
              <!-- main Container start -->
              <table class="main-container" cellpadding="0" cellspacing="0" align="center" border="0" style="margin:0px auto;padding:40px 0 60px 0;width:100%;max-width:630px;background:rgb(255,255,255)">
                <tbody><tr style="margin:0;padding:0">
                  <td style="width:100%;max-width:630px;border-collapse:separate;padding:0 20px;overflow:hidden">
                    <!-- symbol start -->
                    ${logo_dom()}
                    <!-- symbol end -->
                    <!-- title start -->
                    <table class="email-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:24px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es74', language_code)}                          
                        </td>
                      </tr></tbody>
                    </table>
                    <!-- title end -->
    
                    <!-- box contents start -->
                    <table class="email-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:40px 0px 30px 0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#262626;word-break:keep-all;padding: 20px 0px;border-radius: 4px;background-color: #fafafa;text-align: center;font-weight: 500;">
                          ${Util.getStr('es75', language_code, [ask_name, store_title])}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <table class="email-order-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:16px;font-weight:bold;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es10', language_code)}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <table class="email-order-contents" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;border-top: 2px solid #191919;padding-bottom: 30px;">
                      <tbody>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es11', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${item_title}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es76', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${ask_title}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es77', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 0px 20px;">
                            ${ask_date}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es78', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 12px 20px;">
                            ${_ask_contents}
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 100px;height: 44px;background-color: rgba(0, 0, 0, 0.05);text-align: center;border-bottom: 1px solid rgba(0,0,0,0.1);">
                            ${Util.getStr('es79', language_code)}
                          </td>
                          <td style="border-bottom: 1px solid rgba(0,0,0,0.1);padding: 12px 20px;">
                            ${_answer_contents}
                          </td>
                        </tr>
                      </tbody>
                    </table>
    
                    <table class="email-order-explain-1" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none;padding-bottom: 10px;">
                      <tbody><tr>
                        <td style="font-family:'Noto Sans KR',sans-serif;font-size:14px;font-stretch:normal;font-style:normal;letter-spacing:normal;color:#212121">
                          ${Util.getStr('es80', language_code)}
                        </td>
                      </tr></tbody>
                    </table>
    
                    <!-- box contents end -->
                    <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                      <tbody><tr>
                        <td style="padding:0 0;border:0px" width="100%">
                          <a href="${URL(`/users/store/${user_id}/orders?menu=MENU_ASK_LIST`)}" target="_blank" style="text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">
                            <div style="width: 100%;padding: 12px 0px;background:#191919;border-radius: 4px;font-size: 14px;font-weight: bold;color:#ffffff;">
                              ${Util.getStr('es81', language_code)}
                            </div>
                          </a>
                        </td>
                      </tr></tbody>
                    </table>
                  </td>
                </tr></tbody>
              </table>
              <!-- main Container end -->
    
              <!-- footer start -->
              ${footer_dom(language_code)}
              <!-- footer end -->
            </td>
          </tr></tbody>
        </table>
      </body>
    </html>`
  }
 },
}