---
title: "Autonomous System Patching Part 1"
date: "2022-06-30"
image: ""
author: "Martez Reed"
tags: ["DevOps"]
categories: ["DevOps"]
draft: true
---

Organizations are faced with the daunting challenge of constantly working to keep systems up to date. Automation is a key component in helping to solve this challenge. In this series of posts we'll take a look at building a solution for autonomously patching a system.

The first tactical step in developing an autonomous patching solution is being able to dynamically fetch the current version that the system is running. Most platforms have an API endpoint in which the current or active version can be retrieved from. Some platforms require authentication in order to retrieve the current version for security reasons.

In our scenario we'll take a look at what's required to retrieve the version from a GitLab CE instance. GitLab requires an access token to authenticate, the instructions to create the token are found here in the Gitlab docs (https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html#create-a-personal-access-token). The following python script retrives the version from a GitLab CE instance.

```python
import requests
import json
import urllib3

# Disable insecure SSL warning message
urllib3.disable_warnings()

host = "https://grtmanage01.grt.local"
token = "sw-mYxV4EN2HqZ74J36n"

headers = {}
headers['PRIVATE-TOKEN'] = token
r = requests.get(host + "/api/v4/version", headers=headers, verify=False)
apiVersionPayload = json.loads(r.text)
version = apiVersionPayload['version']
print(version)
```

The python script returns the current Gitlab version similar to the output displayed below.

```shell
15.0.0
```

Now that we have the current version, we're ready to retrieve a list of available versions for comparison.

**Resources**

GitLab REST API: https://docs.gitlab.com/ee/api/version.html