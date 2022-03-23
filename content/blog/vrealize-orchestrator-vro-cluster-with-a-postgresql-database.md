---
title: "vRealize Orchestrator (vRO) Cluster with a PostgreSQL Database"
date: "2017-06-26"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_14.png"
draft: false
author: "Martez Reed"
tags: ["vRO","VMware"]
categories: ["VMware", "vRO"]
---

In this post we're going to build out a two node vRealize Orchestrator cluster with a PostgreSQL database. VMware is deprecating support for Microsoft SQL and Oracle databases as the vRO external database in favor of PostgreSQL.

[https://docs.vmware.com/en/vRealize-Orchestrator/7.3/rn/vrealize-orchestrator-73-release-notes.html](https://docs.vmware.com/en/vRealize-Orchestrator/7.3/rn/vrealize-orchestrator-73-release-notes.html)

## PostgreSQL database installation and configuration

The first thing we need to do is install and configure PostgreSQL on a linux server. The following steps will how to install and configure PostgreSQL 9.6.3 on a CentOS 7 machine.

**Install PostgreSQL Repo**

```bash
yum install -y https://download.postgresql.org/pub/repos/yum/9.6/redhat/rhel-7-x86_64/pgdg-centos96-9.6-3.noarch.rpm  
```

**Install PostgreSQL server**

```bash
yum install -y postgresql96-server  
```

**Initialize the database**

```bash
/usr/pgsql-9.6/bin/postgresql96-setup initdb
```

**Enable the PostgreSQL service to start on boot**

```bash
systemctl enable postgresql-9.6  
```

**Enable remote connections**

The following change must be made to the **/var/lib/pgsql/9.6/data/postgresql.conf** config file to allow remote connections.

```bash
listen_address 'localhost'  
```

to

```bash
listen_address '*'  
```

**Authorize remote connections**

The following entry must be added to the **/var/lib/pgsql/9.6/data/pg_hba.conf** to authorize remote servers to connect to the database.

The following three properties of each line should be changed.

- database_name
- database_user
- vro_appliance_1/2_IP
    
    host database_name database_user vro_appliance_1_IP/32 trust  
    host database_name database_user vro_appliance_2_IP/32 trust
    

**Start the PostgreSQL service**

```bash
systemctl start postgresql-9.6  
```

## Create vRO database user

Now that we've got PostgreSQL installed and running we need to create a user for vRO to access the database.

**Change to the postgres superuser to create the vRO user**

```bash
su - postgres  
```

**Create the vRO database user**

Provide a password when prompted.

```bash
createuser vrodbuser --pwprompt  
```

## Create vRO database

The last thing we need to do is create the database that vRO will utilize.

```bash
createdb -O vrodbuser vrodatabase  
```

**Logoff of the postgres account**

```bash
exit  
```

## vRO configuration

With the database configured we can now start the vRO configuration. The first step is to deploy two vRO 7.3 appliances to vSphere and then log into the control center of the first appliance ([https://ip_address:8283/vco-controlcenter](https://ip_address:8283/vco-controlcenter)).

Select "**Standalone Orchestrator**" from the "**Select deployment type:**" drop-down list even though we're configuring a cluster. Provide the hostname or IP address of the load balancer VIP to allow requests to be load balanced or leave the address of the appliance if a load balancer will not be used.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_1.png)

Select an authentication mode of either **vSphere** or **vRealize Automation**. We've selected **vSphere** authentication in this case since we're not deploying vRealize Automation. Enter the hostname of the PSC in the **Host address** field and click "**CONNECT**".  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_2.png)

Click "**ACCEPT CERTIFICATE**" to trust the SSL certificate for the PSC.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_3.png)

Enter vSphere credentials as well as the default tenant and click "**REGISTER**" to register the vRO appliance with the vSphere SSO domain.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_4.png)

Designate a vSphere SSO group as the admin group for vRO appliance.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_5.png)

Click "**SAVE CHANGES**" after an admin group has been selected.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_6.png)

After completing the initial setup the service needs to be restarted to apply the changes we just made. Click "**Startup Options**" to access the restart action.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_11.png)

We should see a message indicating that a server restart is required to apply our configuration changes. Click the "**RESTART**" button to restart the vco-server service.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_12.png)

Once the service has restarted when see a current status of "**RUNNING**" and the active and pending configuration fingerprints matches.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_13.png)

Now we need to configure vRO to use our external PostgreSQL database server. Click "**Configure Database**" to access the database configuration.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_11.png)

Enter the hostname/IP address and port number for the PostgreSQL database (The default port is 5432). Enter the database name and credentials, then click "**SAVE**" to apply the changes.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_8.png)

If the connection was successful we should get a "**Configuration saved**" message indicating that the vRO appliance was able to establish a connection to the PostgreSQL database.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_9.png)

## Add Second vRO Appliance

Now we'll add our second vRO appliance and create our cluster. Select "**Clustered Orchestrator**" from the "**Select deployment type:**" drop-down list. Enter the hostname/IP of the first vRO appliance along with the VAMI credentials for the appliance and click "**JOIN**" to create the vRO cluster.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_10.png)

Following the join cluster operation we need to restart the vco-server service on our second vRO appliance. Click "**Startup Options**" to access the restart action.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_11.png)

We should see a message indicating that a server restart is required to apply our configuration changes. Click the "**RESTART**" button to restart the vco-server service.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_12.png)

Once the service has restarted when see a current status of "**RUNNING**" and the active and pending configuration fingerprints matche.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_13.png)

Let's view the current status of our cluster by clicking on "**Orchestrator Cluster Management**" from the main page of the control center.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_11.png) Once the vco-server service on our second vRO appliance has been successfully restarted we should see that both nodes are synchronized and in a "**RUNNING**" state.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_cluster_with_a_postgresql_database/vROCluster_14.png)

## References

Install PostgreSQL  
[https://www.postgresql.org/download/linux/redhat/](https://www.postgresql.org/download/linux/redhat/)

Create PostgreSQL user  
[https://www.a2hosting.com/kb/developer-corner/postgresql/managing-postgresql-databases-and-users-from-the-command-line](https://www.a2hosting.com/kb/developer-corner/postgresql/managing-postgresql-databases-and-users-from-the-command-line)

PostgreSQL Authorization  
[http://www.thegeekstuff.com/2014/02/enable-remote-postgresql-connection/?utm_source=tuicool](http://www.thegeekstuff.com/2014/02/enable-remote-postgresql-connection/?utm_source=tuicool)

vRealize Orchestrator 7.3 Installation and Configuration  
[http://pubs.vmware.com/orchestrator-73/index.jsp#com.vmware.vrealize.orchestrator-install-config.doc/GUID-BEB98B76-354A-438D-8BA0-53DE8E2F1DE2.html](http://pubs.vmware.com/orchestrator-73/index.jsp#com.vmware.vrealize.orchestrator-install-config.doc/GUID-BEB98B76-354A-438D-8BA0-53DE8E2F1DE2.html)

vRealize Orchestrator 7.3 Release Notes  
[http://pubs.vmware.com/Release_Notes/en/orchestrator/vrealize-orchestrator-73-release-notes.html](http://pubs.vmware.com/Release_Notes/en/orchestrator/vrealize-orchestrator-73-release-notes.html)
