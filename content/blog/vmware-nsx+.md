---
title: "VMware NSX+ Overview - Tech Field Day Extra"
description: "A recap of the VMware Tech Field Day Extra presentation during VMware Explore 2023"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/vmware_nsx%2B/vmware-nsx%2B-title.png"
date: "2023-09-06"
draft: false
author: "Martez Reed"
tags: ["VMware","vSphere","NSX"]
categories: ["VMware","NSX"]
---

VMware recently presented at the [Tech Field Day Extra](https://techfieldday.com/appearance/vmware-presents-networking-and-security-at-tech-field-day-extra-at-vmware-explore-2023/) event during VMware Explore 2023. The presentation covered VMware's networking and security product updates. 

## Cross-Cloud Vision
VMware has been building out a cross-cloud solution that enables enterprise organizations to seamlessly deploy workloads to "any" cloud. This is being realized by building out operating environments in hyperscaler clouds such as AWS (VMC on AWS), Azure, GCP (Google Cloud VMware Engine), IBM Cloud (IBM Cloud for VMware Solutions), Oracle Cloud (Oracle Cloud VMware Solutions), and others. Each of these offerings is built using VMware's SDDC solution which leverages vSphere for compute, vSAN for storage, and NSX for networking.

NSX serves as the networking layer across the various VMware based solutions from on-prem deployments to the hyperscaler based deployments. This provides customers with a similar operating experience for each of the different deployments but still requires them to be managed in a disaggregated manner. The introduction of NSX+ now provides companies with the ability to leverage a centralized cloud service to manage the NSX networking layer in an aggregated fashion to reduce the overall management overhead and benefit from new features as they are introduced due to it being a SaaS solution.

The value of VMware's growing portfolio of hyperscaler based offerings is their adjacency to the cloud provider environment coupled with the ability to offload ongoing management of the underlying infrastructure as organizations contiue to evaluate their desire to manage datacenters themselves.

## VMware NSX+
VMware introducted [vSphere+ and vSAN+](https://blogs.vmware.com/vsphere/2022/06/announcing-vsphereplus-and-vsanplus-to-deliver-benefits-of-cloud-to-on-premises-workloads.html) last year to provide customers with a centralized cloud control plane for managing vSphere and vSAN. NSX+ aims to offer customers running NSX with the same benefits of simplifying configuration and management from a hosted control plane. 

### NSX+ Features
The initial release includes the following features:

* **NSX+ Policy Management:** Centralized management of network and security policies (Distributed Firewall, Gateway Firewall, and Distributed IPS/IDS). ***Currently only supports on-prem NSX***

* **NSX+ Intelligence:** Security oriented network traffic visibility solution.
***Currently only supports on-prem NSX***

* **NSX+ Network Detection and Response:** Centralized aggregation and correlation of network security events. ***Currently only supports on-prem NSX***

* **NSX+ ALB Cloud Services:** Centralized management of NSX Advanced Load Balancers (NSX Advanced Load Balancer is the load balancer technology from AVI Networks, which VMware acquired in 2019). ***Currently only supports VMC on AWS***

## Final Thoughts
NSX+ is a compelling offering that aligns with where the industry has been moving for several years in terms of a centralized cloud control plane to manage distributed installations at scale. The part that will be the most interesting to see in the upcoming months is the ability to integrate the policy management with the native cloud networking and security to provide a robust policy management solution that extends beyond just VMware NSX.

Ultimately, the cloud control plane management overlay will effectively allow the different individual hyperscaler deployments to be treated as just another datacenter.