---
title: "VMware vSphere Stateless Container Hosts"
description: "meta description"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/detecting-hashicorp-vault-root-login/vault_root_login.png"
date: "2022-04-17"
draft: true
author: "Martez Reed"
tags: ["VMware","vSphere","DevOps"]
categories: ["vSphere"]
---

Containers has been on a steady march to replace virtual machines as the primary computing model for which applications are developed. The use of containers provide a self-contained means of application deployment that is faster to develop against.

Containers with all of their benefits still need to run on an underlying operating system. That operating system often runs on a virtual machine or instance.

There are a number of operating systems that are purpose built for simply running containers. Fedora/Red Hat CoreOS, Flatcar Linux, VMware Photon and others.

## Stateless Configuration

In this example we'll walk through booting

https://www.greenreedtech.com/vmware-vsphere-vm-ipxe-boot-without-dhcp/


```bash
provider "vsphere" {
  user           = var.vsphere_user
  password       = var.vsphere_password
  vsphere_server = var.vsphere_server
  allow_unverified_ssl = true
}

data "vsphere_datacenter" "dc" {
  name = "GRT"
}

data "vsphere_datastore" "datastore" {
  name          = "Local_Storage_2"
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_compute_cluster" "cluster" {
  name          = "GRT-Cluster"
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_network" "network" {
  name          = "VM Network"
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_host" "host" {
  name          = "grtesxi02.grt.local"
  datacenter_id = data.vsphere_datacenter.dc.id
}

resource "vsphere_virtual_machine" "vm" {
  name             = "ipxedemo01"
  resource_pool_id = data.vsphere_compute_cluster.cluster.resource_pool_id
  datastore_id     = data.vsphere_datastore.datastore.id
  host_system_id   = data.vsphere_host.host.id

  num_cpus                   = 2
  memory                     = 2048
  guest_id                   = "other3xLinux64Guest"
  wait_for_guest_net_timeout = 0

  network_interface {
    network_id = data.vsphere_network.network.id
  }

  disk {
    label = "disk0"
    size  = 10
  }

  extra_config = {
    "guestinfo.ipxe.scriptlet"    = "ifopen net0 && chain $${filename}"
    "guestinfo.ipxe.filename"     = "http://boot.ipxe.org/demo/boot.php"
    "guestinfo.ipxe.net0.ip"      = "10.0.0.11"
    "guestinfo.ipxe.net0.gateway" = "10.0.0.1"
    "guestinfo.ipxe.dns"          = "10.0.0.200"
    "nx3bios.filename"            = "/vmfs/volumes/60eaabc3-b06bcfb0-091a-e4d3f1d05084/15ad07b0.rom"
    "ethernet0.opromsize"         = "58880"
  }
}
```

```bash
terraform init
```

