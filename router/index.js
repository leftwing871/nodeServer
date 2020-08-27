var express = require('express')
var app = express()
var router = express.Router()
var path = require('path')

var main = require('./main/main')// ./router/main.js 를 불러다 사용하겠다는 내용
var email = require('./email/email')
var join = require('./join/index')
var login = require('./login/index')
var logout = require('./logout/index')
var movie = require("./movie/index")
var mongodb = require("./mongodb/index")

router.use('/main', main)// /main 이하의 경로는 해당 router 에서 처리하겠다는 내용
router.use('/email', email)
router.use('/join', join)
router.use('/login', login)
router.use('/logout', logout)
router.use('/movie', movie)
router.use('/mongodb', mongodb)

router.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, "../public/main.html"))
})

module.exports = router;