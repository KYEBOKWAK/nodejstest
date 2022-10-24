var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var Types = use('lib/types.js');
const res_state = use('lib/res_state.js');

const moment_timezone = require('moment-timezone');
moment_timezone.tz.setDefault("Asia/Seoul");

const global = use('lib/global_const.js');

var mysql = require('mysql');

function isAdmin(user_id, callBack) {
  if(!user_id){
    return callBack(false);
  }
  const querySelect = mysql.format("SELECT id FROM admins WHERE user_id=?", [user_id]);
  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return callBack(false);
    }

    return callBack(true);
  })
}

//플레이스 주인인지 확인한다.
function isPlaceMaster(user_id, store_id, callBack){
  if(!user_id || !store_id){
    return callBack(false);
  }

  const querySelect = mysql.format("SELECT id FROM stores WHERE id=? AND user_id=?", [store_id, user_id]);

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return callBack(false);
    }

    const data = result[0];
    if(store_id === data.id){
      //플레이스 주인이 맞다;
      return callBack(true);
    }else{
      //플레이스 id와 data id가 다르면 현재 설정된 플레이스 주인이 아니다.
      return callBack(false);
    }
  })
}

//포스트의 다음 PAGE ID값을 가져온다.
function getNextPostPageID(store_id, callBack){
  const selectQuery = mysql.format("SELECT id, page_id FROM posts WHERE store_id=? ORDER BY page_id DESC LIMIT 1", [store_id]);

  db.SELECT(selectQuery, {}, (result) => {
    let next_page_id = 0;
    if(!result || result.length === 0){
      next_page_id = 1;
    }else{
      const data = result[0];
      next_page_id = data.page_id + 1;
    }

    return callBack(next_page_id);
  })
}

function insertPostAddItem(post_id, select_item_id_list, callBack=()=>{}){

  if(select_item_id_list.length === 0){
    return callBack();
  }

  const nowDate = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

  let _insertQueryArray = [];
  let _insertOptionArray = [];

  for(let i = 0 ; i < select_item_id_list.length ; i++){
    const data = select_item_id_list[i];
    let queryObject = {
      key: i,
      value: "INSERT INTO posts_items SET ?;"
    }

    let insertObject = {
      key: i,
      value: {
        post_id: post_id,
        item_id: data.id,
        created_at: nowDate
      }
    }

    _insertQueryArray.push(queryObject);
    _insertOptionArray.push(insertObject);
  }

  db.INSERT_MULITPLEX(_insertQueryArray, _insertOptionArray, (result) => {
    return callBack();
  }, (error) => {
    return callBack();
  })
}

function insertPost(user_id, store_id, title, story, state, select_item_id_list, callBack = (isSuccess, page_id, fail_message = '') => {}){

  getNextPostPageID(store_id, (next_page_id) => {
    // let state = Types.post.none;
    // if(isSecret){
    //   state = Types.post.secret
    // }

    const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

    const postData = {
      page_id: next_page_id,
      user_id: user_id,
      store_id: store_id,
      donation_id: null,  //생각해보니 이거 필요 없음.. 나중에 빼야지
      state: state,
      title: title,
      story: story,
      created_at: date,
      updated_at: date
    }

    db.INSERT("INSERT INTO posts SET ?", postData, 
    (result) => {
      insertPostAddItem(result.insertId, select_item_id_list, () => {
        return callBack(true, next_page_id, '');
      })
    }, (error) => {
      return callBack(false, 0,'포스트 추가 실패(1)');
    })
  });
}

function updatePostAddItem(post_id, update_delete_place_item_info_list, update_add_place_item_info_list, callBackSuccess=()=>{}, callBackError=()=>{}){
  if(update_delete_place_item_info_list.length === 0){
    insertPostAddItem(post_id, update_add_place_item_info_list, () => {
      return callBackSuccess();
    })
  }else{
    db.DELETE("DELETE FROM posts_items WHERE post_id=? AND item_id IN (?)", [post_id, update_delete_place_item_info_list], (result_delete) => {
  
      insertPostAddItem(post_id, update_add_place_item_info_list, () => {
        return callBackSuccess();
      })
    }, (error_result_delete) => {
      return callBackError('상품 삭제 에러');
    });
  }
}

