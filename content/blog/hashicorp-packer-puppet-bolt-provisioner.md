---
title: "HashiCorp Packer Puppet Bolt Provisioner"
date: "2019-08-14"
image: ""
author: "Martez Reed"
tags: ["HashiCorp","Puppet","Bolt","Packer"]
categories: ["Packer"]
draft: false
---


Treating workloads as "cattle" or immutable is a popular management paradigm for stateless workloads and is especially prevalent for such workloads that are hosted in a public cloud. The concept is based upon the notion that servers are pre-baked with all of the software that is needed for the application and any stateful data is pushed to an external persistent storage mechanism such as an object storage or a message queue. There's a number of methods for accomplishing the pre-baking that includes the configuration and installation of software on the templates that will be used for immutable servers.

In this post we’ll use HashiCorp Packer and Puppet Bolt to create a VMware vSphere template that contains a specific version of HashiCorp Consul that we can use for immutable upgrades or potential rollbacks. The plugin also works for other Packer builders but vSphere will be covered in this post.

### Puppet Bolt

Puppet Bolt will be used in this example to enable the creation of our pre-baked template without the need for a Puppet master. To simplify the integration between Packer and Puppet Bolt we'll use an unofficial Packer Puppet Bolt provisioner ([https://github.com/martezr/packer-provisioner-puppet-bolt](https://github.com/martezr/packer-provisioner-puppet-bolt)) that I've developed. We'll take a look at the integration once we get to the HashiCorp Packer section of this blog post but first we need to set up Bolt to enable us to install Consul on the template.

In our example we'll use the Consul module available on the Puppet forge (https://forge.puppet.com/KyleAnderson/consul) to install HashiCorp Consul. Since we'll be using the module we need to add it to the Puppetfile we're using for Puppet Bolt along with the module it requires.

#### Bolt Configuration

The following steps will install and configure Puppet Bolt.

**Install the Puppet Bolt repo**

Add the Puppet repo to the system, install bolt and create the Bolt directory.

```bash
sudo rpm -Uvh https://yum.puppet.com/puppet6/puppet6-release-el-7.noarch.rpm
sudo yum install -y puppet-bolt
mkdir -p ~/.puppetlabs/bolt/
```

**Create Puppet Bolt Configuration File**

This step creates a Puppet Bolt global configuration file that the Terraform Puppet provisioner uses for the Bolt process.

```bash
cat << EOF > ~/.puppetlabs/bolt/bolt.yaml
modulepath: "~/.puppetlabs/bolt-code/modules:~/.puppetlabs/bolt-code/site-modules"
inventoryfile: "~/.puppetlabs/bolt/inventory.yaml"
concurrency: 10
format: human
ssh:
  host-key-check: false
  user: root
EOF
```

**Create Puppet Bolt Inventory File**

The Terraform Puppet provisioner targets the Puppet master specified in the Terraform code but Bolt needs additional information for connecting to the Puppet master such as user credentials.

```bash
cat << EOF > ~/.puppetlabs/bolt/inventory.yaml
---
config:
  ssh:
    host-key-check: false
    user: root
EOF
```

**Bolt Puppetfile**

This step creates a Bolt Puppetfile for installing the two Puppet modules required by the Terraform Puppet provisioner.

# Modules from the Puppet Forge.
mod 'KyleAnderson-consul', '5.1.0'
mod 'puppetlabs-stdlib', '5.2.0'
mod 'puppet-archive', '3.2.1'
mod 'camptocamp-systemd', '2.6.0'
mod 'puppetlabs-powershell', '2.3.0'

**Bolt Plan**

We're going to create a custom plan for installing HashiCorp Consul using the module from the forge. The first thing we need to do is create the module structure in our Bolt directory.

```bash
mkdir -p ~/.puppetlabs/bolt-code/site-modules/bolt_consul/plans
```

With the directory structure in place we just need to create our Puppet manifest file (install.pp) in the "plans" directory with the code below.

