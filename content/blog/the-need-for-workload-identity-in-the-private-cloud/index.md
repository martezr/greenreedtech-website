---
title: "The Need for Workload Identity in the Private Cloud "
description: "The Need for Workload Identity in the Private Cloud"
image: "images/post/private-cloud-image.jpg"
twitterimage: 'private-cloud-image.jpg'
date: "2024-09-26"
draft: false
author: "Martez Reed"
tags: ["Private Cloud","Workload Identity"]
categories: ["Workload Identity"]
---

A growing consideration for cloud spending and the proliferation of AI have caused many organizations to evaluate their use of the public cloud. Many are looking at taking better advantage of their existing data centers or leveraging colocation facilities to enable the best of both worlds. Many will state that the cloud isn’t a location but an operating model. This means that companies have adopted operational patterns for managing workloads in the public cloud (location) that would like to leverage in their private cloud. I believe that workload identity is one of those patterns that many would like to take advantage of in their private cloud.

Workload identity in the public cloud enables a frictionless authentication experience when a workload needs to access a cloud-native service. This not only reduces the overhead of creating and managing service accounts but also enables a better security posture through the use of short-lived credentials. 

### This all sounds great but don’t workloads in a private cloud already have identities? 

Workloads in a private cloud environment have identifiers like the name of a virtual machine or an operating system’s hostname. These pieces of metadata can easily be spoofed and don’t assure that the workload initiating the request is actually the workload. 

### What about service accounts (Username and Password)?

The most frequently used method for machine authentication is a username and password. This is usually a dedicated service account but is often just an admin's personal named account. This incurs the administrative overhead of needing to rotate dozens or hundreds of service account passwords on a regular basis. Another consideration is that most identity systems don't allow the use of the service account to be restricted to a single IP address. This would help provide an assurance that the service account can only be used from the designated system.

### What about x509 Certificates?

Let’s start with the fact that public Key Infrastructure (PKI) and certificates are notoriously difficult for most organizations. Certificates suffer from many of the same problems as usernames and passwords, such as the need to rotate them. Many solutions, such as service meshes, use TLS certificates to enable mutual authentication (mTLS) between workloads. This works well but is tightly coupled to the service mesh deployment, which may not work for non-Kubernetes workloads. This means that every workload in the environment can’t take advantage of this capability.

### So, why do we need workload identity in the private cloud? 

The same reasons we’ve come to love workload identity in the public cloud as well as the value it could bring to hybrid cloud environments.

* **Workload Identity Federation:** More public cloud providers are actively acknowledging that their cloud isn’t the only game in town. GCP and AWS, for example, have solutions for trusting an identity from the other cloud. This could be used to seamlessly access GCP cloud storage from an AWS EC2 instance. The same could also, in theory, be done from a private cloud.
* **Improved Security Posture:** Long-lived credentials pose a security risk and are generally more cumbersome to rotate should there be a security incident. A workload identity solution would automate the rotation of the credentials used and restrict the lifetime of an associated credential.
* **Identity Uniqueness Assurance:** This is technically possible with a service account or x509 certificate, but a workload identity solution provides greater assurance that the identity is truly unique.
* **Cloud Operating Model Alignment:** This is a capability that public cloud providers have provided for years and is a widely adopted pattern that provides tremendous value. It only makes sense for the private cloud to provide a similar capability to enable a unified experience.

### So, where’s the workload identity in the private cloud? 

One of the reasons that workload identity hasn’t been more of a priority in the private cloud is that the services that the identity is used to access in the public cloud don’t exist in the same fashion in the private cloud. Services like object storage and database as a service (DBaaS) are table stakes for cloud providers but are still very immature in the private cloud. These services in the private cloud will only continue to mature as the technology options to enable them, like Kubernetes, continue to be adopted.

There are actually a number of solutions in the private cloud that aim to provide workloads with an identity, such as HashiCorp Vault (https://www.vaultproject.io/) and SPIFEE (https://spiffe.io/). These solutions provide half of the equation in that they still need something that they initially trust to verify the identity of the workload that just isn’t present in private clouds. In the public cloud, this is an identity provided by the cloud provider that these solutions can cryptographically verify.