module.exports = {
  file_upload_target_type: {
    orders_items: 'orders_items',
    items: 'items',
    product_file: 'product_file'
  },
  store_home_item_list: {
    POPUALER: 'POPUALER',
    NEW_UPDATE: 'NEW_UPDATE',
    IN_ITEM: 'IN_ITEM'
  },
  item_state: {
    SALE: 0,
    SALE_STOP: 1,
    SALE_PAUSE: 2,
    SALE_LIMIT: 3
  },
  save_img: {
    user: 'SAVE_IMG_USER',
    item: 'SAVE_IMG_ITEM',
  },
  store:{
    STATE_READY: 1,
    STATE_READY_AFTER_FUNDING: 2,
    STATE_UNDER_INVESTIGATION: 3,
    STATE_APPROVED: 4,
  },
  main_thumb: {
    THUMBNAIL_TYPE_RECOMMEND: 1, //크라우드 티켓 추천 썸네일
    THUMBNAIL_TYPE_CROLLING: 2, //크라우드 티켓 크롤링 썸네일
    THUMBNAIL_TYPE_MAGAZINE: 3, //크라우드 티켓 매거진 썸네일
    THUMBNAIL_TYPE_RECOMMENT_SANDBOX_EVENT: 4 //추천 썸네일, 이벤트성(예:샌드박스 추석 
  },
  login: {
    email: "email",
    facebook: "facebook",
    google: "google",
    kakao: "kakao",
    apple: "apple"
  },
  comment: {
    pageType: {
      detail: 'detail',
      moreList: 'moreList',
      commentsComment: 'commentsComment'
    },
    commentable_type: [
      {
        key: 'project',
        value: "App\\Models\\Project"
      },
      {
        key: 'comment',
        value: "App\\Models\\Comment"
      },
      {
        key: 'mannayo',
        value: "App\\Models\\Meetup"
      },
      {
        key: 'store',
        value: "App\\Models\\Store"
      }
    ],
    second_target_type: [
      {
        key: 'store_order',
        value: 'App\\Models\\Store_order'
      }
    ]
  },
  toastMessage: {
    TOAST_TYPE_NONE: 0,
    TOAST_TYPE_CONNECT_TICKETING: 1
  },
  mannayo_sort:{
    MANNAYO_SORT_TYPE_POPUALER: "MANNAYO_SORT_TYPE_POPUALER",
    MANNAYO_SORT_TYPE_NEW: "MANNAYO_SORT_TYPE_NEW"
  },
  project: {
    STATE_READY: 1,
    STATE_READY_AFTER_FUNDING: 2,
    STATE_UNDER_INVESTIGATION: 3,
    STATE_APPROVED: 4,

    EVENT_TYPE_DEFAULT: 0, //기본 타입
    EVENT_TYPE_INVITATION_EVENT: 1,   //이벤트 타입(초대권)
    EVENT_TYPE_CRAWLING: 2,  //크롤링된 이벤트
    EVENT_TYPE_PICK_EVENT: 3,  //pick 이벤트
    EVENT_TYPE_CUSTOM: 4,  //커스텀하게 특정 alias 프로젝트로 구분해서 사용한다.
    EVENT_TYPE_GROUP_BUY: 5,

    EVENT_TYPE_SUB_SANDBOX_PICK: 1,  //샌드박스 전용 pick 이벤트
    EVENT_TYPE_SUB_SECRET_PROJECT: 2,//URL 통해서만 들어올 수 있는 프로젝트. 더보기에 공개 안됨
    EVENT_TYPE_SUB_Woongjin_play_city: 3,

    PICK_STATE_NONE: 0,  //pick 상태
    PICK_STATE_PICKED: 1,  //pick 완료 상태

    IS_PAY_DEFAULT: 0, //기본값
    IS_PAY_ACCOUNT: 1, //무통장 계좌이체 추가 옵션(루디 이슈)
  },
  order: {
    ORDER_STATE_STAY: 0, //결제 대기 상태 예전 주문정보고 있기 때문에 스탠바이 state를 별도 추가
    ORDER_STATE_PAY: 1,   //결제 혹은 결제대기
    ORDER_STATE_PAY_NO_PAYMENT: 2,   //order 는 들어갔지만, 결제 프로세를 안탐
    ORDER_STATE_PAY_SCHEDULE: 3,
    ORDER_STATE_PAY_SCHEDULE_RESULT_FAIL: 4,
    ORDER_STATE_PAY_SUCCESS_NINETY_EIGHT: 5, //98번 오더인데 결제 떨어짐.
    //ORDER_STATE_PAY_SUCCESS_SCHEDULE_NINETY_EIGHT: 6,
    ORDER_STATE_PAY_ACCOUNT_STANDBY: 6,
    ORDER_STATE_PAY_ACCOUNT_SUCCESS: 7,
    
    ORDER_STATE_APP_PAY_WAIT: 8, //앱 결제 진행시, 스탠바이. //30분 동안 결제 처리가 되지 않으면 자동 취소
    ORDER_STATE_APP_PAY_COMPLITE: 9,  //앱 결제 완료
    ORDER_STATE_APP_PAY_IAMPORT_WEBHOOK_VERIFY_COMPLITE: 10,  //앱 2차 iamport webhook 검증 완료
    ORDER_STATE_APP_PAY_WAIT_VBANK: 11, //가상계좌 진행시 대기

    ORDER_STATE_APP_STORE_PAYMENT: 12,    //컨텐츠 상점 결제 완료 및 대기
    ORDER_STATE_APP_STORE_READY: 13,  //컨텐츠 상점 준비단계
    ORDER_STATE_APP_STORE_SUCCESS: 14,  //컨텐츠 상점 컨텐츠 완성. 크티에 보냄
    ORDER_STATE_APP_STORE_RELAY_CUSTOMER: 15,  //컨텐츠 크티에서 고객에게 보냄
    ORDER_STATE_APP_STORE_CUSTOMER_COMPLITE: 16,  //고객 콘텐츠 확인함.

    ORDER_STATE_APP_STORE_STANBY: 17,//isp 결제 대기 상태 24시간 뒤에도 ORDER_STATE_APP_STORE_STANBY 라면 취소된다.

    ORDER_STATE_STANDBY_START: 98,
    ORDER_STATE_PAY_END: 99,
    //ORDER_STATE_SCHEDULE_PAY: 2, //예약결제 //결제 상태는 하나로 통합. 프로젝트의 타입에 따라서 구분한다.

    ORDER_STATE_CANCEL_START: 100, //취소사유는 100~200
    ORDER_STATE_PROJECT_CANCEL: 102,   //프로젝트 중도 취소
    ORDER_STATE_PROJECT_PICK_CANCEL: 103,  //추첨 안됨.
    ORDER_STATE_PAY_ACCOUNT_NO_PAY: 104,  //미입금으로 취소
    ORDER_STATE_CANCEL_ACCOUNT_PAY: 105, //계좌이체인데 고객이 취소누름.
    ORDER_STATE_CANCEL_WAIT_PAY: 106, //앱 결제 진행중 10분 초과로 인한 취소

    ORDER_STATE_CANCEL_STORE_RETURN: 107, //스토어 반려
    ORDER_STATE_CANCEL_STORE_WAIT_OVER: 108, //스토어 승인기간 만료됨

    ORDER_STATE_CANCEL: 199,//고객취소는 맨 마지막

    ORDER_STATE_HOST_SHOW_ORDER_END: 200,

    ORDER_STATE_ERROR_START: 500,
    ORDER_STATE_ERROR_PAY: 501,
    ORDER_STATE_ERROR_NO_INFO_IAMPORT: 502,
    ORDER_STATE_ERROR_TICKET_OVER_COUNT: 503,
    ORDER_STATE_ERROR_NO_PAY_NINETY_EIGHT: 504,  //98번 오더값인데 결제 정보가 없음(결제 안됨)
    ORDER_STATE_ERROR_NO_PAY_NO_IMP_INFO_NINETY_EIGHT: 505,  //98번 오더값인데 결제 정보가 없음(결제 안됨)
    ORDER_STATE_ERROR_GOODS_OVER_COUNT: 506,

    ORDER_STATE_ERROR_IAMPORT_WEBHOOK_ERROR: 507,
    ORDER_STATE_ERROR_IAMPORT_WEBHOOK_NONE: 508,  //iamport 웹훅 state가 아무값도 아닐때

    ORDER_STATE_APP_STORE_STANBY_FAIL: 509,

    ORDER_STATE_ERROR_END: 600,

    ORDER_STATE_STANDBY: 999,

    //ORDER_PROCESS_STATE_INIT: 1,
    //ORDER_PROCESS_STATE_: 2,

    ORDER_TYPE_COMMISION_WITH_COMMISION: 0,  //커미션이 있는 오더 //env값으로 뺌
    ORDER_TYPE_COMMISION_WITHOUT_COMMISION: 1, //커미션이 없는 오더

    ORDER_PAY_TYPE_CARD: 0,
    ORDER_PAY_TYPE_ACCOUNT: 1,
  },
  buyState: {
    BUY_STATE_NONE: 0,
    BUY_STATE_ONLY_TICKET : 1,
    BUY_STATE_ONLY_GOODS : 2,
    BUY_STATE_TICKET_AND_GOODS : 3,
    BUY_STATE_ONLY_SUPPORT : 4
  },
  deviceState: {
    DEVICE_PC: 0,
    DEVICE_MOBILE: 1
  },
  mannayo_list:{
    TYPE_MANNAYO_LIST_NONE: "TYPE_MANNAYO_LIST_NONE",
    TYPE_MANNAYO_LIST_MORE_BUTTON: "TYPE_MANNAYO_LIST_MORE_BUTTON",
    TYPE_MANNAYO_LIST_LIKE_MORE_BUTTON: "TYPE_MANNAYO_LIST_LIKE_MORE_BUTTON",
    TYPE_MANNAYO_LIST_FIND_MORE_BUTTON: "TYPE_MANNAYO_LIST_FIND_MORE_BUTTON",
    TYPE_MANNAYO_LIST_COLLECT_CREATOR: "TYPE_MANNAYO_LIST_COLLECT_CREATOR",
    TYPE_MANNAYO_LIST_COLLECT_MCN: "TYPE_MANNAYO_LIST_COLLECT_MCN",
    TYPE_MANNAYO_LIST_COLLECT_LOCAL: "TYPE_MANNAYO_LIST_COLLECT_LOCAL",
  },
  pay_method : {
    PAY_METHOD_TYPE_CARD: "card", //신용카드
    PAY_METHOD_TYPE_CARD_INPUT: "card_input", //신용카드 input인데 실제론 안씀
    PAY_METHOD_TYPE_VBANK: "vbank", //가상계좌
    PAY_METHOD_TYPE_PHONE: "phone" //휴대폰소액결제
  },
  like:{
    LIKE_MANNAYO: "LIKE_MANNAYO",
    LIKE_PROJECT: "LIKE_PROJECT",
    LIKE_COMMENT: "LIKE_COMMENT",
    LIKE_CHAT: "LIKE_CHAT"
  },
  project_sort: {
    PROJECT_SORT_NONE: "PROJECT_SORT_NONE"
  },
  project_list_type: {
    PROJECT_LIST_ALL: "PROJECT_LIST_ALL",
    PROJECT_LIST_TICKETING: "PROJECT_LIST_TICKETING",
    PROJECT_LIST_FIND: "PROJECT_LIST_FIND",
    PROJECT_LIST_LIKE: "PROJECT_LIST_LIKE"
  },
  res: {
    //SUCCESS RES
    RES_SUCCESS_START: 0,

    RES_SUCCESS: 1,
    RES_SUCCESS_LOGIN_SNS_ALREADY_FACEBOOK: 2,
    RES_SUCCESS_LOGIN_SNS_ALREADY_GOOGLE: 3,
    RES_SUCCESS_LOGIN_SNS_ALREADY_KAKAO: 4,
    RES_SUCCESS_LOGIN_SNS_ALREADY_APPLE: 5,

    RES_SUCCESS_END: 999,

    //ERROR RES
    RES_ERROR_START: 1000,

    RES_ERROR: 1001,
    RES_ERROR_ALREADY_EMAIL_REGISTER: 1002,
    RES_ERROR_ALREADY_SNS_REGISTER: 1003,

    RES_ERROR_END: 9999
  },
  find_email:{
    none: 'none',
    email: 'email',
    sns: 'sns',
    email_sns: "email_sns" 
  },
  directOpen: {
    MAIN_HOME: {
      NONE: 0,
      HOME: 1,
      MEETUP: 2,
      MANNAYO: 3,
      EVENT: 4
    },
    MAIN_BOTTOM: {
      NONE: 0,
      HOME: 1,
      CHAT: 2,
      ALARM: 3,
      MYPAGE: 4
    },
    PAGE: {
      NONE: 0,
      PROJECT_DETAIL: 1,
      MANNAYO_DETAIL: 2,
      MYPAGE_DETAIL: 3,
      MANNAYO_MAKE: 4,
      MY_TICKET: 5
    }
  }
  /*
  query: {
    success_start: 0,
    success: 1,
    success_end: 999,
    error_start: 1000,
    error: 1001,
    error_end: 9999
  }

  */
}