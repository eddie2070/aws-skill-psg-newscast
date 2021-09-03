# Alexa-Skill_PSG-Newscast

This project allows to deploy the PSG Newscast skill for Alexa.

This skill gives you the latest update about the Paris Saint-Germain soccer team (France). Get information on the last results, next game coming up, position on the leaderboard, either for Ligue 1 or the UEFA Champions League. 

It requires an Alexa developer account and an AWS account.
We use Lambda functions in an AWS account as backend, Step Functions as the workflow orchestrator, and DynamoDB to retain recent data that have been retrieved from the public API football-data.org

This entire architecture can be deployed via the CDK/CloudFormation provided here. 

## Architecture

<img src="https://github.com/eddie2070/aws-skill-psg-newscast/blob/main/img/PSGNewscast%20-%20Page%202.png?raw=true"/>

### Notes

The Alexa developer skill deployment has not been automated yet. We provide the interaction model definition that can be imported.

Current intents:
* Last Results
* Next Game
* Position in the leaderboard

<img src="https://github.com/eddie2070/aws-skill-psg-newscast/blob/main/img/skill-multimodal-welcome.png?raw=true"/>
<img src="https://github.com/eddie2070/aws-skill-psg-newscast/blob/main/img/skill-multimodal-lastresults.png?raw=true"/>
<img src="https://github.com/eddie2070/aws-skill-psg-newscast/blob/main/img/skill-multimodal-nextgame.png?raw=true"/>
<img src="https://github.com/eddie2070/aws-skill-psg-newscast/blob/main/img/skill-multimodal-leaderboard.png?raw=true"/>
