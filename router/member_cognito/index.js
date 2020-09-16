var express = require('express')
var app = express()
var router = express.Router()
var path = require('path')
global.fetch = require('node-fetch')

// var cookieParser = require('cookie-parser')
// app.use(cookieParser())

// var session = require('express-session')
// app.use(session({
//     secret: 'keyboard cat', 
//     resave: false, //false는 바뀔때만 저장소에 값을 저장한다.
//     saveUninitialized: true, //세션이 필요하기전 까지는 세션을 구동시키지 않는다.
// }))

var AmazonCognitoIdentity = require("amazon-cognito-identity-js");
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const AuthenticationDetails = AmazonCognitoIdentity.AuthenticationDetails;
const CognitoUser = AmazonCognitoIdentity.CognitoUser;
const CognitoAccessToken = AmazonCognitoIdentity.CognitoAccessToken;
const CognitoIdToken = AmazonCognitoIdentity.CognitoIdToken;
const CognitoRefreshToken = AmazonCognitoIdentity.CognitoRefreshToken;
const CognitoUserSession = AmazonCognitoIdentity.CognitoUserSession;

const AWS = require('aws-sdk');
AWS.config.loadFromPath('./aws_credential.json');
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

// var poolData = {
//     UserPoolId : 'ap-northeast-2_5LN8CUqGh', // your user pool id here
//     ClientId : '1gvatk95e4b9apptk0mtare9d' // your client id here //Generate Client Secret 반드시 해제
// };

var poolData2 = {
    UserPoolId : '', // your user pool id here
    ClientId : '1kccrpc3tqh6bncor2ifdpm3kh' // your client id here //Generate Client Secret 반드시 해제
};

var userPool = new CognitoUserPool(poolData2);
var jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');

let tokens


//  /member_cognito/register, GET
router.get('/signUp', function(req,res) {
    res.render('member_cognito/signUp.ejs', {'message': 'message---'})
})


//  /member_cognito/signUp, POST
router.post('/signUp', function(req, res){
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var os = req.body.os;
    //const user_state = req.body.user_state;

    
    const params =
    {
        "ClientId": poolData2.ClientId,
        "Password": password,
        "Username": username,
        "UserAttributes":
        [
            {
                "Name": "email",
                "Value": email
            }
            ,
            {
                "Name": "custom:os",
                "Value": os
            }
            // {
            //     "Name": "user_state",
            //     "Value": user_state
            // },
            // {
            //     "Name": "updated_at",
            //     "Value": '2020-09-21'
            // }
        ]
    };
    
    cognitoIdentityServiceProvider.signUp(params, function(err, data)
    {
        var msg;
        if(err)
        {
            msg = JSON.stringify(err, null, 2)
            console.log(msg);
            res.render('member_cognito/signUpResult.ejs', {'message': msg});
        }
        else
        {
            msg = JSON.stringify(data, null, 2)
            console.log(data);
            res.render('member_cognito/signUpResult.ejs', {'message': msg});
        }

        //{ "UserConfirmed": false, "CodeDeliveryDetails": { "Destination": "e***@m***.com", "DeliveryMedium": "EMAIL", "AttributeName": "email" }, "UserSub": "311a8d0e-efd3-4b90-b67e-a830a8b74903" }

        // { UserConfirmed: false,
        //   CodeDeliveryDetails:
        //   { Destination: 'l***@g***.com',
        //      DeliveryMedium: 'EMAIL',
        //      AttributeName: 'email' },
        //   UserSub: '62e9b013-fdd6-4a45-8d80-3bc173c8ed08' }

    });
    
})

//  /member_cognito/, GET
router.get('/', function(req, res) {
    
    tokens = req.cookies.tokens
    console.log(JSON.stringify(tokens, null, 2))

    
    if(!tokens){
        const msg = tokens
        console.log('msg: ', msg)

        res.render('member_cognito/index.ejs', {'message': msg})
        return
    }
    

        console.log('validateToken step0')
        validateToken(tokens).then((value)=>{
            res.render('member_cognito/validateToken.ejs', {'message': value})
        })
/*
    console.log('validateToken step1')
        if(isValid)
        {
            
            return
        }
        else{
            res.render('member_cognito/validateToken.ejs', {'message': 'invalid'})
            return
        }
        console.log('validateToken step2')

    console.log(tokens)
*/  
    
})

// //  /member_cognito/login, POST
// router.post('/login', function(req, res){
//     var attributeList = [];
    
//     var email = req.body.email;
//     var password = req.body.password;
    
//     var dataEmail = { Name: 'email',  Value: email};
//     var dataPassword = { Name: 'password',  Value: password};
    
//     var attributeEmail = new CognitoUserAttribute(dataEmail);
//     var attributePassword = new CognitoUserAttribute(dataPassword);
    
//     attributeList.push(attributeEmail);
//     attributeList.push(attributePassword);
    
//     userPool.signUp()
    
// })

router.get('/confirmSignUp', function(req, res) {
    var msg = ''
    res.render('member_cognito/confirmSignUp.ejs', {'message': msg})
})

router.post('/confirmSignUp', function(req, res) {

    const params2 =
    {
        ClientId: poolData2.ClientId,
        ConfirmationCode: req.body.ConfirmationCode,
        Username: req.body.Username
    };

    cognitoIdentityServiceProvider.confirmSignUp(params2, function(err, data)
    {
        var msg;
        if(err)
        {
            msg = err.message
            console.log(err);
            res.render('member_cognito/confirmSignUp.ejs', {'message': msg});
        }
        else
        {
            msg = JSON.stringify(data, null, 2)
            console.log(data);
            res.render('member_cognito/confirmSignUpSuccess.ejs', {'message': msg});
        }

    });

})

//  /member_cognito/signIn, GET
router.get('/signIn', function(req,res) {
    res.render('member_cognito/signIn.ejs', {'message': 'message---'})
})