function updatePost(post_id, title, story, state, update_delete_place_item_info_list, update_add_place_item_info_list, callBack = (isSuccess, fail_message = '') => {}){

  updatePostAddItem(post_id, update_delete_place_item_info_list, update_add_place_item_info_list, () => {
    const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

    const postData = {
      state: state,
      title: title,
      story: story,
      updated_at: date
    }

    db.UPDATE("UPDATE posts SET ? WHERE id=?", [postData, post_id], 
    (result) => {
      return callBack(true, '');
    }, (error) => {
      return callBack(false, '포스트 업데이트 실패(2)');
    })
    
  }, (error_message) => {
    return callBack(false, error_message);
  })
}

function setNullDonationPostID(post_id, callBack = (isSuccess, fail_message = '') => {}){
  db.UPDATE("UPDATE orders_donations SET post_id=? WHERE post_id=?", [null, post_id], 
  (result) => {
    return callBack(true, '');
  }, (error) => {
    return callBack(false, '후원 post ID 값 null 셋팅 실패');
  })
}

function deletePostAddItems(post_id, callBack = (isSuccess, fail_message = '') => {}) {
  db.DELETE("DELETE FROM posts_items WHERE post_id=?", [post_id], 
  (result) => {
    return callBack(true, '');
  }, (error) => {
    return callBack(false, 'post item 삭제 실패');
  })
}

function deleteLikes(post_id, callBack = (isSuccess, fail_message = '') => {}){
  db.DELETE("DELETE FROM likes WHERE target_id=? AND like_type=?", [post_id, Types.like.LIKE_POST], 
  (result) => {
    return callBack(true, '');
  }, (error) => {
    return callBack(false, 'post like 삭제 실패');
  })
}

function deletePost(post_id, callBack = (isSuccess, fail_message = '') => {}){
  //코멘트를 검색해서 삭제 해준다.

  //좋아요 검색해서 삭제 해준다.
  deletePostAddItems(post_id, (isSuccess, fail_message) => {
    if(!isSuccess){
      return callBack(isSuccess, fail_message);
    }

    deleteLikes(post_id, (isSuccess, fail_message) => {
      if(!isSuccess){
        return callBack(isSuccess, fail_message);
      }
  
      deletePostComment(post_id, (isSuccess, fail_message) => {
        if(!isSuccess){
          return callBack(isSuccess, fail_message);
        }
    
        setNullDonationPostID(post_id, (isSuccess, fail_message) => {
          if(!isSuccess){
            return callBack(isSuccess, fail_message);
          }
          
          db.DELETE("DELETE FROM posts WHERE id=?", post_id, 
          (result) => {
            return callBack(true, '');
          }, (error) => {
            return callBack(false, '포스트 삭제 실패');
          })
          
        })
      })
    })
  })  
}

function deletePostComment(post_id, callBack = (isSuccess, fail_message = '') => {}){

  let selectQueryComments = mysql.format("SELECT id FROM comments WHERE commentable_id=? AND commentable_type=?", [post_id, 'App\\Models\\Post']);

  db.SELECT(selectQueryComments, {}, (result_basic_comment_list) => {
    // console.log(result_basic_comment_list);
    if(!result_basic_comment_list || result_basic_comment_list.length === 0){
      return callBack(true, '');
    }

    let comment_parent_id_list = [];
    for(let i = 0 ; i < result_basic_comment_list.length ; i++){
      const data = result_basic_comment_list[i];
      comment_parent_id_list.push(data.id);
    }

    db.DELETE("DELETE FROM comments WHERE commentable_type='App\\\\Models\\\\Comment' AND commentable_id IN (?)", [comment_parent_id_list], (result_comments_comment) => {
      db.DELETE("DELETE FROM comments WHERE commentable_type='App\\\\Models\\\\Post' AND id IN (?)", [comment_parent_id_list], (result_comment) => {
        return callBack(true, '');
      }, (error_comment) => {
        return callBack(false, '포스트 코멘트 삭제 실패(2)');
      })
    }, (error_comments_comment) => {
      return callBack(false, '포스트 코멘트 삭제 실패(1)');
    })
  })
}

