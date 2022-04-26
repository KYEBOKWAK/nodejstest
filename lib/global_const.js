module.exports = {
  pay: {
    WAIT_STORE_ORDER_TIME_MIN: 60,
    WAIT_TIME_MIN: 10  //10분 대기 시간
  },

  except_place_id: 1428,
  except_place_id_otherstore: 889 //해당 크리에이터는 다른 콘텐츠 상품도 둘러보세요만 제외 한다. 추후 except_place_id과 같이 기능적으로 분리 한다. 일단 임시 코드
}