//  /member_cognito/signIn, POST
router.post('/signIn', function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    
    const authenticationData =
    {
        Username: username,
        Password: password
    };
    
    var authenticationDetails = new AuthenticationDetails(authenticationData);
    
    var userData = {
        Username : username, // your username here
        Pool : userPool
    };
    
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    console.log("-+-+-+-+-+-+-+-+-+-+-+-+-")
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            console.log("onSuccess --- ---")
            //console.log('id token : ' + result.getIdToken().getJwtToken());
            console.log(JSON.stringify(result, null, 2))
            
            console.log("onSuccess --- ---")
            const tokens = {
                accessToken: result.getAccessToken().getJwtToken(),
                idToken: result.getIdToken().getJwtToken(),
                refreshToken: result.getRefreshToken().getToken()
            }
            
            res.cookie('tokens', JSON.stringify(tokens, null, 2))
            res.cookie('payload', result.getIdToken().payload)

            res.redirect('/member_cognito')
            //res.render('member_cognito/signIn.ejs', {'message': JSON.stringify(tokens, null, 2)})

/*

The ID token contains claims about the identity of the authenticated user such as name, email, and phone_number.
다음과 같은 인증된 사용자의 ID에 대한 클레임 포함 name, email, 그리고 phone_number.

The access token contains scopes and groups and is used to grant access to authorized resources.
범위 및 그룹을 포함하며 권한 있는 리소스에 대한 액세스를 부여하는 데 사용됩니다.

The refresh token contains the information necessary to obtain a new ID or access token.
새 ID를 획득하는 데 필요한 정보가 포함되어 있거나, 액세스 권한을 부여합니다.


{
   "idToken":{
      "jwtToken":"eyJraWQiOiJQTkRqVDB6bU42ZnB0N3RVOGp4dDhHZFE0ZTk5R3JoNUNJOTYwSEFmVGdnPSIsImFsZyI6IlJTMjU2In0.eyJjdXN0b206b3MiOiJ3ZWIiLCJzdWIiOiIzYTE2NGMwNC1hODhiLTRmODgtOTNjOC05YTU5ZDY3YzhiNmEiLCJhdWQiOiIxa2NjcnBjM3RxaDZibmNvcjJpZmRwbTNraCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6IjI1MTZiMWI4LWI3NTgtNDZjMS05NzliLTVjMjU2MjcyMzQwNSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNjAwMTUwOTEwLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtbm9ydGhlYXN0LTIuYW1hem9uYXdzLmNvbVwvYXAtbm9ydGhlYXN0LTJfUzRQaWhZQkx4IiwiY29nbml0bzp1c2VybmFtZSI6ImxlZnR3aW5nODcxIiwiZXhwIjoxNjAwMTU0NTEwLCJpYXQiOjE2MDAxNTA5MTAsImVtYWlsIjoibGVmdHdpbmc4NzFAZ21haWwuY29tIn0.cCpof85pzlvYcgHA6opY_4_I0vSgjAaRF_S_GdobsN5QWVwww1pkrrUTUgC1BYAx3DxV9_O27P9mPDKDDruzGO7BZ6a_SWiOeg-Whb_N3mkueLRqRyJctpSLk7gDkwgTrV_VIWLohhCgl8GfzIsfewtLfGRJH-xQlWS1DHNLnRC9GP1QYnsMpdFNkBx3UPWdk1HDLSR7fKUtn18caqhZLe55ctd7t2YJXwqN_n1Jy5Lrzc98nbFr_yk1x8mRizpRJ-l8nKQaXbJhs1lezm5zo_M4tmZlzfQ0pFiUzwLiwyIz8GoG8kOxR9rSEzNfPhHuTDeQTsvuw_Ss0tPd0pYhdA",
      "payload":{
         "custom:os":"web",
         "sub":"3a164c04-a88b-4f88-93c8-9a59d67c8b6a",
         "aud":"1kccrpc3tqh6bncor2ifdpm3kh",
         "email_verified":true,
         "event_id":"2516b1b8-b758-46c1-979b-5c2562723405",
         "token_use":"id",
         "auth_time":1600150910,
         "iss":"https://cognito-idp.ap-northeast-2.amazonaws.com/ap-northeast-2_S4PihYBLx",
         "cognito:username":"leftwing871",
         "exp":1600154510,
         "iat":1600150910,
         "email":"leftwing871@gmail.com"
      }
   },
   "refreshToken":{
      "token":"eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.gjcyQyftqx--uCq_D4rawwSttA3gGwZ7ItLylt_95NiYlwI7fBO-GBL7Rptg9ZwXSj_g28VstDCC3hHpfLaVIrs4WRE1unNgh8lArJdLScjIR8gnXMqWnjRwONKaeo-FVXJp_PR4gV9kjipvLHif6qnrjuc_XcDDueQ9-XvYBVLkrcCfn6n8fwujUU7-8EaRb2ZZnkb35lwXJbokIoJmBR_9DIBYMBLBUuCzaXYn_m8_eJNq_jSvi8wBopW2DavChzM6Kuazhzd1rtsXAcKKMSQouHzXu_KJTEePrhdZqpt1C3c2RLcLJbWWl_wwizhIiIdq3Es46PqJvuyBliP70g.GsKOo4Ac4oJ8_Fty.RIkxo8n1AKxs3LAaltPD-wDyjMjWR596-G2J0KF2l7_b6mQUGB45qP-VpW1plY_K7Fj9zOwE6FLBinitBFyuxlbzv4FknCZY7m8DrAUAxsKArMMpoUagZZZUu2rH-vER4FMN3p7nbgWgHGsjTZTz9faUnw5Bvd_2O9xPQyHobyIKjAO3buvS_XBqrrcave0MJGKQEd53a3T6j406BG-cBErajRpz7oxjxYi2plN6cAmtB7rU_nDVQCxWzy3_a88qNZS5loeENI_oIftMULqw30LqKo6RjLUO6ApVB91fvD_K0oshwk6PD07yf5BnAV6nnvOagNxRYsHc4C4n7B5CrdWKg-WblbfgIItDdmUg2eLYFRSE52Tz20zayyE0_h61xKuXVCL1QD1-iTclWS6QrxgwDbxSipD3lfUqpMEPBxpoZBEEXblp9THdlTxkMuNJkOPNWclh1p9zk6L8hI7wiswk-063n7zpp6qZgsTE5tMscx24NKzrgSCe0ZEiEFZzV_u-ybj7Ej_8V6OStx2RBdqQIpK0Gj6rXWxOwu64cQTH64sq1HPif8CgteEh1y14N9yzIFy3DTaRiAgjNYXSdIdaRtD5JXF7RJ96YZlS8FgaLNXPI2k3HQMlR4jStfK2ZYpbWg91TG4Mn2C_MNgXYh_vR5iub46ihvywuDOrVLzK3BQXgWS7bNe5ohZ6ef_M3pV6O0cweX_PzYe_4Qo8KHI5uRlQbVNpcMwIjSY-PRyVj1Szd9pjlpQr4J9aFIDwWdjVekUcWxHsr2YpXsq1l-yus7WAizKd5ANfXzb_4Mx55_K4rzQyWHTukIMFQgoGY242ufsYW4I5nCVvo1DLmB1OncRz5w60Dxo5vjl_BfyfHGJ-8o0_4b9PoWg4H4kYfxixcmxQMPh9MUZrHSm7gpA8BVZ2C0g336am5iKWiEBF9mVC7kcOOx4kEUPGZGYAnF8gGzB0lmS4gflKdYe6U-9jBXORIEaGWjwpB1mwVD65r8MaMATmoUEQv4PiToqEn5sks7AN2irTnxKSAUhsuhOQBhS_lfewHCUq3jDphqeuT1IRowlcY2q0x_uw_QuWZ2b6zPml2M5-aPRs2BQzhAv_00Fw2ICTLn5jCwSBiU-B9p8J6PSCYkpF72ATaefqMluNHVzvuSpmLnrNOog59_GwVfomQQL0M9aAGFM7SZ6nI_J_jrJxCs2T8w_3lFQ-KXqIlA9_j2Sz8xh-U0Ct0M6WBk1DmOu0gM-02igNDCOUmmV_DaCyraFyvwedrAZSICUQXBXK2cMCMQ9s5PGcVtAdsTQErWXY.lYpBEyAatvAo-LkGk2Q87g"
   },
   "accessToken":{
      "jwtToken":"eyJraWQiOiJyZ0MwUmhMbktHeW85VDNmRmRESDdIYUZXTjBWQmFBbmpwR2VkaEhKdU00PSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIzYTE2NGMwNC1hODhiLTRmODgtOTNjOC05YTU5ZDY3YzhiNmEiLCJldmVudF9pZCI6IjI1MTZiMWI4LWI3NTgtNDZjMS05NzliLTVjMjU2MjcyMzQwNSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MDAxNTA5MTAsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1ub3J0aGVhc3QtMi5hbWF6b25hd3MuY29tXC9hcC1ub3J0aGVhc3QtMl9TNFBpaFlCTHgiLCJleHAiOjE2MDAxNTQ1MTAsImlhdCI6MTYwMDE1MDkxMCwianRpIjoiMzlmMDZjOWUtNzY3Mi00ZDMxLWFjOWEtMjYyM2JmYzU1NDYxIiwiY2xpZW50X2lkIjoiMWtjY3JwYzN0cWg2Ym5jb3IyaWZkcG0za2giLCJ1c2VybmFtZSI6ImxlZnR3aW5nODcxIn0.GYhloVy2Eim_jLaSReB4-WcYAK9Eup079gFD5hBu2XNT0VFlZjG3xuwWFRd12XZx6w8_eJKplAlLFYj5fmtBvyE0RV_Q1wQcefMbuzneb1rBqGO2ia6NApjMDVMUZ1oJT4hbmh_yoOkLMRAqZS74vCrcwgelowKJd7dvb1thJ59rLZlHz-hwlEGJU4if0SjapEDp-2mF4PQcR9_KXsAjU8ZoVWzsrAxL6cCduGdvckWmF0qeRmfGfmHWpL5ab40SO8_FUfwzwRhqiH89X0xYMPGFb7ZDN1PZkJ8uWz4tbOhCn8wRdkrI6qKvPQSs-BlC02izQ-cWpXP9WzWmhCxlyA",
      "payload":{
         "sub":"3a164c04-a88b-4f88-93c8-9a59d67c8b6a",
         "event_id":"2516b1b8-b758-46c1-979b-5c2562723405",
         "token_use":"access",
         "scope":"aws.cognito.signin.user.admin",
         "auth_time":1600150910,
         "iss":"https://cognito-idp.ap-northeast-2.amazonaws.com/ap-northeast-2_S4PihYBLx",
         "exp":1600154510,
         "iat":1600150910,
         "jti":"39f06c9e-7672-4d31-ac9a-2623bfc55461",
         "client_id":"1kccrpc3tqh6bncor2ifdpm3kh",
         "username":"leftwing871"
      }
   },
   "clockDrift":0
}


*/
            
            
            // req.session.token = result;
            // req.session.save(function(err){
            //     res.render('member_cognito/signIn.ejs', {'message': JSON.stringify(tokens, null, 2)})
                
            // })
            
            // console.log("-1-1-1-1-1-1-1-1-1-1-1-1-1-1-1-1-1-2-")
            // req.session.uid = username;
            // req.session.author_id = result.getIdToken().getJwtToken();
            // req.session.isLogined = true;
            
            // console.log("-1-1-1-1-1-1-1-1-1-1-1-1-1-1-1-1-1-3-")
            // //세션 스토어가 이루어진 후 redirect를 해야함.
            // req.session.save(function(err){
            //     console.log("-- session save success --")
            //     console.log(JSON.stringify(err, null, 2))

            //     res.render('member_cognito/signIn.ejs', {'message': JSON.stringify(tokens, null, 2)})
            // });

        },
        onFailure: function(err) {
            
            //console.log("onFailure")
            //var msg = JSON.stringify(err, null, 2)
            console.log('err : ' + JSON.stringify(err, null, 2));

            
            if(err.code == "UserNotConfirmedException")
            {
                res.render('member_cognito/confirmSignUp.ejs', {'message': err.message})
                return;
            }

            
            res.render('member_cognito/signIn.ejs', {'message': err.message}) 

        }
    });
    
})

