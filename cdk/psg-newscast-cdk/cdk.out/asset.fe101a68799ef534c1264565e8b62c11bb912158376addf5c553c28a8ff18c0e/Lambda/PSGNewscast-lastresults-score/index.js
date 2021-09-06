const axios = require('axios');
const jp = require('jsonpath');
const converter = require('number-to-words');
const AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB();
var documentClient = new AWS.DynamoDB.DocumentClient();
//var AWSXRay = require('aws-xray-sdk-core');

//AWSXRay.captureAWSClient(dynamodb.service);

const url= 'http://api.football-data.org/v2/teams/524/matches?limit=100';
const headers= {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'X-Auth-Token': 'a9bc952d181c47268446a51dafc83286'
    };

    exports.handler = async (event, context, callback) => {
        var params = {
            Key: {
                "ID": "lastresults"
            }, 
            TableName: "PSGNewscast"
        };
        //var ddbcheck = await dynamodb.getItem(params).promise();
        var ddbcheck  = await documentClient.get(params).promise();
        console.log("ddbcheck: ", ddbcheck);
        if (JSON.stringify(ddbcheck) === "{}") {
            let response = await axios.get(url, {headers});
            //console.log("test: ", response.data);
            //let json = JSON.parse(response);
            //console.log("json: ",json);
            var jsongamefinished = jp.query(response.data, '$.matches[?(@.status==="FINISHED")]');
            console.log("jsongamefinished: ",jsongamefinished);
            var jsongamelastgame = jsongamefinished[jsongamefinished.length - 1];
            var jsonday = jp.query(jsongamelastgame, '$.matchday');
            var jsoncompetition = jp.query(jsongamelastgame, '$.competition.name');
            var jsondaynumber = converter.toWordsOrdinal(jsonday);
            var jsongamedateUTC = jp.query(jsongamelastgame, '$.utcDate');
            console.log("jsongamedateUTC:", jsongamedateUTC[0]);
            var jsongamedate = jsongamedateUTC[0].split("T")[0];
            var jsongamecurhome = jp.query(jsongamelastgame, '$.homeTeam.name');
            console.log("jsongamecurhome:", jsongamecurhome);
            var jsongamecurhomeid = jp.query(jsongamelastgame, '$.homeTeam.id');
            var jsongamecuraway = jp.query(jsongamelastgame, '$.awayTeam.name');
            console.log("jsongamecuraway:", jsongamecuraway);
            var jsongamecurawayid = jp.query(jsongamelastgame, '$.awayTeam.id');
            var jsongamecurwinner = jp.query(jsongamelastgame, '$.score.winner');
            if (jsongamecurwinner == "HOME_TEAM") {
                var jsongamecurwinnername = jsongamecurhome+" won ";
            }  else if (jsongamecurwinner == "AWAY_TEAM") {
                var jsongamecurwinnername = jsongamecuraway+" won ";
            }
            else if (jsongamecurwinner == "DRAW") {
                var jsongamecurwinnername = "draw game between the two teams";
            }
            console.log("currentGameHomeTeam:", jsongamecurhome);
            console.log("cjsongamecurwinnername:", jsongamecurwinnername);
            var jsongamecurhomescore = jp.query(jsongamelastgame, '$.score.fullTime.homeTeam');
            console.log("cjsongamecurwinnername:", jsongamecurhomescore);
            var jsongamecurawayscore = jp.query(jsongamelastgame, '$.score.fullTime.awayTeam');
            console.log("cjsongamecurwinnername:", jsongamecurawayscore);
            //in the game of the x journey of league 1, with XX playin YY, XX won 1 to 2, would you like to know more.
            //Leaderboard The position of PSG in League One is first, with 9 points.
            //Angers SCO is second with 7 points. Clermont Foot 63 is third with 7 points. You can ask for the last results, , next game, position in the leaderboard, latest news, or music.
            //The PSG next game will be on Sunday August 29th 2021 at 2:45 pm East Coast time, with Stade Brestois 29, playing versus Paris Saint-Germain FC for the fourth journey of Ligue 1 . Would you like to know more?
            var conc = "Last results. ".concat("In the game of the ", jsondaynumber, " journey, with ", jsongamecuraway," playing at ", jsongamecurhome,". ", jsongamecurwinnername, jsongamecurhomescore, " to ", jsongamecurawayscore,".");
                //jsondaynumber,strmid,str2,jsongamecurhome,strmid,str3,jsongamecuraway,strmid,str4,jsongamecurwinnername,strmid,str5,jsongamecurhomescore,strmid,str6,jsongamecurawayscore,strmid,str7,jsongamedate,strmid,str8,jsoncompetition,strfin);
            console.log("conc: ", conc);

            var hometeamlogo = "https://crests.football-data.org/"+jsongamecurhomeid+".png";
            console.log("hometeamlogo: ",hometeamlogo);  
            var awayteamlogo = "https://crests.football-data.org/"+jsongamecurawayid+".png";
            console.log("awayteamlogo: ",awayteamlogo);    
            
            //var hometeamlogo2 = "https://www.logofootball.net/wp-content/uploads/".concat(jsongamecurhome[0].replace(/\s+/g, '-'),'.png');
            
            var scoredata = {
                        "homescore": jsongamecurhomescore[0],
                        "awayscore": jsongamecurawayscore[0],
                        "hometeamlogo": hometeamlogo,
                        "awayteamlogo": awayteamlogo,
                        "journey": jsonday[0],
                        "jsoncompetition": jsoncompetition[0],
                        "jsongamedate": jsongamedate[0]
            };
            console.log("scoredata: ",scoredata);
            
            var paramsddb = {
                Item: {
                    "ID": "lastresults",
                    "output": {
                        conc
                    },
                    "score":{
                        scoredata
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
                    "score":{
                        "homescore": jsongamecurhomescore[0],
                        "awayscore": jsongamecurawayscore[0],
                        "hometeamlogo": hometeamlogo,
                        "awayteamlogo": awayteamlogo,
                        "journey": jsonday,
                        "jsoncompetition": jsoncompetition,
                        "jsongamedate": jsongamedate
                    }
                }
            };
        } else {
            console.log("output from ddbcheck: ", ddbcheck.Item);
            console.log("score from ddbcheck: ", ddbcheck.Item.score);
            return {
                'lastresults': {
                    'conc': ddbcheck.Item.output.conc,
                    'score': ddbcheck.Item.score.scoredata
                }
            };
        }
    };