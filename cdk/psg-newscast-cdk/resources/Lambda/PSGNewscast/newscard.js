const APLHomeCardRequestInterceptor = {
    process(handlerInput) {
        const withNewsCard = handlerInput.responseBuilder.withStandardCard;
        const withStandardCard = handlerInput.responseBuilder.withStandardCard;
        console.log("payload: ",handlerInput);
        console.log("payload2: ",handlerInput.context.succeed);
        function withNewsAPLCard(cardTitle, cardContent){
            console.log("cardContenta: ",cardContent);
            var sourcingdata = JSON.stringify(cardContent).toString().replace(/\\/g, "").replace(/text/g,"primaryText").substring(1).slice(0, -1);
            console.log("sourcingdata: ",sourcingdata);
            console.log("typof: ",typeof(sourcingdata));
            //console.log("JSON.parse(cardContent).hometeamlogo: ",JSON.parse(cardContent).hometeamlogo);
            if(supportsAPL(handlerInput)){
                handlerInput.responseBuilder.addDirective({
                    type: 'Alexa.Presentation.APL.RenderDocument',
                    version: '1.0',
                    document: APLDoc,
                    datasources: {
                        "assets": {
                                //"home": JSON.parse(cardContent).hometeamlogo.toString(),//JSON.parse(cardContent).hometeamlogo, //"https://medias.lequipe.fr/logo-football/26/120-2021-2022",
                                //"away": JSON.parse(cardContent).awayteamlogo //"https://medias.lequipe.fr/logo-football/6/120-2021-2022"
                        },
                         "standings": {
                        //     "positioncard": JSON.parse(cardContent).positioncard,
                        //     "points": JSON.parse(cardContent).points,
                        //     "teamaheadname": JSON.parse(cardContent).teamaheadname,
                        //     "teamaheadposition": JSON.parse(cardContent).teamaheadposition,
                        //     "teamaheadpoints": JSON.parse(cardContent).teamaheadpoints,
                        //     "teambehindname": JSON.parse(cardContent).teambehindname,
                        //     "teambehindpoints": JSON.parse(cardContent).teambehindpoints
                         },
                        "sourcing": JSON.parse(sourcingdata)
                        // {
                        //     "listdata": [
                        //     {"primaryText": "PSG Mercato: Paris SG Eyes Franck Kessié in January if He Doesn’t Extend With AC Milan"  },
                        //     {"primaryText": "‘Strange Feeling to See Him With Another Jersey’ – Barça President Joan Laporta Comments on Seeing Lionel Messi With PSG"  },
                        //     {"primaryText": "Report: Messi, Neymar, and Mbappe Expected to Miss PSG’s Ligue 1 Fixture Against Clermont"  },
                        //     {"primaryText": "PSG Mercato: Juventus Interested in Signing Navas Over the Upcoming Winter Transfer Window"  }
                        //     ]
                        // }
                        //sourcingdata
                    },
                        templateData: {
                            "header": cardTitle,
                            "text": cardContent,
                            // default background for simple card
                            "backgroundSmall": "",
                            "backgroundLarge": "https://w0.peakpx.com/wallpaper/26/11/HD-wallpaper-psg-french-football-club-logo-blue-fabric-background-t-shirt-emblem-paris-saint-germain-france-football.jpg",
                            "headerAttributionImage": "https://nationaldailyng.com/wp-content/uploads/2019/06/AS.png"
                        },
                });
            }
            withNewsCard(cardTitle, cardContent);
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
        handlerInput.responseBuilder.withNewsCard = (...args) => withNewsAPLCard(...args);
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
    "version": "1.7",
    "license": "Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.\nSPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0\nLicensed under the Amazon Software License  http://aws.amazon.com/asl/",
    "theme": "dark",
    "import": [
        {
            "name": "alexa-layouts",
            "version": "1.4.0"
        }
    ],
    "mainTemplate": {
        "parameters": [
            "payload",
            "sourcing"
        ],
        "items": [
            {
                "type": "AlexaTextList",
                "backgroundColorOverlay": "True",
                "headerTitle": "Latest News for PSG - (source @PSGTalk)",
                "headerBackButton": true,
                "headerBackButtonCommand": [	
                    {"type":"SendEvent","arguments":["goBack"],
                    "components": [ "idForTheTextComponent"]
                }
            ],
                "backgroundImageSource": "https://w0.peakpx.com/wallpaper/26/11/HD-wallpaper-psg-french-football-club-logo-blue-fabric-background-t-shirt-emblem-paris-saint-germain-france-football.jpg",
                "listItems": "${sourcing.listdata}",
                "touchForward": true,
                "id": "newsList"
            }
        ]
    }
};

module.exports = {
    APLHomeCardRequestInterceptor
};