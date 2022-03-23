---
title: "Vault Audit Logging"
date: "2018-02-01"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/vault_audit_logging/vault_audit_logging_1.png"
author: "Martez Reed"
tags: ["HashiCorp","Vault","DevOps","Security"]
categories: ["Vault"]
draft: false
---

Vault ([https://www.vaultproject.io/](https://www.vaultproject.io/)) is a secrets management tool created by HashiCorp that is extremely popular. Given the sensitive nature of the data being stored by a Vault server it is critical that auditing be configured appropriately to provide a record of who accessed sensitive data and when it was accessed. In this blog post we'll walk through configuring a Vault server for auditing and dump the log entries to an AWS S3 bucket for centralized storage.

## Enable Auditing

The following is an example of a write event to vault.

Example Audit entry

```json
{
    "time": "2018-02-01T14:40:03.226772711Z",
    "type": "response",
    "auth": {
        "client_token": "hmac-sha256:09b0c08f04bc69bf10a0b8c1d2fa3d84ad4efc470d4f3125950cb5979e606843",
        "accessor": "hmac-sha256:34d5c7474ecac552772fbe091aee99dfc60b6461d42504a117b09928552cfad8",
        "display_name": "root",
        "policies": [
            "root"
        ],
        "metadata": null,
        "entity_id": ""
    },
    "request": {
        "id": "1af553d4-f2a8-4fac-66ec-b333b392011a",
        "operation": "create",
        "client_token": "hmac-sha256:09b0c08f04bc69bf10a0b8c1d2fa3d84ad4efc470d4f3125950cb5979e606843",
        "client_token_accessor": "hmac-sha256:34d5c7474ecac552772fbe091aee99dfc60b6461d42504a117b09928552cfad8",
        "path": "secret/audittest",
        "data": {
            "value": "hmac-sha256:f0dbb2e3574400553d45f259391f17a2c09e7845deb310faf3151ea2527e6c51"
        },
        "policy_override": false,
        "remote_address": "172.28.128.6",
        "wrap_ttl": 0,
        "headers": {}
    },
    "response": {},
    "error": ""
}
```

### Security Considerations

The audit log entry contains the value of the secret in a hashed format but can be deciphered with the appropriate access to the vault server. The log files should be encrypted and access to the log files restricted.

> The audit logs contain the full request and response objects for every interaction with Vault. The request and response can be matched utilizing a unique identifier assigned to each request. The data in the request and the data in the response (including secrets and authentication tokens) will be hashed with a salt using HMAC-SHA256.

> The purpose of the hash is so that secrets aren't in plaintext within your audit logs. However, you're still able to check the value of secrets by generating HMACs yourself; this can be done with the audit device's hash function and salt by using the /sys/audit-hash API endpoint (see the documentation for more details). Currently Vault supports three auditing methods

### Audit Methods

Vault supports the following three methods for writing audit entries.

- Socket
- Syslog
- File

#### Socket

The socket audit device writes to a TCP, UDP, or UNIX socket. Due the warning in the HashiCorp documentation below we are avoiding this method for a more reliable method as the loss of a single audit entry is not desired.

> Warning: Due to the nature of the underlying protocols used in this device there exists a case when the connection to a socket is lost a single audit entry could be omitted from the logs and the request will still succeed. Using this device in conjunction with another audit device will help to improve accuracy, but the socket device should not be used if strong guarantees are needed for audit logs.

#### Syslog

Syslog is the de-facto standard for logging and is partially supported by Vault as the method is limited to sending only to local syslog and not a remote destination.

#### File

Given the limitations of the other two methods the file audit method is the ideal audit method. To centralize the logging we'll use Fluentd to dump the logs to an S3 bucket.

```bash
vault audit enable file file_path=/var/log/vault_audit.log  
```

## Installing Fluentd

**Increase Max number of File Descriptors**

Please add following lines to your /etc/security/limits.conf file and reboot your machine.

```
root soft nofile 65536  
root hard nofile 65536  
* soft nofile 65536   
* hard nofile 65536
```

**Install Fluentd**

```bash
curl -L https://toolbelt.treasuredata.com/sh/install-redhat-td-agent3.sh | sh  
```

**Enable Fluentd to start on boot**

```bash
sudo systemctl enable td-agent.service  
```

**Start the Fluentd service**

```bash
sudo systemctl start td-agent.service  
```

With the Fluentd agent installed and the service started we now need to create an entry for our source which is the vault audit log file and a destination which will be our S3 bucket for persistently storing the log entries.

**Fluentd Configuration**

We need to write following input and output stanzas to the Fluentd agent configuration file (`/etc/td-agent/td-agent.conf`).

**Input**

```
<source>  
  @type tail
  path /var/log/vault_audit.log
  pos_file /var/log/td-agent/vault.audit_log.pos
  <parse>
    @type json
  </parse>
  tag s3.vault.audit
</source>  
```

**S3 Output**

```
<match s3.*.*>  
  @type s3

  aws_key_id YOUR_AWS_KEY_ID
  aws_sec_key YOUR_AWS_SECRET/KEY
  s3_bucket YOUR_S3_BUCKET_NAME
  path logs/

  <buffer>
    @type file
    path /var/log/td-agent/s3
    timekey_wait 1m
    chunk_limit_size 256m
  </buffer>

  time_slice_format %Y%m%d%H%M
</match>  
```

## Validating Auditing

Now that we've gotten everything configured we just need to test it to make sure everything is working properly. To do this we need to perform some vault action like writing a secret or reading a secret to trigger the creation of an audit entry.

```bash
vault write secret/audittest value=testingvaultauditing  
```

Once the command is run we should see a new entry created in the /var/log/vault_audit.log file and after a few minutes we should see a folder created in our S3 bucket for storing our Vault audit logs.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vault_audit_logging/vault_audit_logging_2.png)

## References

Installing Fluentd  
[https://docs.fluentd.org/v1.0/articles/before-install](https://docs.fluentd.org/v1.0/articles/before-install)

HashiCorp Vault Auditing  
[https://www.vaultproject.io/docs/audit/index.html](https://www.vaultproject.io/docs/audit/index.html)
