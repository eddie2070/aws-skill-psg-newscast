const axios = require('axios');
const jp = require('jsonpath');
const converter = require('number-to-words');
const AWS = require('aws-sdk');
var documentClient = new AWS.DynamoDB.DocumentClient();
const moment = require('moment-timezone');
const sharp = require("sharp");
var s3 = new AWS.S3();
var lambda = new AWS.Lambda();

var eventbridge = new AWS.EventBridge();

// var livegamemarker = (date) => {
//     console.log("livegamemarker: ", date);
//     var cronexp = moment(date[0]).format("m H D M [?] YYYY");
//     console.log("cronexp: ",cronexp);
    
//     var paramseventrule = {
//       Name: 'PSGNewscast-livemarker', /* required */
//       Description: 'adds live game marker',
//       //RoleArn: 'STRING_VALUE',
//       ScheduleExpression: 'cron('+cronexp+')',
//       State: "ENABLED",
//       Tags: [
//         {
//           Key: 'Name', /* required */
//           Value: 'PSGNewscast' /* required */
//         },
//         /* more items */
//   ]
// };
//     eventbridge.putRule(paramseventrule, function(err, data) {
//       if (err) console.log(err, err.stack); // an error occurred
//       else     console.log(data);           // successful response
//     });
    
//     var paramseventtarget = {
//         Rule: "PSGNewscast-livemarker",
//         Targets: [{Arn: "arn:aws:lambda:us-east-1:753451452012:function:PSGNewscast-nextgame", 
//         Id: "Lambdalivemarker", 
//         Input: '{"marker": "playingnow"}'
//         }]
//     };
//     eventbridge.putTargets(paramseventtarget, function(err, data) {
//       if (err) console.log(err, err.stack); // an error occurred
//       else     console.log(data);           // successful response
// });

// };

var liverefresh = async (state) => {
    console.log("liverefresh: ", state);

            var paramseventrule = {
                Name: 'PSGNewscast-liverefresh', /* required */
                Description: 'refreshes score every 3 minutes, when game is occuring',
                ScheduleExpression: 'rate(3 minutes)',
                State: state,
                Tags: [
                    {
                    Key: 'Project', /* required */
                    Value: 'PSGNewscast' /* required */
                    },
                    ]
            };
            console.log("paramseventrule: ", paramseventrule);

            var putrulefresh = await eventbridge.putRule(paramseventrule).promise();
            console.log("putrulefresh ARN: ", putrulefresh.RuleArn);
            
            var paramlambdatrigperm = {
                Action: 'lambda:InvokeFunction',
                FunctionName: 'PSGNewscast-livegame',
                Principal: 'events.amazonaws.com', 
                StatementId: 'Event'+Date.now(),
                SourceArn: putrulefresh.RuleArn
            };
            var lambdatrigperm = await lambda.addPermission(paramlambdatrigperm).promise();
            console.log("lambdatrigperm: ",lambdatrigperm);
            
            // var paramsedd = {
            //      FunctionName: 'PSGNewscast-livegame' /* required */
            // }
            // var lbdeventsource = await lambda.createEventSourceMapping(paramsedd).promise();
            // console.log("lbdeventsource: ",lbdeventsource);
    
            var paramseventtarget = {
                Rule: "PSGNewscast-liverefresh",
                Targets: [{Arn: "arn:aws:lambda:us-east-1:753451452012:function:PSGNewscast-livegame", 
                Id: "Lambdaliverefresh"+Date.now()
                }]
            };

            var liveputtarget = await eventbridge.putTargets(paramseventtarget).promise();
            console.log("liveputtarget: ",liveputtarget);
            console.log("target added to Eventbridge rule");
            // return liveputtarget;

};


const url = 'http://api.football-data.org/v2/teams/524/matches?status=SCHEDULED';
const headers = {
  Accept: 'application/json',
  'Accept-Charset': 'utf-8',
  'X-Auth-Token': 'a9bc952d181c47268446a51dafc83286'
};