```puppet
plan bolt_consul::install(
  TargetSpec $nodes,
  String $version,
) {
  # Ensure puppet tools are installed and gather facts for the apply
  apply_prep([$nodes])

  apply($nodes) {
    package { 'unzip':
      ensure => present,
    }

    class { '::consul':
      version          => $version,
      config_hash => {
        'bootstrap_expect' => 1,
        'client_addr'      => '0.0.0.0',
        'data_dir'         => '/opt/consul',
        'datacenter'       => 'east-aws',
        'log_level'        => 'INFO',
        'node_name'        => 'server',
        'server'           => true,
        'ui'               => true,
      }
    }

    $puppet_packages = [ 'puppet-agent', 'puppet-release' ]
    package { $puppet_packages:
      ensure => absent,
    }
  }
}
```

Once the manifest has been created the Bolt directory structure should look similar to that below.

```bash
[root@centos7base ~]# tree -L 3 ~/.puppetlabs/
/root/.puppetlabs/
├── bolt
│   ├── analytics.yaml
│   ├── bolt.yaml
│   ├── inventory.yaml
│   └── Puppetfile
└── bolt-code
    ├── modules
    │   ├── archive
    │   ├── consul
    │   ├── powershell
    │   ├── stdlib
    │   └── systemd
    └── site-modules
        └── bolt_consul

10 directories, 4 files
```

### HashiCorp Packer

In this example we'll use an existing vSphere template as our base template. The template only contains standard OS configurations and we'll use the combination of Packer and Bolt to create our Consul specific template. The following are the tasks we'll need to accomplish to setup Packer.

- Download the latest version of HashiCorp Packer from releases.hashicorp.com
- Download the latest version of the Jetbrains vSphere Packer plugin
- Download the latest version of the Puppet Bolt Packer provisioner plugin
- Create Packer template JSON file

**Install HashiCorp Packer**

```bash
wget https://releases.hashicorp.com/packer/1.4.2/packer_1.4.2_linux_amd64.zip && unzip packer_1.4.2_linux_amd64.zip && chmod +x packer
```

**Install the Puppet Bolt Packer provisioner plugin**

```bash
wget https://github.com/martezr/packer-provisioner-puppet-bolt/releases/download/v0.1.0/packer-provisioner-puppet-bolt_0.1.0_Linux_x86_64.tar.gz && tar -xzf packer-provisioner-puppet-bolt_0.1.0_Linux_x86_64.tar.gz 
```

**Install the Jetbrains Packer vSphere builder plugin**

```bash
wget https://github.com/jetbrains-infra/packer-builder-vsphere/releases/download/v2.3/packer-builder-vsphere-clone.linux
```

**Packer Template**

The Packer template below shows the integration provided by the Puppet Bolt plugin.

```json
{
  "variables": {
    "vsphere_password": "",
    "ssh_password": ""
  },
  "builders": [
    {
      "type": "vsphere-clone",
      "vcenter_server":      "10.0.0.205",
      "username":            "administrator@vsphere.local",
      "password":            "{{user `vsphere_password`}}",
      "insecure_connection": "true",
      "template": "centos7base",
      "vm_name":  "boltpackdemo",
      "cluster": "GRT-Cluster",
      "host": "10.0.0.246",
      "communicator": "ssh",
      "ssh_username": "root",
      "ssh_password": "{{user `ssh_password`}}"
    }
  ],
  "provisioners": [
    {
      "type": "puppet-bolt",
      "user": "root",
      "bolt_plan": "bolt_consul::install",
      "bolt_params": {
        "version": "1.5.3"
      }
    }
  ]
}
```

With the Packer template file create we just need to run the build command to provision the vSphere template using Packer.

```bash
./packer build -var 'vsphere_password=password' -var 'ssh_password=password' bolt.json
```

The build should produce output similar to that below and shows how Bolt is being executed against the template machine.

![](images/bolt_packer_1-1024x393.png)

Once the build process has been completed we should have a pre-baked HashiCorp Consul server. We can provision a new virtual machine based upon the template and see that consul is already installed by browsing to the Consul web interface (http://ip_address:8500) in a web browser.

![](images/bolt_packer_2-1024x562.png)

The provisioner plugin currently only supports Linux workloads and Windows support will be added in a future release.

### References

**Consul Puppet Module**

https://forge.puppet.com/KyleAnderson/consul

**Packer Puppet Bolt Provisioner Plugin**

https://github.com/martezr/packer-provisioner-puppet-bolt

**Jetbrains Packer vSphere Builder Plugin**

https://github.com/jetbrains-infra/packer-builder-vsphere
