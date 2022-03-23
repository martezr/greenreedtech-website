---
title: "NetApp: Highly Performant Storage for Cloud Native Apps"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/netapp_highly_performant_storage_for_cloud_native_apps/netapp_highly_performant_storage_for_cloud_native_apps_1.png"
author: "Martez Reed"
draft: false
date: "2018-05-01"
categories: ["cfd3","devops"]
tags: ["cfd3"]
---

NetApp was one of the **"legacy"** companies that presented a number of compelling solutions at [Cloud Field Day #3](http://techfieldday.com/event/cfd3/). The challenge for many similar companies is how do you continue to stay relevant given the pace at which technology moves.

Kubernetes is the defacto container orchestration platform created by Google that is one of the hottest technologies within the IT industry at this time. One of the still developing areas with containers is the management of stateful applications which for many is an anti-pattern for containers which they feel should be stateless. The challenge with stateful applications running in containers is that there must be some sort of persistent storage to allow the state to survive the destruction of the container. This is where a company like NetApp comes into the picture.

NetApp offers a collection of products that can be leveraged to create a highly scalable, performant and cloud agnostic kubernetes persistent storage solution.

## NetApp Cloud Volumes

[https://cloud.netapp.com/cloud-volumes](https://cloud.netapp.com/cloud-volumes)

NetApp Cloud Volumes is a fully managed enterprise class CIFS/NFS storage solution available within the public cloud. Cloud Volumes is based upon NetApp's ONTAP technology that is familiar to those that manage storage in existing on-prem environments.

NetApp Cloud Volumes is an enterprise class storage solution that includes a number of features unavailable with the native cloud provider storage solutions.

- **Storage Replication:** Cloud Volumes enables the use of NetApp's SnapMirror replication to replicate data to either an on-prem NetApp or a Cloud Volumes deployment in a different cloud provider.
- **Compression:** The underlying NetApp storage compresses data to save on storage costs.
- **Deduplication:** The underlying NetApp storage deduplicates common data to save on storage costs.
- **Performance:** The performance of the Cloud Volumes solution has been benchmarked to provide consistently faster speeds than cloud provider native storage.

## NetApp Trident

[https://github.com/NetApp/trident](https://github.com/NetApp/trident)

Trident is an open source project created by NetApp that enables NetApp's enterprise storage to be natively leveraged as a persistent volume with Kubernetes.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/netapp_highly_performant_storage_for_cloud_native_apps/netapp_highly_performant_storage_for_cloud_native_apps_2.png)

This allows Kubernetes to dynamically provision storage at an application level as well as specify the storage performance to meet the applications I/O requirements. This enables the application to seamlessly move around the Kubernetes cluster.

The combination of Trident and Cloud Volumes allows for I/O hungry workloads like databases to continue to be moved into containers and still meet performance requirements.

The following video is a snippet of the presentation given at Cloud Field Day #3 about NetApp's cloud services.

<iframe width="560" height="315" src="https://www.youtube.com/embed/VZKk7sI0lKc?rel=0&amp;start=3440" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

## References

Kubernetes Persistent Volumes  
[https://kubernetes.io/docs/concepts/storage/persistent-volumes/](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)

Kubernetes Dynamic Volume Provisioning  
[https://kubernetes.io/docs/concepts/storage/dynamic-provisioning/](https://kubernetes.io/docs/concepts/storage/dynamic-provisioning/)

OpenShift and NetApp  
[https://blog.openshift.com/partner-spotlight-netapp/](https://blog.openshift.com/partner-spotlight-netapp/)
