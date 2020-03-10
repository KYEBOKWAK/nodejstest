module.exports = {
  project: {
    STATE_READY: 1,
    STATE_READY_AFTER_FUNDING: 2,
    STATE_UNDER_INVESTIGATION: 3,
    STATE_APPROVED: 4,

    EVENT_TYPE_DEFAULT: 0, //기본 타입
    EVENT_TYPE_INVITATION_EVENT: 1,   //이벤트 타입(초대권)
    EVENT_TYPE_CRAWLING: 2,  //크롤링된 이벤트
    EVENT_TYPE_PICK_EVENT: 3,  //pick 이벤트

    EVENT_TYPE_SUB_SANDBOX_PICK: 1,  //샌드박스 전용 pick 이벤트
    EVENT_TYPE_SUB_SECRET_PROJECT: 2,//URL 통해서만 들어올 수 있는 프로젝트. 더보기에 공개 안됨

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

    ORDER_STATE_STANDBY_START: 98,
    ORDER_STATE_PAY_END: 99,
    //ORDER_STATE_SCHEDULE_PAY: 2, //예약결제 //결제 상태는 하나로 통합. 프로젝트의 타입에 따라서 구분한다.

    ORDER_STATE_CANCEL_START: 100, //취소사유는 100~200
    ORDER_STATE_PROJECT_CANCEL: 102,   //프로젝트 중도 취소
    ORDER_STATE_PROJECT_PICK_CANCEL: 103,  //추첨 안됨.
    ORDER_STATE_PAY_ACCOUNT_NO_PAY: 104,  //미입금으로 취소
    ORDER_STATE_CANCEL_ACCOUNT_PAY: 105, //계좌이체인데 고객이 취소누름.
    ORDER_STATE_CANCEL_M_STANBY: 106, //앱 결제 진행중 30분 초과로 인한 취소
    ORDER_STATE_CANCEL: 199,//고객취소는 맨 마지막

    ORDER_STATE_HOST_SHOW_ORDER_END: 200,

    ORDER_STATE_ERROR_START: 500,
    ORDER_STATE_ERROR_PAY: 501,
    ORDER_STATE_ERROR_NO_INFO_IAMPORT: 502,
    ORDER_STATE_ERROR_TICKET_OVER_COUNT: 503,
    ORDER_STATE_ERROR_NO_PAY_NINETY_EIGHT: 504,  //98번 오더값인데 결제 정보가 없음(결제 안됨)
    ORDER_STATE_ERROR_NO_PAY_NO_IMP_INFO_NINETY_EIGHT: 505,  //98번 오더값인데 결제 정보가 없음(결제 안됨)
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
    BUY_STATE_TICKET_AND_GOODS : 3
  },
  deviceState: {
    DEVICE_PC: 0,
    DEVICE_MOBILE: 1
  }
}