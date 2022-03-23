---
title: "Jenkins Certified Engineer: Folders"
date: "2016-07-14"
description: "meta description"
image: ""
draft: false
author: "Martez Reed"
tags: ["DevOps", "Jenkins"]
categories: ["Jenkins"]
---

This post covers the section listed below on the Certified Jenkins Engineer (CJE) exam.

Section #3: Building Continuous Delivery (CD) Pipelines

Folders

- How to control access to items in Jenkins with folders
- Referencing jobs in folders

#### What are folders?

Jenkins provides the ability to organize jobs into a hierarchical manner with the [CloudBees Folders Plugin](https://wiki.jenkins-ci.org/display/JENKINS/CloudBees+Folders+Plugin). This allows us to manage the jobs much like we would files on a file system. Folders can also be used to manage permissions on a per folder basis to ease security administration.

Below is the config.xml file of a folder which holds the folder's configuration much like the config.xml configuration file for a job.

```xml
<?xml version='1.0' encoding='UTF-8'?>  
<com.cloudbees.hudson.plugins.folder.Folder plugin="cloudbees-folder@5.12">  
  <actions/>
  <description></description>
  <properties/>
  <views>
    <hudson.model.AllView>
      <owner class="com.cloudbees.hudson.plugins.folder.Folder" reference="../../.."/>
      <name>All</name>
      <filterExecutors>false</filterExecutors>
      <filterQueue>false</filterQueue>
      <properties class="hudson.model.View$PropertyList"/>
    </hudson.model.AllView>
  </views>
  <viewsTabBar class="hudson.views.DefaultViewsTabBar"/>
  <healthMetrics>
    <com.cloudbees.hudson.plugins.folder.health.WorstChildHealthMetric/>
  </healthMetrics>
  <icon class="com.cloudbees.hudson.plugins.folder.icons.StockFolderIcon"/>
```

* * *

#### Creating folders

Now that we've gone over what folders are let's go ahead and create a folder.

**Step #1:** Click "New Item" to create a new item (job/folder) ![Jenkins Ceritifed Engineer: Folders](https://s3.us-west-2.amazonaws.com/greenreedtech.com/jce_folders/Jenkins_Certified_Engineer_Folders_1.png)

**Step #2:** Enter a name in the textbox, select "Folder" and click "OK" to create the folder. ![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/jce_folders/Jenkins_Certified_Engineer_Folders_2.png)

**Step #3:** Configure the folder settings as desired and click "Save" to apply the changes. ![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/jce_folders/Jenkins_Certified_Engineer_Folders_3.png)

* * *

#### Creating a job in a folder

This section will cover creating a new job within a folder.

**Step #1:** From within the desired folder, click "New Item" to create a new item (job/folder). In this case we're using the "Finance" folder we created in the previous task. ![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/jce_folders/Jenkins_Certified_Engineer_Folders_4.png)

**Step #2:** Enter a name in the textbox and select "Freestyle project" and click "OK" to create the job. ![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/jce_folders/Jenkins_Certified_Engineer_Folders_5.png) **Step #3:** Configure the job settings as desired and click "Save" to apply the changes.

If we go back to the folder we now see that the "Monthly_Report" job we just created is listed in the folder.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/jce_folders/Jenkins_Certified_Engineer_Folders_6.png)

* * *

#### Moving an existing job to a folder

In addition to creating a new job in our folder we can move our existing jobs to folder. We'll move a job named "Test" to our Finance folder.

**Step 1:** Click the arrow to the right of the job name and select "Move". ![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/jce_folders/Jenkins_Certified_Engineer_Folders_7.png)

**Step 2:** Select the desired folder from the drop down menu and click "Move". In our case we'll select the Finance folder. ![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/jce_folders/Jenkins_Certified_Engineer_Folders_8.png)

We now see that the "Test" job has been added to our "Finance" folder.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/jce_folders/Jenkins_Certified_Engineer_Folders_9.png)

* * *

#### Referencing jobs in folders

With the creation of folders we need to understand the namespace used for referencing files within the folder such as the folder config.xml and jobs in the folder.

In this example we're going to use a folder named "JenkinsFolder" and a job name "JenkinsJob".

http://**JenkinsServer/job/**JenkinsFolder**/job/**JenkinsJob**

Server Name: JenkinsServer  
Folder Name: JenkinsFolder  
Job Name: JenkinsJob

We can see that a "job" section is prepended to both the folder name as well as the job name. Now that we have an idea of how to navigate folders, let's try an example. We need to create a link for the following job nested within a folder.

Server Name: JenkinsServer  
Folder Name: Finance  
Job Name: MonthlyReport

**Solution:** http://**JenkinsServer/job/Finance/job/MonthlyReport

Now that we're comfortable with accessing jobs within let's try accessing a file within the folder.

Server Name: JenkinsServer  
Folder Name: HR  
File Name: config.xml

**Solution:** http://**JenkinsServer/job/HR/config.xml

* * *

#### How to control access to items in Jenkins with folders

We can utilize our folders for managing user access to jobs by providing users with global read privileges and then assigning the user additional rights at the folder level to allow them to manage the jobs within the folder but not access any other folders on the Jenkins server.

**A security realm needs to be configured**

**Step #1:** Click "Manage Jenkins" from the sidebar. ![Jenkins Ceritifed Engineer: Folders](https://s3.us-west-2.amazonaws.com/greenreedtech.com/jce_folders/Jenkins_Certified_Engineer_Folders_10.png) **Step #2:** Click "Configure Global Security". ![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/jce_folders/Jenkins_Certified_Engineer_Folders_11.png)

**Step #3:** Select the "Project-based Matrix Authorization Strategy" under the "Authorization" section and select the appropriate permissions. ![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/jce_folders/Jenkins_Certified_Engineer_Folders_12.png)

**Step #4:** From the folder configuration section select the "Enable project-based security" checkbox and assign the desired permissions to the user or group. ![Jenkins Ceritifed Engineer: Folders](https://s3.us-west-2.amazonaws.com/greenreedtech.com/jce_folders/Jenkins_Certified_Engineer_Folders_13.png)

With access control being managed at the folder level we are able to segregate jobs on our Jenkins server to different departments or groups.

Reference  
[https://www.cloudbees.com/products/cloudbees-jenkins-platform/team-edition/features/folders-plugin](https://www.cloudbees.com/products/cloudbees-jenkins-platform/team-edition/features/folders-plugin)  
[https://go.cloudbees.com/docs/cloudbees-documentation/cje-user-guide/chapter-folder.html#](https://go.cloudbees.com/docs/cloudbees-documentation/cje-user-guide/chapter-folder.html#)
