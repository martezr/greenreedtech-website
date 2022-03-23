---
title: "Puppet Policy Based Autosigning with vRA7"
date: "2017-02-09"
author: "Martez Reed"
image: ""
draft: false
categories: ["vmware","vra"]
tags: ["puppet","vmware","vra"]
---

### What is Policy Based Autosigning

A critical aspect of any Puppet deployment is determining how we want to allow nodes to get their certificate signed by the Puppet master. Before we delve into policy based autosigning we'll discuss the other three methods for managing certificate signing.

- **Manual**
    
    - Manually signing certs breaks automated deployment processes.
- **Naive**
    
    - Naive is insecure as it allows any node access to the Puppet master.
- **Basic Autosigning**
    
    - Basic autosigning signs requests based upon a whitelist which can be circumvented by modifying the name used in the request.

Now that we've gone over the other three methods let's go over policy based autosigning. Policy based autosigning utilizes a script that can be written in any language supported by the puppet master to validate some piece of information in the certificate request. This could be something as simple as a shell script to validate a challenge password against a file with a static list or as complex as reaching out to multiple external systems to validate. This adds additional security to our signing process as we're challenging our node to provide additional information before signing a certificate.

### Puppet Policy Based Autosigning with vRA7

Now that we understand the goal and purpose of policy based autosigning we'll jump into how we can use VMware vRealize Automation 7 as our validation source.

**Overview**

First we'll cover how the entire process works from a high level.

- Request catalog item
- Trigger vRO workflow
    
    - Pull machine uuid from the payload
    - Create a csr_attributes.yaml file with the machine uuid
    - Deploy the csr_attributes.yaml file onto the guest
    - Install Puppet on the guest and trigger an agent run
- The agent presents it's request for signing
- The policy based autosiging script is run against the certificate request
    
    - The script contacts our vRA7 instance to validate the machine uuid provided in the request
    - If the machine uuid exists sign the certificate
    - If the machine uuid doesn't exist reject the request

**Configure Puppet**

Let's start by adding our autosigning script to our puppet master, we'll place it in "/etc/puppetlabs/puppet". The script can be downloaded from github using the link below.

[https://github.com/martezr/puppet-vra7-autosign/blob/master/vrapolicysign.rb](https://github.com/martezr/puppet-vra7-autosign/blob/master/vrapolicysign.rb)

We need to make our script executable and ensure it is accessible by the user that Puppet is running as.

**Puppet Enterprise**

```
chmod +x vrapolicysign.rb && chown pe-puppet:pe-puppet vrapolicysign.rb  
```

**Puppet Open Source**

```
chmod +x vrapolicysign.rb && chown puppet:puppet vrapolicysign.rb  
```

With our script in place we now need to add our connection for our vRA7 instance. We'll add the "vrapolicyconfig.yaml" config file to the puppet master in the same location as our autosign script.

```bash
grtvra7:  
  url: https://cloudportal.grt.local
  username: administrator@vsphere.local
  password: P@$$w0rd
  tenant: vsphere.local
```

**connection name:** An arbitrary name for the connection  
**url:** The url of the vRA7 instance  
**username:** username an account with credentials to query the system for all VMs in the tenant  
**password:** password for the account  
**tenant:** tenant to query

The script supports multiple connection entries but hasn't not been tested to ensure properly functionality.

Now that we've configured our connection information we just need to add our script to our Puppet config file and then restart the Puppet server service in order to start using policy based autosigning.

Add the following entry to the "[master]" section of the puppet.conf configuration file on the Puppet master.

```bash
autosign = $confdir/vrapolicyautosign.rb  
```

Restart the puppet server service.

**Puppet Enterprise**

```bash
systemctl restart pe-puppetserver  
```

**Puppet Open Source**

```bash
systemctl restart puppetserver  
```

With everything in place we're ready to provision a new machine and have Puppet automatically sign the node's certificate.

The script also has a logging mechanism that outputs the results of incoming requests in the "vrapolicylog.json" log file in the "/etc/puppetlabs/puppet/ssl" directory.

```json
{"status":"success","certname":"engineering0141.grt.local","uuid":"afcd55a3-20ea-47cf-90cc-8bbb6c6d5324"}
{"status":"success","certname":"engineering0154.grt.local","uuid":"dd3b798f-d7c5-434f-8e0e-2df9cacea6e0"}
{"status":"success","certname":"engineering0155.grt.local","uuid":"db30bec4-858d-4f46-bb6b-b64c0670a3ac"}
```

## References

Puppet  
[https://docs.puppet.com/puppet/latest/ssl_autosign.html](https://docs.puppet.com/puppet/latest/ssl_autosign.html)

RDO Project  
[https://blogs.rdoproject.org/7221/policy-based-autosigning-a-step-towards-more-secure-deployments-with-puppet](https://blogs.rdoproject.org/7221/policy-based-autosigning-a-step-towards-more-secure-deployments-with-puppet)
