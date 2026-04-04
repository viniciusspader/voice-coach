#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";
import * as path from "path";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env from the aws package directory
try {
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), ".env");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch {
  // .env not present — fall through to env var validation below
}

const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID;
const ALERT_EMAIL = process.env.ALERT_EMAIL;

if (!AWS_ACCOUNT_ID) {
  throw new Error("Missing required environment variable: AWS_ACCOUNT_ID. Set it in packages/aws/.env or your shell.");
}
if (!ALERT_EMAIL) {
  throw new Error("Missing required environment variable: ALERT_EMAIL. Set it in packages/aws/.env or your shell.");
}

class VoiceCoachStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── Cognito User Pool ──
    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const appClient = userPool.addClient("AppClient", {
      authFlows: { userSrpAuth: true },
      preventUserExistenceErrors: true,
    });

    // ── DynamoDB table for sessions ──
    const sessionsTable = new dynamodb.Table(this, "SessionsTable", {
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sessionId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: dynamodb.TableEncryption.DEFAULT,
    });

    sessionsTable.addGlobalSecondaryIndex({
      indexName: "userId-createdAt-index",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ── SNS topic for failure alerts ──
    const alertTopic = new sns.Topic(this, "AlertTopic", {
      displayName: "Voice Coach Alerts",
    });
    alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(ALERT_EMAIL)
    );

    // ── Lambda function ──
    const fn = new lambda.Function(this, "CoachFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(import.meta.dirname!, "lambda")),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        SESSIONS_TABLE: sessionsTable.tableName,
      },
    });

    // DynamoDB access
    sessionsTable.grantReadWriteData(fn);

    // Bedrock permissions (Haiku 4.5)
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: [
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0",
          `arn:aws:bedrock:us-east-1:${this.account}:inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0`,
        ],
      })
    );

    // ── API Gateway ──
    const api = new apigateway.RestApi(this, "CoachApi", {
      restApiName: "VoiceCoachAPI",
      deployOptions: { stageName: "prod" },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      { cognitoUserPools: [userPool] }
    );

    const authOptions: apigateway.MethodOptions = {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    const lambdaIntegration = new apigateway.LambdaIntegration(fn);

    // POST /analyze
    const analyze = api.root.addResource("analyze");
    analyze.addMethod("POST", lambdaIntegration, authOptions);

    // GET /sessions
    const sessions = api.root.addResource("sessions");
    sessions.addMethod("GET", lambdaIntegration, authOptions);

    // GET /sessions/{id}
    const session = sessions.addResource("{id}");
    session.addMethod("GET", lambdaIntegration, authOptions);

    // GET /progress
    const progress = api.root.addResource("progress");
    progress.addMethod("GET", lambdaIntegration, authOptions);

    // ── Outputs ──
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "Voice Coach API URL",
    });

    new cdk.CfnOutput(this, "SessionsTableName", {
      value: sessionsTable.tableName,
      description: "DynamoDB sessions table name",
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID",
    });

    new cdk.CfnOutput(this, "AppClientId", {
      value: appClient.userPoolClientId,
      description: "Cognito App Client ID",
    });
  }
}

const app = new cdk.App();

// Tags for cost tracking
cdk.Tags.of(app).add("Project", "voice-coach");
cdk.Tags.of(app).add("Environment", "prod");
cdk.Tags.of(app).add("Owner", "vini");

new VoiceCoachStack(app, "VoiceCoachStack", {
  env: { account: AWS_ACCOUNT_ID, region: process.env.AWS_REGION ?? "us-east-1" },
});
