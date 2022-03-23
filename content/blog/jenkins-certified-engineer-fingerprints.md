---
title: "Jenkins Certified Engineer: Fingerprints"
date: "2016-03-15"
description: "meta description"
image: ""
draft: false
author: "Martez Reed"
tags: ["DevOps", "Jenkins"]
categories: ["Jenkins"]
---

This post covers the section listed below on the Certified Jenkins Engineer (CJE) exam.

**Section #1: Key CI/CD/Jenkins Concepts**

**Fingerprints**

- **What are fingerprints?**
- **How do fingerprints work?**

#### What are fingerprints?

Jenkins utilizes fingerprints for tracking a specific instance of a file. This is critically important when attempting to determine which particular version of a file was used during a build. The fingerprint of a file is simply a MD5 checksum that can be used for comparing files.

An example fingerprint (MD5 checksum) is provided below for reference.

**MD5: d41d8cd98f00b204e9800998ecf8427e**

#### How do fingerprints work?

The fingerprints are stored as xml files in the $JENKINS_HOME/fingerprints directory on the Jenkins master. The xml file contains the Jenkins job name, build number, MD5 checksum, and fingerprinted file name.

```xml
<?xml version='1.0' encoding='UTF-8'?>  
<fingerprint>  
  <timestamp>2016-03-15 19:26:54.777 UTC</timestamp>
  <original>
    <name>Test</name>
    <number>1</number>
  </original>
  <md5sum>d41d8cd98f00b204e9800998ecf8427e</md5sum>
  <fileName>testfile.txt</fileName>
  <usages>
    <entry>
      <string>Test</string>
      <ranges>1</ranges>
    </entry>
  </usages>
  <facets/>
</fingerprint>  
```

#### References

[https://wiki.jenkins-ci.org/display/JENKINS/Fingerprint](https://wiki.jenkins-ci.org/display/JENKINS/Fingerprint)
