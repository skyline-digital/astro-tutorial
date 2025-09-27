import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const siteBucket = new cdk.aws_s3.Bucket(this, "AstroTutorialSiteBucket", {
      bucketName: "s3-p-ase2-astro-tutorial-dist",
      websiteIndexDocument: "index.html",
      publicReadAccess: false,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
    })

    const distribution = new cdk.aws_cloudfront.Distribution(this, "AstroTutorialDistribution", {
      defaultBehavior: {
        origin: cdk.aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, },
      defaultRootObject: "index.html",
    })

    new cdk.aws_s3_deployment.BucketDeployment(this, 'DeployAstroTutorialSite', {
      sources: [cdk.aws_s3_deployment.Source.asset('../../dist')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    })

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: distribution.domainName,
    })
  }
}
