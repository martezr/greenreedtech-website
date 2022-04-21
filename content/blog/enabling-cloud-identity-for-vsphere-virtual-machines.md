---
title: "Enabling Cloud Workload Identity for vSphere Virtual Machines"
description: "Enable "
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/enabling_cloud_identity_for_vsphere_virtual_machines/enabling-cloud-identity-for-vsphere-virtual-machines.png"
date: "2022-04-21"
draft: false
author: "Martez Reed"
tags: ["HashiCorp","Vault","DevOps","Security"]
categories: ["vSphere"]
---

One of the major benefits of using the public cloud is the integrated identity and access management (IAM). This simplifies the process of granting workloads access to other cloud services. Think about how an AWS EC2 instance is granted access to write objects to an S3 bucket. An IAM role is assigned to the instance which has a policy that grants the S3 access. This enables AWS CLI tools and application built upon the AWS SDK to access the bucket without explicitly providing credentials.

The seamless access works becuase the tools and sdks actually make API calls to an API that contains the credentials. The API endpoint is accessible from the EC2 instance and contains information about the instance such as the network configuration and identity details. This is the [instance metadata service](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html) and is accessible at http://169.254.169.254 from within the EC2 instance.

### IAM Roles for vSphere Virtual Machines?

This led me to wonder about how a similar experience could be achieved for virtual machines running on VMware vSphere. This would enable a workload identity for vSphere virtual machines running on-prem or even those running on vSphere environments in the public cloud like [VMware Cloud on AWS](https://www.vmware.com/products/vmc-on-aws.html). This could also be used as a spring board to delivering such as experience for on-prem services like object storage or database as a service.

### Solution Overview

Now that there was a goal, the only thing left to do was develop a design for the solution.

![Cloud Identity Design](https://s3.us-west-2.amazonaws.com/greenreedtech.com/enabling_cloud_identity_for_vsphere_virtual_machines/enabling-cloud-identity-for-vsphere-virtual-machines.png)
The core of the solution is built upon the [vAuth platform](https://github.com/martezr/vauth) that I've been iterating on the last few years and covered in a previous [post](https://www.greenreedtech.com/hashicorp-vault-vsphere-authentication-with-vmware-event-broker-appliance-veba/). The goal was to extend the functionality further with the idea of directly mimicing the functionality offered in AWS or any of the other public clouds. This meant that there needed to be an instance metadata service that would present CLI tools or SDKs with an API endpoint accessible from the virtual machine.

**Instance Metadata Service**

To accomplish this goal, an agent running in the guest operating system is needed. The agent would run a web server that mocks the instance metadata service that's available at http://169.254.169.254 from an AWS EC2 instance. Based upon a google search I found out that others have done something similar and even AWS has a mock version of the instance metadata service.

The [version](https://github.com/nytimes/mock-ec2-metadata) of instance metadata service created by the New York Times included details about how to accomplish the network configuration. This meant creating a new address to listen on 169.254.169.254 on the virtual machine's loopback interface.

**Instace Metadata Service Credentials**

The instance metadata service would need to be able to dynamically fetch AWS credentials to present via the local API endpoint. The API server would need to return the name of the role associated with the virtual machine and then present the AWS access key and secret key upon request. This is where the HashiCorp Vault integration comes into play.

**HashiCorp Vault AWS Dynamic Credentials**

The vAuth platform aims to turn VMware vSphere into a trusted platform for HashiCorp Vault. Since the generation of [dynamic AWS credentials](https://www.vaultproject.io/docs/secrets/aws#sts-assumerole) is a core use of Vault, it only made sense to just use the existing Vault integration functionality. The agent will use the AppRole credentials the vAuth platform was already presenting to the virtual machine for authentication to Vault.

### Solution Technical Details

Now that we've walked through the high level parts of the solution, we'll look at the lower level details to accomplish this.

* **AWS IAM Role:** The AWS IAM role that will be used to grant the virtual machine access to AWS services. This would the same configuration for granting an AWS EC2 instance access to AWS services.
* **AWS IAM Policy:** The AWS IAM policy attached to the IAM role that defines the level of access granted to the EC2 instance.
* **HashiCorp Vault AWS Secrets Backend Role:** The AWS secrets backend role in Vault that maps to the role in AWS. This utilizes role assumption to closely mimic the AWS experience. 
* **HashiCorp Vault Policy:** The HashiCorp Vault policy used to grant a Vault entity access 
* **HashiCorp Vault AppRole Role:** The HashiCorp Vault AppRole role used to authenticate to Vault. 

With all the components wired up we're able to run a like `aws s3 cp` to fetch a file from AWS without needing to explicitly define any credentials. The screenshot below shows running the AWS CLI from a vSphere virtual machine to fetch an object from S3.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/enabling_cloud_identity_for_vsphere_virtual_machines/enabling-cloud-identity-for-vsphere-virtual-machines-aws-cli.jpeg)

All the components are chained together forming a fairly complex but powerful integration. The solution unlocks an interesting capability for organizations running workloads on VMware vSphere and looking at ways to "modernize" these workloads.

## References

Amazon EC2 Metadata Mock: https://github.com/aws/amazon-ec2-metadata-mock

Mock EC2 Metadata: https://github.com/nytimes/mock-ec2-metadata

GCP Workload Identity Federation: https://medium.com/google-cloud/workload-identity-federation-for-on-premise-workloads-with-spiffe-24a861b3cf6c


HashiCorp Vault AWS Dynamic Credentials: https://www.vaultproject.io/docs/secrets/aws#sts-assumerole