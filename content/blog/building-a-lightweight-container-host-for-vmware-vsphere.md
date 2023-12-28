---
title: "Building a Lightweight Container Host for VMware vSphere"
description: "LinuxKit enables the ability to build modular lightweight container hosts for VMware vSphere"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/building_a_lightweight_container_host_for_vmware_vsphere/building-a-lightweight-container-host-for-vmware-vsphere-title.png"
date: "2022-04-22"
draft: false
author: "Martez Reed"
tags: ["DevOps","Containers"]
categories: ["VMware"]
---

Containerization and Kubernetes have dominated the IT conversation for the last handful of years. Containers enable rapid development, application portability and a myriad of other benefits. Containers rely on a host operating system in order to run and ideally it would be one that is extremely lightweight since the apps running in the containers are what we really care about.

This is where minimal or stripped down operating systems that have been optimized for just running containers comes into play. We've seen a steady flow of minimal container centric operating system like CoreOS, Project Atomic, FlatCar Linux, VMware Photon, Red Hat CoreOS, K3os and countless others. I've tried most of these and they do the job more or less. 

The challenge that I've had is that I wanted something really lightweight and easy to deploy on VMware vSphere. I wanted something without needing to figure out how to use ignition or deploying an OVA/OVF was necessary. During my search I found out about LinuxKit.

## LinuxKit

