const axios = require('axios');
const jp = require('jsonpath');
const converter = require('number-to-words');
const AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB();
var documentClient = new AWS.DynamoDB.DocumentClient();
const sharp = require("sharp");
const moment = require('moment-timezone');
var s3 = new AWS.S3();

//var AWSXRay = require('aws-xray-sdk-core');

//AWSXRay.captureAWSClient(dynamodb.service);

const url= 'http://api.football-data.org/v2/teams/524/matches?limit=100';
const headers= {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'X-Auth-Token': 'a9bc952d181c47268446a51dafc83286'
    };
const urlscoremeta= 'https://v3.football.api-sports.io/fixtures?team=85&last=1';
const urlscoredata= 'https://v3.football.api-sports.io/fixtures/events\?fixture=';



var logo = async (teamid) => {

    var paramss3logocheck = {
    Bucket: "psgnewscast-skill2021", 
    Key: "teamlogo/"+teamid+".png"
    };
        
    try {
        await s3.headObject(paramss3logocheck).promise();
        console.log("File Found in S3");
    } catch (err) {
        console.log("File not Found ERROR : " + err.code +". Uploading image in S3 " +teamid);

         //4. convert from a remote file
        //var hometeamlogo = "https://crests.football-data.org/"+jsongamecurhomeid+".png";
        if (teamid == "champions") {
            var input = (await axios({ url: 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg', responseType: "arraybuffer" })).data;
        } else { input = (await axios({ url: 'https://crests.football-data.org/'+teamid+'.svg', responseType: "arraybuffer" })).data;}
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

var gameevents = async (home) => {
    console.log("gameevents input home value: ", home);
    let headers= {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-apisports-key': 'd68f8e5b4877d76423b507b79e80f26b'
    };
    let fixtureidreq = await axios.get(urlscoremeta, {headers});
    console.log("fixtureidreq: ",fixtureidreq);
    var fixtureid=fixtureidreq.data.response[0].fixture.id;
    console.log("fixtureid: ",fixtureid);
    let fixture_events = await axios.get(urlscoredata+fixtureid, {headers});
    console.log("fixture_events: ",fixture_events.data.response);
    //var fixturegoals = jp.query(fixture_events.data, '$.response[?(@.type==="Goal")]..player');..player[?(@.name)]' 
    var fixturegoalsteam = jp.query(fixture_events.data, '$.response[?(@.type==="Goal")]..team');
    console.log("fixturegoalsteam: ",fixturegoalsteam);
    var fixturegoalsplayer = jp.query(fixture_events.data, '$.response[?(@.type==="Goal")]..player');
    console.log("fixturegoalsplayer: ",fixturegoalsplayer);
    var fixturegoalstime = jp.query(fixture_events.data, '$.response[?(@.type==="Goal")]..time');
    console.log("fixturegoalstime: ",fixturegoalstime);
    var goals = [];
    for (let i = 0; i < fixturegoalsteam.length; i++) {
            if (typeof goals[fixturegoalsteam[i].name] !== 'undefined') {
                var a = goals[fixturegoalsteam[i].name];
                console.log("a: ", a);
                var b = a.length;
                goals[fixturegoalsteam[i].name][b]= {
                "scoreplayer": fixturegoalsplayer[i].name,
                "scoretime": fixturegoalstime[i].elapsed,
                "scoretimeextra": fixturegoalstime[i].extra
                };
            } else {
                goals[fixturegoalsteam[i].name]= [{
                    "scoreplayer": fixturegoalsplayer[i].name,
                    "scoretime": fixturegoalstime[i].elapsed,
                    "scoretimeextra": fixturegoalstime[i].extra
                }];
            }
    }
    console.log("goals array: ",typeof goals);
    var team1 = Object.keys(goals)[0];
    console.log("team1: ", team1);
    var team2 = Object.keys(goals)[1];
    if (home == 'Paris Saint-Germain FC' && team1 == "Paris Saint Germain") {
        console.log("first loop");
        Object.defineProperty(goals, 'homegoals', Object.getOwnPropertyDescriptor(goals, Object.keys(goals)[0]));
        console.log("Object.keys(goals)[0] AC: ", Object.keys(goals)[0]);
        Object.defineProperty(goals, 'awaygoals', Object.getOwnPropertyDescriptor(goals, Object.keys(goals)[1]));
        console.log("Object.keys(goals)[0] AD: ", Object.keys(goals)[1]);
        delete goals[team1];
        delete goals[team2];
    } else {
        console.log("second loop");
        Object.defineProperty(goals, 'awaygoals', Object.getOwnPropertyDescriptor(goals, Object.keys(goals)[0]));
        console.log("Object.keys(goals)[0] AC: ", Object.keys(goals)[0]);
        Object.defineProperty(goals, 'homegoals', Object.getOwnPropertyDescriptor(goals, Object.keys(goals)[1]));
        console.log("Object.keys(goals)[0] AD: ", Object.keys(goals)[1]);
        delete goals[team1];
        delete goals[team2];
    }
    console.log("goals array AA: ",goals);
    return goals;
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
        console.log("jsongamedate:", jsongamedate);
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
        var date = new Date(jsongamedate);
        console.log("date:", date);
        var dateformat = moment(jsongamedate).format('dddd MMMM Do YYYY');
        console.log("dateformat2: ",dateformat);
        var jsonstageUEFA = "";
        var jsongroupUEFA = "";
        if (jsoncompetition == "UEFA Champions League") {
            jsonstageUEFA = jp.query(jsongamelastgame, '$.stage');
            var logoUEFA = await logo("champions");
            console.log("logoUEFA: ",logoUEFA);
            var logoUEFApng = "https://psgnewscast-skill2021.s3.amazonaws.com/teamlogo/champions.png";
            if (jsonstageUEFA == "GROUP_STAGE") {
                jsonstageUEFA = "Group stage";
                jsongroupUEFA = "- "+jp.query(jsongamelastgame, '$.group');
            } else jsongroupUEFA = "";
        } 
        //in the game of the x journey of league 1, with XX playin YY, XX won 1 to 2, would you like to know more.
        //Leaderboard The position of PSG in League One is first, with 9 points.
        //Angers SCO is second with 7 points. Clermont Foot 63 is third with 7 points. You can ask for the last results, , next game, position in the leaderboard, latest news, or music.
        //The PSG next game will be on Sunday August 29th 2021 at 2:45 pm East Coast time, with Stade Brestois 29, playing versus Paris Saint-Germain FC for the fourth journey of Ligue 1 . Would you like to know more?
        var conc = "Last results. ".concat("In the game of the ", jsondaynumber, " journey on ", dateformat, ", with ", jsongamecuraway," playing at ", jsongamecurhome,". ", jsongamecurwinnername, jsongamecurhomescore, " to ", jsongamecurawayscore,".");
            //jsondaynumber,strmid,str2,jsongamecurhome,strmid,str3,jsongamecuraway,strmid,str4,jsongamecurwinnername,strmid,str5,jsongamecurhomescore,strmid,str6,jsongamecurawayscore,strmid,str7,jsongamedate,strmid,str8,jsoncompetition,strfin);
        console.log("conc: ", conc);

        var homelogo = await logo(jsongamecurhomeid);
        console.log("homelogo: ",homelogo);
        var awaylogo = await logo(jsongamecurawayid);
        console.log("awaylogo: ",awaylogo);

        var hometeamlogo = "https://psgnewscast-skill2021.s3.amazonaws.com/teamlogo/"+jsongamecurhomeid+".png";
        var awayteamlogo = "https://psgnewscast-skill2021.s3.amazonaws.com/teamlogo/"+jsongamecurawayid+".png";
        
        var goalstats = await gameevents(jsongamecurhome);
        console.log("goalstats.homegoals[0]: ",goalstats.homegoals);
        console.log("goalstats.awaygoals[0]: ",goalstats.awaygoals);
        console.log("goalstats: ",goalstats);

        //var hometeamlogo = "https://crests.football-data.org/"+jsongamecurhomeid+".png";
        //console.log("hometeamlogo: ",hometeamlogo);  
        //var awayteamlogo = "https://crests.football-data.org/"+jsongamecurawayid+".png";
        //console.log("awayteamlogo: ",awayteamlogo);    
        
        //var hometeamlogo2 = "https://www.logofootball.net/wp-content/uploads/".concat(jsongamecurhome[0].replace(/\s+/g, '-'),'.png');
        
        var scoredata = {
                    "homescore": jsongamecurhomescore[0],
                    "awayscore": jsongamecurawayscore[0],
                    "hometeamlogo": hometeamlogo,
                    "awayteamlogo": awayteamlogo,
                    "journey": jsonday[0],
                    "jsoncompetition": jsoncompetition[0],
                    "jsongamedate": dateformat,
                    "jsonstageUEFA": jsonstageUEFA,
                    "jsongroupUEFA": jsongroupUEFA,
                    "homegoals": goalstats.homegoals,
                    "awaygoals": goalstats.awaygoals
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
                'TTL':  Math.floor(Date.now()/1000 + 2000) ,
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
                    "jsongamedate": dateformat,
                    "jsonstageUEFA": jsonstageUEFA,
                    "jsongroupUEFA": jsongroupUEFA,
                    "homegoals": goalstats.homegoals,
                    "awaygoals": goalstats.awaygoals
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