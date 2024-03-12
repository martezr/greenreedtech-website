---
title: "Don't Blindly Trust GitOps"
description: "getting started with argo workflows for automationa and orchestration"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/getting-started-with-argo-workflows/getting-started-with-argo-workflows-landing-page.png"
date: "2024-02-29"
draft: true
author: "Martez Reed"
tags: ["DevOps","Orchestration"]
categories: ["DevOps"]
---

GitOps seems to be everywhere and has really taken off with the proliferation of Kubernetes. GitOps is the concept of managing system configuration exclusively through the use of committing configuration code to a Git repository. As an example, if a user needed to be added to a group then that addition would be defined in code (likely Terraform) and a subsequent process would apply the changes to the system. In the case of Kubernetes, continuous reconciliation is a major aspect of GitOps. It essentially means that Kubernetes will make the change and then continually enforce that configuration. It seems like there's nothing but positives given the ability to update configuration via code, review and approve the changes via a RV


# Why
Blindly trusting anything is a terrible idea, but why not trust GitOps? 

