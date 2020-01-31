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
  }
}