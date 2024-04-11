---
title: "Getting Started with Kubevirt"
date: "2024-03-19"
image: ""
author: "Martez Reed"
categories: ["DevOps"]
tags: ["DevOps"]
draft: true
---
The Broadcom acquisition of VMware and resulting changes have prompted many to look for alternative virtualization solutions.

## Installing Kubernetes (k3s)
Kubevirt leverages Kubernetes

```
curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644 --cluster-init
sudo mkdir -p /etc/kubernetes
sudo cp -i /etc/rancher/k3s/k3s.yaml /etc/kubernetes/admin.conf
cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
```

## Network

```
apt-get install -y openvswitch-switch openvswitch-common
``

```
ovs-vsctl add-br vmnetwork
```

```
ovs-vsctl add-port vmnetwork eth1
```
tet

```
cat <<EOF | kubectl create -f -
apiVersion: "k8s.cni.cncf.io/v1"
kind: NetworkAttachmentDefinition
metadata:
  name: ovs-net-1
  annotations:
    k8s.v1.cni.cncf.io/resourceName: ovs-cni.network.kubevirt.io/vmnetwork
spec:
  config: '{
      "cniVersion": "0.4.0",
      "type": "ovs",
      "bridge": "vmnetwork"
    }'
EOF
```


## Installing Kubevirt

```
# Point at latest release
export RELEASE=$(curl https://storage.googleapis.com/kubevirt-prow/release/kubevirt/kubevirt/stable.txt)
# Deploy the KubeVirt operator
kubectl apply -f https://github.com/kubevirt/kubevirt/releases/download/${RELEASE}/kubevirt-operator.yaml
# Create the KubeVirt CR (instance deployment request) which triggers the actual installation
kubectl apply -f https://github.com/kubevirt/kubevirt/releases/download/${RELEASE}/kubevirt-cr.yaml
```

```
# wait until all KubeVirt components are up
kubectl -n kubevirt wait kv kubevirt --for condition=Available
```

## Create a Virtual Machine
Now that Kubevirt has been installed, we're ready to create a virtual machine.


```


```