var express = require('express') //node_modules에서 express 관련 파일을 가져오고 함수를 사용할 수 있게 준비해준다
var app = express()
//express.Router 클래스를 사용하면 모듈식 마운팅 가능한 핸들러를 작성할 수 있습니다. 
//Router 인스턴스는 완전한 미들웨어이자 라우팅 시스템이며, 따라서 “미니 앱(mini-app)”이라고 불리는 경우가 많습니다.
var router = express.Router()
var path = require('path')

//app.js 에서 /main 경로로 routing 되기 때문에 main.js 에서는 '/' 경로만 입력합니다.
// router.get('/', function(req, res) {
//     console.log('main js loaded')
//     //res.sendFile(path.join(__dirname , '../../public/main.html'))
//     console.log(req.user)
//     var id = req.user.id;
//     res.render('main.ejs', {'id': id})
// })

router.get('/', function(req, res) {
    console.log('main js loaded')
    //res.sendFile(path.join(__dirname , '../../public/main.html'))
    console.log(req.user)
    var user = req.user;
    if(!user) res.render('login.ejs')
    res.render('main.ejs', {'id': user.id})
})

//다른파일에서 이 파일(main.js)을 쓸 수 있습니다.
module.exports = router;
