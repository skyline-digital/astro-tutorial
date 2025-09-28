#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AstroTutorialStack } from "../lib/cdk-stack";

const app = new cdk.App();
new AstroTutorialStack(app, "AstroTutorialStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

