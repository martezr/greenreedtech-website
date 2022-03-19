---
title: "VMware vSphere VM iPXE Boot without DHCP"
description: "meta description"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/vmware-vsphere-vm-ipxe-boot-without-dhcp/vSphere_ipxe_title.png"
date: "2021-08-27"
draft: false
author: "Martez Reed"
tags: ["DevOps", "VMware"]
categories: ["VMware"]
---

Network booting operating systems isn’t a new concept and has been around for years. Bare metal deployments are typically where network booting is commonly used. Most network cards are equipped with a network boot rom that enables the server to boot from the network using the PXE protocol. The PXE protocol is an old protocol that offers limited functionality. iPXE (https://ipxe.org/) is an open source network boot firmware that extends PXE with additional functionality. Network booting comes with a number of challenges, primarily configuring and managing the associated infrastructure required (DHCP, TFTP, etc.). TFTP isn’t typically used in most IT environments and DHCP isn’t commonly available on networks or VLANs used for hosting servers.

**Network booting vSphere VMs**

Similar to bare metal servers a VMware vSphere virtual machine supports network booting via the PXE protocol embedded in the virtual network card boot rom. As we mention earlier, the PXE protocol is limited in terms of functionality and requires a DHCP and TFTP server on the network. iPXE enables offers more functionality than PXE but we need a way to use the iPXE protocol instead of PXE. This is sometimes done through a process known as chain loading in which we boot iPXE with PXE but we still need DHCP and TFTP. We could also burn an ISO image to eliminate the DHCP and TFTP requirement but that means every VM needs to have an ISO mounted.

The solution to our problem is to use a custom network boot ROM that includes iPXE. This means that we can quasi natively use iPXE instead of PXE to network boot without DHCP or TFTP. iPXE supports interacting with VMware guest info to set the network information to boot an OS image from the network.

**Why network boot vSphere VMs?**

We now know that network booting is a pain but we have a fairly elegant solution but why even consider it for virtual machines when a template can easily be used. I view this as the next wave of workload management in which virtual machines are stateless shells that can be used for hosting containers that offers a simple one to one mapping with persistent storage handle further up in the proverbial stack. In my opinion this decouples the underlying VM guest operating system from the application and unlocks the ability to patch or update the guest os on the fly. Hosting the OS in memory and not writing it to disk means that every boot is an opportunity to swap out the underlying operating system. Projects like LinuxKit make this all the more viable when you think about hosting a MySQL database container on a minimal container host that only host the database container. This means I can potentially swap out the host OS at a moment’s notice while maintaining continuity at the database layer. This starts to enable a huge shift in how IT workloads are managed.


## Building a network boot ROM

Now that we know that we can replace the network boot rom of a virtual machine we need to create an iPXE boot rom to replace the VMware shipped network boot rom.

**Reduce ROM Size**

In order to boot iPXE from the custom network boot rom we need to disable some of the iPXE features that are enabled by default. This is due to a size limitation documented in this Github issue (https://github.com/ipxe/ipxe/issues/168). After some testing the one big component that would get us under the 64kb limit on the network boot rom was unfortunately HTTPS support. We could easily chainload a version of iPXE via HTTP to then use an image with HTTPS support that ultimately loads the operating system that we want.

**Enable VMware Settings**

The VMware guest info support is easily added by uncommented one of the VMware iPXE setting in the config/settings.h file before building the rom (https://ipxe.org/buildcfg/vmware_settings).

**Build the ROM**

In order to build the network boot rom for our vSphere VM requires a number of tools but we can use Docker to avoid installing a bunch of tools on our local machine. I’ve simplified this process by creating automation to handle the end to end process in this Github repo – https://github.com/martezr/vsphere-network-boot-rom-builder.

**Move the boot ROM**

With the network boot rom built we now need to move it somewhere that can be accessed by our ESXi host. There are two common options of where to place the rom, in the virtual machine directory on the ESXi datastore or in a global location that isn’t tied to the lifecycle of an individual VM. In this case the global location made sense to avoid needing to keep track of rom build versions across potentially dozens or hundreds of VMs.

The custom network boot rom can be uploaded to vSphere in a number of ways but I often use SCP to simply copy it to a datastore of a single ESXi host. The rom can be uploaded to a shared datastore hosted on any of the supported storage backends such as NFS or iSCSI. Here’s an example scp command to copy the boot rom to an ESXi host.

```bash
scp bins/15ad07b0.rom root@grtesxi02.grt.local:/vmfs/volumes/5826d416-0504a9f8-cf5f-0026b954baa6
```

## Creating a Virtual Machine

With the iPXE network boot rom created we now need to create a new virtual machine that will act as our shell for booting our operating system. All of the iPXE configuration will be handled using guest information presented to the virtual machine. We just need to provide the information during the provisioning process. The network boot rom related values (nx3bios.filename and ethernet0.opromsize) are covered in this blog post (https://thewayeye.net/2012/april/1/pxe-booting-virtual-machines-using-vmware-fusionworkstation-and-gpxe-or-ipxe/) along with the appropriate values for other network adapter types such as e1000 and e1000e.

<table><tbody><tr><td>Name</td><td>Description</td><td>Value</td></tr><tr><td>guestinfo.ipxe.filename</td><td>The</td><td>http://boot.ipxe.org/demo/boot.php</td></tr><tr><td>guestinfo.ipxe.scriptlet</td><td>An iPXE script to run on boot</td><td>ifopen net0 &amp;&amp; chain ${filename}</td></tr><tr><td>guestinfo.ipxe.net0.ip</td><td>The IP address used by the first network interface during the iPXE boot phase</td><td>10.0.0.10</td></tr><tr><td>guestinfo.ipxe.net0.gateway</td><td>The network gateway used by the first network interface during the iPXE boot phase</td><td>10.0.0.1</td></tr><tr><td>guestinfo.ipxe.dns</td><td>The DNS server used during the iPXE boot phase</td><td>10.0.0.200</td></tr><tr><td>nx3bios.filename</td><td>The path of the network boot rom relative to the vSphere environment.</td><td>/vmfs/volumes/5826d416-0504a9f8-cf5f-0026b954baa6/15ad07b0.rom</td></tr><tr><td>ethernet0.opromsize</td><td>The size in kilobytes of the network rom file</td><td>58880</td></tr></tbody></table>

There’s several ways to create a virtual machine in vSphere but we’ll be using Terraform in this example to simplify the creation process.


```bash
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

## Booting the Virtual Machine

Now that everything has been configured we’re ready to boot the virtual machine using the network settings associated with the virtual machine. We’re using the iPXE demo linux image for testing the boot process, the image should boot pretty quickly if it everything works as expected.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vmware-vsphere-vm-ipxe-boot-without-dhcp/vSphere_ipxe_demo_boot-1005x628.png)

## References

The following sites were referenced during the creation of this blog post.

https://ipxe.org/buildcfg/vmware_settings

https://thewayeye.net/2012/april/1/pxe-booting-virtual-machines-using-vmware-fusionworkstation-and-gpxe-or-ipxe/

