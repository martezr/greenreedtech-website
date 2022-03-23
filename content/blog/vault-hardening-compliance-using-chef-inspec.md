---
title: "Vault Hardening Compliance using Chef InSpec"
date: "2018-08-07"
image: ""
draft: false
author: "Martez Reed"
tags: ["DevOps", "Vault","Security","InSpec"]
categories: ["Vault"]
---

HashiCorp Vault is quickly becoming the defacto secrets management platform used in environments that rely on DevOps concepts for application delivery. Vault is incredibly easy and simple to get started with but takes a bit of thought and planning to operationalize it.

One of the challenges is ensuring that the installation of your security platform is secure. Chef InSpec is a compliance as code tool that allows us to create profiles that outline a desired security posture. In this post we're looking at an example InSpec profile for Vault that mimics some of the common controls found in industry standards such as CIS benchmarks and DISA STIGs.

[https://github.com/martezr/inspec-vault](https://github.com/martezr/inspec-vault)

**Requirements**

This InSpec profile assumes the following configuration.

- CentOS 7
- Vault running as a SystemD service
- AuditD

**Download and install Chef InSpec ([https://downloads.chef.io/inspec](https://downloads.chef.io/inspec))**

The following command downloads and installs Chef InSpec.

```bash
rpm -Uvh https://packages.chef.io/files/stable/inspec/2.2.50/el/7/inspec-2.2.50-1.el7.x86_64.rpm  
```

**Run InSpec Profile**

The following command runs the Vault InSpec profile against the local machine.

```bash
inspec exec https://github.com/martezr/inspec-vault  
```

```
Profile: HashiCorp Vault InSpec Profile (inspec-vault)  
Version: 0.0.1  
Target:  local://

  ✔  vault-1.1: Keep Vault up to date
     ✔  vault_version version should cmp >= "v0.10.1"
  ×  vault-1.2: Audit Vault executable
     ×  Auditd Rules lines should include "-w /usr/local/bin/vault -p rwxa -k vault"
     expected ["No rules"] to include "-w /usr/local/bin/vault -p rwxa -k vault"
  ×  vault-1.3: Secure Vault configuration files (2 failed)
     ×  Directory /opt/vault should not be readable by others
     expected Directory /opt/vault not to be readable by others
     ✔  Directory /opt/vault should not be writable by others
     ×  Directory /opt/vault should not be executable by others
     expected Directory /opt/vault not to be executable by others
     ✔  Directory /opt/vault owner should eq "vault"
  ×  vault-1.4: Audit Vault files and directories
     ×  Auditd Rules lines should include "-w /opt/vault/ -p rwxa -k vault"
     expected ["No rules"] to include "-w /opt/vault/ -p rwxa -k vault"
  ×  vault-1.5: Audit Vault service configuration
     ×  Auditd Rules lines should include "-w /etc/systemd/system/vault.service -p rwxa -k vault"
     expected ["No rules"] to include "-w /etc/systemd/system/vault.service -p rwxa -k vault"
  ✔  vault-1.6: Ensure that the vault service is running
     ✔  Service vault should be installed
     ✔  Service vault should be enabled
     ✔  Service vault should be running
  ✔  vault-1.7: Ensure Vault is not running as root
     ✔  Processes vault users should not eq ["root"]
  ×  vault-1.8: Ensure swap is disabled on the system
     ×  Command: `swapon -s | grep -v Filename` exit_status should eq 1

     expected: 1
          got: 0

     (compared using ==)

  ✔  vault-1.9: Verify that vault.service file permissions are set to 644 or more restrictive
     ✔  File /etc/systemd/system/vault.service should exist
     ✔  File /etc/systemd/system/vault.service should be file
     ✔  File /etc/systemd/system/vault.service should be readable by owner
     ✔  File /etc/systemd/system/vault.service should be writable by owner
     ✔  File /etc/systemd/system/vault.service should be readable by group
     ✔  File /etc/systemd/system/vault.service should not be writable by group
     ✔  File /etc/systemd/system/vault.service should be readable by other
     ✔  File /etc/systemd/system/vault.service should not be writable by other
     ✔  File /etc/systemd/system/vault.service should not be executable


Profile Summary: 4 successful controls, 5 control failures, 0 controls skipped  
Test Summary: 16 successful, 6 failures, 0 skipped
```

## Attributes

InSpec attributes allow variables to be changed at runtime such as the name of a user or the path of a directory to check. This allows the InSpec profile be flexible enough to accommodate small differences in configurations.

### Running the InSpec Profile with attributes

The example below shows how we can use an attributes file to change some of the things that the InSpec profile looks for.

The readme of the InSpec profile lists what attributes are available such as vault_dir or vault_user. We just need to create a yaml file such as "attr.yaml" and define the desired attributes like the example below.

**Example attributes.yaml file**

```
vault_user: bob  
vault_dir: /etc/vault  
```

**Running the InSpec profile with an attributes file**

```bash
inspec exec https://github.com/martezr/inspec-vault --attributes file_path/attributes.yaml  
```

This InSpec profile is in the early stages of development and continues to evolve but it provides an example of how InSpec can be used as a tool to shift security left.

## References

HashiCorp Vault InSpec Profile  
[https://github.com/martezr/inspec-vault](https://github.com/martezr/inspec-vault)

InSpec Profiles  
[https://www.inspec.io/docs/reference/profiles/](https://www.inspec.io/docs/reference/profiles/)
