---
title: "HashiCorp Vault Unique AppRole Identity Logging"
image: "https://www.datocms-assets.com/2885/1620159869-brandvaultprimaryattributedcolor.svg"
date: "2021-12-01"
author: "Martez Reed"
tags: ["DevOps","HashiCorp","Security","Vault"]
categories: ["Vault"]
draft: false
---

HashiCorp Vault supports several authentication methods for human and non-human access. Several of the non-human authentication methods are tied to specific platforms or clouds such as AWS, Kubernetes, Azure, and others. For workloads that are running on non-supported platforms, the AppRole authentication method is typically recommended for authentication. The AppRole method uses a role as the core construct as the name implies. In order to authenticate a role ID and a secret ID are required.

## AppRole Conundrum
The role is typically used in a non-unique or shared manner in that it is used by multiple systems for authentication purposes. It is possible to create a role that is unique to an individual workload but can greatly increase the management overhead. This poses the classic challenge of correctly identifying which system accessed a given path in Vault. The audit log does include the remote IP address of the system that makes the request, but this method of identification relies upon a point in time mapping of the IP address to the system.

## Solution
The Vault API supports the ability to add custom metadata to a generated AppRole secret ID that is displayed in the Vault audit logs. This enables the system that is trusted to generate secret IDs for a given role to associate a unique identity with the secret ID. The custom metadata appears in the requests and responses of access attempts by the token associated with the generated secret ID. The screenshot below displays an example that specifies virtual_machine_name as the identifying piece of metadata associated with the secret ID.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/hashicorp-vault-unique-approle-identity-logging/vault-approle-unique-identity.png)

Without the addition of the additional metadata all that we would know was that the potentially shared role was used to access a given path within HashiCorp Vault.

## Adding Identity Metadata
Now that we know how the solution works let’s walk through adding the custom metadata during an API call to generate a secret ID for an example role. The API expects the metadata field to be a JSON formatted string (https://www.vaultproject.io/api/auth/approle#generate-new-secret-id).

```bash
curl -k \
  --header "X-Vault-Token: s.Zdd50L8a35S6FKxC1UNzvhgU" \
  --request POST --data '{"metadata": "{ \"tag1\": \"production\" }"}' \         https://127.0.0.1:8200/v1/auth/approle/role/vsphereapp/secret-id
```

## Conclusion
In this blog post we took a quick look at how we can utilize the AppRole authentication method in HashiCorp Vault without sacrificing the benefit of named or unique identities from an auditing perspective.
