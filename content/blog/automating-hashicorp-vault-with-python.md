---
title: "Automating HashiCorp Vault with Python"
date: "2022-04-01"
image: ""
author: "Martez Reed"
tags: ["Vault","HashiCorp","DevOps"]
categories: ["Vault"]
draft: true
---

Python is a popular programming language used by those working with public cloud and DevOps.

The [hvac](https://hvac.readthedocs.io/en/stable/overview.html) python library is an unofficial client for interacting with HashiCorp Vault.


The hvac library can be installed using python pip by running the following command.

```bash
pip install hvac
```

Create a client connection to the Vault instance using the appropriate connection details.

```python
client = hvac.Client(
    url='https://localhost:8200',
    token=os.environ['VAULT_TOKEN'],
    cert=(client_cert_path, client_key_path),
    verify=server_cert_path,
)
```

This blog post walked through a few basic uses of using python to automate the configuration of a Vault deployment.

## References

**HashiCorp Vault API for listing token accessors**

[https://www.vaultproject.io/api-docs/auth/token#list-accessors](https://www.vaultproject.io/api-docs/auth/token#list-accessors)

**HVAC Python Library**

[https://hvac.readthedocs.io/en/stable/overview.html](https://hvac.readthedocs.io/en/stable/overview.html)