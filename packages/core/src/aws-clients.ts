import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { SFN } from "@aws-sdk/client-sfn";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { KMS } from "@aws-sdk/client-kms";
import { SQS } from "@aws-sdk/client-sqs";

const dynamoClient = new DynamoDB();

export const sqs = new SQS();
export const kms = new KMS();
export const ddb = DynamoDBDocument.from(dynamoClient, {
	marshallOptions: {
		convertEmptyValues: true,
		removeUndefinedValues: true,
	},
});

export const sfn = new SFN();