router.get('/page', function(req, res) {

    if(req.session.displayName){
        res.render('member_cognito/page.ejs', {'message': req.session.displayName})
    }
    else
    {
        res.render('member_cognito/page.ejs', {'message': 'not exist session'})
    }
    
})

router.get('/updateUserInfo', function(req, res) {
    
    tokens = req.cookies.tokens
    if(tokens){
        validateToken(tokens).then((value)=>{
            res.render('member_cognito/updateUserInfo.ejs', {'message': ''}) 
        })
    } else {
        res.redirect('/member_cognito')
    }
    
})

//https://blog.jsecademy.com/how-to-authenticate-users-with-tokens-using-cognito/
//https://blog.jsecademy.com/how-to-authenticate-users-with-tokens-using-cognito/
router.post('/updateUserInfo', function(req, res){
    tokens = req.cookies.tokens
    
    if(!tokens){
        res.redirect('/member_cognito')
        return
    }
    
    //console.log(req.cookies.payload['custom:os'])
    
    var payload = req.cookies.payload
    
    const obj_tokens = JSON.parse(tokens)
    const AccessToken = new CognitoAccessToken({AccessToken: obj_tokens.accessToken})
    const IdToken = new CognitoIdToken({IdToken: obj_tokens.idToken})
    const RefreshToken = new CognitoRefreshToken({RefreshToken: obj_tokens.refreshToken})
    
    const sessionData = {
      IdToken: IdToken,
      AccessToken: AccessToken,
      RefreshToken: RefreshToken
    };
    
    const userSession = new CognitoUserSession(sessionData);

    var password = req.body.os;
    const username = payload['cognito:username']

    var userData = {
        Username : username, // your username here
        Pool : userPool
    };
    
    const cognitoUser = new CognitoUser(userData);
    cognitoUser.setSignInUserSession(userSession);
    
    var attributeList = [];
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"custom:os",Value: password}));
    
    
    cognitoUser.getSession(function (err, session) { // You must run this to verify that session (internally)
      if (session.isValid()) {
        console.log("valid")
        // Update attributes or whatever else you want to do
        cognitoUser.updateAttributes(attributeList, (err, result) => {
            if(err)
            {
                console.log("--fail--------", err, err.stack)
                console.log("--fail--------", JSON.stringify(result, null, 2))
            }else
            {
                console.log("--success--------")   
                res.redirect('/member_cognito')
            }
        })
      } else {
        // TODO: What to do if session is invalid?
        console.log("un valid")
      }
    });
    

})


