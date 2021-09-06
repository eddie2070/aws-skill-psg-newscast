const axios = require('axios');
const jp = require('jsonpath');
const converter = require('number-to-words');
const AWS = require('aws-sdk');
//var dynamodb = new AWS.DynamoDB();
var documentClient = new AWS.DynamoDB.DocumentClient();
//const moment = require('moment-timezone');

const url = 'http://api.football-data.org/v2/competitions/2015/standings';
const headers = {
  Accept: 'application/json',
  'Accept-Charset': 'utf-8',
  'X-Auth-Token': 'a9bc952d181c47268446a51dafc83286'
};

exports.handler = async (event, context, callback) => {
  var params = {
            Key: {
                "ID": "standings"
            }, 
            TableName: "PSGNewscast"
        };
    var ddbcheck  = await documentClient.get(params).promise();
  console.log('ddbcheck: ', ddbcheck);
  if (JSON.stringify(ddbcheck) === '{}') {
    const response = await axios.get(url, { headers });
    console.log("Classement:", response.data);
    var jsonq = jp.query(response.data.standings[0], '$.table[?(@.team.id==524)].position');
    console.log("test:", jsonq);
    var posit = converter.toWordsOrdinal(jsonq);
    var points = jp.query(response.data.standings[0], '$.table[?(@.team.id==524)].points');
    
    if (jsonq == 1) {
            var jsonteamaheadname = jp.query(response.data.standings[0], '$.table[1].team.name');
            var jsonteamaheadpositioncard = jp.query(response.data.standings[0], '$.table[1].position');
            var jsonteamaheadposition = converter.toWordsOrdinal(jp.query(response.data.standings[0], '$.table[1].position'));
            var jsonteamaheadpoints = jp.query(response.data.standings[0], '$.table[1].points');
            var jsonteambehindname = jp.query(response.data.standings[0], '$.table[2].team.name');
            var jsonteambehindpositioncard = jp.query(response.data.standings[0], '$.table[2].position');
            var jsonteambehindposition = converter.toWordsOrdinal(jp.query(response.data.standings[0], '$.table[2].position'));
            var jsonteambehindpoints = jp.query(response.data.standings[0], '$.table[2].points');
            
            var standingsdata = '[{"score":' +points[0]+ ',"listItemIdentifier": "2","ordinalNumber": "1","text": "Paris SG","position":'+ jsonq[0]+',"token": "1"},{"score":' +jsonteamaheadpoints[0]+',"listItemIdentifier": "2","ordinalNumber": 2,"text":"' +jsonteamaheadname[0]+'","position":' +jsonteamaheadpositioncard[0]+',"token": "2"},{"score":' +jsonteambehindpoints[0]+',"listItemIdentifier": "2","ordinalNumber": 2,"text":"' +jsonteambehindname[0]+'","position":' +jsonteambehindpositioncard[0]+',"token": "2"}]';
        }
        else {
            var a = posit - 1;
            console.log("ahead:", a);
            var b = posit + 1;
            console.log("behind:", b);
            var jsonteamaheadname = jp.query(response.data.standings[0], '$.table[a].team.name');
            var jsonteamaheadpoints = jp.query(response.data.standings[0], '$.table[a].points');
            var jsonteambehindname = jp.query(response.data.standings[0], '$.table[b].team.name');
            var jsonteambehindpoints = jp.query(response.data.standings[0], '$.table[b].points');
            
            var standingsdata = '[{"score":' +jsonteamaheadpoints[0]+ ',"listItemIdentifier": "2","ordinalNumber": "1","text":' +jsonteamaheadname[0]+',"position":'+ a +',"token": "1"},{"score":' +points[0]+',"listItemIdentifier": "2","ordinalNumber": 2,"text":"Paris SG","position":' +jsonq+',"token": "2"},{"score":' +jsonteambehindpoints[0]+',"listItemIdentifier": "2","ordinalNumber": 2,"text":"' +jsonteambehindname[0]+'","position":' +b+',"token": "2"}]';

        }

    //console.log("dateformat:", dateformat);
                //in the game of the x journey of league 1, with XX playin YY, XX won 1 to 2, would you like to know more.
            //Leaderboard The position of PSG in League One is first, with 9 points.
            //Angers SCO is second with 7 points. Clermont Foot 63 is third with 7 points. You can ask for the last results, , next game, position in the leaderboard, latest news, or music.
            //The PSG next game will be on Sunday August 29th 2021 at 2:45 pm East Coast time, with Stade Brestois 29, playing versus Paris Saint-Germain FC for the fourth journey of Ligue 1 . Would you like to know more?
    var conc = "The position of PSG in Ligue 1 is ".concat(posit ,", with ", points," points");
    console.log("conc: ", conc);
    
    // var standingsdata = {
    //     "positioncard": jsonq[0],
    //     "position": posit,
    //     "points": points[0],
    //     "teamaheadname": jsonteamaheadname[0],
    //     "teamaheadposition": jsonteamaheadposition,
    //     "teamaheadpositioncard": jsonteamaheadpositioncard,
    //     "teamaheadpoints": jsonteamaheadpoints[0],
    //     "teambehindname": jsonteambehindname[0],
    //     "teambehindposition": jsonteambehindposition,
    //     "teambehindpoints": jsonteambehindpoints[0],
    //     "teambehindpointscard": jsonteambehindpositioncard
    // };
    
    var paramsddb = {
        Item: {
            "ID": "standings",
            "output": {
                conc
            },
            "standings": {
                standingsdata
            },
            'UpdateTime': Math.floor(Date.now() /1000) ,
            'TTL':  Math.floor(Date.now()/1000 + 600) ,
        }, 
        ReturnConsumedCapacity: "TOTAL",
        TableName: "PSGNewscast"
    };
    console.log("paramsddb: ",paramsddb);
    var ddbput = await documentClient.put(paramsddb).promise();
    console.log("ddbput: ",ddbput);
    return {
        "lastresults": {
            conc,
            "standings":{
               standingsdata
            }
        }
    };
  } else {
     console.log("output from ddbcheck: ", ddbcheck.Item);
     var standingsddb = ddbcheck.Item.standings;
            return {
                "lastresults": {
                    "conc": ddbcheck.Item.output.conc,
                    "standings" : ddbcheck.Item.standings
            }
        };
    }
};