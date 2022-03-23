---
title: "Advanced VMware vSphere Template Orchestration"
date: "2019-08-06"
image: ""
author: "Martez Reed"
tags: ["StackStorm","VMware","DevOps"]
categories: ["StackStorm"]
draft: false
---

Template management is a critical facet of infrastructure management and traditionally one of the more challenging operations there is. The advent of tools like HashiCorp Packer have provided administrators with the ability declaratively automate the template creation process.

Automation is great but in most organizations a single piece of automation is part of a larger process that includes tickets and potentially other hand offs.

In this example we'll walk through creating a process for creating VMware vSphere machine templates in a fully automated fashion with deep integrations with other tools for documenting and testing the created template.

The code for this example can be found in the following GitHub repositories.

The StackStorm pack that contains the orchestration workflow: [https://github.com/martezr/stackstorm-grtlab](https://github.com/martezr/stackstorm-grtlab)

The Terraform and Packer code: [https://github.com/martezr/orchestration-demos](https://github.com/martezr/orchestration-demos)

#### Tools

The orchestration detailed in this example contains a number of tools that are covered below.

###### [StackStorm](https://stackstorm.com/)

StackStorm is an open source orchestration tool with numerous integrations with third-party tools for simplifying the creation of complex orchestration workflows. StackStorm will drive the orchestration in this example and handle all of the hand offs.

###### [Github](https://www.github.com)

Github is used for storing all of the code used in this example and is where StackStorm will fetch code from.

###### [ServiceNow](https://www.servicenow.com/)

ServiceNow is an ITSM or IT Service Management platform that we'll use for incident management and as a CMDB in our example.

###### [Jenkins](https://jenkins.io/)

Jenkins is a continuous integration (CI) server typically used for testing and building code. In our example Jenkins will be used for validating our deployed code. This shows how the workflow could incorporate tests that may already exist that are created by the applications developers or QA team. This helps to reduce potential issues created by base template updates

###### [ServerSpec](https://serverspec.org/)

ServerSpec is a Ruby based testing framework that I being used for acceptance testing in our example. A few simple tests are being run but it shows how the integration can provide tremendous value.

###### [HashiCorp Packer](https://www.packer.io/)

Packer is a tool for defining a template in a declarative manner via a JSON file.

###### [HashiCorp Terraform](https://www.terraform.io/)

Terraform is used to provision the virtual machine that is used for validating that the new template doesn't break any downstream applications.

#### Stages

![title image](images/advanced_vmware_vsphere_template_orchestration_title-1024x593.png)

The high level stages of the orchestration displayed in the image below are detailed below along with the StackStorm code for each stage.

![](images/advanced_vmware_vsphere_template_stackstorm-1024x560.png)

##### Create Incident

This first stage of the workflow is to create an incident in ServiceNow for the new template. The goal of this stage is integrating with ServiceNow to provide a record of what is being done as part of the automated template creation process. The StackStorm code below shows that we're creating a new record in the incident table and providing some metadata about the incident such as the description and the submitter.

Once the record has been created in the incident table we are storing the sysid of the ServiceNow incident in the incident_id variable for use later when we resolve the incident. Additionally we're specifying the next stage of the workflow which cleaning up any existing clones of our code git repo.

```yaml
create_incident:
  action: servicenow.create_record
  input:
    table: "incident"
    payload: {"short_description":"CentOS 7 Monthly Image Update","category":"software","description":"Updating CentOS 7 template","caller_id":"stackstorm"}
  next:
    - when: <% succeeded() %>
      publish: incident_id=<% result().result.sys_id %>
      do: cleanup_git_repo
```

The screenshot below displays a new incident created by the orchestration to track the work performed during this process and align with change management processes.

![](images/advanced_vmware_vsphere_template_new_incident-1024x560.png)

##### Clone Github Repo

The second stage of the workflow cleans up any existing copy of the Github repository and clones the Github repository that contains the Packer template code as well as the Terraform code used for testing the newly created template.

```yaml
cleanup_git_repo:
  action: linux.rm
  input:
    target: /stackstorm/orchestration-demos
    recursive: True
    sudo: True
    hosts: localhost
  next:
    - when: <% succeeded() %>
      do: clone_build_repo
```

Once the local copy of the repo is removed then a clone operation is performed.

```yaml
clone_build_repo:
  action: git.clone
  input:
    source: https://github.com/martezr/orchestration-demos.git
    destination: /stackstorm/orchestration-demos
    hosts: localhost
  next:
    - when: <% succeeded() %>
      do: create_template
```

##### Build Template

The third stage of the workflow builds the VMware vSphere template from an ISO image using HashiCorp Packer and the Jetbrains vSphere Packer plugin.

The Packer JSON file is hosted in the cloned GitHub repository and the variable file that contains sensitive information is stored on the filesystem of the StackStorm host. This data could be retrieved in a more secure fashion such as retrieved from HashiCorp Vault or StackStorm's encrypted data storage.

```yaml
create_template:
  action: packer.build
  input:
    packerfile: /stackstorm/orchestration-demos/packer/centos7base.json
    variables_file: /stackstorm/packer-vars.json
  next:
    - when: <% succeeded() %>
      do: provision_test_stack
```

##### Provision Test Stack

The fourth stage of the workflow provisions a VMware vSphere virtual machine based on the previously created template and configures it using Puppet via the Terraform Puppet Provisioner.

In a real world example this might be an entire application stack owned by another team that consumes the template. This provides tighter integration to help prevent breaking changes from being propogated.

```yaml
provision_test_stack:
  action: terraform.pipeline
  input:
    variable_files: ["/stackstorm/vsphere.auto.tfvars"]
    plan_path: /stackstorm/orchestration-demos/terraform/teststack
    backend: {"path":"/stackstorm/terraform.tfstate"}
  next:
    - when: <% succeeded() %>
      do: output_test_stack_info
```

##### Validate Test Stack

The fifth stage of the workflow is run some validation tests against the stack. These tests might be tests provided by teams that own applications that are built on the base template. In this example StackStorm executes a defined job in Jenkins that runs some ServerSpec tests.

```yaml
validate_test_stack:
  action: jenkins.build_job_wait
  input:
    project: "validate_teststack"
    parameters: {"target":"<% ctx().ip_address %>"}
  next:
    - when: <% succeeded() %>
      do: destroy_test_stack
    - when: <% failed() %>
      do: destroy_test_stack
```

The screenshot below displays the console output of the Jenkins job that was run to perform the validation of the test virtual machine provisioned by Terraform.

![](images/advanced_vmware_vsphere_template_jenkins-1024x561.png)

##### Destroy Test Stack

The sixth stage of the workflow is to tear down the virtual machine used for testing the updates to the base template. Since Terraform was used to provision the virtual machine we'll just run a Terraform Destroy to tear it down.

```yaml
destroy_test_stack:
  action: terraform.destroy
  input:
    variable_files: ["/stackstorm/vsphere.auto.tfvars"]
    plan_path: /stackstorm/orchestration-demos/terraform/teststack
    state_file_path: "/stackstorm/terraform.tfstate"
  next:
    - when: <% succeeded() %>
      do: create_cmdb_record
```

##### Fetch Template Metadata

The seventh stage of the workflow is to fetch the metadata for the template such as the hardware specifications to input them into the CMDB in ServiceNow. The Packer JSON is just being outputted via the cat command but a custom script for parsing file or fetching the data directly from vCenter would provide a more robust solution. The output is being stored in the template_data variable.

```yaml
get_template_data:
  action: core.local
  input:
    cmd: cat /stackstorm/orchestration-demos/packer/centos7base.json
  next:
    - when: <% succeeded() %>
      publish: template_data=<% result().stdout.builders[0] %>
      do: create_cmdb_record
```

##### Create CMDB Entry

The eighth stage of the workflow is creating a record in the CMDB for the new vSphere template. The payload contains metadata about the template that we defined in the previous stage and made available to this stage with the publish declaration.

```yaml
create_cmdb_record:
  action: servicenow.create_record
  input:
    payload: {"name":"<% ctx().template_name %>","description":"CentOS 7 Demo Template","guest_os":"<% ctx().template_data.guest_os_type %>","cpus":"<% ctx().template_data.CPUs %>","memory":"<% ctx().template_data.RAM %>","disk_size":"<% ctx().template_data.disk_size %>","object_id":"1"}
    table: "cmdb_ci_vmware_template"
  next:
    - when: <% succeeded() %>
      do: close_incident
```

The screenshot below displays the CMDB record for the template created by the orchestration.

![](images/advanced_vmware_vsphere_template_cmdb-1024x560.png)

##### Close Incident

The nineth and final stage of the workflow is to close or resolve the incident in ServiceNow. This stage closes the loop on the change in ServiceNow with the template successfully being created. In the example we're passing the incident_id variable that was returned from the very first stage in the workflow along with providing the state of "6" which is resolved and the required fields of code and notes.

```yaml
close_incident:
  action: servicenow.update
  input:
    table: "incident"
    sysid: <% ctx().incident_id %>
    payload: {"state":"6", "close_code": "Solved (Permanently)", "close_notes": "Created  <% ctx().template_name %> template"}
```

The screenshot below displays the incident created by the first stage of the orchestration now in a "resolved" state due to closing out the incident as part of the orchestration.

![](images/advanced_vmware_vsphere_template_closed_incident-1-1024x561.png)

This example could be extended much further to include additional systems and stages.

This example shows just some of the possibilities of creating advanced orchestration with a tool like StackStorm.
