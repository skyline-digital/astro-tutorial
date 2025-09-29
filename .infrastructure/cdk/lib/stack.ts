import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class AstroTutorialStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = "astro-tutorial.aws.skylinedigital.co.nz"

    const zone = new cdk.aws_route53.PublicHostedZone(this, "AstroTutorialHostedZone", {
      zoneName: domainName,
    })
    new cdk.CfnOutput(this, "Site", { value: 'https://' + domainName })

    const rootZone = cdk.aws_route53.HostedZone.fromLookup(this, 'RootZone', {
      domainName: 'aws.skylinedigital.co.nz',
    })

    new cdk.aws_route53.NsRecord(this, 'RootZoneNSRecord', {
      zone: rootZone,
      recordName: "astro-tutorial",
      values: zone.hostedZoneNameServers!,
      ttl: cdk.Duration.days(2),
    })

    const certificate = cdk.aws_certificatemanager.Certificate.fromCertificateArn(this, 'RootCertificate', "arn:aws:acm:us-east-1:425225284125:certificate/29f34ea6-4950-43f9-874a-cf53a80c7f7f")

    const siteBucket = new cdk.aws_s3.Bucket(this, "AstroTutorialSiteBucket", {
      bucketName: "s3-p-ase2-astro-tutorial-dist",
      objectOwnership: cdk.aws_s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      publicReadAccess: true,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ACLS_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      websiteIndexDocument: 'index.html',
    })
    new cdk.CfnOutput(this, 'SiteBucketName', { value: siteBucket.bucketName });

    const distribution = new cdk.aws_cloudfront.Distribution(this, "AstroTutorialDistribution", {
      certificate,
      domainNames: [domainName],
      minimumProtocolVersion: cdk.aws_cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.S3StaticWebsiteOrigin(siteBucket),
        compress: true,
        allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, },
      defaultRootObject: "index.html",
    })
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId })

    new cdk.aws_route53.ARecord(this, 'AstroTutorialSiteAliasRecord', {
      zone,
      recordName: domainName,
      target: cdk.aws_route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.CloudFrontTarget(distribution)),
    })

    new cdk.aws_s3_deployment.BucketDeployment(this, 'AstroTutorialDeploySite', {
      sources: [cdk.aws_s3_deployment.Source.asset('../../dist')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    })
  }
}