[LinuxKit](https://github.com/linuxkit/linuxkit) is interesting in that it offers many of the benefits of the afformentioned container centric operating systems with the added benefit of being extremely modular and small.

LinuxKit has been around at least publicly since 2017 (https://www.docker.com/blog/introducing-linuxkit-container-os-toolkit/) and was covered in a few DockerCon talks that year. I hadn't really heard much about LinuxKit at the time or recently for that matter. By chance I heard about it recently when digging into the tinkerbell project originaly created by Equinix (https://www.docker.com/blog/linuxkit-as-a-commodity-for-building-linux-distributions/). The project is still alive and is actually used under the covers for Docker so that's a good sign of continued support. Now that we know about LinuxKit, let's take a look at how to use it to build a lightweight container host.


### Building the operating system

LinuxKit has a command-line tool that has to be installed on the system running the command. Instructions on installing LinuxKit are found in the repository's [README](https://github.com/rn/linuxkit#build-the-linuxkit-tool) file.

A YAML file is used to define the components that are built into the operating system. The example file below contains a minimal configuration that includes things like a linux kernel, containerd, a dhcp client and nginx.

```yaml
kernel:
  image: linuxkit/kernel:5.10.92
  cmdline: "console=tty0"
init:
  - linuxkit/init:8f1e6a0747acbbb4d7e24dc98f97faa8d1c6cec7
  - linuxkit/runc:f01b88c7033180d50ae43562d72707c6881904e4
  - linuxkit/containerd:de1b18eed76a266baa3092e5c154c84f595e56da
  - linuxkit/ca-certificates:c1c73ef590dffb6a0138cf758fe4a4305c9864f4
onboot:
  - name: sysctl
    image: linuxkit/sysctl:bdc99eeedc224439ff237990ee06e5b992c8c1ae
services:
  - name: getty
    image: linuxkit/getty:76951a596aa5e0867a38e28f0b94d620e948e3e8
    env:
     - INSECURE=true
  - name: rngd
    image: linuxkit/rngd:4f85d8de3f6f45973a8c88dc8fba9ec596e5495a
  - name: dhcpcd
    image: linuxkit/dhcpcd:52d2c4df0311b182e99241cdc382ff726755c450
  - name: nginx
    image: nginx:1.13.8-alpine
    capabilities:
     - CAP_NET_BIND_SERVICE
     - CAP_CHOWN
     - CAP_SETUID
     - CAP_SETGID
     - CAP_DAC_OVERRIDE
    binds:
     - /etc/resolv.conf:/etc/resolv.conf
```

Linuxkit supports outputting the operating system in various formats such as BIO ISO, EFI ISO among others. The following example builds an ISO file named linuxkitdemo.iso based upon the yaml file above.

```bash
linuxkit build -format iso-bios -name linuxkitdemo minimal.yaml
```

A few minutes later, an iso file will be created in the current directory named linuxkitdemo.iso.

```bash
Extract kernel image: docker.io/linuxkit/kernel:5.10.92
Add init containers:
Process init image: docker.io/linuxkit/init:8f1e6a0747acbbb4d7e24dc98f97faa8d1c6cec7
Process init image: docker.io/linuxkit/runc:f01b88c7033180d50ae43562d72707c6881904e4
Process init image: docker.io/linuxkit/containerd:de1b18eed76a266baa3092e5c154c84f595e56da
Process init image: docker.io/linuxkit/ca-certificates:c1c73ef590dffb6a0138cf758fe4a4305c9864f4
Add onboot containers:
  Create OCI config for linuxkit/sysctl:bdc99eeedc224439ff237990ee06e5b992c8c1ae
Add service containers:
  Create OCI config for linuxkit/getty:v0.8
  Create OCI config for linuxkit/rngd:4f85d8de3f6f45973a8c88dc8fba9ec596e5495a
  Create OCI config for linuxkit/dhcpcd:52d2c4df0311b182e99241cdc382ff726755c450
  Create OCI config for nginx:1.13.8-alpine
Create outputs:
  minimal.iso
```

At this point we're ready to upload the generate iso file to a datastore that is accessible by our ESXi host. We could manually upload the iso file and create a virtual machine but we'll use Terraform to automate things.

```bash
provider "vsphere" {
  user                 = var.vsphere_username
  password             = var.vsphere_password
  vsphere_server       = var.vsphere_server
  allow_unverified_ssl = true
}


data "vsphere_datacenter" "dc" {
  name = var.vsphere_datacenter
}

data "vsphere_datastore" "datastore" {
  name          = var.vsphere_datastore
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_compute_cluster" "cluster" {
  name          = var.vsphere_cluster
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_network" "network" {
  name          = var.vsphere_network
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_host" "host" {
  name          = var.vsphere_host
  datacenter_id = data.vsphere_datacenter.dc.id
}


resource "vsphere_file" "linuxkit_iso_upload" {
  datacenter         = data.vsphere_datacenter.dc.name
  datastore          = data.vsphere_datastore.datastore.name
  source_file        = "linuxkitdemo.iso"
  destination_file   = "linuxkitdemo.iso"
  create_directories = false
}

resource "vsphere_virtual_machine" "vm" {
  name             = var.vsphere_vm_name
  resource_pool_id = data.vsphere_compute_cluster.cluster.resource_pool_id
  datastore_id     = data.vsphere_datastore.datastore.id
  host_system_id   = data.vsphere_host.host.id

  num_cpus                   = var.vsphere_vm_cpus
  memory                     = var.vsphere_vm_memory
  guest_id                   = "other3xLinux64Guest"
  wait_for_guest_net_timeout = 0

  cdrom {
    datastore_id = data.vsphere_datastore.datastore.id
    path         = "linuxkitdemo.iso"
  }

  network_interface {
    network_id = data.vsphere_network.network.id
  }

  disk {
    label = "disk0"
    size  = 10
  }

  depends_on = [
    vsphere_file.linuxkit_iso_upload,
  ]
}
```

After a minute or two the virtual machine will have finished provisioning and the nginx container will be running.


![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/building_a_lightweight_container_host_for_vmware_vsphere/building-a-lightweight-container-host-for-vmware-vsphere-nginx.png)

There's also a terraform provider for interacting with LinuxKit to create ISO images.

```bash
terraform {
  required_providers {
    linuxkit = {
      version = "0.0.7"
      source  = "resinstack/linuxkit"
    }
  }
}

provider "linuxkit" {}

data "linuxkit_kernel" "kernel" {
  image   = "linuxkit/kernel:5.6.11"
  cmdline = "console=tty0 console=ttyS0 console=ttyAMA0"
}

data "linuxkit_init" "init" {
  containers = [
    "linuxkit/init:v0.8",
    "linuxkit/runc:v0.8",
    "linuxkit/containerd:v0.8",
    "linuxkit/ca-certificates:v0.8",
  ]
}

data "linuxkit_image" "sysctl" {
  name  = "sysctl"
  image = "linuxkit/sysctl:v0.8"
}

data "linuxkit_image" "rngd1" {
  name    = "rngd1"
  image   = "linuxkit/rngd:v0.8"
  command = ["/sbin/rngd", "-1"]
}

data "linuxkit_image" "getty" {
  name  = "getty"
  image = "linuxkit/getty:v0.8"
  env   = ["INSECURE=true"]
}

data "linuxkit_image" "rngd" {
  name  = "rngd"
  image = "linuxkit/rngd:v0.8"
}

data "linuxkit_image" "dhcpcd" {
  name  = "dhcpcd"
  image = "linuxkit/dhcpcd:v0.8"
}

data "linuxkit_image" "sshd" {
  name  = "sshd"
  image = "linuxkit/sshd:v0.8"
}

data "linuxkit_config" "sshd" {
  kernel = data.linuxkit_kernel.kernel.id
  init   = [data.linuxkit_init.init.id]

  onboot = [
    data.linuxkit_image.sysctl.id,
    data.linuxkit_image.rngd1.id,
  ]

  services = [
    data.linuxkit_image.getty.id,
    data.linuxkit_image.rngd.id,
    data.linuxkit_image.dhcpcd.id,
    data.linuxkit_image.sshd.id,
  ]
}

resource "linuxkit_build" "sshd" {
  config_yaml = data.linuxkit_config.sshd.yaml
  destination = "${path.module}/sshd.tar"
}

resource "linuxkit_image_raw_bios" "sshd" {
  build = linuxkit_build.sshd.destination
  destination = "${path.module}/sshd.raw"
}

```

This capability unlocks several possibilites from spinning up on-prem ECS agent nodes to Kubernetes clusters or just lightweight hosts running a single container.