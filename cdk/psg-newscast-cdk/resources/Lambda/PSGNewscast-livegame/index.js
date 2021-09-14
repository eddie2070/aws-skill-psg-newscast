const axios = require('axios');
const jp = require('jsonpath');
const AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();
var documentClient = new AWS.DynamoDB.DocumentClient();
const mom = require('moment');
const moment = require('moment-timezone');
const sharp = require("sharp");
const { JsonPath } = require('@aws-cdk/aws-stepfunctions');
var s3 = new AWS.S3();

const url = 'http://api.football-data.org/v2/teams/524/matches/?status=LIVE'
//const url = "https://api.football-data.org/v2/teams/524/matches/?status=FINISHED";
const headers = {
  Accept: 'application/json',
  'Accept-Charset': 'utf-8',
  'X-Auth-Token': 'a9bc952d181c47268446a51dafc83286'
}

var logo = async (teamid) => {
    
    var paramss3logocheck = {
    Bucket: "psgnewscast-skill2021", 
    Key: "teamlogo/"+teamid+".png"
    };
        
    try {
        await s3.headObject(paramss3logocheck).promise();
        console.log("File Found in S3");
    } catch (err) {
        console.log("File not Found ERROR : " + err.code +". Uploading image in S3");

         //4. convert from a remote file
        //var hometeamlogo = "https://crests.football-data.org/"+jsongamecurhomeid+".png";
        const input = (await axios({ url: 'https://crests.football-data.org/'+teamid+'.svg', responseType: "arraybuffer" })).data;
        console.log("input: ",input);  
    
        var teamlogo = await sharp(input)
            .toFormat('png')
            .toBuffer();
        
        console.log("teamlogo: ",teamlogo);
            
        var paramss3logo = {
            Body: teamlogo, 
            Bucket: "psgnewscast-skill2021", 
            Key: "teamlogo/"+teamid+".png",
            ACL: "public-read",
            ServerSideEncryption: "AES256", 
            StorageClass: "STANDARD_IA"
            };
    
            const teamlogoput = await s3.putObject(paramss3logo).promise();
            console.log("teamlogoput: ",teamlogoput);
            return teamlogoput.ETag;
    }
};

exports.handler = async (event, context, callback) => {
  console.log("event: ",event);
  var params = {
    Key: {
        "ID": "livemarker"
    }, 
    TableName: "PSGNewscast"
};
//var ddbcheck = await dynamodb.getItem(params).promise();
var ddbcheck  = await documentClient.get(params).promise();
console.log("ddbcheck: ", ddbcheck);
if (ddbcheck.Item.gameinfo === "notstarted") {
  const response = await axios.get(url, { headers });
  console.log("response: ", response);
  var jsongamelivear = jp.query(response.data, '$.matches[0]');
  var jsongamelive = jsongamelivear[0];
  console.log("jsongamelive: ", jsongamelive);
  var jsongameliveid = jp.query(response.data, 'id');
  var jsongamelivehome = jp.query(jsongamelive, '$.homeTeam.name')[0];
  console.log("jsongamelivehome: ", jsongamelivehome);
  var jsongamelivehomeid = jp.query(jsongamelive, '$.homeTeam.id');
  var jsongamelivehomescore = jp.query(jsongamelive, '$.score.fullTime.homeTeam')[0];
  var jsongameliveaway = jp.query(jsongamelive, '$.awayTeam.name')[0];
  var jsongameliveawayid = jp.query(jsongamelive, '$.awayTeam.id');
  var jsongameliveawayscore = jp.query(jsongamelive, '$.score.fullTime.awayTeam')[0];
  var jsongamelivematchday = jp.query(jsongamelive, '$.matchday');
  var jsoncompetition = jp.query(jsongamelive, '$.competition.name')[0];
  var jsoncompetitionstage = "";
    if (jsoncompetition == "UEFA Champions League") {
        jsoncompetitionstage = "in the " + jp.query(jsongamelive, '$.group');
    } else {
        jsoncompetitionstage;
    }
    var jsongamelivedate = jp.query(jsongamelive, '$.utcDate');
    var jsongamelivedatestart = mom(jsongamelivedate,"YYYY-MM-DDTHH:mm:ssZ");
    console.log("jsongamelivedatestart: ", jsongamelivedatestart);
    var jsongamelivedatenow = mom(mom().format(), "YYYY-MM-DDTHH:mm:ssZ");
    console.log("datwnow", jsongamelivedatenow);
    console.log("jsongamelivedatenow: ", jsongamelivedatenow);
    var jsongameliveclock = jsongamelivedatenow.diff(jsongamelivedatestart, 'minutes');
    console.log("jsongameliveclock: ", jsongameliveclock);
    if (45<jsongameliveclock<=60) {jsongameliveclock="45' Half Time"}
    if (jsongameliveclock>60) {jsongameliveclock = jsongameliveclock-15}
    if (jsongameliveclock>105) {jsongameliveclock = "90' Extended Time"}
    
    var homelogo = await logo(jsongamelivehomeid);
    console.log("homelogo: ",homelogo);
    var awaylogo = await logo(jsongameliveawayid);
    console.log("awaylogo: ",awaylogo);
    
    var conc = jsongamelivehome.concat(" is playing versus ", jsongameliveaway, " for the journey ", jsongamelivematchday , " of ", jsoncompetition, jsoncompetitionstage, ". The score is ", jsongamelivehomescore, " to ", jsongameliveawayscore, " after ", jsongameliveclock, " minutes.");
    console.log("conc: ", conc);

        var paramsddb = {
          Key: {"ID": "livemarker"},
          AttributeUpdates: {
            "gameinfo" : {
                Action: "PUT",
                Value: {
                "jsongamelivehome": jsongamelivehome,
                "jsongamelivehomescore": jsongamelivehomescore,
                "jsongameliveaway": jsongameliveaway,
                "jsongameliveawayscore": jsongameliveawayscore,
                "jsoncompetition": jsoncompetition,
                "jsoncompetitionstage": jsoncompetitionstage,
                "jsongameliveclock": jsongameliveclock
              }
            },
            "output" : {
              Action: "PUT",
              Value: {
                "conc": conc
              }
          }
          }, 
          ReturnConsumedCapacity: "TOTAL",
          TableName: "PSGNewscast"
      };
        console.log("paramsddb: ",paramsddb);
        var ddbput = await documentClient.update(paramsddb).promise();
        //if (err) console.log(err, err.stack); // an error occurred
        //else     console.log(data);           // successful response
        //});
        console.log("ddbput: ",ddbput);

        return {
          "lastresults": conc,
              "livegame": "gameinfo"
          };

    //console.log("conc2: ",tweetfind);
    //return tweetfind;
} else {
  console.log("output from ddbcheck: ", ddbcheck.Item);
  //console.log("tweetslist from ddbcheck: ", ddbcheck.Item.livegame.gameinfo);
  return {
      'lastresults': {
          'conc': ddbcheck.Item.output.conc,
          'livetweet': ddbcheck.Item.livegame
      }
  };
}

};