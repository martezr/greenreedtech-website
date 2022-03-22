---
title: "Deployment Pipeline Chaos Engineering with StackStorm and ChaosToolkit"
date: "2020-06-24"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/deployment-pipeline-chaos-engineering-with-stackstorm-and-chaostoolkit/chaos_update.png"
author: "Martez Reed"
tags: ["Chaostoolkit","Chaos Engineering","DevOps","StackStorm"]
categories: ["StackStorm"]
draft: false
---

Chaos Engineering is the practice of experimenting or injecting faults into a system to test how the system responds to the failure (https://principlesofchaos.org). Chaos Engineering is still new for many organizations and can be a daunting practice to adopt at first but even baby steps into the practice can be immediately beneficial.

In this blog post we'll look at how we can introduce chaos engineering into our deployment pipeline to test the resiliency of our example web application. We'll be using [StackStorm](https://stackstorm.com/) for running our deployment pipeline and integrate it with ChaosToolkit for carrying out the Chaos Engineering. [ChaosToolkit](https://chaostoolkit.org/) is an open source framework written in Python for running chaos engineering experiments.

The code for this blog post can be found in the following Github repos:

- Terraform code: [https://github.com/martezr/orchestration-demos/tree/master/terraform/chaosstack](https://github.com/martezr/orchestration-demos/tree/master/terraform/chaosstack)
- ChaosToolkit experiment: [https://github.com/martezr/orchestration-demos/blob/master/chaos_experiments/aws.json](https://github.com/martezr/orchestration-demos/blob/master/chaos_experiments/aws.json)
- StackStorm workflow: [https://github.com/martezr/stackstorm-grtlab/blob/master/actions/workflows/chaos_demo.yaml](https://github.com/martezr/stackstorm-grtlab/blob/master/actions/workflows/chaos_demo.yaml)

#### Architecture

This example will deploy a web application to AWS using Terraform and include a load balancer that serves traffic to two (2) EC2 instances in an autoscale group (ASG). This architecture should allow for the web application to be accessible even if there was an issue with one of the EC2 instances in the autoscale group. This is a common architectural pattern for deploying highly available  applications but there are various configuration issues that could prevent the application from being available following a failure.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/deployment-pipeline-chaos-engineering-with-stackstorm-and-chaostoolkit/stackstorm_chaos_1-1024x721.png)

#### Experiment

Given the architecture in our example what we will test or evaluate is if our website can continue to be accessed if one of the EC2 instances in the autoscale group is terminated.

**Configuration:**  ChaosToolkit supports passing environment variables to the experiment. In this example we are passing the name of our autoscale group along with the DNS name of the application load balancer.

**Hypothesis:** The hypothesis is that we expect our web application to still be reachable even if one of the instances in our AWS autoscale group is terminated.

**Chaos Method:** In this experiment we are terminating an EC2 instance in the autoscale group that backs our application load balancer.

The following is the ChaosToolkit experiment that defines what will happen during the experiment. Experiments are written in a JSON format.

```json
{
    "version": "1.0.0",
    "title": "Ensure AWS resilliency",
    "description": "If an autoscale fails another node should become the leader",
    "tags": ["aws"],
    "contributions": {
        "reliability": "high",
        "security": "none",
        "scalability": "none"
    },
    "configuration": {
        "aws_region": "us-east-1",
        "asg_name": {
            "type": "env",
            "key": "asg_name"
        },
        "alb_dns_name": {
            "type": "env",
            "key": "alb_dns_name"
        }
    },
    "steady-state-hypothesis": {
        "title": "Application responds",
        "probes": [
            {
                "type": "probe",
                "name": "check-web-service",
                "tolerance": 200,
                "provider": {
                    "type": "http",
                    "timeout": [2, 2],
                    "expected_status": 200,
                    "url": "http://${alb_dns_name}"
                }
            }
]
    },
    "method": [
        {
            "provider": {
              "module": "chaosaws.asg.actions",
              "type": "python",
              "func": "terminate_random_instances",
              "arguments": {
                  "asg_names": ["${asg_name}"],
                  "instance_count": 1
              }
            },
            "type": "action",
            "name": "terminate-asg-instance",
            "pauses": {
                "after": 10
            }
          },
        {
            "ref": "check-web-service"
        }
    ],
    "rollbacks": []
}
```

#### Pipeline

Now that we have our experiment we need an automated method of running the experiment. In this case we'll be using StackStorm to deploy our application stack and perform the experiment automatically once everything has been deployed.

**Clone Github Repo**

The code used in this example is hosted on Github and we need to clone that repo to allow the code to be executed by the latter steps of the workflow.

```yaml
clone_build_repo:
    action: git.clone
    input:
      source: https://github.com/martezr/orchestration-demos.git
      destination: /stackstorm/orchestration-demos
      hosts: localhost
    next:
      - when: <% succeeded() %>
        do: generate_aws_credentials
```

**Fetch Dynamic AWS Credentials**

In this example we're going to utilize HashiCorp Vault to fetch short-lived credentials to use for our pipeline execution. In this case the instance of HashiCorp Vault has already been configured and integrated with StackStorm. The AWS credentials are being  published to allow subsequent steps in the workflow to access the credentials.

```yaml
generate_aws_credentials:
    action: vault.read path="aws/creds/stackstorm"
    next:
      - when: <% succeeded() %>
        publish:
          - access_key: <% result().result.access_key %>
          - secret_key: <% result().result.secret_key %>
          - stdout: <% result().stdout %>
          - stderr: <% result().stderr %>
        do:
          - provision_app_stack
```

**Deploy Stack**

We're going to build our application stack using HashiCorp Terraform. In this example our Terraform code is in the Github repository we fetched in an earlier stage of the  workflow. The state is being stored locally on the system for demonstration purposes and we are passing the AWS credentials from the last  step as variables.

```yaml
provision_app_stack:
    delay: 15
    action: terraform.pipeline
    input:
      plan_path: /stackstorm/orchestration-demos/terraform/chaosstack
      backend: {"path":"/stackstorm/chaosstack.tfstate"}
      variable_dict: {"aws_access_key":"<% ctx('access_key') %>","aws_secret_key":"<% ctx('secret_key') %>"}
    next:
      - when: <% succeeded() %>
        do: output_alb_dns
```

**Output ALB DNS Name**

In the case of this example we won't be using a dedicated DNS address for our web application see we need an additional stage in the workflow to capture the DNS name associated with the ALB that has been provisioned. This DNS address will be used by our chaos experiment to test reachability to our web application.

```yaml
output_alb_dns:
    action: terraform.output
    input:
      plan_path: /stackstorm/orchestration-demos/terraform/chaosstack
    next:
      - when: <% succeeded() %>
        publish:
          - alb_dns_name: <% result().result.alb_dns_name.value %>
        do: run_chaos_experiment
```

**Run Chaos** **Experiment**

The final stage of the workflow is to run our chaos experiment against the application stack we just deployed. The goal of the experiment is to evaluate if our web application is able to continue serving traffic relatively uninterrupted following the termination of an instance in the AWS autoscale group. In addition to the AWS credentials being passed to the stage we're also including the name of the autoscale group and the load balancer's DNS name for reachability testing.

```yaml
run_chaos_experiment:
    delay: 10
    action: chaostoolkit.run_experiment
    input:
      path: /stackstorm/orchestration-demos/chaos_experiments/aws.json
      env: {"AWS_ACCESS_KEY_ID":"<% ctx('access_key') %>","AWS_SECRET_ACCESS_KEY":"<% ctx('secret_key') %>","asg_name":"<% ctx('asg_name') %>","alb_dns_name":"<% ctx('alb_dns_name') %>"}
```

The screenshot below is the deployment workflow in the StackStorm web interface.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/deployment-pipeline-chaos-engineering-with-stackstorm-and-chaostoolkit/stackstorm_chaos_2_1-1024x456.png)

This example shows the core capability of adding Chaos Engineering into the pipeline but could be extended to destroy the environment if the experiment failed, it could push the report from the experiment into a CMDB to create a record of how resilient the application is along with countless other possible integrations.

Hopefully this sets you on the path of getting excited about incorporating Chaos Engineering into your deployment pipelines to actually validate the assumptions that are made about your application's resiliency.