---
title: "VMware NSX+"
description: "LinuxKit enables the ability to build modular lightweight container hosts for VMware vSphere"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/vmware_nsx%2B/vmware-nsx%2B-title.png"
date: "2023-09-02"
draft: false
author: "Martez Reed"
tags: ["VMware","vSphere","NSX"]
categories: ["vSphere"]
---

VMware recently presented at the [Tech Field Day Extra](https://techfieldday.com/appearance/vmware-presents-networking-and-security-at-tech-field-day-extra-at-vmware-explore-2023/) event during VMware Explore 2023. The presentation covered VMware's networking and security product updates. 

VMware is most known for it's flagship VMware vSphere product (ESXi and vCenter) that enables organizations to run on-prem workloads in a virtualized fashion.

NSX is a complimentary network virtualization solution that provides a way to effectively abstract the underlying network and offer network functions like routing, load balancing, distributed firewalls, and more.

## VMware NSX+
VMware introducted [vSphere+ and vSAN+](https://blogs.vmware.com/vsphere/2022/06/announcing-vsphereplus-and-vsanplus-to-deliver-benefits-of-cloud-to-on-premises-workloads.html) last year to provide customers with a centralized cloud control plane for managing vSphere and vSAN. NSX+ aims to offer customers running NSX with the same benefits of simplifying configuration and management from a hosted control plane. 

### NSX+ Features
The initial release includes the following features:

* **NSX+ Policy Management:** Centralized management of network and security policies (Distributed Firewall, Gateway Firewall, and Distributed IPS/IDS). ***Currently only supports on-prem NSX***

* **NSX+ Intelligence:** Security oriented network traffic visibility solution.
***Currently only supports on-prem NSX***

* **NSX+ Network Detection and Response:** Centralized aggregationa and correlation of network security events. ***Currently only supports on-prem NSX***

* **NSX+ ALB Cloud Services:** Centralized management of NSX Advanced Load Balancers (NSX Advanced Load Balancer is the load balancer technology from AVI Networks, which VMware acquired in 2019). ***Currently only supports VMC on AWS***

## Cross-Cloud Vision
VMware has been building out a cross-cloud solution that enables enterprise organizations to seamlessly deploy workloads to disparate cloud environments. VMware is continuing to invest in building out operating environments in hyperscaler clouds such as AWS, Azure, GCP, IBM Cloud, Oracle, and others. NSX serves as the networking layer for across the various VMware based solutions from on-prem deployments to the hyperscaler based deployments. The introduction of NSX+ now provides companies with the ability to leverage a centralized cloud service to reduce management overhead and benefit from new features without the need to upgrade software.

The value of VMware's growing portfolio of hyperscaler based offerings is their adjacency to the cloud provider environment coupled with the ability to offload ongoing management of the underlying infrastructure.