router.get('/updatePassword', function(req, res) {
    
    tokens = req.cookies.tokens
    if(tokens){
        validateToken(tokens).then((value)=>{
            res.render('member_cognito/updatePassword.ejs', {'message': ''}) 
        })
    } else {
        res.redirect('/member_cognito')
    }
    
})

//https://www.youtube.com/watch?v=2goubZKVRSQ
//https://www.youtube.com/watch?v=2goubZKVRSQ
router.post('/updatePassword', function(req, res){
    tokens = req.cookies.tokens
    
    if(!tokens){
        res.redirect('/member_cognito')
        return
    }
    

    var payload = req.cookies.payload
    
    const obj_tokens = JSON.parse(tokens)
    const AccessToken = new CognitoAccessToken({AccessToken: obj_tokens.accessToken})
    const IdToken = new CognitoIdToken({IdToken: obj_tokens.idToken})
    const RefreshToken = new CognitoRefreshToken({RefreshToken: obj_tokens.refreshToken})
    
    const sessionData = {
      IdToken: IdToken,
      AccessToken: AccessToken,
      RefreshToken: RefreshToken
    };
    
    const userSession = new CognitoUserSession(sessionData);

    var old_password = req.body['old-password']
    var password = req.body.password
    var confirm_password = req.body['confirm-password']
    
    const username = payload['cognito:username']

    var userData = {
        Username : username, // your username here
        Pool : userPool
    };
    
    const cognitoUser = new CognitoUser(userData);
    cognitoUser.setSignInUserSession(userSession);
    
    var attributeList = [];
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"custom:os",Value: password}));
    
    
    cognitoUser.getSession(function (err, session) { // You must run this to verify that session (internally)
      if (session.isValid()) {
        console.log("valid")
        // Update attributes or whatever else you want to do
        cognitoUser.changePassword(old_password, password, (err, result) => {
            if(err)
            {
                console.log("--fail--------", err, err.stack)
                console.log("--fail--------", JSON.stringify(result, null, 2))
            }else
            {
                console.log("--success--------")   
                res.redirect('/member_cognito')
            }
        })
      } else {
        // TODO: What to do if session is invalid?
        console.log("un valid")
      }
    });
    
    
})

router.get('/resetPasswordRequest', function(req, res) {
    
    const userDetails = { Username: 'leftwing871', Pool: userPool }
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userDetails)
    cognitoUser.forgotPassword({
        onSuccess: data => {
            console.log(data)
            res.redirect('/member_cognito')
        }, 
        onFailure: err => {
            console.error(err)
        }
    })
    
})


router.get('/resetPassword', function(req, res) {
    
    res.render('member_cognito/resetPassword.ejs', {'message': ''}) 
    
})

router.post('/resetPassword', function(req, res){
    var code = req.body['code']
    var password = req.body.password
    var confirm_password = req.body['confirm-password']
    
    const userDetails = { Username: 'leftwing871', Pool: userPool }
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userDetails)
    cognitoUser.confirmPassword(code, password, {
        onSuccess: data => {
            console.log(data)
            res.redirect('/member_cognito')
        }, 
        onFailure: err => {
            console.error(err)
        }
    })
    
})

router.get('/logout', function(req, res) {
    // delete req.session.displayName;
    // req.session.save(() => {
    //     res.redirect('/member_cognito/signIn')
    // })
    res.clearCookie('tokens');
    res.redirect('/member_cognito')
})

router.get('/deleteUser', function(req, res) {
    
    res.render('member_cognito/deleteUser.ejs', {'message': ''}) 

})

router.post('/deleteUser', function(req, res){
    // var username = req.body.username
    
    // const userDetails = { Username: 'leftwing871', Pool: userPool }
    // const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userDetails)
    // cognitoUser.confirmPassword(code, password, {
    //     onSuccess: data => {
    //         console.log(data)
    //         res.redirect('/member_cognito')
    //     }, 
    //     onFailure: err => {
    //         console.error(err)
    //     }
    // })
    
})




