---
title: "vSphere Alarms with Slack and StackStorm"
date: "2017-02-03"
draft: false
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/vsphere_alarms_with_slack_and_stackstorm/stackstorm_vsphere_slack_05.png"
author: "Martez Reed"
tags: ["DevOps", "StackStorm","VMware"]
categories: ["StackStorm"]
---

Being notified of when something happens in your environment has always been important and has evolved over time from basic emails to IM messages via tools like Slack.

This post will cover posting alarm information to Slack via StackStorm. In addition post alarm information to Slack we can take autoremediation actions in response to alarms which we'll cover in later posts.

#### Generate API Key

In order for our vSphere instance to communicate with StackStorm we need to provide vSphere with some way of authenticating to our StackStorm server. The solution is to create an API key that our script will use to connect to StackStorm.

```bash
st2 apikey create -k -m '{"used_by": "vsphere_alarms"}'  
MTk4ZThiZWM3ZTc0ZWI0N2UxNDMzZGExOWZjNw  
```

#### Create Custom StackStorm Webhook

Now we'll create our webhook to allow vSphere to communicate with StackStorm. We'll create go ahead and rule which will also handle the creation of our webhook.

We'll name our rule **vsphere_alarm_slack** and we'll place it in the default pack.

/opt/stackstorm/packs/default/rules/vsphere_alarm_slack.yaml

```yaml
---
  name: "vsphere_alarm_slack"
  pack: "default"
  description: "Post vSphere alarms to Slack"
  enabled: true

  trigger:
    type: "core.st2.webhook"
    parameters:
      url: "vsphere"

  action:
    ref: "chatops.post_message"
    parameters:
        message: "Alarm Name: {{trigger.body.alarm_name}}n 
      Alarm ID: {{trigger.body.alarm_id}}n  
      Alarm Target: {{trigger.body.alarm_target_name}}n 
      Alarm Description: {{trigger.body.alarm_description}}"
        channel: "vsphere"
```

This configuration assumes that chatops has been configured to allow StackStorm to post to Slack.

#### Create vSphere Script

With StackStorm configured we can now dig into creating our script to call the webhook from our VCSA when the alarm is triggered.

SSH to the vCenter Appliance

```bash
ssh root@vcenterappliance  
```

Enable the command shell

```bash
shell.set --enabled True  
```

Access the command shell

```bash
shell  
```

We'll create a scripts directory to store our scripts.

```bash
mkdir /root/scripts  
```

Now we can create our script

/root/scripts/alarm.sh

The environment variables are just a few key ones that have been picked from the entire list available that can be found [here](https://pubs.vmware.com/vsphere-60/index.jsp?topic=%2Fcom.vmware.vsphere.monitoring.doc%2FGUID-5F5932FA-71FA-473E-8776-92B00742D566_copy.html)

```bash
#!/bin/bash

# environment variables
alarm_name=$VMWARE_ALARM_NAME  
alarm_id=$VMWARE_ALARM_ID  
alarm_target_name=$VMWARE_ALARM_TARGET_NAME  
alarm_description=$VMWARE_ALARM_EVENTDESCRIPTION

# Trigger StackStorm Web Hook
curl -k -X POST https://stackstorm01.grt.local/api/v1/webhooks/vsphere   
-H "St2-Api-Key: MTk4ZThiZWM3ZTc0ZWI0N2UxNDMzZGExOWZjNw" 
-H "Content-Type: application/json" 
--data '{"alarm_name": "value1", "alarm_id": "value2",
 "alarm_target_name": "value3", "alarm_description": "value4"}'
```

## Create vSphere Alarm

The last step is for us to create the vSphere alarm that we'll be notified of via Slack. Of course we could use an existing alarm as well.

Click the green plus from the "Manage > Alarm Definitions" section of the VM we want to test with.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vsphere_alarms_with_slack_and_stackstorm/stackstorm_vsphere_slack_01.png)

We'll give the alarm a name of "stackstorm_notify" and select "specific event occuring on this object, for example VM Power On" from the change the "Monitor for:" section.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vsphere_alarms_with_slack_and_stackstorm/stackstorm_vsphere_slack_02.png)

Click the green plus and select "VM powered off" from the drop-down list of event options under the "Trigger if ANY of the following events occur:" section.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vsphere_alarms_with_slack_and_stackstorm/stackstorm_vsphere_slack_03.png)

Click the green plus and select **"Run a command"** from the action drop-down list. Add the path of our vSphere script in the **"Configuration field"** and select **"Once"** from the yellow to red section.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vsphere_alarms_with_slack_and_stackstorm/stackstorm_vsphere_slack_04.png)

Now that our rule and webhook have been created let's go ahead and test our Alarm by powering off our VM. If everything has been configured correctly we get a fancy message in Slack regarding the alarm.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vsphere_alarms_with_slack_and_stackstorm/stackstorm_vsphere_slack_05.png)

This is just a basic example of the value that StackStorm can bring to a vSphere environment.

## References

vSphere Alarm Environment Variables  
[https://pubs.vmware.com/vsphere-60/index.jsp?topic=%2Fcom.vmware.vsphere.monitoring.doc%2FGUID-5F5932FA-71FA-473E-8776-92B00742D566_copy.html](https://pubs.vmware.com/vsphere-60/index.jsp?topic=%2Fcom.vmware.vsphere.monitoring.doc%2FGUID-5F5932FA-71FA-473E-8776-92B00742D566_copy.html)

VirtuallyGhetto - How to run a script on VCSA  
[http://www.virtuallyghetto.com/2016/06/how-to-run-a-script-from-a-vcenter-alarm-action-in-the-vcsa.html](http://www.virtuallyghetto.com/2016/06/how-to-run-a-script-from-a-vcenter-alarm-action-in-the-vcsa.html)

StackStorm Authentication  
[https://docs.stackstorm.com/authentication.html](https://docs.stackstorm.com/authentication.html)

StackStorm Webhooks  
[https://docs.stackstorm.com/webhooks.html](https://docs.stackstorm.com/webhooks.html)
