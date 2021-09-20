const APLHomeCardRequestInterceptor = {
    process(handlerInput) {
        const withResultsCard = handlerInput.responseBuilder.withStandardCard;
        const withStandardCard = handlerInput.responseBuilder.withStandardCard;
        console.log("payload: ",handlerInput);
        console.log("payload2: ",handlerInput.context.succeed);
        function withResultsAPLCard(cardTitle, cardContent){
            console.log("cardContent: ",cardContent);
            console.log("JSON.parse(cardContent).hometeamlogo: ",JSON.parse(cardContent).hometeamlogo);
            if(supportsAPL(handlerInput)){
                handlerInput.responseBuilder.addDirective({
                    type: 'Alexa.Presentation.APL.RenderDocument',
                    version: '1.0',
                    document: APLDoc,
                    datasources: {
                        "assets": {
                                "home": JSON.parse(cardContent).hometeamlogo.toString(),//JSON.parse(cardContent).hometeamlogo, //"https://medias.lequipe.fr/logo-football/26/120-2021-2022",
                                "away": JSON.parse(cardContent).awayteamlogo //"https://medias.lequipe.fr/logo-football/6/120-2021-2022"
                        },
                        "score": {
                            "homescore": JSON.parse(cardContent).homescore,
                            "awayscore": JSON.parse(cardContent).awayscore,
                            "journey": JSON.parse(cardContent).journey,
                            "jsoncompetition": JSON.parse(cardContent).jsoncompetition,
                            "jsongamedate": JSON.parse(cardContent).jsongamedate,
                            "jsonstageUEFA": JSON.parse(cardContent).jsonstageUEFA,
                            "jsongroupUEFA": JSON.parse(cardContent).jsongroupUEFA
                        },
                        templateData: {
                            "header": cardTitle,
                            "text": cardContent,
                            // default background for simple card
                            "backgroundSmall": "",
                            //"backgroundLarge": "https://i.etsystatic.com/11598164/r/il/a180b4/824313786/il_1588xN.824313786_qt51.jpg",
                            "backgroundLarge": "https://w0.peakpx.com/wallpaper/26/11/HD-wallpaper-psg-french-football-club-logo-blue-fabric-background-t-shirt-emblem-paris-saint-germain-france-football.jpg",
                            "headerAttributionImage": "https://nationaldailyng.com/wp-content/uploads/2019/06/AS.png"
                        }
                    }
                });
            }
            if (JSON.parse(cardContent).jsonstageUEFA != "") {
                console.log("add champions logo");
                var championslogo = "https://psgnewscast-skill2021.s3.amazonaws.com/teamlogo/champions.png";
            } else {championslogo = ""}
            withResultsCard(cardTitle, cardContent);
            return handlerInput.responseBuilder;
        }
        function withStandardAPLCard(cardTitle, cardContent, smallImageUrl, largeImageUrl){
            if(supportsAPL(handlerInput)){
                handlerInput.responseBuilder.addDirective({
                    type: 'Alexa.Presentation.APL.RenderDocument',
                    version: '1.0',
                    document: APLDoc,
                    datasources: {
                        templateData: {
                            "header": cardTitle,
                            "text": cardContent,
                            "backgroundSmall": smallImageUrl,
                            "backgroundLarge": largeImageUrl
                        }
                    }
                })
            }
            withStandardCard(cardTitle, cardContent, smallImageUrl, largeImageUrl);
            return handlerInput.responseBuilder;
        }
        handlerInput.responseBuilder.withResultsCard = (...args) => withResultsAPLCard(...args);
        handlerInput.responseBuilder.withStandardCard = (...args) => withStandardAPLCard(...args);
    }
}

function supportsAPL(handlerInput){
    const {supportedInterfaces} = handlerInput.requestEnvelope.context.System.device;
    return supportedInterfaces['Alexa.Presentation.APL'];
}