function validateToken(tokens)
{
    console.log('parameter tokens: ', tokens)
    return new Promise((resolve, reject) => {
        console.log("validateToken ... begin")
        console.log(tokens)
        const obj_tokens = JSON.parse(tokens)
        const AccessToken = new CognitoAccessToken({AccessToken: obj_tokens.accessToken})
        const IdToken = new CognitoIdToken({IdToken: obj_tokens.idToken})
        const RefreshToken = new CognitoRefreshToken({RefreshToken: obj_tokens.refreshToken})
    
        const sessionData = {
            IdToken: IdToken,
            AccessToken: AccessToken,
            RefreshToken: RefreshToken
        }
        
        const userSession = new CognitoUserSession(sessionData)
        
        var userData = {
            Username : "", // your username here
            Pool : userPool
        };
        
        const cognitoUser = new CognitoUser(userData)
        cognitoUser.setSignInUserSession(userSession)
        
        cognitoUser.getSession(function (err, session) {
            if (session.isValid()) {
                console.log("validateToken ... valid")
                resolve(true);
            } else {
                console.log("validateToken ... isvalid")
                resolve(false);
            }
        });
    });
    
}



/*
https://stackoverflow.com/questions/35318442/how-to-pass-parameter-to-a-promise-function
https://stackoverflow.com/questions/35318442/how-to-pass-parameter-to-a-promise-function
https://stackoverflow.com/questions/35318442/how-to-pass-parameter-to-a-promise-function
https://stackoverflow.com/questions/35318442/how-to-pass-parameter-to-a-promise-function

//  /member_cognito/validateToken, GET
router.get('/validateToken', function(req,res) {
    
    const AccessToken = new CognitoAccessToken({AccessToken: "eyJraWQiOiJtNjZ2R1lLQkpsT3dJV21tMnhlZ0pqUVdBTzFBckZoNjdRdmIyMEtRRWhRPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI1YmE0MmY3YS0xNjBiLTQ5ZGMtYTIwMy05ODQzM2FiNzA2OTAiLCJldmVudF9pZCI6IjEyYTliZTg5LTZjYTItNGFkMy04MTA3LTFlNTE3ZTI3OTkzMSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE1OTcyMDkyMTAsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1ub3J0aGVhc3QtMi5hbWF6b25hd3MuY29tXC9hcC1ub3J0aGVhc3QtMl9hc0lpdGVVM3oiLCJleHAiOjE1OTcyMTI4MTAsImlhdCI6MTU5NzIwOTIxMCwianRpIjoiMDRhNzNkMGEtZGIzYi00NDY1LTgyNDQtYjBiODhiNDFlYzQwIiwiY2xpZW50X2lkIjoiNG8xZTlvNDAzaG9pdmJxYm9hNzIwaTBjaXYiLCJ1c2VybmFtZSI6ImVobGVlMiJ9.HC-VX9LdLJgDEChU4CUkwY9BbYGvt1ix0jXa8cz26FF860E6ufWfBsT9smreC-c8ZXNhoqtinP-h5iMqd4vVPLq25lBpP-Hjlh1-R6aY9D9jFZ8ARam1z3DAMIrAtBoK6gW4WVLPxWaCIHrsJpmENuCWsaSIHnu3xmWUZ9iWiaywVCPKl1YC1iz0ZuZdkqZASQueqqGvRFoFXbTT8a-iuv2s6pIkzmYxvBHinijzSedHV7uqst87FlDoYnMQ8aIos-Cq05bIm6cuP3--p6jahSIsiVK1JWBHisu5gEWXr0ua3zui_pDQJ8aIknX1QO0T6E0WsRyBIow4LQXw147jUw"})
    const IdToken = new CognitoIdToken({IdToken: "eyJraWQiOiJ2bWlURWduQVVLb0p0czRXaW1SMTA3MG5QZWZkclVkcmprVXA2VXlMZTNjPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI1YmE0MmY3YS0xNjBiLTQ5ZGMtYTIwMy05ODQzM2FiNzA2OTAiLCJhdWQiOiI0bzFlOW80MDNob2l2YnFib2E3MjBpMGNpdiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6IjEyYTliZTg5LTZjYTItNGFkMy04MTA3LTFlNTE3ZTI3OTkzMSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNTk3MjA5MjEwLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtbm9ydGhlYXN0LTIuYW1hem9uYXdzLmNvbVwvYXAtbm9ydGhlYXN0LTJfYXNJaXRlVTN6IiwiY29nbml0bzp1c2VybmFtZSI6ImVobGVlMiIsImV4cCI6MTU5NzIxMjgxMCwiaWF0IjoxNTk3MjA5MjEwLCJlbWFpbCI6ImVobGVlQG1lZ2F6b25lLmNvbSJ9.HuOAtQboIaVja-Us1AooWRGn7A57jk-FzztYAEZp1-8sQvddBKMgy1UdyFI6NxDObiCCbfzvm2ThjYX0sBaMykNAuwRhqx0p1fdZrTfjQL-LauT00h124H7nkNbELq8wtPtZloucRv4I3T2YaOZ2hSo58MVHEiKkkGaWao5z8EB4CZyUqZONVRdDAtljgU0V1iRs74n4MjmLXe7hPNOiI-ZORCPNsUJgLHlzBkHSuNIlsMGdZcEaPnnUVQtKMJsyIZjUevFNsnVmi9Gs3pvKzUu6nJgmNNMdDx45slRg1fZitIr8ILTu8bdXiMlQYJq-9ieoaVdNJXWZk2MsXm5y1A"})
    const RefreshToken = new CognitoRefreshToken({RefreshToken: "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.PJ1C3w9ha1x-AE1M1zDzVNmG3uiC6DqtdWgbvdZ3VYrDIgAT2Cg2vEmfMkaVeTh4ZOuJZgLNok3EWyhhm2HK127B83X4btf6No0APaGNcobc_WQ63kRsJG1lf2V5k-plI1-R5P-3_dW9jkj2R0q7clPjqACvBlUH4bC-HFbiVO9ZzrmHLkiyPqaHH4KQ8NJ27hkLxNlqQhufA92HVoQJKD9JN2R6OzoR6aBhOG9AUIVge6_bgHvAnOsf441A_YJg-ncNF_7CqK86_1024dHRMeT-PAwL4Ejdp6SYGRQaUT3Lp793bJ50NnDMu6GcySvKNV5wKb40I8kxTgkZW505Bw.d9ZkFhgWD6eDZOzQ.Ikmdx3Ppc4v01H-EijdoxFnsdRXExQ04rsv99YrmaCFNwSNc2_1D7XRJb4hINficAkz_vGwBV61a_Z3ZcT5arU65orzv38xREbn7I_dSoPPJg7gkkJOpvrJpFS9Jpib6U2Ba8T3zI0pXTaah6OlVnR8Jr-9uImnNgJFGr1oqgbMoLt6NI1UH55T4g3VGyu1eI7LHFL39Iw-0ysaKYJHdYlo7HWbsipEkjgA49zJwTMP0he7r1ryAHsVLZsDzgXRLUYM1xbdHE1epHiFPtC-a5LhdXCLgorFK00Zory0ARH2E5QiFvGQA8ZdjzsWhwwqjP9BMMdvQwtN73UYP_dhYrTmPisSeL0CII8Tck9xIJ3EPNlYc208MDUPRIqFEhvWsql6oNoLIbeTLrnO8CtGqUjOIJdgZ2Mq66FXZjpucd2vvFc3vd8_wGUBnRUaolDmI8DN6iEpgmIgzH3SDICQ2pPmuV8t8sOEt9ulF7xVmKQ4sMgyYomBhClBuaZPHzJL_ImyT2U8UQE5wXvs8l2RH78E3V3t01DYyAEhmfbhO-Vh_OdN6kh9Kqli_So26AaY0vh7mGB5PdmQa4ePcLlAU61WLpdFAC8Zrbj6cDePGCYdiaIKfX9u3ovABwXU0D0vdnFjxUHNu87xnnLRAJ3gOA3oVfZzQZ6EjayZ85u6lEYR9n5aFBeAxwnX2Orb4AJEBRkViSJtUcxby0V-ZbAhNpLOTbDm5yXTeo0DvNE7tMgAX43xBKPqBnPCA69g88uPLAGI6bahvQpf_btgTqPq-UoLfzMPcueg_B6Wh0aOucIMFn2ToeiDY9dQDzvlzCd7MURRmwcYBwIgcf5B4XHQzkd7HhzOhK9r16_eSDTdNthqEIWEcFoQlpXizcGDd8QPaG0qVAgoDc9tUGc-hQfzqvDYMtsbh-2omag6wDLJ7uFWtSInC1P1zYpp_LntjZbyR9OG7mKLvbwrcf8MDY7vyx3UuGbj-iokDDh0SWMBtYclmgR2fEQn1gp446fcj8hNqg0hf25nkNeNAAwyzy3s5mpJYMmBD1DyD79apWhrCukmBzn04b7QCX6ziGvI_guVLeVcfLNAnLO_kVgh2HLFWYnmd0tgWssWCLu0J-TuQ0GzneUUDqo2WJnPGFB8Qd-ZVwpilbjtj1-3a9NY8Dvc9uGLHdNjAad2qpVqyrzA851mVGiJqnyBDeELOFa_k3CaarOQ0dFl7oqgnX4nv2ha6aHztbJnYUbUC3uc9JMbkWZe1VApRibTA89kdN7WXyIPpFjs-GhgK7rXyFpWRHr589ITY.Gu3whH84ByjGIdpaXvI5Pg"})
    
    const sessionData = {
        IdToken: IdToken,
        AccessToken: AccessToken,
        RefreshToken: RefreshToken
    }
    
    const userSession = new CognitoUserSession(sessionData)
    
    var userData = {
        Username : "", // your username here
        Pool : userPool
    };
    
    const cognitoUser = new CognitoUser(userData);
    cognitoUser.setSignInUserSession(userSession);
    
    cognitoUser.getSession(function (err, session) {
        if (session.isValid()) {
            res.render('member_cognito/validateToken.ejs', {'message': 'valid-'})
        } else {
            res.render('member_cognito/validateToken.ejs', {'message': 'invalid'})
        }
    });
    
})


//  /member_cognito/validateToken2, GET
router.get('/validateToken2', function(req,res) {
    
    //const AccessToken = new CognitoAccessToken({AccessToken: "eyJraWQiOiJtNjZ2R1lLQkpsT3dJV21tMnhlZ0pqUVdBTzFBckZoNjdRdmIyMEtRRWhRPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI1YmE0MmY3YS0xNjBiLTQ5ZGMtYTIwMy05ODQzM2FiNzA2OTAiLCJldmVudF9pZCI6IjEyYTliZTg5LTZjYTItNGFkMy04MTA3LTFlNTE3ZTI3OTkzMSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE1OTcyMDkyMTAsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1ub3J0aGVhc3QtMi5hbWF6b25hd3MuY29tXC9hcC1ub3J0aGVhc3QtMl9hc0lpdGVVM3oiLCJleHAiOjE1OTcyMTI4MTAsImlhdCI6MTU5NzIwOTIxMCwianRpIjoiMDRhNzNkMGEtZGIzYi00NDY1LTgyNDQtYjBiODhiNDFlYzQwIiwiY2xpZW50X2lkIjoiNG8xZTlvNDAzaG9pdmJxYm9hNzIwaTBjaXYiLCJ1c2VybmFtZSI6ImVobGVlMiJ9.HC-VX9LdLJgDEChU4CUkwY9BbYGvt1ix0jXa8cz26FF860E6ufWfBsT9smreC-c8ZXNhoqtinP-h5iMqd4vVPLq25lBpP-Hjlh1-R6aY9D9jFZ8ARam1z3DAMIrAtBoK6gW4WVLPxWaCIHrsJpmENuCWsaSIHnu3xmWUZ9iWiaywVCPKl1YC1iz0ZuZdkqZASQueqqGvRFoFXbTT8a-iuv2s6pIkzmYxvBHinijzSedHV7uqst87FlDoYnMQ8aIos-Cq05bIm6cuP3--p6jahSIsiVK1JWBHisu5gEWXr0ua3zui_pDQJ8aIknX1QO0T6E0WsRyBIow4LQXw147jUw"})
    //const IdToken = new CognitoIdToken({IdToken: "eyJraWQiOiJ2bWlURWduQVVLb0p0czRXaW1SMTA3MG5QZWZkclVkcmprVXA2VXlMZTNjPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI1YmE0MmY3YS0xNjBiLTQ5ZGMtYTIwMy05ODQzM2FiNzA2OTAiLCJhdWQiOiI0bzFlOW80MDNob2l2YnFib2E3MjBpMGNpdiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6IjEyYTliZTg5LTZjYTItNGFkMy04MTA3LTFlNTE3ZTI3OTkzMSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNTk3MjA5MjEwLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtbm9ydGhlYXN0LTIuYW1hem9uYXdzLmNvbVwvYXAtbm9ydGhlYXN0LTJfYXNJaXRlVTN6IiwiY29nbml0bzp1c2VybmFtZSI6ImVobGVlMiIsImV4cCI6MTU5NzIxMjgxMCwiaWF0IjoxNTk3MjA5MjEwLCJlbWFpbCI6ImVobGVlQG1lZ2F6b25lLmNvbSJ9.HuOAtQboIaVja-Us1AooWRGn7A57jk-FzztYAEZp1-8sQvddBKMgy1UdyFI6NxDObiCCbfzvm2ThjYX0sBaMykNAuwRhqx0p1fdZrTfjQL-LauT00h124H7nkNbELq8wtPtZloucRv4I3T2YaOZ2hSo58MVHEiKkkGaWao5z8EB4CZyUqZONVRdDAtljgU0V1iRs74n4MjmLXe7hPNOiI-ZORCPNsUJgLHlzBkHSuNIlsMGdZcEaPnnUVQtKMJsyIZjUevFNsnVmi9Gs3pvKzUu6nJgmNNMdDx45slRg1fZitIr8ILTu8bdXiMlQYJq-9ieoaVdNJXWZk2MsXm5y1A"})
    //const RefreshToken = new CognitoRefreshToken({RefreshToken: "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.PJ1C3w9ha1x-AE1M1zDzVNmG3uiC6DqtdWgbvdZ3VYrDIgAT2Cg2vEmfMkaVeTh4ZOuJZgLNok3EWyhhm2HK127B83X4btf6No0APaGNcobc_WQ63kRsJG1lf2V5k-plI1-R5P-3_dW9jkj2R0q7clPjqACvBlUH4bC-HFbiVO9ZzrmHLkiyPqaHH4KQ8NJ27hkLxNlqQhufA92HVoQJKD9JN2R6OzoR6aBhOG9AUIVge6_bgHvAnOsf441A_YJg-ncNF_7CqK86_1024dHRMeT-PAwL4Ejdp6SYGRQaUT3Lp793bJ50NnDMu6GcySvKNV5wKb40I8kxTgkZW505Bw.d9ZkFhgWD6eDZOzQ.Ikmdx3Ppc4v01H-EijdoxFnsdRXExQ04rsv99YrmaCFNwSNc2_1D7XRJb4hINficAkz_vGwBV61a_Z3ZcT5arU65orzv38xREbn7I_dSoPPJg7gkkJOpvrJpFS9Jpib6U2Ba8T3zI0pXTaah6OlVnR8Jr-9uImnNgJFGr1oqgbMoLt6NI1UH55T4g3VGyu1eI7LHFL39Iw-0ysaKYJHdYlo7HWbsipEkjgA49zJwTMP0he7r1ryAHsVLZsDzgXRLUYM1xbdHE1epHiFPtC-a5LhdXCLgorFK00Zory0ARH2E5QiFvGQA8ZdjzsWhwwqjP9BMMdvQwtN73UYP_dhYrTmPisSeL0CII8Tck9xIJ3EPNlYc208MDUPRIqFEhvWsql6oNoLIbeTLrnO8CtGqUjOIJdgZ2Mq66FXZjpucd2vvFc3vd8_wGUBnRUaolDmI8DN6iEpgmIgzH3SDICQ2pPmuV8t8sOEt9ulF7xVmKQ4sMgyYomBhClBuaZPHzJL_ImyT2U8UQE5wXvs8l2RH78E3V3t01DYyAEhmfbhO-Vh_OdN6kh9Kqli_So26AaY0vh7mGB5PdmQa4ePcLlAU61WLpdFAC8Zrbj6cDePGCYdiaIKfX9u3ovABwXU0D0vdnFjxUHNu87xnnLRAJ3gOA3oVfZzQZ6EjayZ85u6lEYR9n5aFBeAxwnX2Orb4AJEBRkViSJtUcxby0V-ZbAhNpLOTbDm5yXTeo0DvNE7tMgAX43xBKPqBnPCA69g88uPLAGI6bahvQpf_btgTqPq-UoLfzMPcueg_B6Wh0aOucIMFn2ToeiDY9dQDzvlzCd7MURRmwcYBwIgcf5B4XHQzkd7HhzOhK9r16_eSDTdNthqEIWEcFoQlpXizcGDd8QPaG0qVAgoDc9tUGc-hQfzqvDYMtsbh-2omag6wDLJ7uFWtSInC1P1zYpp_LntjZbyR9OG7mKLvbwrcf8MDY7vyx3UuGbj-iokDDh0SWMBtYclmgR2fEQn1gp446fcj8hNqg0hf25nkNeNAAwyzy3s5mpJYMmBD1DyD79apWhrCukmBzn04b7QCX6ziGvI_guVLeVcfLNAnLO_kVgh2HLFWYnmd0tgWssWCLu0J-TuQ0GzneUUDqo2WJnPGFB8Qd-ZVwpilbjtj1-3a9NY8Dvc9uGLHdNjAad2qpVqyrzA851mVGiJqnyBDeELOFa_k3CaarOQ0dFl7oqgnX4nv2ha6aHztbJnYUbUC3uc9JMbkWZe1VApRibTA89kdN7WXyIPpFjs-GhgK7rXyFpWRHr589ITY.Gu3whH84ByjGIdpaXvI5Pg"})
    
    var _AccessToken= "eyJraWQiOiJtNjZ2R1lLQkpsT3dJV21tMnhlZ0pqUVdBTzFBckZoNjdRdmIyMEtRRWhRPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI1YmE0MmY3YS0xNjBiLTQ5ZGMtYTIwMy05ODQzM2FiNzA2OTAiLCJldmVudF9pZCI6IjMxNTI5OTVjLTVjYzItNDhiNC1iYjNjLTQ0OWY4Y2JmYzQxZCIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE1OTcyMTQxNjEsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1ub3J0aGVhc3QtMi5hbWF6b25hd3MuY29tXC9hcC1ub3J0aGVhc3QtMl9hc0lpdGVVM3oiLCJleHAiOjE1OTcyMTc3NjEsImlhdCI6MTU5NzIxNDE2MSwianRpIjoiNTAxNDcwOTgtMTgxNi00MDA2LTljNjgtZmZhN2FiMjg4YzEyIiwiY2xpZW50X2lkIjoiNG8xZTlvNDAzaG9pdmJxYm9hNzIwaTBjaXYiLCJ1c2VybmFtZSI6ImVobGVlMiJ9.emFzKGdKPwBEc21tdVBz95oTmmRxdXgK_VhVrvUgA4DBxEXrwILNvfHvcAjFmLsauHU_eerxmkUNSSwMO422XLfdqQYDTgFvS5RM-NSrmDPeRJ7wh4Eza5S9cyxgC6Q_EoGOWRzudJVPvC8uGi1L9Kv240M1CDEsRtTAR9bZqWbsa4k8aRQGzJOxLpwQcPeyLE2sQNrsY9cbojyqwz0Bk4Kjf9rU61rKQBn9lCcoMHA_nClg29S_jwGwv6X1wAu5ovAsqUHpp0QukP0IgzJ6xJeURGaCFZSTmry5fSdPCINVfIrwonPmsL7tf9ZwjRDlcJfAGVpjhkclA-SZoM1zDA";
    var _IdToken= "eyJraWQiOiJ2bWlURWduQVVLb0p0czRXaW1SMTA3MG5QZWZkclVkcmprVXA2VXlMZTNjPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI1YmE0MmY3YS0xNjBiLTQ5ZGMtYTIwMy05ODQzM2FiNzA2OTAiLCJhdWQiOiI0bzFlOW80MDNob2l2YnFib2E3MjBpMGNpdiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6IjMxNTI5OTVjLTVjYzItNDhiNC1iYjNjLTQ0OWY4Y2JmYzQxZCIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNTk3MjE0MTYxLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtbm9ydGhlYXN0LTIuYW1hem9uYXdzLmNvbVwvYXAtbm9ydGhlYXN0LTJfYXNJaXRlVTN6IiwiY29nbml0bzp1c2VybmFtZSI6ImVobGVlMiIsImV4cCI6MTU5NzIxNzc2MSwiaWF0IjoxNTk3MjE0MTYxLCJlbWFpbCI6ImVobGVlQG1lZ2F6b25lLmNvbSJ9.lRtadPzF7mlCjxuydZgMeKn9mu_2MO7bHHczTlcQ32A2yMfarvMYt7ye_Is3hAZtX77dzXswSSUbbBt9iYIA4S8lR_FCrum7XU8a7FtAoFuMexSRnEk3DHgf_Vjhm94Zc4pwTcYEOer6i4NgUsdR0wqd3LrPhxOW8uKFiaU37qXXMzVYZRc0Ja5HO9SFOBIclnjIwkeXbhCNj083ZZXD6DlGS5n_K1J1w4mxXjEWddEgNF0XxtGzf1vJRwm4RuCRbPYL6RbyXV4vrurJnpy-nlqffSutvfL7VAysi7G7xvfndYCMVy_18A-eozkxmGL4-YEn-yDZfG5ro950M8i84g";
    
    // var decodedJwt = jwt.decode(token, {complete: true})
    // if (!decodedJwt) {
    //   console.log(decodedJwt)
    // }else 
    // {
    //   console.log("==== null ====")  
    // }
    
    // console.log("=============")
    // console.log(decodedJwt)
    
    
    jwt.verify(_IdToken, pem, { algorithms: ['RS256'] }, function(err, decodedToken) {
        console.log('err : ' + JSON.stringify(err, null, 2));
        console.log('xxxxxxxx : ' + JSON.stringify(decodedToken, null, 2));
        
        res.render('member_cognito/validateToken.ejs', {'message': ""})
    });
    
})


router.post('/validateToken', function(req, res) {
    var token = req.body.token;
    
    jwt.verify(token, pem, { algorithms: ['RS256'] }, function(err, decodedToken) {
        console.log('err : ' + JSON.stringify(err, null, 2));
        console.log('err : ' + JSON.stringify(decodedToken, null, 2));
        
        res.render('member_cognito/validateToken.ejs', {'message': token})
    });
    
    
})

*/

