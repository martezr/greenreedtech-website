---
title: Terraform Supply Chain Security
description: Ensuring the integrity of your Terraform workflows — from binary checksum verification and code signing to least-privilege S3 state management.
image: https://s3.us-west-2.amazonaws.com/greenreedtech.com/hashicorp-terraform-checksum-verification/terraform-checksum-verification.png
technologies:
  - HashiCorp Terraform
  - AWS S3
  - Security
  - Supply Chain
status: complete
publishDate: 2022-05-17T00:00:00Z
relatedPosts:
  - hashicorp-terraform-checksum-verification
  - hashicorp-terraform-code-signing
  - terraform-aws-s3-state-management-least-privilege
---

Supply chain attacks targeting infrastructure tooling are a growing concern. This project covers the steps needed to verify Terraform binary authenticity, sign your Terraform code, and lock down remote state storage with least-privilege AWS policies.