router.post("/write/init", function(req, res){
  const user_id = req.body.data.user_id;
  // const store_user_id = req.body.data.store_user_id;
  const store_id = req.body.data.store_id;

  isPlaceMaster(user_id, store_id, (isPlaceMaster) => {
    if(isPlaceMaster){
      //플레이스 주인이다.
      return res.json({
        result: {
          state: res_state.success,
          isInit: true,
          isAdmin: false
        }
      })
    }else {
      //플레이스 주인이 아니다. admin인지 확인한다.
      isAdmin(user_id, (isAdmin) => {
        if(isAdmin){
          // console.log('근데 어디민임');
          //주인은 아닌데 admin이면 고고
          return res.json({
            result: {
              state: res_state.success,
              isInit: true,
              isAdmin: true
            }
          })
        }else{
          return res.json({
            result: {
              state: res_state.success,
              isInit: false,
              isAdmin: false
            }
          })
        }
      })
    }
  })
})

router.post("/write", function(req, res){
  const user_id = req.body.data.user_id;
  const store_user_id = req.body.data.store_user_id;
  const store_id = req.body.data.store_id;
  const title = req.body.data.title;
  const story = req.body.data.story;

  const state = req.body.data.state;

  const select_item_id_list = req.body.data.select_item_id_list;

  isPlaceMaster(user_id, store_id, (isPlaceMaster) => {
    if(isPlaceMaster){
      //플레이스 주인이다.
      insertPost(user_id, store_id, title, story, state, select_item_id_list, (isSuccess, page_id, fail_message) => {
        if(isSuccess){
          return res.json({
            result: {
              state: res_state.success,
              page_id: page_id
            }
          })
        }else{
          return res.json({
            state: res_state.error,
            message: fail_message,
            result: {}
          })
        }
      })
    }else {
      //플레이스 주인이 아니다. admin인지 확인한다.
      isAdmin(user_id, (isAdmin) => {
        if(isAdmin){
          //주인은 아닌데 admin이면 고고
          insertPost(store_user_id, store_id, title, story, state, select_item_id_list, (isSuccess, page_id, fail_message) => {
            if(isSuccess){
              return res.json({
                result: {
                  state: res_state.success,
                  page_id: page_id
                }
              })
            }else{
              return res.json({
                state: res_state.error,
                message: fail_message,
                result: {}
              })
            }
          })
        }else{
          return res.json({
            state: res_state.error,
            message: '플레이스 주인만 작성 가능합니다.',
            result: {}
          })
        }
      })
    }
  })
})

router.post("/edit", function(req, res){
  const user_id = req.body.data.user_id;
  // const store_user_id = req.body.data.store_user_id;
  const store_id = req.body.data.store_id;
  const title = req.body.data.title;
  const story = req.body.data.story;
  const post_id = req.body.data.post_id;

  const state = req.body.data.state;
  const select_place_item_info_list = req.body.data.select_place_item_info_list;

  const update_add_place_item_info_list = req.body.data.update_add_place_item_info_list;
  const update_delete_place_item_info_list = req.body.data.update_delete_place_item_info_list;

  isPlaceMaster(user_id, store_id, (isPlaceMaster) => {
    if(isPlaceMaster){
      //플레이스 주인이다.
      updatePost(post_id, title, story, state, update_delete_place_item_info_list, update_add_place_item_info_list, (isSuccess, fail_message) => {
        if(isSuccess){
          return res.json({
            result: {
              state: res_state.success
            }
          })
        }else{
          return res.json({
            state: res_state.error,
            message: fail_message,
            result: {}
          })
        }
      })
    }else {
      //플레이스 주인이 아니다. admin인지 확인한다.
      isAdmin(user_id, (isAdmin) => {
        if(isAdmin){
          //주인은 아닌데 admin이면 고고
          updatePost(post_id, title, story, state, update_delete_place_item_info_list, update_add_place_item_info_list, (isSuccess, fail_message) => {
            if(isSuccess){
              return res.json({
                result: {
                  state: res_state.success
                }
              })
            }else{
              return res.json({
                state: res_state.error,
                message: fail_message,
                result: {}
              })
            }
          })
        }else{
          return res.json({
            state: res_state.error,
            message: '플레이스 주인만 작성 가능합니다.',
            result: {}
          })
        }
      })
    }
  })
})