module.exports = router;

// var jwk = {
//   "keys":[
//       {
//          "alg":"RS256",
//          "e":"AQAB",
//          "kid":"vmiTEgnAUKoJts4WimR1070nPefdrUdrjkUp6UyLe3c=",
//          "kty":"RSA",
//          "n":"ozKuOF5lcyXgAt7OeA4v0YRPKNM_xSIIqMk1GwmEFCqpYOoZ8uvTWbsOXFkzO9E4RPp6UEdkHAbnowxsLfeSMRupL5QnTIXcNWqBk2nDVqjfNV_NOT4_a5dawIjFRkHNu-_7knH3l-USSgeIJ61tQjmCIzUiqnM29b5IKem5fN2llzE4A1ttZthw7Rm4f5qllWTAyng_ETipWpuklKXRrzdkPERY9bkgiRwNp-x5BRq-pyhl7Qviejv4FNF0xTXxphXZOY04VV2iBsYHeKr_PaH7obPIztQiYPGq_VWYFhrRwNYXF1SlSnz1xLhSzzDHNBwJHH7UA9rGbNszZHKl-Q",
//          "use":"sig"
//       },
//       {
//          "alg":"RS256",
//          "e":"AQAB",
//          "kid":"m66vGYKBJlOwIWmm2xegJjQWAO1ArFh67Qvb20KQEhQ=",
//          "kty":"RSA",
//          "n":"iZ9CNHdXwE_12tym3KYHChFxqK8bwc0xt1Ucn5kxvbeugJ5i49XjWlrWRQJy8_Uy60w3HWjcrOtr__fxrG4gNVjGwBQHFTb7GVvG9UsNeZLMYDjcYEZDLlXLjY2peAmlIVKsyjjNBVumCbrNpywlzqzTpyuMFgY-dIYYJSzSxz4zo8TFaRItC5uoNt4iSqJp8SMMaFPToD0di3Jo3yK1rDy9lqCond-PkIHnTOLjM2DpCYJELY0T8-XRMNsqkyBTmUFKMX_75aKnVft1Ee08GZ9iGuVU4YWoAIkZLPqN5iD4rBQW1YDfYkpTVXQF9Mpa8w5E-oEtE3m4W-EcVjblQw",
//          "use":"sig"
//       }
//   ]
// }


// var pem = jwkToPem(jwk.keys[0]);