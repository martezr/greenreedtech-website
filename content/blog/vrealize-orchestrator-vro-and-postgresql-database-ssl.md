---
title: "vRealize Orchestrator (vRO) and PostgreSQL Database SSL"
date: "2017-06-30"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_and_postgresql_database_ssl/vRO_Cluster_SSL_7.png"
draft: false
author: "Martez Reed"
tags: ["vRO","VMware"]
categories: ["VMware", "vRO"]
---

In a previous post we walked through configuring a PostgreSQL database server as the external database for our vRealize Orchestrator (vRO) cluster. In this post we'll cover adding SSL support to encrypt the traffic between our vReazlie Orchestrator cluster and our PostgreSQL database server.

## PostgreSQL SSL Configuration

#### Generate CSR

The first thing we need to do is get our SSL certificate for the database server. In this case we're going to use openssl to generate our certificate request and ultimately we'll use openssl self-sign the certificate.

```bash
openssl req -newkey rsa:4096 -nodes -keyout vrodb.key -out vrodb.csr  
```

Provide the necessary information to the prompts.

```bash
Generating a 4096 bit RSA private key  
.............................................................++
..................................................................................++
writing new private key to 'vrodb.key'  
-----
You are about to be asked to enter information that will be incorporated  
into your certificate request.  
What you are about to enter is what is called a Distinguished Name or a DN.  
There are quite a few fields but you can leave some blank  
For some fields there will be a default value,  
If you enter '.', the field will be left blank.  
-----
Country Name (2 letter code) [XX]:US  
State or Province Name (full name) []:IL  
Locality Name (eg, city) [Default City]:Chicago  
Organization Name (eg, company) [Default Company Ltd]:Green Reed Technology  
Organizational Unit Name (eg, section) []:IT  
Common Name (eg, your name or your server's hostname) []:grtdb01.grt.local  
Email Address []:admin@grt.local

Please enter the following 'extra' attributes  
to be sent with your certificate request  
A challenge password []:  
An optional company name []:Green Reed Technology  
```

#### Sign Certificate Request

We'll sign the certificate request with openssl since we're using a self-signed certificate but the CSR could be signed by a trusted CA as well.

```bash
openssl x509 -signkey vrodb.key -in vrodb.csr -req -days 365 -out vrodb.crt  


Signature ok  
subject=/C=US/ST=IL/L=Chicago/O=Green Reed Technology/OU=IT/CN=grtdb01.grt.local/emailAddress=admin@grt.local  
Getting Private key  
```

#### Modify Permissions

With the private key and certificate created we'll secure the file permissions.

```bash
chmod 400 vrodb.key  
chown postgres:postgres vrodb.key  
chown postgres:postgres vrodb.crt  
```

#### Configure SSL Support

The following change must be made to the /var/lib/pgsql/9.6/data/postgresql.conf config file to enable SSL support.

```bash
ssl = on  
ssl_cert_file = 'vrodb.crt'  
ssl_key_file = 'vrodb.key'  
ssl_ca_file = 'vrodb.crt'  
```

#### Restart the PostgreSQL Service

We need to restart the PostgreSQL service to apply the changes we've made.

```bash
systemctl restart postgresql-9.6  
```

## vRO SSL Configuration

With our database server configured to support SSL we just need to configure our vRealize Orchestrator (vRO) cluster to use SSL to connect to the database.

The first thing we need to do is import the SSL certificate for our database server into vRealize Orchestrator. From the vRealize Orchestrator (vRO) control center click "**Certificates**" to manage the vRealize Orchestrator (vRO) certificates.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_and_postgresql_database_ssl/vROCluster_11-1024x571.png)

Click "**IMPORT**" and select "**Import from a PEM-encoded file**".  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_and_postgresql_database_ssl/vRO_Cluster_SSL_1.png)

Click "**BROWSE**" and select the SSL certificate that our database server utilizes. The SSL certificate may need to be copied from the database server is not present on the local machine.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_and_postgresql_database_ssl/vRO_Cluster_SSL_2.png)

Click "**IMPORT**" to import the SSL certificate into the keystore.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_and_postgresql_database_ssl/vRO_Cluster_SSL_3.png) Verify the SSL certificate and click "**IMPORT**".  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_and_postgresql_database_ssl/vRO_Cluster_SSL_4.png) Once the import process has been completed the SSL certificate should show as a trusted SSL certificate.

Repeat the SSL certificate import process on all additional vRO appliances in the cluster.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_and_postgresql_database_ssl/vRO_Cluster_SSL_5.png)

With the SSL certificate of our database imported we need to configure our connection to use SSL. Click on "**Database**" from the Control Center home page to configure the database.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_and_postgresql_database_ssl/vROCluster_11.png)

Toggle the "**Use SSL**" slider, select "**require**" for the SSL mode and click "**SAVE**" to configure SSL support.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_and_postgresql_database_ssl/vRO_Cluster_SSL_6.png)

If the connection was established successfully we should see a "Configuration saved" message.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_orchestrator_vro_and_postgresql_database_ssl/vRO_Cluster_SSL_7.png)

Unfortunately even though we just configured SSL support the UI doesn't update properly so it seems like we don't have SSL configured if we go back to the database configuration screen.

One way to validate the SSL configuration is to log into one of the vRO appliances and run the following command.

```bash
cat /var/lib/vco/app-server/conf/vmo.properties | grep sslmode  
```

The command output should be similar to that below if SSL is configured and no output if it's not.

```bash
database.url=jdbc:postgresql://grtdb01.grt.local:5432/vrodatabase?sslmode=require  
```

## References

PostgreSQL SSL Configuration  
[https://www.postgresql.org/docs/9.6/static/ssl-tcp.html](https://www.postgresql.org/docs/9.6/static/ssl-tcp.html)

vRealize Orchestrator Database Configuration  
[https://docs.vmware.com/en/vRealize-Orchestrator/7.3/com.vmware.vrealize.orchestrator-install-config.doc/GUID-DB3E9B1D-59B4-40A6-8A82-E7D1605697C7.html](https://docs.vmware.com/en/vRealize-Orchestrator/7.3/com.vmware.vrealize.orchestrator-install-config.doc/GUID-DB3E9B1D-59B4-40A6-8A82-E7D1605697C7.html)
