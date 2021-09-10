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



exports.handler = async (event, context, callback) => {
  var params = {
    Key: {
        "ID": "livegame"
    }, 
    TableName: "PSGNewscast"
};
//var ddbcheck = await dynamodb.getItem(params).promise();
var ddbcheck  = await documentClient.get(params).promise();
console.log("ddbcheck: ", ddbcheck);
if (JSON.stringify(ddbcheck) === "{}") {
  const response = await axios.get(url, { headers });
  console.log("response: ", response);

    

        var paramsddb = {
          Item: {
              "ID": "livegame",
              "output": "conc",
              "livegame":"gameinfo",
              'UpdateTime': Math.floor(Date.now() /1000) ,
              'TTL':  Math.floor(Date.now()/1000 + 600) ,
          }, 
          ReturnConsumedCapacity: "TOTAL",
          TableName: "PSGNewscast"
      };
        console.log("paramsddb: ",paramsddb);
        //var ddbput = await documentClient.put(paramsddb).promise();
        //if (err) console.log(err, err.stack); // an error occurred
        //else     console.log(data);           // successful response
        //});
        //console.log("ddbput: ",ddbput);

        return {
          "lastresults": "conc",
              "livegame": "gameinfo"
          }

    //console.log("conc2: ",tweetfind);
    //return tweetfind;
} else {
  console.log("output from ddbcheck: ", ddbcheck.Item);
  console.log("tweetslist from ddbcheck: ", ddbcheck.Item.livegame.gameinfo);
  return {
      'lastresults': {
          'conc': ddbcheck.Item.output.conc,
          'livetweet': ddbcheck.Item.livegame
      }
  };
}

}