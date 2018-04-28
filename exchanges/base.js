

var request = require('request');
var crypto = require('crypto');
var fs = require('fs');


var getHmac = function(str, secret) {
    // var buf = crypto.randomBytes(16);
    // secret = buf.toString("hex");//密钥加密；
    var Signture = crypto.createHmac("sha1", this.secret_key);//定义加密方式
    Signture.update(str);
    var miwen=Signture.digest().toString("base64");//生成的密文后将再次作为明文再通过pbkdf2算法迭代加密；
    return miwen;
}


var getSha1 = function(str) {

    var sha1 = crypto.createHash("sha1");//定义加密方式:md5不可逆,此处的md5可以换成任意hash加密的方法名称；
    sha1.update(str);
    var res = sha1.digest("hex");  //加密后的值d
    return res;
}


var Dragonex = function Dragonex(key, secret)
{
  console.log(key)
  console.log(secret)
  this.access_key = key;
  this.secret_key = secret;

};

var getAuth = function(method, path,headers){
    new_headers = {}
    for(var k in headers){
        new_headers[k] = headers[k]
    }

    content_md5 =  new_headers["Content-Sha1"]
    content_type = new_headers["Content-Type"]
    date = new_headers['Date']

    dra_headers = []

    for(var k in new_headers){

        if(k.startWith('dragonex-')){
            dra_headers[k] = new_headers[k]
        }

    }
    dra_headers.sort()
    str_to_sign = method +'\n' +content_md5  +'\n' + content_type +'\n' + date+'\n' +dra_headers + path

    var s = getHmac(str_to_sign,this.secret_key)

    return this.access_key+':'+s
}

Dragonex.prototype.defaultHeader = function(method, path, data, callback){
    date = new Date().toUTCString()
    var opt = {
        method:method,
        headers:{
            'Date': date,
            'Content-Type': 'application/json',
            'Content-Sha1': '',
            'token': '',
        }
    }

    if(fs.existsSync('./token.txt')){
        opt.headers.token =  fs.readFileSync('./token.txt').toString()
    }

    auth = getAuth(opt.method, path, opt.headers)
    opt.headers.Auth = auth

    console.log(opt.headers)
    post(method, path, data, opt.headers,(error,statusCode,res)=>{
        if(statusCode == 200){
            callback(true,res)
        }else{
            callback(false,res)
        }

    })
}

Dragonex.prototype.ensureTokenEnable = function(method, path, data, callback){
    defaultHeader(method, path, data, (isTrue,res)=>{
        callback(isTrue,res)
    })
}



var post = function(method,path, data, headers, callback){

    if(method == 'POST'){
        request({
            url: 'https://openapi.dragonex.im'+path,
            method: method,
            headers: headers,
            qs: data
        }, function(error, response, body) {
            console.log(body)
            callback(error,response.statusCode,JSON.parse(body))
        })
    }else{
        request({
            url: 'https://openapi.dragonex.im'+path+data,
            method: method,
            headers: headers,
        }, function(error, response, body) {
            console.log(body)
            callback(error,response.statusCode,JSON.parse(body))
        });
    }

}



var saveToken = function(token){
    fs.writeFile('./token.txt',token,function(err){
        if(err){
            console.log("保存失败")
        }else{
            console.log("保存成功");

        }

   })
}


String.prototype.startWith=function(s){
    if(s==null||s==""||this.length==0||s.length>this.length)
     return false;
    if(this.substr(0,s.length)==s)
       return true;
    else
       return false;
    return true;
   }

module.exports = Dragonex;
