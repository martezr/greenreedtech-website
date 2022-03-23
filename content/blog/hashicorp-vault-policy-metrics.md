---
title: "HashiCorp Vault Policy Metrics"
date: "2019-06-04"
image: ""
author: "Martez Reed"
tags: ["HashiCorp","Vault"]
categories: ["Vault"]
draft: false
---

I gave a talk for HashiCorp's HashiDays event earlier this year that centered around operational intelligence for HashiCorp Vault. The focus was on harnessing data and turning it into actionable insight to help drive informed decisions. One common insight that's often required but not natively available for various reasons is a mechanism to identify what identities a policy is assigned to within Vault.

While it has some limitations one way to mine such data from Vault is through scripting via the REST API. I was actually able to accomplish this using a python script that can be found at the following URL.

[https://github.com/martezr/vault-insights/blob/master/policy-insights.py](https://github.com/martezr/vault-insights/blob/master/policy-insights.py)

At a high level the script performs the following tasks:

1. Retrieve a list of configured authentication methods (Only userpass and approle are currently supported)
2. Retrieve a list of policies
3. Iterate through the roles or users in the authentication methods and generate a list of assignments to policy
4. Output the results in a JSON format for easy consumption into a tool like Splunk or ELK for dashboard visualization

An example of the script output can be found below.

```json
{
    "admins": {
        "assignments": [
            "userpass_aboggs1",
            "userpass_acortez5",
            "userpass_admin",
            "userpass_dsmith",
            "userpass_dtaylor",
            "userpass_edequattro8",
            "userpass_efrazier6",
            "userpass_epeterson",
            "userpass_ering1",
            "userpass_whadden"
        ],
        "total_assignments": 10
    },
    "app-readonly": {
        "assignments": [
            "approle_app8",
            "approle_app9",
            "userpass_appdb1"
        ],
        "total_assignments": 3
    },
    "default": {
        "assignments": [],
        "total_assignments": 0
    },
    "orphan_assignments": {
        "app9": "newerpolicy"
    },
    "policywriter": {
        "assignments": [
            "approle_app1",
            "userpass_mreed"
        ],
        "total_assignments": 2
    },
    "root": {
        "assignments": [],
        "total_assignments": 0
    },
    "testpolicy": {
        "assignments": [
            "approle_app4",
            "approle_app8",
            "approle_hello-world"
        ],
        "total_assignments": 3
    },
    "vaultreporter": {
        "assignments": [
            "userpass_vaultreporter"
        ],
        "total_assignments": 1
    }
}
```

The ultimate goal of the script is to generate metrics that could be used to help determine what level of access an identity has within Vault. It could also be used when looking to eliminate policy sprawl within a Vault cluster.
