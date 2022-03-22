---
title: "Creating a VMware Event Broker Appliance (VEBA) Golang Function"
date: "2021-02-12"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/creating-a-vmware-event-broker-appliance-veba-golang-function/VEBA-Golang-OpenFaas-Function-2.png"
author: "Martez Reed"
tags: ["VMware","VEBA"]
categories: ["VMware"]
draft: false
---

The [VMware Event Broker Appliance (VEBA)](https://vmweventbroker.io/) fling is a really interesting project that enables administrators to take advantage of event driven automation in a VMware vSphere environment. I've been meaning to kick the tires on using the appliance as I've thought a lot about vSphere event driven security and what that looks like from a technical implementation perspective. In this blog post we'll take a look at how to quickly get started with developing a Golang function for the VMware Event Broker Appliance (VEBA) that executes when a virtual machine is powered on.

The following requirements must be in place:

- Deployed VMware Event Broker Appliance (VEBA) with the OpenFaas event processor ([https://vmweventbroker.io/kb/install-openfaas](https://vmweventbroker.io/kb/install-openfaas))
- Docker image registry (VMware Harbor, Docker Hub, AWS ECR, etc.) for hosting the created image
- Golang installed
- OpenFaas CLI installed ([https://docs.openfaas.com/cli/install/](https://docs.openfaas.com/cli/install/))

Create a directory named **vebago** to start creating our function.

```bash
mkdir vebago
```

Change the working directory to the **vebago** directory we just created.

```bash
cd vebago
```

Create a file named **stack.yml** with the following contents. The **gateway** should be replaced with the VEBA's URL ("https://appliance_fqdn") and the **image** should reflect the location of where the Docker image will be stored. The name of the function is **vebago** and the **topic** parameter underneath **annotations** is a comma separated list of the vSphere events, in this case we are using a VM power on event.

```yaml
version: 1.0
provider:
  name: openfaas
  gateway: https://grtveba01.grt.local
functions:
  vebago:
    lang: golang-http
    handler: ./handler
    image: grtharbor01.grt.local/library/vebago:latest
    environment:
      write_debug: true
      read_debug: true
      function_debug: false
    annotations:
      topic: VmPoweredOnEvent
```

The next thing we need to do is create a directory for our Golang code. The name of the directory that hosts Golang code is the value specified for the **handler** parameter in our stack.yml file that we just created.

```bash
mkdir handler
```

Change the working directory to the **handler** directory that we just created.

```bash
cd handler
```

Create a file named **handler.go** with the code snippet displayed below. The Golang code parses the event payload and prints the payload to STDOUT.

```golang
package function

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"

    handler "github.com/openfaas/templates-sdk/go-http"
    "github.com/vmware/govmomi/vim25/types"
)

// cloudEvent is a subsection of a Cloud Event.
type cloudEvent struct {
    Data    types.Event `json:"data"`
    Source  string      `json:"source"`
    Subject string      `json:"subject"`
}

// Handle a function invocation
func Handle(req handler.Request) (handler.Response, error) {
    cloudEvt, err := parseCloudEvent(req.Body)
    if err != nil {
        return errRespondAndLog(fmt.Errorf("parsing cloud event data: %w", err))
    }

    log.Println(cloudEvt)

    return handler.Response{
        Body:       req.Body,
        StatusCode: http.StatusOK,
    }, nil
}

func errRespondAndLog(err error) (handler.Response, error) {
    log.Println(err.Error())

    return handler.Response{
        Body:       []byte(err.Error()),
        StatusCode: http.StatusInternalServerError,
    }, err
}

func parseCloudEvent(req []byte) (cloudEvent, error) {
    var event cloudEvent

    err := json.Unmarshal(req, &event)
    if err != nil {
        return cloudEvent{}, fmt.Errorf("unmarshalling json: %w", err)
    }

    return event, nil
}
```

Change the working directory back to the vebago directory.

```bash
cd ..
```

Now that we have our function components we need to download the OpenFaas template for Golang HTTP in order to properly create the function.

faas-cli template store pull golang-http

We now need to log into OpenFaas in order to deploy the function to OpenFaas.

```bash
cat ~/faas_pass.txt | faas-cli login -g https://grtveba01.grt.local -u admin --password-stdin --tls-no-verify
```

Once the template has been downloaded the function needs to be built, pushed to our docker registry and deployed. Fortunately we can do all of this with a single command to help save us some typing.

```bash
faas-cli up -f stack.yml --build-arg GO111MODULE=on --tls-no-verify
```

The output of the command should be similar to that shown below.

```bash
Image: grtharbor01.grt.local/library/vebago:latest built.
[0] < Building vebago done in 1.23s. [0] Worker done. Total build time: 1.23s [0] > Pushing vebago [grtharbor01.grt.local/library/vebago:latest].
The push refers to repository [grtharbor01.grt.local/library/vebago]
03536ee2d42d: Layer already exists 
e8b6d1455770: Layer already exists 
6ad006678b05: Layer already exists 
5159f12913cf: Layer already exists 
5f70bf18a086: Layer already exists 
e872e0b26f6c: Layer already exists 
777b2c648970: Layer already exists 
latest: digest: sha256:755e3dbcdcaa490d069ecd2b547093b37f8abb37f1d2b7ed39d7402ce8fc08e1 size: 1784
[0] < Pushing vebago [grtharbor01.grt.local/library/vebago:latest] done.
[0] Worker done.

Deploying: vebago.

Deployed. 202 Accepted.
URL: https://grtveba01.grt.local/function/vebago.openfaas-fn
```

With the function successfully deployed we are now ready to validate that the function is actually being called when a virtual machine is powered on and that the function outputs the event details. Since we aren't sending the functions output via email or slack we have to view the STDOUT of the kubernetes pod. An easy way to view the output of the pod is to SSH into the VEBA virtual machine. The first thing to do is

```bash
kubectl get pods -n openfaas-fn
```

The name of the pods that back the OpenFaas functions should be displayed similar to the output displayed below. In this case we want to use the name of the pod that starts with **vebago**.

```bash
NAME                                  READY   STATUS    RESTARTS   AGE
template-compliance-899b5dbd8-qkbf9   1/1     Running   0          30h
vebago-665f4c4f56-mwnjr               1/1     Running   0          9m18s
```

The name of the pods start with the name of the OpenFaas function name specified in the stack.yml file.

```bash
kubectl logs vebago-665f4c4f56-mwnjr -n openfaas-fn --follow
```

At this point we can power on a virtual machine to validate if the function is working properly. The payload should include information about the virtual machine that was just powered on.

```bash
Forking - ./handler []
2021/02/11 22:18:18 Started logging stderr from function.
2021/02/11 22:18:18 Started logging stdout from function.
2021/02/11 22:18:18 OperationalMode: http
2021/02/11 22:18:18 Timeouts: read: 10s, write: 10s hard: 10s.
2021/02/11 22:18:18 Listening on port: 8080
2021/02/11 22:18:18 Writing lock-file to: /tmp/.lock
2021/02/11 22:18:18 Metrics listening on port: 8081
2021/02/11 22:25:43 stderr: 2021/02/11 22:25:43 {{{} 18191 18189 2021-02-11 22:25:39.472999 +0000 UTC VSPHERE.LOCAL\Administrator 0xc00005bc20 0xc00005bc50 0xc00005bc80 0xc00005bcb0    centos8base on  grtesxi01.grt.local in GRT is powered on } https://grtvcenter01.grt.local/sdk VmPoweredOnEvent}
2021/02/11 22:25:43 POST / - 200 OK - ContentLength: 884
```

While this is a very simple example we can start to see the power being able trigger code in response to a vSphere event.

References: [http://www.patrickkremer.com/vmware-event-broker-appliance-part-xiii-deploying-go-functions/](http://www.patrickkremer.com/vmware-event-broker-appliance-part-xiii-deploying-go-functions/)
