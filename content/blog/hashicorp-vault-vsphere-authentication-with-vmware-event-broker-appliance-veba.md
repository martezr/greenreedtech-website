---
title: "HashiCorp Vault vSphere Authentication with VMware Event Broker Appliance (VEBA)"
date: "2021-02-16"
author: "Martez Reed"
tags: ["DevOps","HashiCorp","Security","Vault"]
categories: ["HashiCorp"]
draft: false
---

HashiCorp Vault supports a number of authentication methods including methods that utilize what HashiCorp refers to as a "trusted platform". These include public clouds such as AWS, Azure and GCP along with platforms like Kubernetes. This method of authentication simplifies the introduction of the initial credential or secret that a workload must present to Vault by making use of information about itself that it already knows. The information that is provided to the instance or Kubernetes pod by the platform is metadata typically in the form of cryptographic data. This metadata is presented to HashiCorp Vault for authentication and verified by an API call to the underlying platform.

The question is why isn't this same method used in a VMware vSphere environment to enable this same functionality. All of the other platforms natively present metadata that is difficult to guess and accessible only to that entity from a workload context. VMware vSphere doesn't have a native virtual machine metadata service to enable this functionality. At one point there was a [metadata service](https://blogs.vmware.com/openstack/introducing-the-metadata-service/) that was part of the work done with vSphere Integrated OpenStack (VIO) to provide this virtual machine metadata. Ultimately, OpenStack never gained the traction that many anticipated and the technical implementation of the metadata service was difficult in my opinion given the networking requirements for presenting the service to workloads.

To overcome the challenge of the platform lacking a native metadata service we can take advantage of a native capability that vSphere has used for years for appliances that are deployed to vSphere. vSphere guest info is used by OVA/OVF appliances to effectively pass information from the admin to the guest operating system via VMware tools. The guest operating system uses the vmtoolsd command to perform an RPC operation that allows the virtual machine to query guest info that has been populated by the administrator.

## Solution Overview

![](images/vsphere-vault-auth-veba.png)

Now that we have some background and context on the problem let's take a look into the solution. We need to present the virtual machine with a unique piece of data that no other virtual can fetch or easily guess. HashiCorp Vault provides an AppRole authentication method that is ideally used for machine authentication. The AppRole requires a role ID and a secret ID to be presented to Vault to authenticate. The solution is to use an external system such as VMware Event Broker Appliance to populate a virtual machine's guest info with the role ID and Secret ID from Vault. This is only accessible by the virtual machine itself and vSphere accounts with the appropriate permissions. VMware tools allows the guest OS to query the credentials and ultimately use them to authenticate to Vault. Now we're ready to walk through an example of configuring Vault and VEBA to enable this authentication method.

## Vault Configuration

The first thing we need to is configure HashiCorp Vault to enable and configure AppRole authentication. We also need to create a Vault policy and identity/token for our VEBA function to interact with Vault.

Enable Vault AppRole authentication method

```bash
vault auth enable approle
```

Create a Vault policy to associate with the virtual machine. Write the following policy to a file named vsphereapp-policy.hcl.

```bash
# Read-only permission on 'secret/vspheresecret' path
path "secret/data/vspheresecret" {
  capabilities = [ "read" ]
}
```

Create the Vault policy using the policy file that was just created.

vault policy write vsphereapp vsphereapp-policy.hcl

Create an AppRole role with the policy that was just created assigned.

```bash
vault write auth/approle/role/vsphereapp token_policies="vsphereapp" secret_id_ttl=10m token_ttl=20m token_max_ttl=180m
```

Create the secret that the policy grants access to.

```bash
vault kv put secret/vspheresecret password=SuperSecurePassword
```

## VEBA Function

Now that Vault is configured, we're ready to deploy the VEBA function but there are a few things that need to be done first.

Clone the example github repository

```bash
git clone https://github.com/martezr/vauth
```

Change the working directory to the vebavauth directory

```bash
cd vauth/vebavauth
```

Update the vebaconfig.toml file with the appropriate vCenter and Vault details.

```toml
[vcenter]
server = "grtvcenter01.grt.local"
user = "administrator@vsphere.local"
password = "password"
insecure = true

[vault]
server = "http://grtmanage01.grt.local:8200"
token = "vaultpassword"
```

Update the stack.yml file with the correct gateway for the VMware Event Broker Appliance in your environment.

```yaml
version: 1.0
provider:
  name: openfaas
  gateway: https://grtveba01.grt.local
functions:
  vebavauth:
    lang: golang-http
    handler: ./handler
    image: public.ecr.aws/i4r5n0t9/vebavauth:latest
    environment:
      write_debug: true
      read_debug: true
      function_debug: false
    secrets:
      - vebaconfig
    annotations:
      topic: VmPoweredOnEvent
```

Log into OpenFaaS

```bash
VEBA_GATEWAY=https://grtveba01.grt.local
export OPENFAAS_URL=${VEBA_GATEWAY}
cat ~/faas_pass.txt | faas-cli login -g https://grtveba01.grt.local -u admin --password-stdin --tls-no-verify
```

Create the OpenFaas secret

```bash
faas-cli secret create vebaconfig --from-file=vebaconfig.toml --tls-no-verify
```

Deploy the function

```bash
faas-cli deploy -f stack.yml --tls-no-verify
```

## Virtual Machine Configuration

The VEBA function will inject the Vault AppRole role ID and secret ID into the VM's advanced settings when the virtual machine is powered on but it first must be assigned a role in the custom attributes. The attribute name must be vauth-role as that is what the VEBA function uses when interacting the HashiCorp Vault instance.

![](images/veba-vauth-vm-attributes.png)

The guest operating system now has access to the approle role name, role id and secret id to authenticate to HashiCorp Vault. A configuration management tool such as Ansible, Chef or Puppet could be used to run the command to query the guest info and subsequently generate a HashiCorp Vault agent configuration with that information. We won't delve into the specifics of how to automate that end to end process in this post but we'll perform the authentication operation using a script. On the guest operating system (CentOS 7 in this example) create a file name vaultlogin.sh that handle interacting with the VMware guest info and fetching the secret from Vault.

```bash
#!/bin/bash

VAULTADDR=$1
ROLE=$(/usr/bin/vmtoolsd --cmd "info-get guestinfo.vault.role")
ROLEID=$(/usr/bin/vmtoolsd --cmd "info-get guestinfo.vault.roleid")
SECRETID=$(/usr/bin/vmtoolsd --cmd "info-get guestinfo.vault.secretid")

# Create JSON payload with role and secret IDs
cat << EOF > payload.json
{
  "role_id": "$ROLEID",
  "secret_id": "$SECRETID"
}
EOF
# Fetch Vault token

TOKENDATA=$(curl -s --request POST --data @payload.json $VAULTADDR/v1/auth/approle/login)

# Extract Vault token

TOKEN=$(echo $TOKENDATA | python -c \
   'import json,sys;print json.load(sys.stdin)["auth"]["client_token"]')

# Output Vault token

echo $TOKEN

# Fetch example secret

curl -s --header "X-Vault-Token: $TOKEN" $VAULTADDR/v1/secret/data/vspheresecret | python -m json.tool
```

With the script created we are ready to run the script, the vault address must be passed to the script.

```bash
./vaultlogin.sh http://grtvault01.grt.local:8200
```

The script should return the following output which is the token used for authentication and the JSON payload for the Vault secret. The authentication token output is for testing purposes only and should be removed for production environments.

```bash
s.XBfeDjLCamnxpTik5zMpkNa8
{
    "auth": null,
    "data": {
        "data": {
            "password": "SuperSecurePassword"
        },
        "metadata": {
            "created_time": "2021-02-16T16:09:47.867249231Z",
            "deletion_time": "",
            "destroyed": false,
            "version": 2
        }
    },
    "lease_duration": 0,
    "lease_id": "",
    "renewable": false,
    "request_id": "dd2e325a-09f5-d416-6fb8-7b50041cd204",
    "warnings": null,
    "wrap_info": null
}
```

There are a number of updates that can be made to the function to enable it to be used in a real environment but this blog post is to showcase how the solution can be used to simplify the authentication of VMware vSphere workloads to HashiCorp Vault.

## References

[https://www.vaultproject.io/docs/auth/approle](https://www.vaultproject.io/docs/auth/approle) 
[https://www.vaultproject.io/api/secret/kv/kv-v2](https://www.vaultproject.io/api/secret/kv/kv-v2)
