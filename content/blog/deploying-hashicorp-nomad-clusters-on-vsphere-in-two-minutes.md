---
title: "Deploying HashiCorp Nomad Cluster on vSphere in Two Minutes"
description: "meta description"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/detecting-hashicorp-vault-root-login/vault_root_login.png"
date: "2022-04-27"
draft: true
author: "Martez Reed"
tags: ["VMware","vSphere","DevOps","HashiCorp"]
categories: ["Nomad"]
---

Kubernetes has become the defacto standard for container orchestration platforms. One of the issue that people have with Kubernetes is its often overwhelming complexity with the number of different moving parts. This is where a platform like HashiCorp Nomad fills the gap to provide a simpler solution that is equally robust from a scaling perspective.


### LinuxKit for the Win
In previous blog posts I've talked about the benefits of LinuxKit and how it can be used to quickly deploy a container host. Well, since Nomad is a container orchestrator, it comes as no surprise that container hosts would be needed.


### Nomad in a Container (Thanks Resinstack)

https://github.com/resinstack/nomad

**Nomad ContainerD Task Driver (Thanks Roblox)**

Nomad supports different types of tasks
With ContainerD 

### Terraform

The following Terraform is an example of the configuration used to deploy a three (3) server and three (3) agent system.

```hcl
provider "vsphere" {
  user           = "administrator@vsphere.local"
  password       = ""
  vsphere_server = ""
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


resource "vsphere_file" "ubuntu_vmdk_upload" {
  datacenter         = "GRT"
  datastore          = "Local_Storage_2"
  source_file        = "15ad07b0.rom"
  destination_file   = "15ad07b0.rom"
  create_directories = false
}

data "vsphere_custom_attribute" "attribute" {
  name = "vauth-role"
}

resource "vsphere_virtual_machine" "nomadserver" {
  count = 3
  name             = "nomadserver0${count.index + 1}"
  resource_pool_id = data.vsphere_compute_cluster.cluster.resource_pool_id
  datastore_id     = data.vsphere_datastore.datastore.id
  host_system_id   = data.vsphere_host.host.id

  num_cpus                   = 2
  memory                     = 8192
  guest_id                   = "other3xLinux64Guest"

  network_interface {
    network_id = data.vsphere_network.network.id
  }

  disk {
    label = "disk0"
    size  = 10
  }

  custom_attributes = tomap({"${data.vsphere_custom_attribute.attribute.id}" = "vsphereapp"})

  extra_config = {
    "guestinfo.ipxe.scriptlet"    = "ifopen net0 && chain $${filename}"
    "guestinfo.ipxe.filename"     = "http://10.0.0.136:9000/static/linuxkit.ipxe"
    "guestinfo.ipxe.net0.ip"      = "10.0.0.1${count.index + 1}"
    "guestinfo.ipxe.net0.gateway" = "10.0.0.1"
    "guestinfo.ipxe.dns"          = "10.0.0.200"
    "guestinfo.ipxe.profile"      = "nomadserver"
    "nx3bios.filename"            = "/vmfs/volumes/60eaabc3-b06bcfb0-091a-e4d3f1d05084/15ad07b0.rom"
    "ethernet0.opromsize"         = "58880"
  }
}

resource "vsphere_virtual_machine" "nomadagent" {
  count            = 3
  name             = "nomadagent0${count.index + 1}"
  resource_pool_id = data.vsphere_compute_cluster.cluster.resource_pool_id
  datastore_id     = data.vsphere_datastore.datastore.id
  host_system_id   = data.vsphere_host.host.id

  num_cpus                   = 2
  memory                     = 8192
  guest_id                   = "other3xLinux64Guest"

  network_interface {
    network_id = data.vsphere_network.network.id
  }

  disk {
    label = "disk0"
    size  = 10
  }

  custom_attributes = tomap({"${data.vsphere_custom_attribute.attribute.id}" = "vsphereapp"})

  extra_config = {
    "guestinfo.ipxe.scriptlet"    = "ifopen net0 && chain $${filename}"
    "guestinfo.ipxe.filename"     = "http://10.0.0.136:9000/static/linuxkit.ipxe"
    "guestinfo.ipxe.net0.ip"      = "10.0.0.10${count.index + 1}"
    "guestinfo.ipxe.net0.gateway" = "10.0.0.1"
    "guestinfo.ipxe.dns"          = "10.0.0.200"
    "guestinfo.ipxe.profile"      = "nomadagent"
    "nx3bios.filename"            = "/vmfs/volumes/60eaabc3-b06bcfb0-091a-e4d3f1d05084/15ad07b0.rom"
    "ethernet0.opromsize"         = "58880"
  }
}
```