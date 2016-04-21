var express = require('express');
var bodyparser = require('body-parser');
var multer =  require('multer');
var upload = multer();
var fs = require('fs');
const spawn = require('child_process').spawn;

var app = express();
var rbody = {};  //receive req body 

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));


app.get('/config',(req,res) => {
    return res.status(200).send(rbody);
});

app.post('/config', (req,res) => {
    rbody = req.body;
    var rusers = rbody.users;
    var rshares = rbody.shares;

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

    
    return res.status(200).send('hello,expre');
});

/*
 * if samba is running, return running
 * if samba is stoped ,return not running
 * if system error, return Error
*/
app.get('/status', (req,res) => {
    getSambaStatus((status) => {
        console.log('status:',status);
        if(status === true){
            return res.status(200).send('running');
        } else if(status === false){
            return res.status(200).send('not running');
        } else {
            return res.status(500).send('Error');
        }
    });
});

app.get('/test',(req,res) => {
    console.log(rbody);
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
            var validRegEx = /[^not]/;
            var status = validRegEx.test(result);
            cb(status);             
        } else {
            db('Error');
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
