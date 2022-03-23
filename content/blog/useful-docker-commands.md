---
title: "Useful Docker Commands"
date: "2016-06-12"
image: ""
author: "Martez Reed"
categories: ["DevOps"]
tags: ["Docker"]
draft: false
---

Docker ([https://www.docker.com/](https://www.docker.com/)) is arguably the most popular container platform and this post covers a number of useful Docker commands from basic commands about viewing system information to viewing logs of docker containers. Additional commands can be found at the Docker docs website ([https://docs.docker.com/engine/reference/commandline/cli/](https://docs.docker.com/engine/reference/commandline/cli/)) or via the command line help.

#### Docker Version

View the version of docker installed on the system. Both the client and server version are listed.

```bash
core@coreos03 ~ $ docker version  
Client:  
 Version:      1.11.1
 API version:  1.23
 Go version:   go1.5.4
 Git commit:   5604cbe
 Built:        Wed Apr 27 00:34:42 2016
 OS/Arch:      linux/amd64

Server:  
 Version:      1.11.1
 API version:  1.23
 Go version:   go1.5.4
 Git commit:   5604cbe
 Built:        Wed Apr 27 00:34:42 2016
 OS/Arch:      linux/amd64
```

#### Docker Info

The docker info command provides information about the configuration of the docker installation and the underlying host system.

```bash
Containers: 5  
 Running: 0
 Paused: 0
 Stopped: 5
Images: 4  
Server Version: 1.11.1  
Storage Driver: devicemapper  
 Pool Name: docker-253:0-201329853-pool
 Pool Blocksize: 65.54 kB
 Base Device Size: 10.74 GB
 Backing Filesystem: xfs
 Data file: /dev/loop0
 Metadata file: /dev/loop1
 Data Space Used: 4.111 GB
 Data Space Total: 107.4 GB
 Data Space Available: 31.4 GB
 Metadata Space Used: 3.453 MB
 Metadata Space Total: 2.147 GB
 Metadata Space Available: 2.144 GB
 Udev Sync Supported: true
 Deferred Removal Enabled: false
 Deferred Deletion Enabled: false
 Deferred Deleted Device Count: 0
 Data loop file: /var/lib/docker/devicemapper/devicemapper/data
 Metadata loop file: /var/lib/docker/devicemapper/devicemapper/metadata
 Library Version: 1.02.107-RHEL7 (2015-12-01)
Logging Driver: json-file  
Cgroup Driver: cgroupfs  
Plugins:  
 Volume: local
 Network: bridge null host
Kernel Version: 3.10.0-327.18.2.el7.x86_64  
Operating System: CentOS Linux 7 (Core)  
OSType: linux  
Architecture: x86_64  
CPUs: 4  
Total Memory: 7.625 GiB  
Name: grtdocker01.grt.local  
ID: AUCR:OSG7:L55S:OUSY:RIC2:5Z3N:GUHO:6FY5:KY5D:4XMW:XVGE:OS4W  
Docker Root Dir: /var/lib/docker  
Debug mode (client): false  
Debug mode (server): false  
Registry: https://index.docker.io/v1/  
WARNING: bridge-nf-call-iptables is disabled  
WARNING: bridge-nf-call-ip6tables is disabled  
```

#### Docker Search

The docker search command is used to search Docker Hub for images.

```bash
core@coreos03 ~ $ docker search tomcat  
NAME                    DESCRIPTION                                     STARS     OFFICIAL   AUTOMATED  
tomcat                  Apache Tomcat is an open source implementa...   170       [OK]  
tutum/tomcat            Tomcat image - listens in port 8080. For t...   39                   [OK]  
consol/tomcat-7.0       Tomcat 7.0.57, 8080, "admin/admin"              12                   [OK]  
consol/tomcat-8.0       Tomcat 8.0.15, 8080, "admin/admin"              10                   [OK]  
consol/tomcat-6.0       Tomcat 6.0.43, 8080, "admin/admin"              6                    [OK]  
dordoka/tomcat          Ubuntu 14.04, Oracle JDK 8 and Tomcat 8 ba...   4                    [OK]  
cloudesire/tomcat       Tomcat server 6/7/8 with oracle java 7/8 o...   1                    [OK]  
ericogr/tomcat          Tomcat 8.0.23, 8080, "docker/docker"            1                    [OK]  
liferay/tomcat          Tomcat version used by Portal bundles (onl...   0                    [OK]  
learninglayers/tomcat                                                   0                    [OK]  
```

#### Docker Pull

The docker pull command is used to pull/download a docker image from Docker hub or another registry.

```bash
core@coreos03 ~ $ docker pull tomcat  
latest: Pulling from tomcat

64e5325c0d9d: Pull complete  
bf84c1d84a8f: Pull complete  
87de57de6955: Pull complete  
e96a900a1f99: Pull complete  
cea65f1f366a: Pull complete  
4302b8c85571: Pull complete  
18915de4c9b5: Pull complete  
82abb7bc23ec: Pull complete  
6416577ab1f9: Pull complete  
30d3aa5cd1ab: Pull complete  
c38e3be299d7: Pull complete  
5b52f9536b25: Pull complete  
20a4f100dbfe: Pull complete  
78385a28b88c: Pull complete  
a8fa88caa27d: Pull complete  
70f5cd177182: Pull complete  
46e30d8fbae8: Pull complete  
f7ad3bbb1c50: Pull complete  
cb8603fe47ec: Already exists  
tomcat:latest: The image you are pulling has been verified.  
Important: image verification is a tech preview feature and should not be relied on to provide security.

Digest: sha256:848f3114260a02bacbd2495f30fb55264cc8271dc4ac4e3a8f2e7a052088ea07  
Status: Downloaded newer image for tomcat:latest  
```

#### Docker Images

The docker images command is used to view the docker images that are on the system.

```bash
core@coreos03 ~ $ docker images  
REPOSITORY          TAG                 IMAGE ID            CREATED             VIRTUAL SIZE  
tomcat              latest              cb8603fe47ec        10 days ago         347.8 MB  
```

#### Docker Inspect

The docker inspect command is used to view detailed information about a container.

```bash
core@coreos03 ~ $ docker inspect tomcat  
[{
    "Architecture": "amd64",
    "Author": "",
    "Comment": "",
    "Config": {
        "AttachStderr": false,
        "AttachStdin": false,
        "AttachStdout": false,
        "Cmd": [
            "catalina.sh",
            "run"
        ],
        "CpuShares": 0,
        "Cpuset": "",
        "Domainname": "",
        "Entrypoint": null,
        "Env": [
            "PATH=/usr/local/tomcat/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "LANG=C.UTF-8",
            "JAVA_VERSION=7u79",
            "JAVA_DEBIAN_VERSION=7u79-2.5.5-1~deb8u1",
            "CATALINA_HOME=/usr/local/tomcat",
            "TOMCAT_MAJOR=8",
            "TOMCAT_VERSION=8.0.23",
            "TOMCAT_TGZ_URL=https://www.apache.org/dist/tomcat/tomcat-8/v8.0.23/bin/ 
             apache-tomcat-8.0.23.tar.gz"
        ],
        "ExposedPorts": {
            "8080/tcp": {}
        },
        "Hostname": "6c732c6044b7",
        "Image": "f7ad3bbb1c50434bb0c84c53492f342205b65c65d06945d063e5b17121d0d4c5",
        "Labels": {},
        "MacAddress": "",
        "Memory": 0,
        "MemorySwap": 0,
        "NetworkDisabled": false,
        "OnBuild": [],
        "OpenStdin": false,
        "PortSpecs": null,
        "StdinOnce": false,
        "Tty": false,
        "User": "",
        "Volumes": null,
        "WorkingDir": "/usr/local/tomcat"
    },
    "Container": "be30c700ecba2c2b79ff74e285fed908c4d7999439dbd2930520d43192ddd194",
    "ContainerConfig": {
        "AttachStderr": false,
        "AttachStdin": false,
        "AttachStdout": false,
        "Cmd": [
            "/bin/sh",
            "-c",
            "#(nop) CMD ["catalina.sh" "run"]"
        ],
        "CpuShares": 0,
        "Cpuset": "",
        "Domainname": "",
        "Entrypoint": null,
        "Env": [
            "PATH=/usr/local/tomcat/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "LANG=C.UTF-8",
            "JAVA_VERSION=7u79",
            "JAVA_DEBIAN_VERSION=7u79-2.5.5-1~deb8u1",
            "CATALINA_HOME=/usr/local/tomcat",
            "TOMCAT_MAJOR=8",
            "TOMCAT_VERSION=8.0.23",
            "TOMCAT_TGZ_URL=https://www.apache.org/dist/tomcat/tomcat-8/v8.0.23/bin/
            apache-tomcat-8.0.23.tar.gz"
        ],
        "ExposedPorts": {
            "8080/tcp": {}
        },
        "Hostname": "6c732c6044b7",
        "Image": "f7ad3bbb1c50434bb0c84c53492f342205b65c65d06945d063e5b17121d0d4c5",
        "Labels": {},
        "MacAddress": "",
        "Memory": 0,
        "MemorySwap": 0,
        "NetworkDisabled": false,
        "OnBuild": [],
        "OpenStdin": false,
        "PortSpecs": null,
        "StdinOnce": false,
        "Tty": false,
        "User": "",
        "Volumes": null,
        "WorkingDir": "/usr/local/tomcat"
    },
    "Created": "2015-06-17T09:43:56.815855333Z",
    "DockerVersion": "1.6.2",
    "Id": "cb8603fe47ec8fb30fe333e5bbf3cf17ddb945343713a5fc377ad8f85ab29b9d",
    "Os": "linux",
    "Parent": "f7ad3bbb1c50434bb0c84c53492f342205b65c65d06945d063e5b17121d0d4c5",
    "Size": 0,
    "VirtualSize": 347787355
}
]
```

#### Docker Run

The docker run command is used to start a docker container.

```bash
core@coreos03 ~ $ docker run -d --name=tomcatserver -p 8080:8080 tomcat  
7ed9431710611b301ee9a50e3afc3f3fd8ce3486e9d00cbae06821d3bffb1007  
```

#### Docker PS

The docker ps command is used to view running containers.

```bash
core@coreos03 ~ $ docker ps  
CONTAINER ID        IMAGE               COMMAND  
7ed943171061        tomcat:latest       "catalina.sh run" 

CREATED             STATUS              PORTS                    NAMES  
33 seconds ago      Up 32 seconds       0.0.0.0:8080->8080/tcp   tomcatserver  
```

#### Docker Stop

The docker stop command is used to stop a running container.

```bash
core@coreos03 ~ $ docker stop tomcatserver  
```

#### Docker Logs

The docker logs command is used to view log data from a container.

```bash
core@coreos03 ~ $ docker logs tomcatserver  
Server version:        Apache Tomcat/8.0.23  
Server built:          May 19 2015 14:58:38 UTC  
Server number:         8.0.23.0  
OS Name:               Linux  
OS Version:            4.0.3  
Architecture:          amd64  
Java Home:             /usr/lib/jvm/java-7-openjdk-amd64/jre  
JVM Version:           1.7.0_79-b14  
JVM Vendor:            Oracle Corporation  
CATALINA_BASE:         /usr/local/tomcat  
CATALINA_HOME:         /usr/local/tomcat  
Command line argument: -Dcatalina.base=/usr/local/tomcat  
Command line argument: -Dcatalina.home=/usr/local/tomcat  
Command line argument: -Djava.io.tmpdir=/usr/local/tomcat/temp  
Server startup in 598 ms  
```

#### Docker stats

The docker stats command is an interactive tool for viewing performance data about running containers.

```bash
CONTAINER           CPU %               MEM USAGE/LIMIT       MEM %               NET I/O  
tomcatserver        0.15%               124.3 MiB/1.943 GiB   6.25%               1.512 KiB/648 B  
```

### References:

[https://docs.docker.com/engine/reference/commandline/cli/](https://docs.docker.com/engine/reference/commandline/cli/)
