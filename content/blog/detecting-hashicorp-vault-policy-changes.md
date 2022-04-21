---
title: "Detecting HashiCorp Vault Policy Changes"
description: "meta description"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/detecting-hashicorp-vault-root-login/vault_root_login.png"
date: "2022-04-01"
draft: true
author: "Martez Reed"
tags: ["HashiCorp","Vault","DevOps","Security"]
categories: ["Vault"]
---

Security of a HashiCorp Vault deployment is of paramount importance given the sensitive nature of the information contained within the platform. During the initial configuration process the root token is used to perform the setup and should be used to create less privileged named accounts. These accounts should be used for day to day administration of the Vault deployment and the root token should only be used in scenarios where it is absolutely necessary. The reason for this is the all-powerful privileges that the root token wields on the platform. Based upon this information it is critical to know whenever the root token is used to log into the Vault deployment and that's what will be covered in this blog post.

All operations in HashiCorp Vault are audited and can be sent to an audit log or syslog that is ultimately shipped to a centralized logging server for greater security. In this example we want to utilize the audit log to find out when a policy is changed outside of the CI/CD process used to define all of our policies using code. We'll use Splunk for our centralized logging server.

### Vault Configuration

The Vault instance needs to be configured to ship the log files to our logging server and in this example the logging server is a Splunk instance. This post assumes that you know how to configure Vault audit logging and ship the logs to a centralized logging server. Details on how to configure this are configured in a previous post ([https://www.greenreedtech.com/vault-audit-logging/](https://www.greenreedtech.com/vault-audit-logging/)) but at a high level audit logging must be enabled in Vault, configured to write to a log file or syslog and configured to ship those logs to a centralized logging server.

### Splunk Configuration

With the audit log now being shipped to our Splunk instance we can see the operations occurring in the Vault cluster. Now we need to figure out what a policy change looks like in the audit log. The easiest way to do this was to perform a policy change and identify what that operation was from a log perspective. The payload below is a policy create/update event.

```json
{
  "time": "2022-04-01T03:26:50.198973857Z",
  "type": "request",
  "auth": {
    "client_token": "hmac-sha256:be5774638ad2cc9c6ad749e43b71756759d44073d8e8285ec9de4dd6cde4a5d7",
    "accessor": "hmac-sha256:286d047c74b34c1c0df8d04c978ecf11076a0a8b557ef197a5e8bfc851aa1808",
    "display_name": "root",
    "policies": [
      "root"
    ],
    "token_policies": [
      "root"
    ],
    "token_type": "service",
    "token_issue_time": "2021-11-17T20:45:23-06:00"
  },
  "request": {
    "id": "c6cec2d3-2f3e-6648-d3c0-4ffd23820004",
    "client_id": "0DHqvq2D77kL2/JTPSZkTMJbkFVmUu0TzMi0jiXcFy8=",
    "operation": "update",
    "mount_type": "system",
    "client_token": "hmac-sha256:be5774638ad2cc9c6ad749e43b71756759d44073d8e8285ec9de4dd6cde4a5d7",
    "client_token_accessor": "hmac-sha256:286d047c74b34c1c0df8d04c978ecf11076a0a8b557ef197a5e8bfc851aa1808",
    "namespace": {
      "id": "root"
    },
    "path": "sys/policies/acl/demo",
    "data": {
      "name": "hmac-sha256:7e83d9290c65d460fbfc3627eac3ce68b8a9e338eac22b283e009c231ab5b04d",
      "policy": "hmac-sha256:ba02f9b757ce2b0d325de063c24f613ee791b6cc03b4ce76173cfbac8d0e8fd4"
    },
    "remote_address": "10.0.0.136",
    "remote_port": 50159
  }
}
```

Now that we know what we want to look for we can create our Splunk search string. The search string looks for any update (create or update) operations at the `sys/policies/acl` path.

```bash
"request.path"="sys/policies/acl/*" "request.operation"=update type=request "auth.display_name"!=vaultci
```

If there has been a recent policy change by a user outside of the CI/CD pipeline service account we should see results from our search similar to those below.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/detecting-hashicorp-vault-root-login/vault_root_login-1024x585.png)

This can be extended to send a notification as well taking active remediation by automatically deleting the new policy.

### References

The following content was used to create this blog post.

**Vault Production Guide**

[https://www.vaultproject.io/guides/operations/production](https://www.vaultproject.io/guides/operations/production)

**Splunk Alert Webhooks**

[https://docs.splunk.com/Documentation/Splunk/8.0.1/Alert/Webhooks](https://docs.splunk.com/Documentation/Splunk/8.0.1/Alert/Webhooks)