var axiosreq = async (urlparam) => {
    var urlv = urlparam;
    var headers = {
      Accept: 'application/json',
      'Accept-Charset': 'utf-8',
      'X-Auth-Token': 'a9bc952d181c47268446a51dafc83286'
    };
    var axiosresp = await axios.get(urlv, { headers });
    console.log("axiosresp:",axiosresp);
    return axiosresp;
};

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
    console.log("event: ", event);
    try {console.log("event: ", event.Records[0].dynamodb);} catch (err) {console.log(err)}
    try {
        if (event.marker == "playingnow") {
            console.log("marker for live game detected");
            var paramsddb = {
                Item: {
                    "ID": "livemarker",
                    "current": "true",
                    "gameinfo": "notstarted",
                    'UpdateTime': Math.floor(Date.now() /1000) ,
                    'TTL':  Math.floor(Date.now()/1000 + 6500) ,
                }, 
                ReturnConsumedCapacity: "TOTAL",
                TableName: "PSGNewscast"
            };
            var ddbputmarker = await documentClient.put(paramsddb).promise();
            console.log("ddbputmarker: ", ddbputmarker);
            var refreshactivation = await liverefresh("ENABLED");
            console.log("refreshactivation: ", refreshactivation);
           
        } else {console.log("event marker not at true")}
        
        try {
            console.log('event.Records[0].eventName :' , event.Records[0].eventName);
            console.log('event.Records[0].dynamodb.Keys.ID :' , event.Records[0].dynamodb.Keys.ID);
        
        if (event.Records[0].eventName == "REMOVE" && event.Records[0].dynamodb.Keys.ID.S === 'livemarker') {
            var refreshoff = liverefresh("DISABLED");
            console.log("Disabled Eventbridge Rule");
            return refreshoff;
        } else {console.log("game still playing or not started")}
        } catch {console.log("no ddb event stream")}
        
        if (event.Records[0].eventName == "REMOVE" && event.Records[0].dynamodb.Keys.ID.S != 'livemarker') {
            console.log("Triggered by REMOVE on nextgame or anything else than livemarker. Not doing anything");
            return "Exit. Triggered by REMOVE on nextgame or anything else than livemarker. Not doing anything";
        }
        
    } catch(err) {console.log("no live game marker or err: ",err)}
    console.log("context: ", context);
  var params = {
            Key: {
                "ID": "nextgame"
            }, 
            TableName: "PSGNewscast"
        };
    var ddbcheck  = await documentClient.get(params).promise();
  console.log('ddbcheck: ', ddbcheck);
  if (JSON.stringify(ddbcheck) === '{}') {
    const response = await axios.get(url, { headers });
    var jsongamescheduled = jp.query(response.data, '$.matches[?(@.status==="SCHEDULED")]');
    var jsongamenextgame = jsongamescheduled[0];
    console.log("jsongamenextgame:", jsongamenextgame);
    var jsonid = jp.query(jsongamenextgame, '$.id');
    var jsonday = jp.query(jsongamenextgame, '$.matchday');
    var jsoncompetition = jp.query(jsongamenextgame, '$.competition.name');
    var jsoncompetitionstage = "";
    if (jsoncompetition == "UEFA Champions League") {
        jsoncompetitionstage = "in the " + jp.query(jsongamenextgame, '$.group');
    } else {
        jsoncompetitionstage = "";
    }
    //console.log("jsonid:", jsonid);
    //console.log("jsonvenue:", jsonvenue);
    var jsongamenexthome = jp.query(jsongamenextgame, '$.homeTeam.name');
    var jsongamecurhomeid = jp.query(jsongamenextgame, '$.homeTeam.id');
    var jsongamenextaway = jp.query(jsongamenextgame, '$.awayTeam.name');
    var jsongamecurawayid = jp.query(jsongamenextgame, '$.awayTeam.id');
    if (jsongamenexthome == "Paris Saint-Germain FC") {
        var jsongamestadium = "Parc des Princes";
    }  else {
        var jsongamestadiumquery = await axiosreq('http://api.football-data.org/v2/teams/'+jsongamecurhomeid);
        console.log("jsongamestadiumquery: ",jsongamestadiumquery);
        var jsongamestadium = jp.query(jsongamestadiumquery.data, '$.venue');
        //var jsongamestadium = jsongamenextaway;
    }
    var jsongamedate = jp.query(jsongamenextgame, '$.utcDate');
    //console.log("jsongamenexthome:", jsongamenexthome);
    //console.log("jsongamenextaway:", jsongamenextaway);
    //console.log("jsongamedate:", jsongamedate);
    var date = new Date(jsongamedate);
    var dateformat = moment(date).tz("America/New_York").format('dddd MMMM Do YYYY [at] h:mm a [East Coast time]');
    //console.log("dateformat:", dateformat);
                //in the game of the x journey of league 1, with XX playin YY, XX won 1 to 2, would you like to know more.
            //Leaderboard The position of PSG in League One is first, with 9 points.
            //Angers SCO is second with 7 points. Clermont Foot 63 is third with 7 points. You can ask for the last results, , next game, position in the leaderboard, latest news, or music.
            //The PSG next game will be on Sunday August 29th 2021 at 2:45 pm East Coast time, with Stade Brestois 29, playing versus Paris Saint-Germain FC for the fourth journey of Ligue 1 . Would you like to know more?
    var conc = "The PSG next game will be on ".concat(dateformat ,", with ", jsongamenexthome," playing versus ", jsongamenextaway," for the ", converter.toWordsOrdinal(jsonday), " journey of ", jsoncompetition, ".");
    //var conc = str1.concat(positaway, strmid, str2, pointsaway, strfin)
    //var jsonb = JSON.parse(conc);
    console.log("conc: ", conc);
    
    //livegamemarker(jsongamedate);
    
    //4. convert from a remote file
    var homelogo = await logo(jsongamecurhomeid);
    console.log("homelogo: ",homelogo);
    var awaylogo = await logo(jsongamecurawayid);
    console.log("awaylogo: ",awaylogo);
    


    //var hometeamlogo = "https://crests.football-data.org/"+jsongamecurhomeid+".png";
    var hometeamlogo = "https://psgnewscast-skill2021.s3.amazonaws.com/teamlogo/"+jsongamecurhomeid+".png";
    var awayteamlogo = "https://psgnewscast-skill2021.s3.amazonaws.com/teamlogo/"+jsongamecurawayid+".png";
    // "https://crests.football-data.org/"+jsongamecurawayid+".png";
    console.log("awayteamlogo: ",awayteamlogo);    
            
    var nextgamedata = {
            "hometeamlogo": hometeamlogo,
            "awayteamlogo": awayteamlogo,
            "journey": jsonday[0],
            "jsoncompetition": jsoncompetition[0],
            "jsongamedate": dateformat,
            "jsongamestadium": jsongamestadium,
            "jsongamenexthome": jsongamenexthome[0],
            "jsongamenextaway": jsongamenextaway[0]
        };
    var paramsddb = {
                Item: {
                    "ID": "nextgame",
                    "output": {
                        conc
                    },
                    "nextgame": {
                          nextgamedata
                              },
                    'UpdateTime': Math.floor(Date.now() /1000) ,
                    'TTL':  Math.floor(Date.now()/1000 + 600) ,
                }, 
                ReturnConsumedCapacity: "TOTAL",
                TableName: "PSGNewscast"
            };
            console.log("paramsddb: ",paramsddb);
            var ddbput = await documentClient.put(paramsddb).promise();
            //if (err) console.log(err, err.stack); // an error occurred
            //else     console.log(data);           // successful response
            //});
            console.log("ddbput: ",ddbput);
            return {
                "lastresults": {
                    conc,
                    "nextgame":{
                       "hometeamlogo": hometeamlogo,
                       "awayteamlogo": awayteamlogo,
                       "journey": jsonday[0],
                       "jsoncompetition": jsoncompetition[0],
                       "jsongamedate": dateformat,
                       "jsongamestadium": jsongamestadium,
                       "jsongamenexthome": jsongamenexthome[0],
                       "jsongamenextaway": jsongamenextaway[0]
                    }
                }
            };
  } else {
     console.log("output from ddbcheck: ", ddbcheck.Item);
     console.log("score from ddbcheck: ", ddbcheck.Item.nextgame);
            return {
                "lastresults": {
                    'conc': ddbcheck.Item.output.conc,
                    'nextgame': ddbcheck.Item.nextgame.nextgamedata
                    
            }
        };
    }
};
    