router.post("/delete", function(req, res){
  const user_id = req.body.data.user_id;
  // const store_user_id = req.body.data.store_user_id;
  const store_id = req.body.data.store_id;
  const post_id = req.body.data.post_id;

  isPlaceMaster(user_id, store_id, (isPlaceMaster) => {
    if(isPlaceMaster){
      //플레이스 주인이다.
      deletePost(post_id, (isSuccess, fail_message) => {
        if(isSuccess){
          return res.json({
            result: {
              state: res_state.success
            }
          })
        }else{
          return res.json({
            state: res_state.error,
            message: fail_message,
            result: {}
          })
        }
      })
    }else {
      //플레이스 주인이 아니다. admin인지 확인한다.
      isAdmin(user_id, (isAdmin) => {
        if(isAdmin){
          //주인은 아닌데 admin이면 고고
          deletePost(post_id, (isSuccess, fail_message) => {
            if(isSuccess){
              return res.json({
                result: {
                  state: res_state.success
                }
              })
            }else{
              return res.json({
                state: res_state.error,
                message: fail_message,
                result: {}
              })
            }
          })
        }else{
          return res.json({
            state: res_state.error,
            message: '플레이스 주인만 삭제가 가능합니다.',
            result: {}
          })
        }
      })
    }
  })
})

router.post("/any/list/menu", function(req, res){
  const store_id = req.body.data.store_id;
  const representative_post_id = req.body.data.representative_post_id;

  let queryStateString = '';
  const isMaster = req.body.data.isMaster;
  if(!isMaster){
    //일반 유저일 경우 비밀글은 제외 된다. 일 경우 비밀 포스트까지 나온다.
    queryStateString = ` AND state=${Types.post.none}`
  }

  let querySelect = '';
  if(representative_post_id === null){
    querySelect = mysql.format(`SELECT store_id, id, page_id, user_id, title, story, created_at, state FROM posts WHERE store_id=? ${queryStateString} AND page_id IS NOT NULL ORDER BY id DESC`, [store_id]);
  }else{
    querySelect = mysql.format(`SELECT store_id, id, page_id, user_id, title, story, created_at, state FROM posts AS post WHERE store_id=? ${queryStateString} AND page_id IS NOT NULL ORDER BY FIELD(id, ?) DESC, id DESC`, [store_id, representative_post_id]);
  }

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          list: []
        }
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
});

