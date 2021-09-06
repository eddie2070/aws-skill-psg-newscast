const axios = require('axios')
const jp = require('jsonpath')
const converter = require('number-to-words');


const url= 'http://api.football-data.org/v2/teams/524/matches?limit=100'
const headers= {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'X-Auth-Token': 'a9bc952d181c47268446a51dafc83286'
    }

var handler = async () => {
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
        var jsongamecuraway = jp.query(jsongamelastgame, '$.awayTeam.name');
        console.log("jsongamecuraway:", jsongamecuraway);
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
        var conc = "Last results.".concat("In the game of the ", jsondaynumber, " journey, with ", jsongamecuraway," playing at ", jsongamecurhome,". ", jsongamecurwinnername, jsongamecurhomescore, " to ", jsongamecurawayscore,".");
            //jsondaynumber,strmid,str2,jsongamecurhome,strmid,str3,jsongamecuraway,strmid,str4,jsongamecurwinnername,strmid,str5,jsongamecurhomescore,strmid,str6,jsongamecurawayscore,strmid,str7,jsongamedate,strmid,str8,jsoncompetition,strfin);
        console.log("conc: ", conc);
        return {conc};
    };

handler();