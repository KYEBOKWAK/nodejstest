module.exports = {
  email_store_arrive_product: {
    subject: '[크티] 주문하신 콘텐츠가 준비됐어요!',
    html: function(store_manager_name, order_name, item_title, requestContent, store_order_id){
      return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
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
                            <div style="text-align:left">주문하신 콘텐츠가<br/>준비되었습니다</div>
                          </td>
                        </tr></tbody>
                      </table>
                      <table class="email-content" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:32px 0px;width:100%;max-width:630px;clear:both;background:none">
                        <tr>
                          <td>
                            <table class="explain-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                              <tr>
                                <td style="padding:0px 0px;font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757;word-break:keep-all">
                                  <div style="text-align:left">오직 <span style="font-weight:bold;color:#43c9f0;">${order_name}</span>님을 위해 준비한<br/><b>${store_manager_name}</b>의 콘텐츠가 완성되었습니다! &#x1F604;</div>
                                </td>
                              </tr>
                            </table>
                            <table class="paragraph-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:24px 0;width:100%;max-width:630px;clear:both;background:none">
                              <tbody><tr>
                                <td style="font-family:'Noto Sans KR','NotoSansCJKkr',sans-serif;font-size:16px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:normal;letter-spacing:normal;color:#212121">
                                  <div style="text-align:left">주문내역</div>
                                </td>
                              </tr></tbody>
                            </table>
                            <table class="order-details" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin-bottom:24px;padding:24px 0;width:100%;max-width:590px;clear:both;background:none;border-collapse:collapse">
                              <tr height="44px" style="border-top:2px solid #43c8ef; border-bottom:1px solid #e8e8e8">
                                <td width="65px" style="background-color: rgba(67, 200, 239, 0.1); padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                                  상점
                                </td>
                                <td style="padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                                  ${store_manager_name}
                                </td>
                              </tr>
                              <tr height="44px" style="border-bottom:1px solid #e8e8e8">
                                <td width="65px" style="background-color: rgba(67, 200, 239, 0.1); padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                                  상품명
                                </td>
                                <td style="padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                                  ${item_title}
                                </td>
                              </tr>
                              <tr height="44px" style="border-bottom:1px solid #e8e8e8">
                                <td width="65px" style="min-width:65px;background-color: rgba(67, 200, 239, 0.1); padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                                  요청사항
                                </td>
                                <td style="padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                                  ${requestContent}
                                </td>
                              </tr>
                            </table>
                            <table class="explain-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                              <tr>
                                <td style="padding:0px 0px;font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757;word-break:keep-all">
                                  <div style="text-align:left">아래 버튼을 눌러서 준비된 콘텐츠를 지금 바로 확인해보세요!<br/>콘텐츠 확인 후 구매 완료 버튼을 꼭! 눌러주시고 크리에이터를 위한 콘텐츠 후기 작성도 잊지 마세요. &#x1F609;</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="padding:0 0;border:0px" width="100%">
                            <table class="cti-button" border="0" cellpadding="0" cellspacing="0" width="" style="border-collapse:separate!important;background:#43c9f0;border-radius:5px;border:0;margin:0 auto;table-layout:fixed" align="left">
                              <tbody><tr>
                                <td style="padding:12px 20px" align="center">
                                  <a href="https://crowdticket.kr/store/content/${store_order_id}" target="_blank" style="font-size:14px;display:block;color:#ffffff;text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">콘텐츠 확인하기</a>
                                </td>
                              </tr></tbody>
                            </table>
                          </td>
                        </tr></tbody>
                      </table>
                      <hr width="100%" size="1px" align="center" color="#ebebeb" style="margin:24px 0px 24px 0px"/>
                      <table class="explain-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0 0 32px 0;width:100%;max-width:630px;clear:both;background:none">
                        <tr>
                          <td style="padding:0px 0px;font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757;word-break:keep-all">
                            <div style="text-align:left">크티 콘텐츠 상점 이용 경험은 어떠셨나요? 여러분의 솔직한 의견을 들려주세요. 소중한 피드백은 적극 반영하여 계속해서 더 좋은 서비스를 만들겠습니다!</div>
                          </td>
                        </tr>
                      </table>
                      <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                        <tbody><tr>
                          <td style="padding:0 0;border:0px" width="100%">
                            <table class="cti-button" border="0" cellpadding="0" cellspacing="0" width="" style="border-collapse:separate!important;background:#43c9f0;border-radius:5px;border:0;margin:0 auto;table-layout:fixed" align="left">
                              <tbody><tr>
                                <td style="padding:12px 20px" align="center">
                                  <a href="https://forms.gle/XJUP4coPgkVwNc9E8" target="_blank" style="font-size:14px;display:block;color:#ffffff;text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">피드백 주러가기</a>
                                </td>
                              </tr></tbody>
                            </table>
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
                                    (주)나인에이엠 / 서울시 마포구 독막로 331 마스터즈타워 2501 / 고객센터 <a href="tel:070-8819-4308" style="color:#43c9f0" target="_blank"><font color="#43c9f0">070-8819-4308</font></a> / 이메일 <a href="mailto:contact@crowdticket.kr" style="color:#43c9f0;text-decoration:underline" target="_blank">contact@crowdticket.kr</a> / 카카오톡 <a href="http://pf.kakao.com/_JUxkxjM/chat" style="color:#43c9f0;text-decoration:underline">@크라우드티켓</a>
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
      </html>`
      
    }
  },
 email_store_order_rejected: {
  subject: ' [크티] 콘텐츠 요청이 반려됐습니다.',
  html: function(store_manager_name, order_name, item_title, refund_reason){
   return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
   <html xmlns="http://www.w3.org/1999/xhtml">
     <head>
       <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
       <style>
         event-emphasize{
           font-weight: 900;
           color: #43c9f0;
         }
         
         emphasize{
           font-weight: bold;
         }
       </style>
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
                         <div style="text-align:left">요청하신 콘텐츠가<br/>반려됐습니다</div>
                       </td>
                     </tr></tbody>
                   </table>
                   <table class="email-content" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:32px 0px;width:100%;max-width:630px;clear:both;background:none">
                     <tr>
                       <td>
                         <table class="info-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;width:100%;height:60px;padding:0px;align:center;background-color:#f9f9f9">
                           <tr>
                             <td style="padding:20px;text-align:center;font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:normal;letter-spacing:normal;color:#262626;word-break:keep-all">
                               죄송합니다, <span style="font-weight:900;color:#43c9f0">${store_manager_name}</span>에게 보낸 ${item_title} 요청이 반려되었어요 &#x1F622;
                             </td>
                           </tr>
                         </table>
                         <table class="attention" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;width:100%;height:24px;padding:12px;margin:8px 0 24px auto;align:left;background-color:#ecf9fd;border-left:4px solid #43c9f0">
                           <tr>
                             <td height="24px" width="24px" style="padding:0px;border:0px">
                               <img src="https://crowdticket0.s3-ap-northeast-1.amazonaws.com/admin/mail/rebrand/ic-circle-error-fill-24@3x.png" alt="!" style="width:24px;height:24px;margin-right:8px;display:block;border-width:0px"/>
                             </td>
                             <td style="align:left;vertical-align:middle;padding:3px 0px;font-family:'Noto Sans KR',sans-serif;font-size:12px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:normal;letter-spacing:normal;color:#212121;word-break:keep-all">
                               콘텐츠를 주문하며 결제하신 금액은 자동 환불처리됩니다. (최대 2~3일 소요)
                             </td>
                           </tr>
                         </table>
                         <table class="explain-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                           <tr>
                             <td style="padding:0px 0px;font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757;word-break:keep-all">
                               <div style="text-align:left">크티 콘텐츠 상점을 이용해주셔서 감사합니다. 요청해주신 ${item_title} 아쉽게도 반려되었습니다.<br/><br/><b>반려사유: ${refund_reason}</div>
                             </td>
                           </tr>
                         </table>
                         <hr width="100%" size="1px" align="center" color="#ebebeb" style="margin:24px 0px 24px 0px"/>
                         <table class="explain-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0;width:100%;max-width:630px;clear:both;background:none">
                           <tr>
                             <td style="padding:0px 0px;font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757;word-break:keep-all">
                               <div style="text-align:left">반려된 이유에 맞춰서 요청 내용을 수정해서 다시 보내주시면 다음에는 ${order_name}님을 위한 맞춤 콘텐츠를 받아보실 수 있을거예요. 콘텐츠 상점에는 다른 상품들도 있으니 다시한번 이용해주세요. &#x1F603;</div>
                             </td>
                           </tr>
                         </table>
                       </td>
                     </tr>
                   </table>
                   <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                     <tbody><tr>
                       <td style="padding:0 0;border:0px" width="100%">
                         <table class="cti-button" border="0" cellpadding="0" cellspacing="0" width="" style="border-collapse:separate!important;background:#43c9f0;border-radius:5px;border:0;margin:0 auto;table-layout:fixed" align="left">
                           <tbody><tr>
                             <td style="padding:12px 20px" align="center">
                               <a href="https://crowdticket.kr/store" target="_blank" style="font-size:14px;display:block;color:#ffffff;text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">다시 콘텐츠 상점으로</a>
                             </td>
                           </tr></tbody>
                         </table>
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
                                 (주)나인에이엠 / 서울시 마포구 독막로 331 마스터즈타워 2501호 / 고객센터 <a href="tel:070-8819-4308" style="color:#43c9f0" target="_blank"><font color="#43c9f0">070-8819-4308</font></a> / 이메일 <a href="mailto:contact@crowdticket.kr" style="color:#43c9f0;text-decoration:underline" target="_blank">contact@crowdticket.kr</a> / 카카오톡 <a href="http://pf.kakao.com/_JUxkxjM/chat" style="color:#43c9f0;text-decoration:underline">@크라우드티켓</a>
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
   `;
  }
 },
 email_store_order_approved: {
  subject: '[크티] 크리에이터가 콘텐츠 요청을 승인했어요!',
  html: function(store_manager_name, order_name, item_title, user_id){
   return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
   <html xmlns="http://www.w3.org/1999/xhtml">
     <head>
       <meta content="text/html; charset=UTF-8" />
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
                         <div style="text-align:left">요청하신 콘텐츠가<br/>곧 준비됩니다</div>
                       </td>
                     </tr></tbody>
                   </table>
                   <table class="email-content" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:32px 0px;width:100%;max-width:630px;clear:both;background:none">
                     <tr>
                       <td>
                         <table class="info-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;width:100%;height:60px;padding:0px;margin:0 0 24px 0;align:center;background-color:#f9f9f9">
                           <tr>
                             <td style="padding:20px;text-align:center;font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:normal;letter-spacing:normal;color:#262626;word-break:keep-all">
                             &#x1F389; <span style="font-weight:900;color:#43c9f0">${order_name}</span>님이 <span style="font-weight:900;color:#43c9f0">${store_manager_name}</span>에게 보낸 요청이 승인됐습니다!
                             </td>
                           </tr>
                         </table>
                         <table class="explain-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                           <tr>
                             <td style="padding:0px 0px;font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757;word-break:keep-all">
                               <div style="text-align:left">지금부터 크리에이터가 ${item_title} 제작을 시작합니다. 콘텐츠는 주문일로부터 최대 14일 이내에 준비됩니다. 콘텐츠 전달이 준비되는대로 다시 안내를 드릴게요!<br/><br/>요청하신 콘텐츠의 내용과 진행상태를 보려면 아래 버튼을 통해 '나의 콘텐츠'에서 확인해주세요.</div>
                             </td>
                           </tr>
                         </table>
                       </td>
                     </tr>
                   </table>
                   <table class="button-block" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                     <tbody><tr>
                       <td style="padding:0 0;border:0px" width="100%">
                         <table class="cti-button" border="0" cellpadding="0" cellspacing="0" width="" style="border-collapse:separate!important;background:#43c9f0;border-radius:5px;border:0;margin:0 auto;table-layout:fixed" align="left">
                           <tbody><tr>
                             <td style="padding:12px 20px" align="center">
                               <a href="https://crowdticket.kr/users/store/${user_id}/orders" target="_blank" style="font-size:14px;display:block;color:#ffffff;text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">나의 콘텐츠로 이동</a>
                             </td>
                           </tr></tbody>
                         </table>
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
                                 (주)나인에이엠 / 서울시 마포구 독막로 331 마스터즈타워 2501호 / 고객센터 <a href="tel:070-8819-4308" style="color:#43c9f0" target="_blank"><font color="#43c9f0">070-8819-4308</font></a> / 이메일 <a href="mailto:contact@crowdticket.kr" style="color:#43c9f0;text-decoration:underline" target="_blank">contact@crowdticket.kr</a> / 카카오톡 <a href="http://pf.kakao.com/_JUxkxjM/chat" style="color:#43c9f0;text-decoration:underline">@크라우드티켓</a>
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
  }
 },
 email_store_order_requested: {
  subject: '[크티] 콘텐츠 주문 내용을 확인해주세요.',
  html: function(user_id, order_name, item_title, item_price, created_at, requestContent){
   return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
   <html xmlns="http://www.w3.org/1999/xhtml">
     <head>
       <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
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
                         <div style="text-align:left">콘텐츠가<br/>요청됐습니다!</div>
                       </td>
                     </tr></tbody>
                   </table>
                   <table class="email-content" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:32px 0px;width:100%;max-width:630px;clear:both;background:none">
                     <tr>
                       <td>
                         <table class="explain-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                           <tr>
                             <td style="padding:0px 0px;font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757;word-break:keep-all">
                               <div style="text-align:left">크티 콘텐츠 상점을 이용해주셔서 감사합니다.<br/><b>${order_name}</b>님이 주문하신 내용은 다음과 같습니다.</div>
                             </td>
                           </tr>
                         </table>
                         <table class="paragraph-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:24px 0;width:100%;max-width:630px;clear:both;background:none">
                           <tbody><tr>
                             <td style="font-family:'Noto Sans KR','NotoSansCJKkr',sans-serif;font-size:16px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:normal;letter-spacing:normal;color:#212121">
                               <div style="text-align:left">주문내역</div>
                             </td>
                           </tr></tbody>
                         </table>
                         <table class="order-details" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin-bottom:24px;padding:24px 0;width:100%;max-width:590px;clear:both;background:none;border-collapse:collapse">
                           <tr height="44px" style="border-top:2px solid #43c8ef; border-bottom:1px solid #e8e8e8">
                             <td width="65px" style="background-color: rgba(67, 200, 239, 0.1); padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               상품명
                             </td>
                             <td style="padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               ${item_title}
                             </td>
                           </tr>
                           <tr height="44px" style="border-bottom:1px solid #e8e8e8">
                             <td width="65px" style="background-color: rgba(67, 200, 239, 0.1); padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               결제금액
                             </td>
                             <td style="padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               ${item_price}원
                             </td>
                           </tr>
                           <tr height="44px" style="border-bottom:1px solid #e8e8e8">
                             <td width="65px" style="background-color: rgba(67, 200, 239, 0.1); padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               구매자 명
                             </td>
                             <td style="padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                              ${order_name}
                             </td>
                           </tr>
                           <tr height="44px" style="border-bottom:1px solid #e8e8e8">
                             <td width="65px" style="background-color: rgba(67, 200, 239, 0.1); padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               요청일시
                             </td>
                             <td style="padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               ${created_at}
                             </td>
                           </tr>
                           <tr height="44px" style="border-bottom:1px solid #e8e8e8">
                             <td width="65px" style="background-color: rgba(67, 200, 239, 0.1); padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               요청내용
                             </td>
                             <td style="padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                              ${requestContent}
                             </td>
                           </tr>
                         </table>
                         <table class="explain-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                           <tr>
                             <td style="padding:0px 0px;font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757;word-break:keep-all">
                               <div style="text-align:left">요청한 콘텐츠는 주문일로부터 7일 이내에 크리에이터가 승인한 후 제작을 시작합니다. 요청사항이 부적절하거나 크리에이터의 사정에 의해 콘텐츠 전달이 어려운 경우 요청이 반려될 수 있습니다. 자세한 내용은 크티 사이트 내의 상세 주문내용을 확인해주세요.</div>
                             </td>
                           </tr>
                         </table>
                       </td>
                     </tr>
                   </table>
                   <table class="cti-button" border="0" cellpadding="0" cellspacing="0" width="" style="border-collapse:separate!important;background:#43c9f0;border-radius:5px;border:0;margin:0 auto;table-layout:fixed" align="left">
                     <tbody><tr>
                       <td style="padding:12px 20px" align="center">
                         <a href="https://crowdticket.kr/users/store/${user_id}/orders" target="_blank" style="font-size:14px;display:block;color:#ffffff;text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">나의 콘텐츠로 이동</a>
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
                                 (주)나인에이엠 / 서울시 마포구 독막로 331 마스터즈타워 2501호 / 고객센터 <a href="tel:070-8819-4308" style="color:#43c9f0" target="_blank"><font color="#43c9f0">070-8819-4308</font></a> / 이메일 <a href="mailto:contact@crowdticket.kr" style="color:#43c9f0;text-decoration:underline" target="_blank">contact@crowdticket.kr</a> / 카카오톡 <a href="http://pf.kakao.com/_JUxkxjM/chat" style="color:#43c9f0;text-decoration:underline">@크라우드티켓</a>
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
  }
 },
 email_store_creator_order: {
  subject: '[크티] 콘텐츠 주문이 들어왔어요!',
  html: function(store_manager_name, order_nick_name, item_title, total_price, created_at, requestContent){
   return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
   <html xmlns="http://www.w3.org/1999/xhtml">
     <head>
       <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
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
                         <div style="text-align:left">팬으로부터의<br/>콘텐츠 주문이 도착했어요!</div>
                       </td>
                     </tr></tbody>
                   </table>
                   <table class="email-content" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:32px 0px;width:100%;max-width:630px;clear:both;background:none">
                     <tr>
                       <td>
                         <table class="explain-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                           <tr>
                             <td style="padding:0px 0px;font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757;word-break:keep-all">
                               <div style="text-align:left">크티 콘텐츠 상점을 통해서<br/>${store_manager_name}님의 콘텐츠 구매요청이 들어왔습니다.</div>
                             </td>
                           </tr>
                         </table>
                         <table class="paragraph-title" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:24px 0;width:100%;max-width:630px;clear:both;background:none">
                           <tbody><tr>
                             <td style="font-family:'Noto Sans KR','NotoSansCJKkr',sans-serif;font-size:16px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:normal;letter-spacing:normal;color:#212121">
                               <div style="text-align:left">주문내역</div>
                             </td>
                           </tr></tbody>
                         </table>
                         <table class="order-details" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin-bottom:24px;padding:24px 0;width:100%;max-width:590px;clear:both;background:none;border-collapse:collapse">
                           <tr height="44px" style="border-top:2px solid #43c8ef; border-bottom:1px solid #e8e8e8">
                             <td width="65px" style="background-color: rgba(67, 200, 239, 0.1); padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               상품명
                             </td>
                             <td style="padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               ${item_title}
                             </td>
                           </tr>
                           <tr height="44px" style="border-bottom:1px solid #e8e8e8">
                             <td width="65px" style="background-color: rgba(67, 200, 239, 0.1); padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               구매금액
                             </td>
                             <td style="padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               ${total_price}원
                             </td>
                           </tr>
                           <tr height="44px" style="border-bottom:1px solid #e8e8e8">
                             <td width="65px" style="background-color: rgba(67, 200, 239, 0.1); padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               구매자
                             </td>
                             <td style="padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                              ${order_nick_name}
                             </td>
                           </tr>
                           <tr height="44px" style="border-bottom:1px solid #e8e8e8">
                             <td width="65px" style="background-color: rgba(67, 200, 239, 0.1); padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               신청일시
                             </td>
                             <td style="padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               ${created_at}
                             </td>
                           </tr>
                           <tr height="44px" style="border-bottom:1px solid #e8e8e8">
                             <td width="65px" style="background-color: rgba(67, 200, 239, 0.1); padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:bold;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               요청사항
                             </td>
                             <td style="padding: 10px 16px 10px 16px; text-align:left; font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:500;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757">
                               ${requestContent}
                             </td>
                           </tr>
                         </table>
                         <table class="explain-paragraph" border="0" cellpadding="0" cellspacing="0" style="overflow:hidden;margin:0px auto;padding:0px;width:100%;max-width:630px;clear:both;background:none">
                          <tr>
                            <td style="padding:0px 0px;font-family:'Noto Sans KR',sans-serif;font-size:14px;font-weight:normal;font-stretch:normal;font-style:normal;line-height:1.71;letter-spacing:normal;color:#575757;word-break:keep-all">
                              <div style="text-align:left">들어온 콘텐츠 요청에 대해 주문 승인 여부를 선택해주세요! 아래 버튼을 통해 상점 관리 페이지로 이동하여 지금까지 요청된 콘텐츠들을 관리할 수 있습니다.<br/><br/>이후 완성된 콘텐츠는 상점 관리 페이지에서 바로 업로드하여 구매자에게 전달하실 수 있습니다. 콘텐츠 전달 방법에 대해 도움이 필요하실 경우 언제든지 이메일 하단의 연락처로 문의주세요.</div>
                            </td>
                          </tr>
                         </table>
                       </td>
                     </tr>
                   </table>
                   <table class="cti-button" border="0" cellpadding="0" cellspacing="0" width="" style="border-collapse:separate!important;background:#43c9f0;border-radius:5px;border:0;margin:0 auto;table-layout:fixed" align="left">
                     <tbody><tr>
                       <td style="padding:12px 20px" align="center">
                         <a href="https://crowdticket.kr/manager/store" target="_blank" style="font-size:14px;display:block;color:#ffffff;text-decoration:none;font-family:'Noto Sans KR',sans-serif;text-align:center">상점 관리 페이지로 이동</a>
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
                                 (주)나인에이엠 / 서울시 마포구 독막로 331 마스터즈타워 2501호 / 고객센터 <a href="tel:070-8819-4308" style="color:#43c9f0" target="_blank"><font color="#43c9f0">070-8819-4308</font></a> / 이메일 <a href="mailto:contact@crowdticket.kr" style="color:#43c9f0;text-decoration:underline" target="_blank">contact@crowdticket.kr</a> / 카카오톡 <a href="http://pf.kakao.com/_JUxkxjM/chat" style="color:#43c9f0;text-decoration:underline">@크라우드티켓</a>
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
  }
 }
}