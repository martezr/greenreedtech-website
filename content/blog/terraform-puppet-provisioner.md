---
title: "Terraform Puppet Provisioner"
date: "2019-07-10"
image: ""
author: "Martez Reed"
tags: ["Puppet","Terraform","HashiCorp","DevOps"]
categories: ["Puppet","Terraform"]
draft: false
---

HashiCorp Terraform 0.12.2 added official support for a Puppet provisioner. One caveat is that the provisioner is only available in 0.12.x of Terraform. The provisioner provides a number of features such as adding data to the CSR for trusted facts, selecting between open source and enterprise agent versions along with autosigning the CSR.

In this post we'll use the Terraform vSphere provisioner to provision a CentOS virtual machine. The provisioner autosign feature will be used for automatically signing the CSR on the Puppet master.

## Workstation Setup

The first thing we to do is setup our machine to deploy the virtual machine. Terraform and Puppet Bolt are what is needed for the setup.

### Terraform Installation

HashiCorp Terraform is a Golang binary that just needs to be downloaded and added to the path on the system. The latest version of HashiCorp Terraform can be downloaded from the following link.

[https://www.terraform.io/downloads.html](https://www.terraform.io/downloads.html)

### Puppet Bolt Installation

Puppet Bolt is used by the Puppet provisioner to bootstrap the Puppet agent on the virtual machine being provisioned.

**Install the Puppet Bolt repo**

Add the Puppet repo to the system

```bash
sudo rpm -Uvh https://yum.puppet.com/puppet6/puppet6-release-el-7.noarch.rpm
```

**Install Puppet Bolt**

Install Puppet Bolt using yum

```bash
sudo yum install -y puppet-bolt
```

**Create Bolt Directory**

Create a directory for the Puppet Bolt configuration

```bash
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
  private-key: ~/.ssh/bolt_id 
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
    private-key: ~/.ssh/bolt_id
EOF
```

**Create Bolt Puppetfile**

This step creates a Bolt Puppetfile for installing the two Puppet modules required by the Terraform Puppet provisioner.

```bash
cat << EOF > ~/.puppetlabs/bolt/Puppetfile
# Modules from the Puppet Forge.
mod 'danieldreier/autosign'
mod 'puppetlabs/puppet_agent'
EOF
```

**Install Bolt Puppet Modules**

This step installs the Puppet modules specified in the Puppetfile from the previous step.

```bash
bolt puppetfile install
```

## Puppet Master Configuration

With the workstation configured we now need to configure the Puppet master to support the policy based autosign method supported by the Terraform Puppet provisioner.

**Install the autosign ruby gem**

This step installs the autosign (https://github.com/danieldreier/autosign) gem that our Puppet master will use for signing the certificate request.

```bash
/opt/puppetlabs/puppet/bin/gem install autosign
```

**Create a new directory for autosign**

Create a directory for the autosign installation.

```bash
mkdir /var/autosign
```

**Update permissions on the autosign directory**

The permissions for the autosign directory need to be updated to allow the Puppet server service to access the directory.

```bash
chown pe-puppet:pe-puppet /var/autosign
```

```bash
chmod 750 /var/autosign
```

**Create autosign log file**

Create a log file for the autosign binary to log events.

```bash
touch /var/log/autosign.log
```

**Update permissions on the autosign log file**

The permissions on the autosign log file need to be updated to allow it to be written to when the Puppet server attempts to autosign the CSR.

```bash
chown pe-puppet:pe-puppet /var/log/autosign.log
```

**Setup the autosign gem**

```bash
/opt/puppetlabs/puppet/bin/autosign config setup
```

The autosign setup creates a configuration file "/etc/autosign.conf" that needs to be modified. We need to ensure that the **journalfile** is configured for "/var/autosign/autosign.journal".

```yaml
---
general:
  loglevel: warn
  logfile: "/var/log/autosign.log"
jwt_token:
  secret: 1s79TOyqMHw3zfKhE1h+1feKMaE=
  validity: '7200'
  journalfile: "/var/autosign/autosign.journal"
```

_**The CSR will contain an invalid challenge password if the loglevel is set to debug**_

With the loglevel set to debug additional debug lines will be added to the challenge password in the CSR which causes the autosign process to fail.

**Set Puppet master autosigning**

The Puppet master configuration file needs to be updated to use the autosign gem as the executable/binary to run when validating CSRs.

```bash
puppet config set --section master autosign /opt/puppetlabs/puppet/bin/autosign-validator
```

**Restart the Puppet Server Service**

Restart the Puppet server service for the changes to take effect.

```bash
systemctl restart pe-puppetserver
```

The Puppet master is now configured for autosigning certificate requests from the Puppet provisioner.

## Terraform

With all of the setup complete we can focus on the Terraform code for provisioning our CentOS 7 virtual machine and using the new Puppet provisioner to integrate it with our Puppet master.

The Puppet provisioner resource block includes a number of configuration options that are covered in greater detail in the documentation but we'll look at the ones that were used in this example.

**server:** The FQDN or IP address of the Puppet master

**server_user:** The name of the user on the Puppet master that the provisioner will connect as

**autosign:** The Puppet provisioner includes code that leverages Puppet Bolt as well as policy based autosigning to automatically sign the nodes SSL certificate on the Puppet master

**open_source:** Whether to use the open source version of the Puppet agent or the enterprise version

**certname:**  The CN for the agent's SSL certificate

**extension_requests:** A map of [extension requests](https://puppet.com/docs/puppet/latest/ssl_attributes_extensions.html#concept-932) to be embedded in the certificate signing request before it is sent to the Puppet master CA. In our example we're passing data to set the pp_role trusted fact that defines the role of the virtual machine.

**connection:** Standard Terraform provisioner connection details for connecting to the virtual machine via SSH or WinRM.

### Example Code

The following code is the Terraform vSphere virtual machine resource along with the Puppet provisioner used in this example.

```hcl
resource "vsphere_virtual_machine" "puppet-demo" {
  name = "puppet-demo.grt.local"
  num_cpus = 1
  memory = 4096
  resource_pool_id = "${data.vsphere_resource_pool.pool.id}"
  datastore_id = "${data.vsphere_datastore.datastore.id}"

  guest_id = "${data.vsphere_virtual_machine.template.guest_id}"
  scsi_type = "${data.vsphere_virtual_machine.template.scsi_type}"

  network_interface {
  network_id = "${data.vsphere_network.network.id}"
    adapter_type = "${data.vsphere_virtual_machine.template.network_interface_types[0]}"
  }

  disk {
    label = "disk0"
    size = "60"
    eagerly_scrub = "${data.vsphere_virtual_machine.template.disks.0.eagerly_scrub}"
    thin_provisioned = "${data.vsphere_virtual_machine.template.disks.0.thin_provisioned}"
  }

  clone {
    template_uuid = "${data.vsphere_virtual_machine.template.id}"

    customize {
      linux_options {
        host_name = "puppet-demo"
        domain = "grt.local"
      }

      network_interface {
        ipv4_address = "10.0.0.30"
        ipv4_netmask = 24
      }
      dns_server_list = ["10.0.0.200"]
      ipv4_gateway = "10.0.0.1"
    }
  }

  provisioner "puppet" {
    server      = "grtpemaster01.grt.local"
    server_user = "root"
    autosign    = true
    open_source = false
    certname    = "puppet-demo.grt.local"
    extension_requests = {
      pp_role = "demo"
    }
    connection {
      type = "ssh"
      host = "${self.default_ip_address}"
      user = "root"
      password = "${var.root_password}"
    }
  }

  provisioner "remote-exec" {
    when = "destroy"
    inline = [
      "puppet node purge puppet-demo.grt.local",
    ]
    connection {
      type = "ssh"
      host = "grtpemaster01.grt.local"
      user = "root"
      password = "${var.root_password}"
    }
  }
}
```

**Initialize Terraform**

With the Terraform code in place we need to initialize the current working directory to download all of the necessary plugins.

```bash
terraform init
```

**Plan Terraform Run**

Now that the Terraform has been initialized we can plan our Terraform run to see if there are any errors.

```bash
terraform plan
```

**Apply Terraform**

The next step once our plan was successful is to apply our Terraform code and validate that the Puppet provisioner worked.

```bash
terraform apply --auto-approve
```

Once the Terraform apply has completed successfully we should be able to see the new node in the Puppet Enterprise console.

![Terraform Puppet provisioner node entry](images/terraform_puppet_provisioner_1.png)

Additionally we can see in the facts for the node that the "demo" role has been set for the pp_role fact we designated in our Terraform code.

![Terraform Puppet provisioner trusted facts](images/terraform_puppet_provisioner_2.png)

### References

Terraform Puppet Provisioner

[https://www.terraform.io/docs/provisioners/puppet.html](https://www.terraform.io/docs/provisioners/puppet.html)

Daniel Dreier Autosign Gem

[https://github.com/danieldreier/autosign](https://github.com/danieldreier/autosign)
