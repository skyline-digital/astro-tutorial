import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = "astro-tutorial.aws.skylinedigital.co.nz"
    const siteDomain = `www.${domainName}`

    const hostedZone = new cdk.aws_route53.PublicHostedZone(this, "AstroTutorialHostedZone", {
      zoneName: domainName,
    })

    new cdk.CfnOutput(this, "Site", { value: 'https://' + siteDomain })

    const zone = cdk.aws_route53.HostedZone.fromLookup(this, 'Zone', { domainName: domainName })

    const certificate = new cdk.aws_certificatemanager.Certificate(this, "SiteCertificate", {
      domainName: domainName,
      subjectAlternativeNames: ['*.' + domainName],
    })

    certificate.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)
    new cdk.CfnOutput(this, 'Certificate', { value: certificate.certificateArn })

    const siteBucket = new cdk.aws_s3.Bucket(this, "AstroTutorialSiteBucket", {
      bucketName: "s3-p-ase2-astro-tutorial-dist",
      publicReadAccess: false,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      websiteIndexDocument: 'index.html',
    })
    new cdk.CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

    const distribution = new cdk.aws_cloudfront.Distribution(this, "AstroTutorialDistribution", {
      certificate: certificate,
      domainNames: [siteDomain, domainName],
      minimumProtocolVersion: cdk.aws_cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        origin: cdk.aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        compress: true,
        allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, },
      defaultRootObject: "index.html",
    })
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId })

    new cdk.aws_route53.ARecord(this, 'WWWSiteAliasRecord', {
      zone,
      recordName: siteDomain,
      target: cdk.aws_route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.CloudFrontTarget(distribution)),
    })

    new cdk.aws_route53.ARecord(this, 'SiteAliasRecord', {
      zone,
      recordName: domainName,
      target: cdk.aws_route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.CloudFrontTarget(distribution)),
    })

    new cdk.aws_s3_deployment.BucketDeployment(this, 'DeployAstroTutorialSite', {
      sources: [cdk.aws_s3_deployment.Source.asset('../../dist')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    })
  }
}
