---
title: "Jenkins Active Directory"
date: "2015-11-20"
description: "meta description"
image: "images/post/05.jpg"
draft: false
author: "Martez Reed"
tags: ["DevOps", "Jenkins"]
categories: ["DevOps"]
---

This post covers integrating Jenkins CI server with Microsoft Active Directory to provide centralized authentication.

### Step #1 - Install he Active Directory plugin

> **Click "Manage Jenkins" from the sidebar**

![](images/Jenkins_AD_1.png)

> **Click "Manage Plugins" to install the Active Directory plugin**

![](images/Jenkins_AD_2.png)

> **Click on the "Available" tab, enter "Active Directory" in the "Filter:" search box, click the checkbox next to "Active Directory plugin" and finally click "Download now and install after restart"**

![](images/Jenkins_AD_3-1.png)

> **Click the "Restart Jenkins when install is complete and no jobs are running" checkbox to complete the plugin installation.**

![](images/Jenkins_AD_6-1.png)

> **Click "Configure Global Security"**

![](images/Jenkins_AD_4.png)

> **Select "Active Directory" and enter the domain and domain accounts information.**

![](images/Jenkins_AD_7.png)

> \*\*Select "Matrix-based security" and add the desired users and groups. \*\*user names and group names are case sensitive\*\*\*\*

![](images/Jenkins_AD_8-4.png)

> **Log into the web interface with AD credentials**

![](images/Jenkins_AD_9.png)

#### References:

Jenkins AD Security
[http://justinramel.com/2013/01/15/active-directory-security/](http://justinramel.com/2013/01/15/active-directory-security/)

Jenkins AD Plugin
[https://wiki.jenkins-ci.org/display/JENKINS/Active+Directory+Plugin](https://wiki.jenkins-ci.org/display/JENKINS/Active+Directory+Plugin)