router.post("/any/list", function(req, res){
  let limit = req.body.data.limit;
  let skip = req.body.data.skip

  const store_id = req.body.data.store_id;

  const representative_post_id = req.body.data.representative_post_id;

  let queryStateString = '';
  const isMaster = req.body.data.isMaster;
  if(!isMaster){
    //일반 유저일 경우 비밀글은 제외 된다. 일 경우 비밀 포스트까지 나온다.
    queryStateString = ` AND state=${Types.post.none}`
  }

  let querySelect = '';
  if(representative_post_id === null){
    querySelect = mysql.format(`SELECT store_id, id, page_id, user_id, title, story, created_at, state FROM posts WHERE store_id=? ${queryStateString} AND page_id IS NOT NULL ORDER BY id DESC LIMIT ? OFFSET ?`, [store_id, limit, skip]);
  }else{
    querySelect = mysql.format(`SELECT store_id, id, page_id, user_id, title, story, created_at, state FROM posts AS post WHERE store_id=? ${queryStateString} AND page_id IS NOT NULL ORDER BY FIELD(id, ?) DESC, id DESC LIMIT ? OFFSET ?`, [store_id, representative_post_id, limit, skip]);
  }
  /*
  if(representative_post_id === null){
    querySelect = mysql.format("SELECT store_id, id, page_id, user_id, title, story, created_at, state FROM posts WHERE store_id=? AND state=? AND page_id IS NOT NULL ORDER BY id DESC LIMIT ? OFFSET ?", [store_id, Types.post.none, limit, skip]);
  }else{
    querySelect = mysql.format("SELECT store_id, id, page_id, user_id, title, story, created_at, state FROM posts AS post WHERE store_id=? AND state=? AND page_id IS NOT NULL ORDER BY FIELD(id, ?) DESC, id DESC LIMIT ? OFFSET ?", [store_id, Types.post.none, representative_post_id, limit, skip]);
  }
  */

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          list: []
        }
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post("/any/detail", function(req, res){
  const page_id = req.body.data.page_id;
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT id, user_id, title, story, created_at, state FROM posts WHERE store_id=? AND page_id=?", [store_id, page_id]);
  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        state: res_state.error,
        message: '포스트 조회 에러 (2)',
        result: {}
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        data: {
          ...data
        }
      }
    })
  });
})

router.post("/any/detail/id", function(req, res){
  const post_id = req.body.data.post_id;

  const querySelect = mysql.format("SELECT post.user_id, post.page_id, post.title, post.story, post.store_id, store.title AS store_title, store.alias AS store_alias FROM posts AS post LEFT JOIN stores AS store ON post.store_id=store.id WHERE post.id=?", [post_id]);

  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          data: null
        }
      })
    }

    const data = result[0];
    return res.json({
      result: {
        state: res_state.success,
        data: {
          ...data
        }
      }
    })
    
  })
})

function setRepresentativePost(store_id, post_id, callBack = (isSuccess) => {}){

  db.UPDATE("UPDATE stores SET representative_post_id=? WHERE id=?", [post_id, store_id], 
  (result) => {
    callBack(true)
  }, (error) => {
    callBack(false)
  })
  /*
  getNextPostPageID(store_id, (next_page_id) => {
    let state = Types.post.none;
    if(isSecret){
      state = Types.post.secret
    }

    const date = moment_timezone().format('YYYY-MM-DD HH:mm:ss');

    const postData = {
      page_id: next_page_id,
      user_id: user_id,
      store_id: store_id,
      donation_id: null,  //생각해보니 이거 필요 없음.. 나중에 빼야지
      state: state,
      title: title,
      story: story,
      created_at: date,
      updated_at: date
    }

    db.INSERT("INSERT INTO posts SET ?", postData, 
    (result) => {
      return callBack(true, '');
    }, (error) => {
      return callBack(false, '포스트 추가 실패(1)');
    })
  });
  */
}

router.post("/representative/post/set", function(req, res){
  const post_id = req.body.data.post_id;
  const user_id = req.body.data.user_id;
  const store_id = req.body.data.store_id;

  isPlaceMaster(user_id, store_id, (isPlaceMaster) => {
    if(isPlaceMaster){
      //플레이스 주인이다.
      setRepresentativePost(store_id, post_id, (isSuccess) => {
        if(!isSuccess){
          return res.json({
            state: res_state.error,
            message: '포스트 메인 설정 실패',
            result: {}
          })
        }

        return res.json({
          result: {
            state: res_state.success
          }
        })
      })
      
    }else {
      //플레이스 주인이 아니다. admin인지 확인한다.
      isAdmin(user_id, (isAdmin) => {
        if(isAdmin){
          //주인은 아닌데 admin이면 고고
          setRepresentativePost(store_id, post_id, (isSuccess) => {
            if(!isSuccess){
              return res.json({
                state: res_state.error,
                message: '포스트 메인 설정 실패',
                result: {}
              })
            }
    
            return res.json({
              result: {
                state: res_state.success
              }
            })
          })
          
        }else{
          return res.json({
            state: res_state.error,
            message: '플레이스 주인이 아닙니다',
            result: {}
          })
        }
      })
    }
  })
});

