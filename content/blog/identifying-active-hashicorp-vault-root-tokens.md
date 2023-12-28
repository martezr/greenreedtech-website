---
title: "Identifying Active HashiCorp Vault Root Tokens"
date: "2020-05-25"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/identifying-active-hashicorp-vault-root-tokens/identifying_active_root.png"
author: "Martez Reed"
tags: ["HashiCorp","Vault","DevOps","Security"]
categories: ["Vault"]
draft: false
---

Revoking the root token on a production HashiCorp Vault deployment is one of the recommended best practices for securing an instance of HashiCorp Vault. The actual process to revoke the root token is fairly straightforward by running the `vault token revoke` command and providing the root token at the command line. In a previous blog post we looked at how to detect when a new root token has been generated. This might be necessary to perform certain operations that require root to carry out. One thing to be aware of is that multiple root tokens can be active at a single moment in time so there is no one root token but potentially many. With the potential for multiple root tokens we need a way to determine if there are any currently active root tokens on our Vault deployment.

Identifying active root tokens requires us to query the Vault instance and evaluate the token accessors to determine which one is a root token. In order to do this we'll be using Python to do this programmatically and the [hvac](https://hvac.readthedocs.io/en/stable/overview.html) python library to easily interact with HashiCorp Vault. The following is a list of the high level steps that our script will perform to identify any active root tokens.

1. Fetch the list of token accessor keys (This is a list of all the active tokens)
2. Iterate through the list and perform a lookup on each token accessor

### Minimum Vault Permissions

The following are the minimum Vault permissions required to perform this search on the Vault deployment.

```bash
# List token accessors
path "auth/token/accessors/"
{
  capabilities = ["list", "sudo"]
}

# Lookup individual tokens by accessor
path "auth/token/lookup-accessor"
{
  capabilities = ["update"]
}
```

### Python Code

The python code is fairly simple in that it first fetches all the active token accessors and then iterates through each of them performing a token lookup to identify any token that has the "root" policy associated. The script expects the address of the Vault instance and the token used to access Vault to be provided as environment variables. The python script requires the hvac and PTable python libraries to be installed.

```python
#!/usr/local/bin/python3

import os
import time
import hvac
import urllib3
from prettytable import PrettyTable

urllib3.disable_warnings()

try:
    os.environ["VAULT_ADDR"]
except Exception:
    print("The VAULT_ADDR environment must be set.")
    os._exit(1)
    
try:
    os.environ["VAULT_TOKEN"]
except Exception:
    print("The VAULT_TOKEN environment must be set.")
    os._exit(1)

client = hvac.Client(url=os.environ['VAULT_ADDR'], verify=False, token=os.environ["VAULT_TOKEN"])

payload = client.list('auth/token/accessors')
keys = payload['data']['keys']
x = PrettyTable()
x.field_names = ["Display Name", "Creation Time", "Expiration Time", "Policies", "Token Accessor"]

for key in keys:
    output = client.lookup_token(key, accessor=True)
    display_name = output['data']['display_name']
    creation_date = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(output['data']['creation_time']))
    expire_time = output['data']['expire_time']
    policies = output['data']['policies']
    accessor = key
    if "root" in policies:
        x.add_row([display_name, creation_date, expire_time, policies, accessor])
print(x)
```

If there are any active root tokens a table similar to the table below will be displayed with information about the root tokens.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/identifying-active-hashicorp-vault-root-tokens/identifying_active_root-1024x121.png)

### Revoking Identified Tokens

If there are root tokens identified at that point we likely want to revoke them and that can be done by running the `vault token revoke` command and adding the `-accessor` switch with the token accessor displayed in the script output table similar to the full command below.

```bash
vault token revoke -accessor xooFDg520Sh3LFfL7QOERsQN
```

The root token will have been revoked and re-running the script should return a result of no active root tokens.

### References

**HashiCorp Vault API for listing token accessors**

[https://www.vaultproject.io/api-docs/auth/token#list-accessors](https://www.vaultproject.io/api-docs/auth/token#list-accessors)

**HashiCorp Vault API for token lookup by accessor**

[https://www.vaultproject.io/api-docs/auth/token#lookup-a-token-accessor](https://www.vaultproject.io/api-docs/auth/token#lookup-a-token-accessor)

**HVAC Python Library**

[https://hvac.readthedocs.io/en/stable/overview.html](https://hvac.readthedocs.io/en/stable/overview.html)
