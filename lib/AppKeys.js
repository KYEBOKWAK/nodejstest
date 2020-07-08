//저장된 state_app 값
//STATE_APP_NONE = "STATE_APP_NONE"; //초기 상태
module.exports = {
  //MAIN STATE START
STATE_APP_NONE: "STATE_APP_NONE", //빈상태
STATE_APP_INIT: "STATE_APP_INIT", //초기 상태
STATE_APP_LOGIN: "STATE_APP_LOGIN", //로그인 화면
STATE_APP_LOGIN_EMAIL: "STATE_APP_LOGIN_EMAIL", //이메일 로그인
STATE_APP_JOIN_EMAIL: "STATE_APP_JOIN_EMAIL", //이메일 회원가입
STATE_APP_EMAIL_CHECK: "STATE_APP_EMAIL_CHECK", //이메일 체크

STATE_APP_PHONE_CHECK: "STATE_APP_PHONE_CHECK", //폰 체크
STATE_APP_PHONE_VALID_CHECK: "STATE_APP_PHONE_VALID_CHECK", //폰 체크
STATE_APP_USER_NAME: "STATE_APP_USER_NAME", //유저 이름

STATE_APP_TERMS_AGREE: "STATE_APP_TERMS_AGREE", //이용 약관 동의

// STATE_APP_INTRO_MAIN: "STATE_APP_INTRO_MAIN",  //mainview가기 전 인트로 뷰  //로딩화면에 타입으로 간다.

STATE_APP_MAIN: "STATE_APP_MAIN",
//MAIN STATE END

//HOME STATE START
//GNB TOP KEY
STATE_HOME_KEY_FEED: 'STATE_HOME_KEY_FEED',
STATE_HOME_KEY_MEETUP: 'STATE_HOME_KEY_MEETUP',
STATE_HOME_KEY_MEET: 'STATE_HOME_KEY_MEET',
STATE_HOME_KEY_EVENT: 'STATE_HOME_KEY_EVENT',
STATE_HOME_KEY_TICKET: 'STATE_HOME_KEY_TICKET',
//HOME STATE END

//click detail project
PAGE_KEY_DETAIL_PROJECT: 'PAGE_KEY_DETAIL_PROJECT',
PAGE_KEY_DETAIL_COMMENT: 'PAGE_KEY_DETAIL_COMMENT',

PAGE_KEY_DETAIL_COMMENT_MANNAYO: 'PAGE_KEY_DETAIL_COMMENT_MANNAYO',

PAGE_KEY_EVENT_SELECT_VIEW: 'PAGE_KEY_EVENT_SELECT_VIEW',
PAGE_KEY_PAY_VIEW: 'PAGE_KEY_PAY_VIEW',
PAGE_KEY_PAY_WEB_VIEW: 'PAGE_KEY_PAY_WEB_VIEW',
PAGE_KEY_POST_CODE_VIEW: 'PAGE_KEY_POST_CODE_VIEW',
PAGE_KEY_PAY_COMPLITE_VIEW: 'PAGE_KEY_PAY_COMPLITE_VIEW',
PAGE_KEY_SURVEY_DETAIL_VIEW: 'PAGE_KEY_SURVEY_DETAIL_VIEW',

PAGE_KEY_MORE_MANNAYO_VIEW: 'PAGE_KEY_MORE_MANNAYO_VIEW',

PAGE_KEY_MANNAYO_DETAIL_VIEW: 'PAGE_KEY_MANNAYO_DETAIL_VIEW',
//

PAGE_KEY_COMMENTS_COMMENT_VIEW: 'PAGE_KEY_COMMENTS_COMMENT_VIEW',

PAGE_KEY_CREATE_MANNAYO_COVER_VIEW: 'PAGE_KEY_CREATE_MANNAYO_COVER_VIEW',

PAGE_KEY_CREATE_MANNAYO_WHO_FIND_CREATOR_VIEW: 'PAGE_KEY_CREATE_MANNAYO_WHO_FIND_CREATOR_VIEW',

PAGE_KEY_FIND_VIEW: 'PAGE_KEY_FIND_VIEW',

PAGE_KEY_CREATE_INPUT_CHANNEL_FIND_VIEW: 'PAGE_KEY_CREATE_INPUT_CHANNEL_FIND_VIEW',

PAGE_KEY_CREATE_MANNAYO_SELECT_VIEW: 'PAGE_KEY_CREATE_MANNAYO_SELECT_VIEW',

PAGE_KEY_CREATE_MANNAYO_SELECT_LOCATION_VIEW: 'PAGE_KEY_CREATE_MANNAYO_SELECT_LOCATION_VIEW',

PAGE_KEY_CREATE_MANNAYO_WHAT_VIEW: 'PAGE_KEY_CREATE_MANNAYO_WHAT_VIEW',

PAGE_KEY_CREATE_MANNAYO_EXAMPLE_VIEW: 'PAGE_KEY_CREATE_MANNAYO_EXAMPLE_VIEW',

PAGE_KEY_MANNAYO_OVERLAP_POPUP_VIEW: 'PAGE_KEY_MANNAYO_OVERLAP_POPUP_VIEW',

PAGE_KEY_MANNAYO_LIST_POPUP_VIEW: 'PAGE_KEY_MANNAYO_LIST_POPUP_VIEW',

PAGE_KEY_MY_PROFILE_EDIT_VIEW: 'PAGE_KEY_MY_PROFILE_EDIT_VIEW',

PAGE_KEY_MY_PROFILE_RECEIPT_VIEW: 'PAGE_KEY_MY_PROFILE_RECEIPT_VIEW',

PAGE_KEY_MEETUP_LIST_POPUP_VIEW: 'PAGE_KEY_MEETUP_LIST_POPUP_VIEW',
}