router.post('/any/onoff', function(req, res){
  const store_id = req.body.data.store_id;
  const querySelect = mysql.format("SELECT is_on FROM onoffs WHERE store_id=? AND type=?", [store_id, 'post']);

  db.SELECT(querySelect, {}, (result) => {
    //값 자체가 없으면 insert 해준다.
    if(!result || result.length === 0){
      const onoffDefaultData = Types.default_onoff_datas.find((value) => {
        return value.type === 'post';
      });

      if(!onoffDefaultData){
        return res.json({
          result: {
            state: res_state.success,
            is_on: false
          }
        })
      }

      let onoffData = {
        store_id: store_id,
        type: onoffDefaultData.type,
        is_on: onoffDefaultData.is_on,
        order_number: onoffDefaultData.order_number
      }

      db.INSERT("INSERT INTO onoffs SET ?", [onoffData], (result) => {
        return res.json({
          result: {
            state: res_state.success,
            is_on: true
          }
        })
      }, (error) => {
        return res.json({
          state: res_state.error,
          message: 'on off insert 실패 (onoff체크)',
          result: {}
        })
      })
    }else{
      const data = result[0];
      return res.json({
        result: {
          state: res_state.success,
          is_on: data.is_on
        }
      })
    }
  })
})

router.post('/any/secret', function(req, res){
  const page_id = req.body.data.page_id;
  const user_id = req.body.data._user_id;
  const store_id = req.body.data.store_id;

  const querySelect = mysql.format("SELECT id, state FROM posts WHERE store_id=? AND page_id=?", [store_id, page_id])
  db.SELECT(querySelect, {}, (result) => {
    if(!result || result.length === 0){
      return res.json({
        state: res_state.error,
        message: '존재하지 않는 포스트 입니다.',
        result: {}
      })
    }

    const data = result[0];
    if(data.state === Types.post.secret){
      //비밀글인데, 유저 id가 없으면 미로그인 유저임
      if(user_id === undefined || user_id === null || user_id === 0){
        return res.json({
          result: {
            state: res_state.success,
            is_master: false,
            post_state: data.state
          }
        })
      }
      //비밀글이면 크리에이터나 admin만 접속 가능하다.
      isPlaceMaster(user_id, store_id, (isPlaceMaster) => {
        if(isPlaceMaster){
          //플레이스 주인이다.
          return res.json({
            result: {
              state: res_state.success,
              is_master: true,
              post_state: data.state
            }
          })
        }else {
          //플레이스 주인이 아니다. admin인지 확인한다.
          isAdmin(user_id, (isAdmin) => {
            if(isAdmin){
              // console.log('근데 어디민임');
              //주인은 아닌데 admin이면 고고
              return res.json({
                result: {
                  state: res_state.success,
                  is_master: true,
                  post_state: data.state
                }
              })
            }else{
              return res.json({
                result: {
                  state: res_state.success,
                  is_master: false,
                  post_state: data.state
                }
              })
            }
          })
        }
      })
    }else{
      return res.json({
        result: {
          state: res_state.success,
          post_state: data.state
        }
      })
    }
  })
})

router.get('/any/items', function(req, res){
  const post_id = Number(req.query.post_id);

  db.SELECT("SELECT store.title AS store_title, posts_item.item_id, item.title AS item_title, item.img_url FROM posts_items AS posts_item LEFT JOIN items AS item ON posts_item.item_id=item.id LEFT JOIN stores AS store ON item.store_id=store.id WHERE post_id=?", post_id, (result) => {
    if(!result || result.length === 0){
      return res.json({
        result: {
          state: res_state.success,
          list: []
        }
      })
    }

    return res.json({
      result: {
        state: res_state.success,
        list: result
      }
    })
  })
})

router.post('/any/test', function(req, res){
  const store_id = req.body.data.store_id;
  getNextPostPageID(store_id, (next_page_id) => {
    return res.json({
      test: next_page_id
    })
  });
})

module.exports = router;