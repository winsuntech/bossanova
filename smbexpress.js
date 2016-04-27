var express = require('express');
var bodyparser = require('body-parser');
var multer =  require('multer');
var upload = multer();
var fs = require('fs');
const spawn = require('child_process').spawn;
const spawnSync = require('child_process').spawnSync;
const execSync = require('child_process').execSync;

var app = express();
var userShareInfo = {};  //receive req body 

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));


app.get('/config',(req,res) => {
    return res.status(200).send(userShareInfo);
});

app.post('/config', (req,res) => {
    userShareInfo = req.body;
    getSambaStatus((status) => {
        if(status == true){
            console.log('process running!');
            if(Object.keys(userShareInfo).length){
                // console.log('not empty');
                configsmb(userShareInfo);
                var s = spawnSync('/etc/init.d/sambactl',['restart']);
                if(s.status === 0){
                    return res.status(200).send('restart ok!');
                } else {
                    return res.status(200).send('restart failed!');
                }
            } else {
                // console.log('empty');
                var s = spawnSync('/etc/init.d/sambactl',['stop']);
                if(s.status === 0){
                    return res.status(200).send('stop ok!');
                } else {
                    return res.status(200).send('stop failed!');
                }
            }
        } else {
            console.log('process not running!');
            if(Object.keys(userShareInfo).length){
                // console.log('not empty');
                configsmb(userShareInfo);
                var s = spawnSync('/etc/init.d/sambactl',['start']);
                if(s.status === 0){
                    return res.status(200).send('start ok!');
                } else {
                    return res.status(200).send('start failed!');
                }
            } else {
                // console.log('empty');
                return res.status(200).send('do nothing');
            }
        }
    });

    // return res.status(200).send('hello,expre');
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

//get username from user uuid
function getusernamefromuuid(alluser,namelist){
    var j = 0;
    var newlist = namelist.map((element) => {
        for(j=0; j<alluser.length; j++){
            // console.log('j:',j,':',alluser.length);
            // console.log('uuid:',alluser[j].uuid);
            // console.log('username:',alluser[j].username);
            if(element == alluser[j].uuid){
                return alluser[j].username;
            }
        }
    });
    // console.log('newlist:',newlist);
    return newlist.join(',');
}

function configsmb(userShareInfo){
    var rusers = userShareInfo.users;
    var rshares = userShareInfo.shares;

    //check for format
    for(var i=0; i<rusers.length;i++){
        if (!validString(rusers[i].username) || !validUuid(rusers[i].uuid)){
            return res.status(400).send('username or uuid Format Error');
        }
    }

    //check for share info
    for(i=0; i<rshares.length; i++){
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
        var args = rusers[i].username;
        var adduserlinux = spawnSync(cmd,[args]);
        // console.log('args:',args);
        if(adduserlinux.status == 0 || adduserlinux.status == 9){
            var args1 = rusers[i].password+'\n'+rusers[i].password;
            var args2 = rusers[i].username;
            // console.log('args1:',args1);
            // console.log('args2:',args2);

            var s = spawnSync('pdbedit',['-a', args2],{input:args1});

            // const echo = spawn('echo', ['-e',args1]);
            // console.log(1);
            // const chpasswd = spawn('pdbedit',['-a',args2]);
            // console.log(2);
            // echo.stdout.on('data', (data) => {
            //     console.log(3);
            //     chpasswd.stdin.write(data);
            // });
            // echo.on('close', (code) => {
            //     console.log(4);
            //     chpasswd.stdin.end();
            // });
            // chpasswd.on('close', (code) => {
            //     console.log(5);
            //     console.log('chpasswd.code:',code);
            // });
        } else {
            console.log('other!');
        }
    }

    var smbglobal = "[global]\n \
    workgroup = WORKGROUP\n \
    netbios name = LEWIS\n \
    object = my_notify\n \
    server string = %h server (Samba, Ubuntu)\n \
    dns proxy = no\n \
    log file = /var/log/samba/log.%m\n \
    max log size = 1000\n \
    syslog = 0\n \
    panic action = /usr/share/samba/panic-action %d\n \
    server role = standalone server\n \
    passdb backend = tdbsam\n \
    obey pam restrictions = yes\n \
    unix password sync = yes\n \
    passwd program = /usr/bin/passwd %u\n \
    passwd chat = *Enter\\snew\\s*\\spassword:* %n\\n *Retype\\snew\\s*\\spassword:* %n\\n *password\\supdated\\ssuccessfully* .\n \
    pam password change = yes \n \
    map to guest = never\n \
    security = user\n \
    guest account = nobody\n \
    browseable = yes\n\
[homes]\n \
    comment = Home Directory\n \
    browseable = no\n \
    read only = no\n \
    create mask = 0775\n \
    directory mask = 0775\n \
    valid users = %S\n";

    //create /etc/samba/smb.conf
    for(i=0; i<rshares.length; i++){
        var data = '['+rshares[i].name+']\n';
        data += '    path = '+rshares[i].directory+'\n';
        data += '    available = yes\nforce user = admin\n';
        data += '    write list = '+getusernamefromuuid(rusers,rshares[i].writelist)+'\n';
        data += '    read list = '+getusernamefromuuid(rusers,rshares[i].readlist)+'\n';
        // var data = getusernamefromuuid(rusers,rshares[i].readlist);
        // console.log('data:',data);
        smbglobal += data;
    }
    // console.log(smbglobal);
    fs.writeFile('/etc/samba/smb.conf', smbglobal, (error) => {
        if(error){
            throw error;
        }
        console.log('write successfully');
    });
}

module.exports = app;