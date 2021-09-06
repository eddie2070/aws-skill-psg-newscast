const axios = require('axios');
const jp = require('jsonpath');
const AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();
var documentClient = new AWS.DynamoDB.DocumentClient();

const url = 'http://api.football-data.org/v2/teams/524/matches/?status=LIVE'
const headers = {
  Accept: 'application/json',
  'Accept-Charset': 'utf-8',
  'X-Auth-Token': 'a9bc952d181c47268446a51dafc83286'
}

var Twit = require('twit'); // this is how we import the twit package
var config = require('./config') //this is we import the config file which is a js file which contains the keys ans tokens
var striptags = require('striptags');
var emojiStrip = require('emoji-strip');
var twitterScreenName = require('twitter-screen-name');

exports.handler =  (event, context, callback) => {
    //const response = await axios.get(url, { headers })
    //console.log(response.data);
    var T = new Twit(config); //this is the object of twit which will help us to call functions inside it
    //var params = {from:'PSG_English', until:'2018-09-24', count: 10}; // this is the param variable which will have key and value,the key is the keyword which we are interested in searching and count is the count of it
    var params = {from:process.env.twit, count: 10, tweet_mode: 'extended'}; // this is the param variable which will have key and value,the key is the keyword which we are interested in searching and count is the count of it

    var tweetfind = T.get('search/tweets', params,function (err, reply) {
        var tweets = reply
        console.log("tweets:", tweets);
        let jsontweet = JSON.stringify(tweets);
        console.log(jsontweet);
        var jsontweetstring = JSON.parse(jsontweet);
        console.log(jsontweetstring);
        var jsongametweets = jp.query(jsontweetstring, '$.statuses[*].full_text');
        var jsonlivetweets1 = striptags(emojiStrip(jsongametweets[0].replace(/\n/g,' ').replace(/^http|https:\/\/\S+/g,' ').replace(/(")/g,' ').replace(/(\.")/g,' ').replace(/(' )/g,'th minute \. ').replace(/\bGO\S*L\b/g,' GOAL ').replace(/@neymarjr/g,'Neymar').replace(/@ECavaniOfficial/g,'Cavani').replace(/@TTuchelofficial/g,'Thomas Tuchel').replace(/@c_nk97/g,'Christopher Nkunku').split(/[\r?\n?\t?\v?\f]+/)[0]));
        var jsonlivetweets2 = striptags(emojiStrip(jsongametweets[1].replace(/\n/g,' ').replace(/^http|https:\/\/\S+/g,' ').replace(/(")/g,' ').replace(/(\.")/g,' ').replace(/(' )/g,'th minute \. ').replace(/\bGO\S*L\b/g,' GOAL ').replace(/@neymarjr/g,'Neymar').replace(/@ECavaniOfficial/g,'Cavani').replace(/@TTuchelofficial/g,'Thomas Tuchel').replace(/@c_nk97/g,'Christopher Nkunku').split(/[\r?\n?\t?\v?\f]+/)[0]));
        var jsonlivetweets3 = striptags(emojiStrip(jsongametweets[2].replace(/\n/g,' ').replace(/^http|https:\/\/\S+/g,' ').replace(/(")/g,' ').replace(/(\.")/g,' ').replace(/(' )/g,'th minute \. ').replace(/\bGO\S*L\b/g,' GOAL ').replace(/@neymarjr/g,'Neymar').replace(/@ECavaniOfficial/g,'Cavani').replace(/@TTuchelofficial/g,'Thomas Tuchel').replace(/@c_nk97/g,'Christopher Nkunku').split(/[\r?\n?\t?\v?\f]+/)[0]));
        var jsonlivetweets4 = striptags(emojiStrip(jsongametweets[3].replace(/\n/g,' ').replace(/^http|https:\/\/\S+/g,' ').replace(/(")/g,' ').replace(/(\.")/g,' ').replace(/(' )/g,'th minute \. ').replace(/\bGO\S*L\b/g,' GOAL ').replace(/@neymarjr/g,'Neymar').replace(/@ECavaniOfficial/g,'Cavani').replace(/@TTuchelofficial/g,'Thomas Tuchel').replace(/@c_nk97/g,'Christopher Nkunku').split(/[\r?\n?\t?\v?\f]+/)[0]));
        var jsonlivetweets5 = striptags(emojiStrip(jsongametweets[4].replace(/\n/g,' ').replace(/^http|https:\/\/\S+/g,' ').replace(/(")/g,' ').replace(/(\.")/g,' ').replace(/(' )/g,'th minute \. ').replace(/\bGO\S*L\b/g,' GOAL ').replace(/@neymarjr/g,'Neymar').replace(/@ECavaniOfficial/g,'Cavani').replace(/@TTuchelofficial/g,'Thomas Tuchel').replace(/@c_nk97/g,'Christopher Nkunku').split(/[\r?\n?\t?\v?\f]+/)[0]));
        console.log("jsonlivetweets1:", jsonlivetweets1);  
        console.log("jsonlivetweets2:", jsonlivetweets2);

        var str1 = '{"type": "success", "tweet1": "';
        var str9 = ',"tweet2": "';
        var str10 = ',"tweet3": "';
        var str11 = ',"tweet4": "';
        var str12 = ',"tweet5": "';
        var strmid = '"';
        var strfin = '"}';
        var conc = "Here is the latest news on Paris Saint Germain. First news! ".concat(jsonlivetweets1,". Second news! ", jsonlivetweets2,". Third news! ", jsonlivetweets3,". Fourth news! ", jsonlivetweets4);
        console.log("conc:", conc);
        return {
          "lastresults": {
              conc,
              "livetweet":{
                 "jsonlivetweets1": jsonlivetweets1,
                 "jsonlivetweets2": jsonlivetweets2,
                 "jsonlivetweets3": jsonlivetweets3,
                 "jsonlivetweets4": jsonlivetweets4
              }
          }
      };
    });
}