---
title: "Detecting HashiCorp Vault Root Token Generation"
description: "meta description"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/detecting-hashicorp-vault-root-token-generation/vault_root_token_gen2fixed-1024x568.png"
date: "2020-05-20"
draft: false
author: "Martez Reed"
tags: ["DevOps", "Terraform","VMware"]
categories: ["Career"]
---

HashiCorp Vault generates a default root token during installation and best practice dictates that the token should be revoked once the deployment has been setup. There are certain critical operations that can only be carried out by a root token and requires that a new root token be generated. Given the immense power that the root token garners it would be ideal to identify when a root token is generated. In this example we'll utilize the Vault audit log to determine when the process to generate a new root token is started and when it is successfully completed. Splunk will be used as our centralized logging server in this example.

Vault 1.4.0 added logging for root token generation events to the audit log to enable the easy identification of these events. Prior to Vault 1.4.0 there was no record of this operation in the Vault audit log to identify when a new root token is generated. The Vault system log output did show the execution of the root token generation commands.

The generation of a new root token involves multiple steps such as initializing the operation which generates an OTP, providing the unseal information and finally decoding the encode version of the generated root token.

**Detect Root Token Init**

We want to be able to detect when someone attempts to generate a root token. The following command is used to initialize the root token generation process from the command line.

```bash
vault operator generate-root -init
```

The following search string returns the appropriate entry from the Vault audit log for this event.

```bash
source="/opt/vault/logs/vault_audit.log" type=response request.path="sys/generate-root/attempt" request.operation="update"
```

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/detecting-hashicorp-vault-root-token-generation/vault_root_token_gen_1-1024x538.png)

**Successful Root Token Generation**

We want to be able to detect when someone is able to successfully generate a new root token. The following search string returns the audit log entry from when the encoded token is generated.

```bash
source="/opt/vault/logs/vault_audit.log" type=response request.path="sys/generate-root/update" response.data.complete=true
```

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/detecting-hashicorp-vault-root-token-generation/vault_root_token_gen2fixed-1024x568.png)

### **References**

The following content was used to create this blog post:

**Root Token Generation Audit Log Pull Request**

https://github.com/hashicorp/vault/pull/8301

**Vault Root Token Generation Lesson**

https://learn.hashicorp.com/vault/operations/ops-generate-root

**Vault Root Token Command Reference**

https://www.vaultproject.io/docs/commands/operator/generate-root

