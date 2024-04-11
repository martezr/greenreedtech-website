---
title: "Getting Started with Pulumi IaC"
date: "2024-03-19"
image: ""
author: "Martez Reed"
categories: ["IaC"]
tags: ["IaC","DevOps"]
draft: true
---
Infrastructure as Code or IaC for short has quickly become a popular way of managing infrastructure, particularly cloud infrastructure. Terraform is the tool most synonymous with IaC and the most popular given it's ability to work across clouds. Terraform utilizes a DSL (Domain Specific Language) for defining the infrastructure configuration known as HCL or Hashicorp Configuration Language. The human readable format makes it simple to get started with and easy to read. The challenge that many have faced with Terraform is when there's a need to define a complex configuration. Those that have worked with a programming language such as Python or Golang often feel hampered by the comparatively limited syntax offered by HCL. This is the problem that Pulumi looks to solve by leveraging existing programming languages like TypeScript, Python, and Golang to define infrastructure.

## Installing Pulumi
Now that we know why Pulumi is used, let's take a look at installing it. Similar to Terraform, Pulumi is a single binary install 


```
https://get.pulumi.com/releases/sdk/pulumi-v3.112.0-darwin-x64.tar.gz
```

## Pulumi Hello World
