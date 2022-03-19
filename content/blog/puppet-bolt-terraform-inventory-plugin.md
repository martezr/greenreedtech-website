---
title: "Puppet Bolt Terraform Inventory Plugin"
date: "2019-10-06"
description: "meta description"
image: "images/post/05.jpg"
draft: false
author: "Martez Reed"
tags: ["DevOps", "Puppet", "Terraform"]
categories: ["DevOps"]
---

HashiCorp Terraform is a popular Infrastructure as Code (IaC) tool that is used for provisioning virtual machines or cloud instances along with other resources. Once a virtual machine or cloud instance is provisioned typically it still needs to be configured which includes security baselines, application dependency configuration and even application deployment. The tasks are generally accomplished with a Configuration Management (CM) tool such as Puppet or Puppet Bolt.

The Puppet Bolt Terraform inventory plugin parses the Terraform state for resources that have been created by Terraform and it enables Bolt to be run against infrastructure created by Terraform without explicitly specifying connection information such as the IP address. This is especially useful in public cloud environments where the IP address associated with an instance is often dynamic. The Puppet Bolt Terraform plugin supports state retrieval for local state backends as well as remote backends.

In this blog post we'll look at how to use the Puppet Bolt Terraform inventory plugin to dynamically retrieve the IP address of a virtual machine provisioned in a VMware vSphere environment which will allow us to run Puppet Bolt against the virtual machine using dynamic information.

## Terraform Manifest

The Terraform code creates a single CentOS 7 virtual machine in a VMware vSphere environment. The Terraform state is stored in HashiCorp Consul for centralized state management.

```bash
terraform {
  backend "consul" {
    address = "10.0.0.6:8500"
    scheme  = "http"
    path    = "terraform/bolt/boltserver/terraform.tfstate"
    datacenter = "puppet-bolt"
  }
}

resource "vsphere_virtual_machine" "boltserver" {
  name       = "boltserver"
  num_cpus   = 2
  memory     = 4096

  resource_pool_id = "${data.vsphere_compute_cluster.cluster.resource_pool_id}"
  datastore_id     = "${data.vsphere_datastore.datastore.id}"

  guest_id = "${data.vsphere_virtual_machine.template.guest_id}"
  scsi_type = "${data.vsphere_virtual_machine.template.scsi_type}"

  network_interface {
    network_id   = "${data.vsphere_network.network.id}"
    adapter_type = "${data.vsphere_virtual_machine.template.network_interface_types[0]}"
  }

  disk {
    label            = "disk0"
    size             = "${data.vsphere_virtual_machine.template.disks.0.size}"
    eagerly_scrub    = "${data.vsphere_virtual_machine.template.disks.0.eagerly_scrub}"
    thin_provisioned = "${data.vsphere_virtual_machine.template.disks.0.thin_provisioned}"
  }

  clone {
    template_uuid = "${data.vsphere_virtual_machine.template.id}"

    customize {
      linux_options {
        host_name = "boltserver"
        domain    = "grt.local"
      }

      network_interface {}
      dns_server_list = ["10.0.0.200"]
      ipv4_gateway = "10.0.0.1"
    }
  }
}
```

The virtual machine can be provisioned using the standard Terraform workflow of init, plan and apply.

## Puppet Bolt Inventory

The Puppet Bolt inventory file defines resource information such as how to the connect to the resource such as the IP address and credentials for the resource. With the virtual machine provisioned the Bolt inventory file needs to be created to dynamically access the virtual machine.

Displayed below is the Puppet Bolt inventory file used in this example.

```yaml
version: 2
groups:
  – name: boltservers
    targets:
      – _plugin: terraform
        resource_type: vsphere_virtual_machine.boltserver
        uri: default_ip_address
        dir: .
        name: name
        backend: remote
```

### Inventory Properties

The Terraform plugin accepts a number of parameters for interacting with the Terraform state.

**resource_type:** The Terraform resource that should be matched with support for regular expressions (i.e. - _resource_type.resource_name_).

**uri:** The property of the Terraform resource used to connect to the resource such as the IP address or DNS name.

**dir:** The inventory plugin executes the Terraform state pull command to retrieve the state. The directory specified should be where the Terraform manifests for the resources resided.

**name:** The property of the Terraform resource to use as the target name

**backend:** The type of backend to load the Terraform state from. The two supported types are local and remote.

## Puppet Bolt Plan

With the resource provisioned and the inventory file configured Puppet Bolt can be run against the provisioned resource without explicitly defining the IP address or DNS name.

The command below runs Puppet Bolt against the virtual machine provisioned with Terraform. In this example we're just using the facts plan that comes with Bolt to show the functionality but a much more complex plan could be used to deploy an application or configure the security baseline as an example.

```bash
bolt plan run facts -i inventory.yaml nodes=boltservers
```

The command generates output similar to that shown below which dynamically retrieved the IP address to access the virtual machine.

```bash
bolt plan run facts -i inventory.yaml nodes=boltservers
Starting: plan facts
Starting: task facts on 10.0.0.15
Finished: task facts with 0 failures in 5.94 sec
Finished: plan facts in 5.97 sec
Finished on 10.0.0.15:
  {
    "os": {
      "name": "CentOS",
      "distro": {
        "codename": "Core "
      },
      "release": {
        "full": "7.6.1810",
        "major": "7",
        "minor": "6"
      },
      "family": "RedHat"
    }
  }
Successful on 1 node: boltserver
Ran on 1 node
```

This integration greatly simplifies configuring machines provisioned with Terraform and eliminates the need to specify the IP address of virtual machine before running Puppet Bolt. This plugin can be especially useful in deploying complex application stacks with dependencies between machines.

## Reference

Puppet Bolt Inventory Plugin

[https://puppet.com/docs/bolt/latest/inventory_file_v2.html#plugins-and-dynamic-inventory](https://puppet.com/docs/bolt/latest/inventory_file_v2.html#plugins-and-dynamic-inventory)
