---
title: "Puppet Hiera HTTP Using CouchDB"
description: "meta description"
image: "images/post/05.jpg"
date: "2015-11-19"
draft: false
author: "Martez Reed"
tags: ["Puppet", "Hiera"]
categories: ["Puppet"]
---

Puppet supports various hiera backends to pull in external data from various sources. This post will cover integrating open source puppet with a couchdb database using the hiera-http backend.

## CouchDB Setup and Configuration

The following steps will cover the setup and configuration of the CouchDB database server that will be used as the data store. The following steps assume that docker has been installed

**Start CouchDB Docker container**

The container is started with a name of "couchdb" and the CouchDB admin username and password are set during container creation. Port 5984 is mapped to port 5984 on the host machine.

```bash
docker run -d --name couchdb -p 5984:5984 -e COUCHDB_USERNAME=couchadmin -e COUCHDB_PASSWORD=Password couchdb
```

**Database configuration**

CouchDB provides a web interface for managing the databases as well as REST API.

Step #1 - Log into the CouchDB web interface using the credentials created during the container provisioning.

Click login at the bottom right corner of the web page

```bash
http://ip_address:5984/_utils
```

![](images/CouchDB_1_new.png) Enter the login credentials
![](images/CouchDB_3.png)

**Step #2** - Create a new database
In our example configuration we'll use "hiera" as the database to store all the puppet related documents.

Click "Create Database" to create the new database
![](images/CouchDB_4_new.png) Enter the database name and click "Create" to create the database.
![](images/CouchDB_5.png)

**Step #3** - Create a new document
The documents will act like the individual .yaml files in the yaml backend to provide a customized hierarchy.

Click "New Document" to create the new document
![](images/CouchDB_6_new.png) Enter the appropriate value for the "\_id" field and Click "Add Field" to add a new field. In our example we use common which replicates the common.yaml file in the yaml backend structure.

![](images/CouchDB_7_new.png) Enter the desired hiera data and click "Save Document" when done. The additional fields are used to store the actual data such as classes, and class variables. In our example we'll add a couchdbtest value for testing.

![](images/CouchDB_8_new.png) The example below shows what the code would look like in a yaml file.

```yaml
---
couchdbtest: 'Does it really work'
```

The database has now been configured so we can move on to the puppet configuration.
![](images/CouchDB_9_new.png)


#### REST API

The previous steps for configuring the database and fields can be performed utilizing the REST API provided by CouchDB. Basic authentication is used to manage the database and documents.

The following command creates the "hiera" database

```bash
curl -X PUT http://couchadmin:Password@10.0.0.148:5984/hiera
```

![](images/CouchDB_rest_1.png)

The following command creates the "common" document

```bash
curl -X PUT http://couchadmin:Password@10.0.0.148:5984/hiera/common -H 'Content-Type: application/json' -d '{"couchdbtest":"Does it really work"}'
```

![](images/CouchDB_rest_2.png)

## Puppet Master Configuration
The following steps will cover configuring Puppet to communicate with the CouchDB database.

Install hiera-http
The hiera-http is installed via ruby-gems

```bash
gem install hiera-http
```

## Update hiera.yaml config file

Use a text editor to modify the hiera.yaml file.

```yaml
---
:backends: ['http','yaml']

:hierarchy:
  - defaults
  - "%{clientcert}"
  - "%{environment}"
  - global

:yaml:
# datadir is empty here, so hiera uses its defaults:
# - /var/lib/hiera on *nix
# - %CommonAppData%PuppetLabshieravar on Windows
# When specifying a datadir, make sure the directory exists.
  :datadir:


:http:
  :host: 10.0.0.148
  :port: 5984
  :output: json
  :failure: graceful
  :use_auth: true
  :auth_user: 'couchadmin'
  :auth_pass: 'Password'
  :paths:
    - /hiera/%{clientcert}
    - /hiera/%{environment}
    - /hiera/common
```

## Perform hiera lookup

We’ll perform a hiera lookup to verify that everything is working.

```bash
hiera couchdbtest -d
```

## References:

CouchDB Docker Image
https://hub.docker.com/r/frodenas/couchdb/

Hiera-http configuration
http://www.craigdunn.org/2012/11/puppet-data-from-couchdb-using-hiera-http/

Open source puppet master install
http://blog.fnaard.com/2015/04/build-puppet-master-on-centos-7-hella.html
