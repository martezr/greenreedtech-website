---
title: "Detecting HashiCorp Vault Root Login"
description: "meta description"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/detecting-hashicorp-vault-root-login/vault_root_login.png"
date: "2020-02-09"
draft: false
author: "Martez Reed"
tags: ["DevOps", "Terraform","VMware"]
categories: ["Career"]
---

Security of a HashiCorp Vault deployment is of paramount importance given the sensitive nature of the information contained within the platform. During the initial configuration process the root token is used to perform the setup and should be used to create less privileged named accounts. These accounts should be used for day to day administration of the Vault deployment and the root token should only be used in scenarios where it is absolutely necessary. The reason for this is the all-powerful privileges that the root token wields on the platform. Based upon this information it is critical to know whenever the root token is used to log into the Vault deployment and that's what will be covered in this blog post.

All operations in HashiCorp Vault are audited and can be sent to an audit log or syslog that is ultimately shipped to a centralized logging server for greater security. In this example we want to utilize the audit log to find out when the root token is used for a login operation. We'll use Splunk for our centralized logging server.

### Vault Configuration

The Vault instance needs to be configured to ship the log files to our logging server and in this example the logging server is a Splunk instance. This post assumes that you know how to configure Vault audit logging and ship the logs to a centralized logging server. Details on how to configure this are configured in a previous post ([https://www.greenreedtech.com/vault-audit-logging/](https://www.greenreedtech.com/vault-audit-logging/)) but at a high level audit logging must be enabled in Vault, configured to write to a log file or syslog and configured to ship those logs to a centralized logging server.

### Splunk Configuration

With the audit log now being shipped to our Splunk instance we can see the operations occurring in the Vault cluster. Now we need to figure out what a root login looks like in the audit log. The easiest way to do this was to perform a root login and identify what that operation was from a log perspective. The payload below is a root token login event.

```json

{
    "auth": {
        "accessor": "hmac-sha256:67869871d870282745682c729d86cee81acb5346c3dbecb573b7d44ea5506d06",
        "client_token": "hmac-sha256:8fe52f85c93aad7df87c7203f864a9900d25451a1cc88c486ae0c951bd3a8936",
        "display_name": "root",
        "policies": [
            "root"
        ],
        "token_policies": [
            "root"
        ],
        "token_type": "service"
    },
    "request": {
        "client_token": "hmac-sha256:8fe52f85c93aad7df87c7203f864a9900d25451a1cc88c486ae0c951bd3a8936",
        "client_token_accessor": "hmac-sha256:67869871d870282745682c729d86cee81acb5346c3dbecb573b7d44ea5506d06",
        "id": "3ab2651a-899b-0a98-c626-73c405d89d02",
        "namespace": {
            "id": "root"
        },
        "operation": "read",
        "path": "auth/token/lookup-self",
        "remote_address": "10.0.0.70"
    },
    "response": {
        "data": {
            "accessor": "hmac-sha256:67869871d870282745682c729d86cee81acb5346c3dbecb573b7d44ea5506d06",
            "creation_time": 1576768685,
            "creation_ttl": 0,
            "display_name": "hmac-sha256:6b89bf27681e54af63afe4a0b936bbf618f8d9b17bcc68df8c11470f7328d745",
            "entity_id": "hmac-sha256:de212e047ea6043f736d83549f3dae8612c688af0d5a6b4d19a262473c5b8bea",
            "expire_time": null,
            "explicit_max_ttl": 0,
            "id": "hmac-sha256:8fe52f85c93aad7df87c7203f864a9900d25451a1cc88c486ae0c951bd3a8936",
            "meta": null,
            "num_uses": 0,
            "orphan": true,
            "path": "hmac-sha256:20039952cb073210bc9cb0fa1dc3dec3e49bcd8a72b5dd2a9f9ce415010c91a0",
            "policies": [
                "hmac-sha256:6b89bf27681e54af63afe4a0b936bbf618f8d9b17bcc68df8c11470f7328d745"
            ],
            "ttl": 0,
            "type": "hmac-sha256:05148f41a98c981f657d9a0cb0b647e1f32a764719da2e75f27a497485eb9b7a"
        }
    },
    "time": "2020-01-31T13:14:37.132982729Z",
    "type": "response"
}
```

Now that we know what we want to look for we can create our Splunk search string to return only root login events.

```bash
auth.display_name="root" type="response" request.path="auth/token/lookup-self"
```

If there has been a recent login with the root token we should see results from our search similar to those below.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/detecting-hashicorp-vault-root-login/vault_root_login-1024x585.png)

This can be extended to send a notification or create a helpdesk ticket, most logging platforms have the ability to trigger an action when a designated event occurs. As an example, Splunk supports a handful of alert actions such as sending an email, outputting results to a lookup file or sending a webhook to an external system.

### References

The following content was used to create this blog post.

**Vault Production Guide**

[https://www.vaultproject.io/guides/operations/production](https://www.vaultproject.io/guides/operations/production)

**Splunk Alert Webhooks**

[https://docs.splunk.com/Documentation/Splunk/8.0.1/Alert/Webhooks](https://docs.splunk.com/Documentation/Splunk/8.0.1/Alert/Webhooks)
