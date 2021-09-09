const core = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");
const iam = require("@aws-cdk/aws-iam");
const dynamodb = require("@aws-cdk/aws-dynamodb");
const stepfunction = require("@aws-cdk/aws-stepfunctions");
const custom = require("@aws-cdk/custom-resources");

const layerArnAsk = "arn:aws:lambda:us-east-1:173334852312:layer:ask-sdk-for-nodejs:4";


class psgService extends core.Construct {
  constructor(scope, id) {
    super(scope, id);

    const table = new dynamodb.Table(this, 'PSGNewscastddb', {
        partitionKey: { name: 'ID', type: dynamodb.AttributeType.STRING },
        timeToLiveAttribute: 'TTL',
        tableName: 'AlexaSkillPSG'
      });
  
      const ddbarn = new core.CfnOutput(this, "DDBTablePSGNewscastARN",{
        value: table.tableArn,
        description: 'DynamoDB Table ARN',
        exportName: 'DDBTablePSGNewscastARN'
      });

    const lambdamomentlayer = new lambda.LayerVersion(this, "momentlayer", {
      compatibleRuntimes: [lambda.Runtime.NODEJS_10_X,lambda.Runtime.NODEJS_12_X],
      code: lambda.Code.asset("resources/Lambda/momentlayer.zip"),
      description: 'A layer with moment timezone'
    })

    const lambdaxraylayer = new lambda.LayerVersion(this, "lambda-layer-xray", {
        compatibleRuntimes: [lambda.Runtime.NODEJS_8_10,lambda.Runtime.NODEJS_12_X,lambda.Runtime.NODEJS_14_X],
        code: lambda.Code.asset("resources/Lambda/lambda-layer-xray.zip"),
        description: 'A layer with xray'
      })

    const lambdasharplayer = new lambda.LayerVersion(this, "sharp-lambda-layer", {
        compatibleRuntimes: [lambda.Runtime.NODEJS_10_X,lambda.Runtime.NODEJS_12_X],
        code: lambda.Code.asset("resources/Lambda/sharp-lambda-layer.zip"),
        description: 'A layer with xray'
      })

    const lambdaalexasdklayer = lambda.LayerVersion.fromLayerVersionArn(this, "ask-layer", layerArnAsk)

    const handler = new lambda.Function(this, "PSGNewscast", {
      //functionName: "PSGNewscast",
      runtime: lambda.Runtime.NODEJS_14_X, //
      code: lambda.Code.asset("resources/Lambda/PSGNewscast"),
      handler: "index.handler",
      environment: {
        //BUCKET: bucket.bucketName
      },
      layers: [lambdaxraylayer,lambdaalexasdklayer],
      timeout: core.Duration.seconds(10)
    });

    const handlerperms = new lambda.CfnPermission(this,"alexatolambda", {
        principal: "alexa-appkit.amazon.com",
        eventSourceToken: "12456080-6c72-4e47-9e57-8099b9c3920e",
        action: 'lambda:InvokeFunction',
        functionName: handler.functionName
    })


    const lambdadispatcher = new lambda.Function(this, "lambdadispatcher", {
      runtime: lambda.Runtime.NODEJS_14_X, //
      //code: lambda.Code.asset("resources"),
      code: lambda.Code.asset("resources/Lambda/PSGNewscast-dispatcher"),
      handler: "index.handler",
      environment: {
        //BUCKET: bucket.bucketName
      },
      timeout: core.Duration.seconds(10)
    });

      
    lambdadispatcher.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
        ],
        resources: ['*']
      }));

      lambdadispatcher.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "states:SendTaskSuccess",
            "states:ListStateMachines",
            "states:SendTaskFailure",
            "states:ListActivities",
            "states:SendTaskHeartbeat"
        ],
        resources: ['*']
      }
      ));

      lambdadispatcher.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "states:*"
        ],
        resources: ['arn:aws:states:us-east-1:753451452012:stateMachine:PSGNewscast-MyStateMachineStandard',
        'arn:aws:states:us-east-1:753451452012:stateMachine:PSGNewscast-MyStateMachineStandard:*',
        'arn:aws:states:us-east-1:753451452012:execution:PSGNewscast-MyStateMachineStandard:*']
      }));


      const lambdalastresults = new lambda.Function(this, "lambda-lastresults-score", {
        runtime: lambda.Runtime.NODEJS_10_X, //
        code: lambda.Code.asset("resources/Lambda/PSGNewscast-lastresults-score"),
        handler: "index.handler",
        environment: {
          //BUCKET: bucket.bucketName
        },
        layers: [lambdamomentlayer,lambdasharplayer],
        timeout: core.Duration.seconds(10)
      });

      lambdalastresults.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "dynamodb:ListContributorInsights",
            "dynamodb:DescribeReservedCapacityOfferings",
            "dynamodb:ListGlobalTables",
            "dynamodb:ListTables",
            "dynamodb:DescribeReservedCapacity",
            "dynamodb:ListBackups",
            "dynamodb:PurchaseReservedCapacityOfferings",
            "dynamodb:DescribeLimits",
            "dynamodb:ListExports",
            "dynamodb:ListStreams"
        ],
        resources: ['*']
      }));

      lambdalastresults.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "dynamodb:*"
        ],
        resources: [table.tableArn]
      }));

      lambdalastresults.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "s3:PutObject",
            "s3:PutObjectAcl"
        ],
        resources: ['arn:aws:s3:::psgnewscast-skill2021/*']
      }));

      lambdalastresults.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "xray:PutTraceSegments",
            "xray:PutTelemetryRecords"
        ],
        resources: ['*']
      }));


      const lambdanextgame = new lambda.Function(this, "lambda-nextgame", {
        runtime: lambda.Runtime.NODEJS_10_X, //
        functionName: "PSGNewscast-nextgame",
        code: lambda.Code.asset("resources/Lambda/PSGNewscast-nextgame"),
        handler: "index.handler",
        environment: {
          //BUCKET: bucket.bucketName
        },
        layers: [lambdamomentlayer,lambdasharplayer],
        timeout: core.Duration.seconds(10)
      });

      lambdanextgame.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "dynamodb:ListContributorInsights",
            "dynamodb:DescribeReservedCapacityOfferings",
            "dynamodb:ListGlobalTables",
            "dynamodb:ListTables",
            "dynamodb:DescribeReservedCapacity",
            "dynamodb:ListBackups",
            "dynamodb:PurchaseReservedCapacityOfferings",
            "dynamodb:DescribeLimits",
            "dynamodb:ListExports",
            "dynamodb:ListStreams"
        ],
        resources: ['*']
      }));

      lambdanextgame.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "dynamodb:*"
        ],
        resources: [table.tableArn]
      }));

      lambdanextgame.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "s3:PutObject",
            "s3:PutObjectAcl"
        ],
        resources: ['arn:aws:s3:::psgnewscast-skill2021/*']
      }));

      lambdanextgame.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "s3:ListBucket"
        ],
        resources: ['arn:aws:s3:::psgnewscast-skill2021/']
      }));

      lambdanextgame.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "xray:PutTraceSegments",
            "xray:PutTelemetryRecords"
        ],
        resources: ['*']
      }));


      const lambdaleaderboard = new lambda.Function(this, "lambda-leaderboard", {
        runtime: lambda.Runtime.NODEJS_10_X, //
        code: lambda.Code.asset("resources/Lambda/PSGNewscast-leaderboard"),
        handler: "index.handler",
        environment: {
          //BUCKET: bucket.bucketName
        },
        timeout: core.Duration.seconds(8)
      });

      lambdaleaderboard.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "dynamodb:ListContributorInsights",
            "dynamodb:DescribeReservedCapacityOfferings",
            "dynamodb:ListGlobalTables",
            "dynamodb:ListTables",
            "dynamodb:DescribeReservedCapacity",
            "dynamodb:ListBackups",
            "dynamodb:PurchaseReservedCapacityOfferings",
            "dynamodb:DescribeLimits",
            "dynamodb:ListExports",
            "dynamodb:ListStreams"
        ],
        resources: ['*']
      }));

      lambdaleaderboard.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "dynamodb:*"
        ],
        resources: [table.tableArn]
      }));

      lambdaleaderboard.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "xray:PutTraceSegments",
            "xray:PutTelemetryRecords"
        ],
        resources: ['*']
      }));

      const lambdatwit = new lambda.Function(this, "lambda-twit", {
        runtime: lambda.Runtime.NODEJS_10_X, //
        functionName: "PSGNewscast-livetweet",
        code: lambda.Code.asset("resources/Lambda/PSGNewscast-livetweet"),
        handler: "index.handler",
        environment: {
          //BUCKET: bucket.bucketName
        },
        layers: [lambdamomentlayer],
        environment: {"twit": "PSGTalk"},
        timeout: core.Duration.seconds(10)
      });

      lambdatwit.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "dynamodb:ListContributorInsights",
            "dynamodb:DescribeReservedCapacityOfferings",
            "dynamodb:ListGlobalTables",
            "dynamodb:ListTables",
            "dynamodb:DescribeReservedCapacity",
            "dynamodb:ListBackups",
            "dynamodb:PurchaseReservedCapacityOfferings",
            "dynamodb:DescribeLimits",
            "dynamodb:ListExports",
            "dynamodb:ListStreams"
        ],
        resources: ['*']
      }));

      lambdatwit.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "dynamodb:*"
        ],
        resources: [table.tableArn]
      }));

      lambdatwit.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "xray:PutTraceSegments",
            "xray:PutTelemetryRecords"
        ],
        resources: ['*']
      }));
      
      const lambdalivegame = new lambda.Function(this, "lambda-livegame", {
        runtime: lambda.Runtime.NODEJS_10_X, //
        functionName: "PSGNewscast-livegame",
        code: lambda.Code.asset("resources/Lambda/PSGNewscast-livegame"),
        handler: "index.handler",
        environment: {
          //BUCKET: bucket.bucketName
        },
        layers: [lambdamomentlayer,lambdasharplayer],
        timeout: core.Duration.seconds(10)
      });

      lambdalivegame.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "dynamodb:ListContributorInsights",
            "dynamodb:DescribeReservedCapacityOfferings",
            "dynamodb:ListGlobalTables",
            "dynamodb:ListTables",
            "dynamodb:DescribeReservedCapacity",
            "dynamodb:ListBackups",
            "dynamodb:PurchaseReservedCapacityOfferings",
            "dynamodb:DescribeLimits",
            "dynamodb:ListExports",
            "dynamodb:ListStreams"
        ],
        resources: ['*']
      }));

      lambdalivegame.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "dynamodb:*"
        ],
        resources: [table.tableArn]
      }));

      lambdalivegame.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "s3:PutObject",
            "s3:PutObjectAcl"
        ],
        resources: ['arn:aws:s3:::psgnewscast-skill2021/*']
      }));

      lambdalivegame.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "xray:PutTraceSegments",
            "xray:PutTelemetryRecords"
        ],
        resources: ['*']
      }));

      const rolestepfunction = new iam.Role(this, 'StepFunctions-PSGNewscast-MyStateMachineStandard-role', {
        assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
        name: 'PSGNewscast-statesRole'
      });
  
      rolestepfunction.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["arn:aws:lambda:us-east-1:753451452012:function:PSGNewscast-lastresults-score:*",
        "arn:aws:lambda:us-east-1:753451452012:function:PSGNewscast-nextgame:*",
        "arn:aws:lambda:us-east-1:753451452012:function:PSGNewscast-leaderboard:*"],
        actions:  ["lambda:InvokeFunction"]
      }));

      const statesarn = new core.CfnOutput(this, "StatesARN",{
        value: rolestepfunction.roleArn,
        description: 'Step Functions ARN',
        exportName: 'StatesARN'
      });

      const machine = new stepfunction.CfnStateMachine(this, "CDK-PSGNewscast-MyStateMachineStandard",{
        stateMachineName: "CDK-PSGNewscast-MyStateMachineStandard",
        roleArn: rolestepfunction.roleArn,
        definitionString:'{\n                "Comment": "Example of a workflow which invokes your Lambda function, implements retries, and catches errors. Learn more at https://docs.aws.amazon.com/step-functions/latest/dg/tutorial-creating-lambda-state-machine.html",\n                "StartAt": "Choice",\n                "States": {\n                  "Choice": {\n                    "Type": "Choice",\n                    "Choices": [\n                      {\n                        "Variable": "$.intentname",\n                        "StringEquals": "LastResultsIntent",\n                        "Next": "Step 1: Invoke Lambda function"\n                      },\n                      {\n                        "Variable": "$.intentname",\n                        "StringEquals": "NextGameIntent",\n                        "Next": "Lambda Invoke"\n                      },\n                      {\n                        "Variable": "$.intentname",\n                        "StringEquals": "Welcome",\n                        "Next": "Pass"\n                      },\n                      {\n                        "Variable": "$.intentname",\n                        "StringEquals": "StandingsIntent",\n                        "Next": "Lambda Invoke Standings"\n                      }\n                    ],\n                    "Default": "Step 3"\n                  },\n                  "Lambda Invoke": {\n                    "Type": "Task",\n                    "Resource": "arn:aws:states:::lambda:invoke",\n                    "Parameters": {\n                      "FunctionName": "arn:aws:lambda:us-east-1:753451452012:function:PSGNewscast-nextgame",\n                      "Payload": {\n                        "Input.$": "$"\n                      }\n                    },\n                    "Retry": [\n                      {\n                        "ErrorEquals": [\n                          "Lambda.ServiceException",\n                          "Lambda.AWSLambdaException",\n                          "Lambda.SdkClientException"\n                        ],\n                        "IntervalSeconds": 2,\n                        "MaxAttempts": 6,\n                        "BackoffRate": 2\n                      }\n                    ],\n                    "End": true\n                  },\n                  "Pass": {\n                    "Type": "Pass",\n                    "End": true,\n                    "Result": {\n                      "Payload": {\n                        "lastresults": "Welcome to PSG news. What would you like to know today? You can ask for the last results, live, next game, position in the leaderboard, latest news, or music."\n                      }\n                    }\n                  },\n                  "Step 1: Invoke Lambda function": {\n                    "Type": "Task",\n                    "Resource": "arn:aws:states:::lambda:invoke",\n                    "Parameters": {\n                      "FunctionName": "arn:aws:lambda:us-east-1:753451452012:function:PSGNewscast-lastresults-score",\n                      "Payload": {\n                        "Input.$": "$"\n                      }\n                    },\n                    "Retry": [\n                      {\n                        "Comment": "Use Retry fields to retry a Lambda function after an error occurs. Learn more at https://docs.aws.amazon.com/step-functions/latest/dg/concepts-error-handling.html#error-handling-retrying-after-an-error",\n                        "ErrorEquals": [\n                          "Lambda.ServiceException",\n                          "Lambda.TooManyRequestsException",\n                          "Lambda.AWSLambdaException",\n                          "Lambda.SdkClientException"\n                        ],\n                        "IntervalSeconds": 2,\n                        "MaxAttempts": 6,\n                        "BackoffRate": 2\n                      }\n                    ],\n                    "Catch": [\n                      {\n                        "Comment": "Use Catch fields to catch errors and revert to fallback states. https://docs.aws.amazon.com/step-functions/latest/dg/concepts-error-handling.html#error-handling-fallback-states",\n                        "ErrorEquals": [\n                          "States.ALL"\n                        ],\n                        "Next": "Fallback state"\n                      }\n                    ],\n                    "End": true\n                  },\n                  "Step 3": {\n                    "Comment": "Use Pass states as placeholders for future states",\n                    "Type": "Pass",\n                    "End": true\n                  },\n                  "Fallback state": {\n                    "Comment": "Handle Lambda exceptions here",\n                    "Type": "Pass",\n                    "Next": "Fail"\n                  },\n                  "Fail": {\n                    "Type": "Fail"\n                  },\n                  "Lambda Invoke Standings": {\n                    "Type": "Task",\n                    "Resource": "arn:aws:states:::lambda:invoke",\n                    "Parameters": {\n                      "FunctionName": "arn:aws:lambda:us-east-1:753451452012:function:PSGNewscast-leaderboard",\n                      "Payload": {\n                        "Input.$": "$"\n                      }\n                    },\n                    "Retry": [\n                      {\n                        "ErrorEquals": [\n                          "Lambda.ServiceException",\n                          "Lambda.AWSLambdaException",\n                          "Lambda.SdkClientException"\n                        ],\n                        "IntervalSeconds": 2,\n                        "MaxAttempts": 6,\n                        "BackoffRate": 2\n                      }\n                    ],\n                    "End": true\n                  }\n                }\n              }'     
      })
    
  }
}

module.exports = { psgService }
