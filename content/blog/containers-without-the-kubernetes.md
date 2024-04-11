---
title: "More Containers With None of the Kubernetes"
date: "2024-03-19"
image: ""
author: "Martez Reed"
categories: ["DevOps"]
tags: ["Kubernetes"]
draft: true
---
By now most people have heard of Kubernetes or k8s for short. It is implicitly assumed that Kubernetes is the underlying platform when there's any conversation about containers or microservices.
The genesis of the solution is Google's Borg platform which is utilized to schedule containers in their internal environment. The vast majority of companies for most of their existance have deployed applications

## Why Not Kubernetes?
The common question most people might ask is why NOT kubernetes given it's ubiquitous adoption. Those that have been in the industry long enough may remember the container wars from the not so distant past. 

The challenge with going down a different path than the Kubernetes route for most companies is just the sheer momentum that is behind Kubernetes at the moment. What I mean by that is the fact that a lot of software, particularly cloud native software, has been built with the assumption that it will be running in Kubernetes. The key part here is running in Kubernetes, I didn't say running in containers as many apps are built to take advantage of Kubernetes specific constructs like the operator pattern for managing the software. This is certainly beneficial for running it on Kubernetes but makes it nearly impossible to run the software on a different container orchestration platform.

## Why Not Just Managed Kubernetes (All the Kubernetes and none of the Ops)?


## What Else is there?
One of the things that I've realized is that at a certain point the hype and noise around a technology can become deafening to the point that its hard to imagine that anything else exists.

* [**Docker Swarm**](https://docs.docker.com/engine/swarm/): Docker is the company and technology that's probably most synonomous with containers. Swarm is a 
* **Azure ACI (Azure Container Instance)**: AWS ECS is a managed container scheduler/orchestrator
* **Azure Container Apps**
* **AWS Elastic Container Service (ECS)**: AWS ECS is a managed container scheduler/orchestrator
* **AWS Fargate**:
* **HashiCorp Nomad**: HashiCorp Nomad is an open source workload scheduler that supports running containers but also Jar can be utilized to run workloads in the public cloud, in a DataCenter, or at the edge.
* **Heroku and Friends**:


## Conclusion
Despite the wave of content focused on Kubernetes, there are actual alternatives that companies are happily using to solve their use cases. This isn't to say that Kubernetes is bad or good but simply to 