function deviceType(handlerInput){
    if(supportsAPL(handlerInput)){
        const {Viewport} = handlerInput.requestEnvelope.context;
        const resolution = Viewport.pixelWidth + 'x' + Viewport.pixelHeight;
        switch(resolution){
            case "480x480": return "EchoSpot";
            case "960x480": return "EchoShow5";
            case "1024x600": return "EchoShow";
            case "1200x800": return "FireHD8";
            case "1280x800": return "EchoShow2";
            case "1920x1080": return "FireTV";
            case "1920x1200": return "FireHD10";
            default: return "unknown";
        }
    } else {
        return "screenless";
    }
}

const APLDoc = 
{
    "type": "APL",
    "version": "1.5",
    "settings": {},
    "theme": "dark",
    "background": "black",
    "import": [
        {
            "name": "alexa-layouts",
            "version": "1.2.0"
        }
    ],
    "mainTemplate": {
        "parameters": [
            "payload",
            "assets",
            "score"
        ],
        "items": [
            {
                "type": "Container",
                "items": [
                              {
            "type": "AlexaBackground",
            "colorOverlay": "True",
            "backgroundImageSource": "https://w0.peakpx.com/wallpaper/26/11/HD-wallpaper-psg-french-football-club-logo-blue-fabric-background-t-shirt-emblem-paris-saint-germain-france-football.jpg"
          },
                    {
                        "type": "Container",
                        "items": [
                            {
                                "type": "Text",
                                "textAlign": "center",
                                "text": "Last Result",
                                "fontFamily": "@fontFamilyRomanSans",
                                "paddingTop": "2vh",
                                "paddingBottom": "10vh",
                                "height": "10dp",
                                "width": "100vw",
                                "fontSize": "8vh"
                            },
          {
                                "type": "Text",
                                "textAlign": "center",
                                "text": "Journey ${score.journey} of ${score.jsoncompetition} on ${score.jsongamedate}",
                                "paddingTop": "2vh",
                                "paddingBottom": "5vh",
                                "height": "10dp",
                                "width": "100vw",
                                "fontSize": "4vh"
                            },
                            {
                                "type": "Text",
                                "textAlign": "center",
                                "text": "${score.jsonstageUEFA} ${score.jsongroupUEFA}",
                                "paddingTop": "0vh",
                                "paddingBottom": "10vh",
                                "height": "5dp",
                                "width": "100vw",
                                "fontSize": "3vh"
                            }
                        ]
                    },
                    {
                        "type": "Container",
                        "items": [
                            {
                               "type": "AlexaImage",
                        "alignSelf": "center",
                        "imageSource": "${assets.home}",
                        "imageRoundedCorner": false,
                        "imageScale": "best-fit",
                        "imageHeight": "20vh",
                        "width": "50vw",
                        "height": "20vw",
                        "imageAspectRatio": "square",
                        "imageBlurredBackground": false
                            },
                            {
                               "type": "AlexaImage",
                        "alignSelf": "center",
                        "imageSource": "${assets.away}",
                        "imageRoundedCorner": false,
                        "imageScale": "best-fit",
                        "imageHeight": "20vh",
                        "width": "50vw",
                        "height": "20vw",
                        "imageAspectRatio": "square",
                        "imageBlurredBackground": false
                            }
                        ],
                        "height": "35%",
                        "width": "100%",
                        "direction": "row",
                        "wrap": "noWrap"
                    },
                    {
                        "type": "Container",
                        "items": [
                            {
                                "type": "Text",
                                "textAlign": "center",
                                "text": "${score.homescore}",
                                "paddingTop": "5vh",
                                "paddingBottom": "5vh",
                                "height": "20dp",
                                "width": "50vw",
                                "fontSize": "10vh"
                            },
                            {
                                "type": "Text",
                                "textAlign": "center",
                                "text": "${score.awayscore}",
                                "paddingTop": "5vh",
                                "paddingBottom": "5vh",
                                "height": "20dp",
                                "width": "50vw",
                                "fontSize": "10vh"
                            }
                        ],
                        "height": "50%",
                        "width": "100%",
                        "direction": "row",
                        "wrap": "noWrap"
                    }
                ],
                "height": "100%",
                "width": "100%",
                "direction": "column",
                "wrap": "noWrap"
            }
        ]
    }
}

module.exports = {
    APLHomeCardRequestInterceptor
}