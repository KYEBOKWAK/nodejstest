var express = require('express');
var router = express.Router();
const use = require('abrequire');
var db = use('lib/db_sql.js');


router.get('/:id/introduce', function(req, res) {
  db.SELECT("SELECT id, name, profile_photo_url, introduce FROM users" + 
            " WHERE id=?", [req.params.id], function(result){
              res.json({
                result
              });
            });
});


module.exports = router;