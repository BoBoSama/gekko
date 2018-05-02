

var request = require('request');
var crypto = require('crypto');
var fs = require('fs');



var Base = function(secret_key, access_key){
  
    this.key = secret_key

    this.access = access_key
}


var getHmac = function(str, secret) {
    // var buf = crypto.randomBytes(16);
    // secret = buf.toString("hex");//密钥加密；
    var Signture = crypto.createHmac("sha1", secret);//定义加密方式
    Signture.update(str);
    var miwen=Signture.digest().toString("base64");//生成的密文后将再次作为明文再通过pbkdf2算法迭代加密；
    return miwen;
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



var getSha1 = function(str) {
 
   
    var sha1 = crypto.createHash("sha1");//定义加密方式:md5不可逆,此处的md5可以换成任意hash加密的方法名称；
    sha1.update(str);
    var res = sha1.digest("hex");  //加密后的值d
    return res;
}

Base.prototype.getAuth = function(method, path,headers){
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
 
    var s = getHmac(str_to_sign,this.key)

    return this.access+':'+s
}

Base.prototype.post = function(path, data, callback){
  
    headers = this.defaultHeader('POST', path, data)
    console.log(headers)
 
    request({
        url: 'https://openapi.dragonex.im'+path,
        method: 'POST',
        headers: headers,
        qs: data
    }, function(error, response, body) {

        if(response.statusCode == 200){
            callback(true,JSON.parse(body))
        }else{
            callback(false,error)
        }

    })

}

Base.prototype.get = function(path, data, callback){
    headers = defaultHeader('GET', path, data)
    console.log(headers)

    request({
        url: 'https://openapi.dragonex.im'+path+data,
        method: 'GET',
        headers: headers,
    }, function(error, response, body) {

        if(response.statusCode == 200){
            callback(true,JSON.parse(body))
        }else{
            callback(false,error)
        }

    })

}

Base.prototype.defaultHeader = function(method, path, data){
    date = new Date().toUTCString()
    var opt = {
        method:'POST',
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
  
    auth = this.getAuth(opt.method, path, opt.headers)
    opt.headers.Auth = auth
    return opt.headers
}

Base.prototype.ensureTokenEnable = function(path, data, callback){
    this.post(path, data, (isTrue,res)=>{
        callback(isTrue,res)
    })
}

Base.prototype.saveToken = function(token){
    fs.writeFile('./token.txt',token,function(err){
        if(err){
            console.log("保存失败")
        }else{
            console.log("保存成功");
   
        }
   
   }) 
}



module.exports = Base
