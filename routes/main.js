var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');

var types = use('lib/types.js');

router.post('/topthumbnail', function(req, res) {
  db.SELECT("SELECT url, title, type  FROM maincarousel", [], function(result){
    res.json({
      result
    })
  });
});

router.post('/ticketing/list', function(req, res) {
  db.SELECT("SELECT title, poster_renew_url, project_id FROM main_thumbnails AS mt " +
            "JOIN projects AS pjt " +
            "WHERE mt.project_id = pjt.id", [],
            function(result){
              res.json({
                result
              })
            });

});

//SELECT title, poster_renew_url, id FROM projects WHERE event_type_sub != 2 ORDER BY id DESC
router.post('/all/project', function(req, res) {
  //console.log(req.body.data.abc);

  db.SELECT("SELECT title, poster_renew_url, id FROM projects" +
            " WHERE state = ?"+
            " AND event_type_sub != ?"+
            " ORDER BY id DESC LIMIT 13", [types.project.STATE_APPROVED, types.project.EVENT_TYPE_SUB_SECRET_PROJECT], function(result){
              res.json({
                result
              });
                // res.json({
                //   result: {
                //     state: 'success',
                //     result
                //   }
                // });
  });

  /*
  db.SELECT("SELECT title, poster_renew_url, id FROM projects" +
            " WHERE state = "+types.project.STATE_APPROVED +
            " AND event_type_sub != "+types.project.EVENT_TYPE_SUB_SECRET_PROJECT +
            " ORDER BY id DESC LIMIT 13", function(result){
    res.json({
      result
    });
  });
  */
});

module.exports = router;