---
title: "Detecting HashiCorp Vault Policy Changes"
description: "meta description"
image: "images/post/vault-policy-update.jpeg"
date: "2022-07-13"
draft: false
author: "Martez Reed"
tags: ["HashiCorp","Vault","DevOps","Security"]
categories: ["Vault"]
---

Security of a HashiCorp Vault deployment is of paramount importance given the sensitive nature of the information contained within the platform. Policies within the platform are used to grant and deny access to the sensitive information stored in the platform.

All operations in HashiCorp Vault are audited and can be shipped to a centralized logging server. In this scenario we want to utilize the audit log to find out when a policy is changed outside of the CI/CD process used to define all of our policies using code.

### Vault Configuration

The Vault instance needs to be configured to ship the log files to our logging server and in this example we're using a combination of [Vector](https://vector.dev/), [NATS](https://nats.io/) and Golang. This post assumes that you know how to configure Vault audit logging and ship the logs to a centralized logging server. Details on how to configure this are covered in a previous post ([https://www.greenreedtech.com/vault-audit-logging/](https://www.greenreedtech.com/vault-audit-logging/)).

### Audit Log Example

Once the audit log has been configured and the logs are being shipped we can see the operations occurring in the Vault cluster. Now we need to figure out what a policy change looks like in the audit log. The easiest way to do this is to perform a policy change and identify what that operation is from a log perspective. The payload below is a policy create/update event.

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

Now that we know what the log entry looks like, we're able to create the logic to find update events.

The example below keys in on the path of the request, the operation which is an update, the type which is the response to the request and finally the display name of the user account.

```bash
request["path"] = "sys/policies/acl/*" 
request["operation"] = update 
type = response 
auth["display_name"] != vaultci
```

If there has been a recent policy change by a user outside of the CI/CD pipeline service account, vaultci in this case then the event should be flagged.

The following code is an example of a solution used for testing Vault events and sends a slack message when a policy update is detected.

```go
func PolicyUpdate(entry utils.AuditLogEntry) {
	if entry.Type == "response" &&
		strings.Contains(entry.Request.Path, "sys/policies/acl") &&
    entry.Auth.DisplayName != "vaultci" &&
		entry.Request.Operation == "update" {
		policypath := strings.Split(entry.Request.Path, "/")
		policyName := policypath[len(policypath)-1]

		var message string
		if entry.Auth.DisplayName == "token" {
			message = fmt.Sprintf("An out of band policy change has been made to the %s policy by %s", policyName, "root")
		} else {
			message = fmt.Sprintf("An out of band policy change has been made to the %s policy by %s", policyName, entry.Auth.DisplayName)
		}
		actions.SendSlackMessage("Vault Policy Update Alert", policyName, message)
		fmt.Println("Update detected")
	}
}
```

### References

The following content was used to create this blog post.

**Vault Production Guide**

[https://www.vaultproject.io/guides/operations/production](https://www.vaultproject.io/guides/operations/production)