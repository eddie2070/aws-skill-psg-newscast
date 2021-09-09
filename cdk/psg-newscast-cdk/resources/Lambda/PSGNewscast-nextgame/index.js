const axios = require('axios');
const jp = require('jsonpath');
const converter = require('number-to-words');
const AWS = require('aws-sdk');
var documentClient = new AWS.DynamoDB.DocumentClient();
const moment = require('moment-timezone');
const sharp = require("sharp");
var s3 = new AWS.S3();


const url = 'http://api.football-data.org/v2/teams/524/matches?status=SCHEDULED';
const headers = {
  Accept: 'application/json',
  'Accept-Charset': 'utf-8',
  'X-Auth-Token': 'a9bc952d181c47268446a51dafc83286'
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
        var jsongamestadium = jsongamenextaway;
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
    