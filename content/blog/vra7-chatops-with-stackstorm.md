---
title: "vRA7 Chatops with StackStorm"
date: "2017-02-17"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/vra7_chatops_with_stackstorm/vRA7_Chatops_With_StackStorm_1.png"
author: "Martez Reed"
draft: false
categories: ["StackStorm","VMware","vRA"]
tags: [ "StackStorm","VMware","vRA"]
---

ChatOps is a pretty cool and still emerging technology that allows users to initiate actions on external systems from within a messaging platform such as slack. There are already bots available from vendors such as opvizor ([http://www.opvizor.com/opbot/](http://www.opvizor.com/opbot/)) that provide this functionality in a productized solution. In the case of opvizor, their bot interacts with VMware vSphere.

In our case we want to add chatops functionality to our VMware vRealize Automation 7 environment to be able to do cool things from within Slack. Things like see how many VMs exist in our tenant or see all the recent requests and their status.

To accomplish this we're going to leverage StackStorm ([https://stackstorm.com/](https://stackstorm.com/)) for integrating Slack and vRA7.

#### Configuring StackStorm

The first thing we need to do is install StackStorm on a VM. The following specifications are recommended.

Operating System: CentOS 7  
CPU: 2  
RAM: 2 GB  
HD: 40 GB

**Disable SELinux**

```bash
setenforce 0  
```

**Install stackstorm**

```bash
curl -sSL https://stackstorm.com/packages/install.sh | bash -s -- --user=st2admin --password=Ch@ngeMe  
```

**Install the vRA7 StackStorm Pack**

```bash
st2 pack install https://github.com/martezr/stackstorm-vra7  
```

Now that we've got the integration pack installed we need to configure the pack by setting the connection information for our vRA7 instance.

**hostname:** The fqdn or IP address of the vRA7 instance  
**username:** A user account with access to the vRA7 tenant  
**password:** The password for the user account  
**tenant:** The vRA7 tenant (Defaults to vsphere.local)  
**verify_ssl:** Determines whether ssl certificate for the vRA7 instance is verified.

**The password will be encrypted and stored in the stackstorm database.**

We need to run the configuration script.

```bash
python /opt/stackstorm/packs/vra7/vra7config.py  
```

We'll be prompted for the connection information.

```bash
hostname (vRA FQDN ex. cloud.company.local): vra.company.local  
verify vRA SSL certificate (true/false) [false]:  
username: administrator@vsphere.local  
Password:  
Retype password:  
tenant name [vsphere.local]:  
Successfully configured vRA7 integration pack  
```

Once the configuration has been completed the connection information is stored in a config at /opt/stackstorm/configs/vra7.yaml

**The configuration file should not be updated manually as the password should be stored in clear text on the system.**

```bash
hostname: vra.company.local  
username: administrator@vsphere.local  
password: {{st2kv.system.vra7_password}}  
tenant: vsphere.local  
verify_ssl: true  
```

The last step is integrating StackStorm and Slack to allow us to talk to our bot. Configuring Slack and StackStorm has been covered extensively and the link below provides excellent guidance on how to do it.

[Ansible and ChatOps](https://stackstorm.com/2015/06/24/ansible-chatops-get-started-%f0%9f%9a%80/)

With everything configured let's open up slack and tell our bot what we want. For our example we'll ask our bot how many VMs are in our vRA tenant.

```bash
! How many vms are in vra
```

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vra7_chatops_with_stackstorm/vRA7_Chatops_With_StackStorm_1.png)

Additional actions

- Get resource by name
    ```bash
    ! tell me about vm_name or ! get details about vm_name
    ```
- Get all requests
    ```bash
    ! get all vra7 requests
    ```

## References

**Stackstorm Install**  
[https://docs.stackstorm.com/install/](https://docs.stackstorm.com/install/)

**Github Repo**  
[https://github.com/martezr/stackstorm-vra7](https://github.com/martezr/stackstorm-vra7)
