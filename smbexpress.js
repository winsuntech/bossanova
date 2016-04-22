var express = require('express');
var bodyparser = require('body-parser');
var multer =  require('multer');
var upload = multer();
var fs = require('fs');
const spawn = require('child_process').spawn;

var app = express();
var userShareInfo = {};  //receive req body 

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));


app.get('/config',(req,res) => {
    return res.status(200).send(userShareInfo);
});

app.post('/config', (req,res) => {
    userShareInfo = req.body;
    var rusers = userShareInfo.users;
    var rshares = userShareInfo.shares;

    //check for format
    for(var i=0; i<rusers.length;i++){
        console.log(rusers[i].uuid);
        if (!validString(rusers[i].username) || !validUuid(rusers[i].uuid)){
            return res.status(400).send('username or uuid Format Error');
        }
    }

    //check for share info
    for(i=0; i<rshares.length; i++){
        console.log(rshares[i].name);
        if(!validString(rshares[i].name)){
            return res.status(400).send('name Format Error');
        }
        if (!fs.existsSync(rshares[i].directory)){
            return res.status(400).send('directory Format Error');
        }
    }

    //add user
    for(i=0; i<rusers.length; i++){
        var cmd = 'useradd';
        var args = [rusers[i].username];
        var adduserlinux = spawn(cmd,args);
        adduserlinux.on('close', (code) => {
            if(code == 0){
                var args1 = rusers[i].password+'\n'+rusers[i].password;
                var args2 = rusers[i].username;
                console.log('args:',args);
                const echo = spawn('echo', ['-e',args1]);
                const chpasswd = spawn('smbpasswd',['-a',args2]);
                echo.stdout.on('data', (data) => {
                    chpasswd.stdin.write(data);
                });
                echo.on('close', (code) => {
                    chpasswd.stdin.end();
                });
            }
        });
    }

    //create /etc/samba/smb.conf
    for(i=0; i<rshares.length; i++){

    }
    return res.status(200).send('hello,expre');
});

/*
 * if samba is running, return running
 * if samba is stoped ,return not running
 * if system error, return Error
*/
app.get('/status', (req,res) => {
    getSambaStatus((status) => {
        // console.log('status:',status);
        return res.status(200).send(status);
        
    });
});

app.get('/test',(req,res) => {
    console.log(userShareInfo);
    return res.send('hotwind');
});

app.listen(3005);

console.log('server address is localhost:3005');

//get samba status
function getSambaStatus(cb){
    var result='';
    status = spawn('/etc/init.d/sambactl', ['status']);
    status.stdout.on('data', (data) => {
        result += data.toString();
    });
    status.on('close', (code) => {
        if(code == 0){
            // console.log('result:',result);
            var status = result.indexOf('not');
            if(status === -1){
                cb(true);
            } else {
                cb(false);
            }
        }
    });
}

//check for string such as username path sharepath
function validString(input){
    var validRegEx = /^[a-z][a-z0-9]{3,31}$/;
    return validRegEx.test(input);
}

//check for uuid
function validUuid(input){
    var validRegEx = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
    return validRegEx.test(input);
}
