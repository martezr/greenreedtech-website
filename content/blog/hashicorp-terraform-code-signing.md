---
title: "HashiCorp Terraform Code Signing"
date: "2022-05-16"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/hashicorp-terraform-code-signing/terraform-code-signing.png"
author: "Martez Reed"
tags: ["HashiCorp","Terraform","DevOps","Security"]
categories: ["Terraform"]
draft: false
---

Signing software has become critically important given the recent supply chain attacks. How do we verify that the software we're downloading is actually created by who believe created the software? In this case we want to ensure that the Terraform binary we're downloading was created by HashiCorp. This helps prevent a scenario where a malicious actor tricks you into downloading a compromised version of Terraform.

## How is Terraform signed?

To ensure that the software was created by HashiCorp we need a way to verify that only they could have signed it. This is where cryptography comes into play, HashiCorp uses a private key to sign the software and then we use the public key to perform the verification. HashiCorp never shares the private key so as to provide the assurance that they're the ones that created the Terraform binary. The public key is shared publicly (https://www.hashicorp.com/security and keybase.io) to verify software signed by the private key. 

HashiCorp actually signs the file that contains the Terraform binary checksums. This is the file in the on releases.hashicorp.com that ends with SHA256SUMS (i.e. - terraform_1.1.9_SHA256SUMS). This means that the file used to verify the integrity of the Terraform binary archive is what is signed and not the binary itself.

## Additional Resources
HashiCorp Learn Guide: https://learn.hashicorp.com/tutorials/terraform/verify-archive