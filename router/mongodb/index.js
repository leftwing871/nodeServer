var express = require('express')
var app = express()
var router = express.Router()
var path = require('path')
var mongoose = require('mongoose');
var Blog = require('../../models/blog');
var documentdb_config = require('../../config/config_documentdb.json');
//var time = require('time');

const fs = require('fs');
const certFileBuf = fs.readFileSync('./rds-combined-ca-bundle.pem');

var mongoDB = process.env.MONGODB_URI || documentdb_config.mongodb_url;

// var options = {
//     useNewUrlParser: true,
//     ssl: true,
//     sslValidate: false,
//     sslCA: certFileBuf
// };

// mongoose.connect(mongoDB, {
//     useNewUrlParser: true,
//     ssl: true,
//     sslValidate: false,
//     sslCA: certFileBuf})
// .then(() => console.log('Connection to DocumentDB successful'))
// .catch((err) => console.error(err,'Error'));

//0. /mongodb, GET index
router.get('/', function(req, res) {
  
    res.redirect('/mongodb/list');
    
})

//1. /mongodb, GET List
router.get('/list', function(req, res) {

    Blog
    .find()
    .then(posts => {
      console.log("Read All 완료");
      
      // res.status(200).json({
      //   message: "Read All success",
      //   data: {
      //     post: posts
      //   }
      // });
      
      res.render('blog/list.ejs', {'list': posts })
    })
    .catch(err => {
      res.status(500).json({
        message: err
      });
    });
    
})


//2. /view, GET Retrieve a single object
router.get('/view', function(req, res) {
    var id = req.param('id');

    Blog
    .findOne({ _id: id })
    .then(blog => {
      if (!blog)
      {
        res.status(404).send({ message: "Not found Tutorial with id " + id });
      }
      else
      {
        console.log(blog)
        res.render('blog/view.ejs', {'id': blog.id, 'writer': blog.writer, 'title': blog.title, 'content': blog.content, 'registDate': blog.registDate })
      }
    })
    .catch(err => {
      res.status(500).json({
        message: 'Not exist Document: ' + err
      });
    });

})


//3-1. /add, GET
router.get('/add', function(req, res) {

    var id = req.param('id');
    var writer = null;
    var title = null;
    var content = null;
    if(id == undefined)
    {
        console.log('id is empty' )
        res.render('blog/add.ejs', {'id': id, 'writer': writer, 'title': title, 'content': content })
    }
    else
    {
        Blog.findById(id)
        .then(blog => {
          if (!blog)
          {
            res.status(404).send({ message: "Not found Tutorial with id " + id });  
          }
          else
          {
            //res.send(blog);
            writer = blog.writer;
            title = blog.title;
            content = blog.content;
            
            res.render('blog/add.ejs', {'id': id, 'writer': writer, 'title': title, 'content': content })
          }
        })
        .catch(err => {
          res.status(500).json({
            message: 'Not exist ' + err
          });
        });
    }

})

//3-2. /add, POST
router.post('/add', async function(req, res) {
    var id = req.body.id;
    var writer = req.body.writer;
    var title = req.body.title;
    var content = req.body.content;
    
    if(typeof id === 'undefined' || id === null || id === '')
    {
        var blog = new Blog(
        {
            writer: writer,
            title: title,
            content: content,
            registDate: getCurrentDate()
        });
        
        blog.save(function (err) {
            if (err) {
                console.log("저장중 오류가 발생했습니다.")
                console.log(err)
                res.json(err);
            }
            else
            {
                res.redirect('/mongodb/'); 
            }
        })
        
    }
    else
    {
        console.log("수정" + id)

        //id = id + '1';
        const filter = { _id: id };
        const update = { writer: writer, title: title, content: content, registDate: getCurrentDate() };
        
        Blog.findOneAndUpdate(filter, update, function(err, result) {
            if (err) {
                console.log("수정중 오류가 발생했습니다.")
                console.log(err)
                res.json(err);
            } else {
                res.redirect('/mongodb/view?id=' + id);
            }
        });
        
    }

})

//4. /delete, GET
router.get('/delete', function(req, res) {
    var id = req.param('id');

    Blog.deleteOne({ _id: id }, function(err, result) {
      if (err) {
        console.log('err');
        res.send(err);
      } else {
        res.redirect('/mongodb'); 
      }
    });
    
    
})


module.exports = router;

function getCurrentDate(){
    // var date = new Date();
    // var year = date.getFullYear();
    // var month = date.getMonth();
    // var today = date.getDate();
    // var hours = date.getHours();
    // var minutes = date.getMinutes();
    // var seconds = date.getSeconds();
    // var milliseconds = date.getMilliseconds();
    // return new Date(Date.UTC(year, month, today, hours, minutes, seconds, milliseconds));
    return Date.now();
}
