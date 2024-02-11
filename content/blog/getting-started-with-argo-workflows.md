---
title: "Getting Started with Argo Workflows"
description: "getting started with argo workflows for automationa and orchestration"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/getting-started-with-argo-workflows/getting-started-with-argo-workflows-landing-page.png"
date: "2024-02-11"
draft: false
author: "Martez Reed"
tags: ["DevOps","Orchestration"]
categories: ["DevOps"]
---

One of the technologies that I find the most enjoyable working with are orchestration solutions that are used to stitch together complex processes. Over my career I've worked with solutions like VMware vRealize Orchestrator (vRO), StackStorm, as well as countless CI/CD platforms that are commonly used to orchestrate various processes. In this blog post we'll take a look at a solution that I've been meaning to try out for quite some time in Argo Workflows. This is part of the broader umbrella of projects that includes ArgoCD, the popular GitOps solution for Kubernetes.

The first thing that was noteable is that Argo Workflows is deployed on Kubernetes. This is certainly expected and not necessarily a bad thing but something that requires some additional consideration in terms of deploying the application. A major benefit of the application running in Kubernetes is that the workflow tasks are executed inside containers. This provides process isolation and an easy way to leverage tools that are bundled inside containers.

## Installing Argo Workflows

The first thing that we'll do is create a dedicated namespace for argo workflows.

```bash
kubectl create namespace argo
```

Next, we'll deploy argo workflows using the quick start manifest just to get a feel for argo workflows. More advanced installation methods are supported such as installing it via a Helm chart.

```bash
kubectl apply -n argo -f https://github.com/argoproj/argo-workflows/releases/download/v3.5.4/quick-start-minimal.yaml
```

Let's verify the deployment of the argo workflow components in the `argo` namespace.

```bash
kubectl get all -n argo
```

The command should generate output similar to that displayed below.

```bash
NAME                                      READY   STATUS    RESTARTS   AGE
pod/argo-server-fdbdc77b6-7vb4s           1/1     Running   0          49s
pod/workflow-controller-cd8b749cf-gjrk9   1/1     Running   0          49s

NAME                  TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
service/argo-server   ClusterIP   10.96.137.10   <none>        2746/TCP   49s

NAME                                  READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/argo-server           1/1     1            1           49s
deployment.apps/workflow-controller   1/1     1            1           49s

NAME                                            DESIRED   CURRENT   READY   AGE
replicaset.apps/argo-server-fdbdc77b6           1         1         1       49s
replicaset.apps/workflow-controller-cd8b749cf   1         1         1       49s
```

By default the installation utilizes client side authentication using the Kubernetes token but we'll disable that for our testing purposes.

```bash
kubectl patch deployment \
  argo-server \
  --namespace argo \
  --type='json' \
  -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/args", "value": [
  "server",
  "--auth-mode=server"
]}]'
```

Now that the argo workflows deployment is ready, we'll access the UI from our local system by using the kubectl port-forward command.

```bash
kubectl -n argo port-forward deployment/argo-server 2746:2746
```

Now when we browse to https://localhost2746 we'll be able to access the argo workflows landing page. From here we'll click on **+ SUBMIT NEW WORKFLOW** to test out how workflows work.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/getting-started-with-argo-workflows/getting-started-with-argo-workflows-landing-page.png)

Since we're just getting started we don't have an existing workflow loaded so we'll use the default example. Click the **Edit using full workflow options** link to utilize the default workflow.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/getting-started-with-argo-workflows/getting-started-with-argo-workflows-workflow-submission.png)

The default template provides us with quite a bit of information on how the workflows can be crafted. We see that there is an input parameter as well as a pretty well fleshed out container definition that includes the command and arguments to run.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/getting-started-with-argo-workflows/getting-started-with-argo-workflows-create-workflow.png)

Once the workflow completes we're able to view the status of the individual tasks or stages along with detail information regarding their execution.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/getting-started-with-argo-workflows/getting-started-with-argo-workflows-workflow-status.png)

We could click on the **LOGS** button to view the output of the cowsay container which would display `hello argo` by default.

## Conclusion
Overall I found the solution to be quick and easy to get started with. This was really nice as I've worked with some solutions that are difficult just to get started with. I deployed argo workflows to a local kind cluster on my laptop further reduce any overhead with kicking the tires. I'm definitely intrigued by the possible use cases for argo workflows.
