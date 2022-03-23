---
title: "vRealize Automation 7.2 hardening compliance with vRO and Splunk"
date: "2017-05-01"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_automation_7_2_hardening_compliance_with_vro_and_splunk/vRA72_Hardening_6.png"
categories: ["VMware","vRA"]
tags: ["VMware","vRA","Security","Splunk"]
draft: false
author: "Martez Reed"
---

In this post we'll walk through how we can utilize vRealize Orchestrator and Splunk to determine how compliant our vRA appliance is with the [vRealize Automation 7.2 hardening guide](https://pubs.vmware.com/vrealize-automation-72/topic/com.vmware.ICbase/PDF/vrealize-automation-72-hardening.pdf).

#### vRA 7.2 hardening compliance script

The first task is utilizing a script to check the settings specified in the hardening guide. In our case we're going to generate JSON output from the script in order to easily ingest the data into Splunk. We're utilizing bash to avoid any dependencies upon other packages that aren't part of the default appliance install. The script below has been truncated for brevity and can be found in the github repo ([https://github.com/martezr/vra72-hardening-automation](https://github.com/martezr/vra72-hardening-automation)).

**The script is incomplete and does not cover all the items covered in the hardening guide**.

```bash
#!/bin/bash
# Set host variable as the system hostname
host=$(hostname)  
header="{ "host": "$host", "checks": ["  
checks=""

checknumber="011"  
checkdescription="Use IPv4 TCP Syncookies"

cat /proc/sys/net/ipv4/tcp_syncookies | grep -v 1 > /dev/null 2>&1

if [ $? -eq 1 ]; then  
  check="{"check": "$checknumber","check_description": "$checkdescription","status": "pass"},"
  checks="$checks $check"
  echo "pass"
else  
  check="{"check": "$checknumber","check_description": "$checkdescription","status": "fail"},"
  checks="$checks $check"
  echo "fail"
fi

checknumber="012"  
checkdescription="Deny IPv6 Router Advertisements"

grep [01] /proc/sys/net/ipv6/conf/*/accept_ra|egrep "default|all" | grep -v 0  > /dev/null 2>&1

if [ $? -eq 1 ]; then  
  check="{"check": "$checknumber","check_description": "$checkdescription","status": "pass"},"
  checks="$checks $check"
  echo "pass"
else  
  check="{"check": "$checknumber","check_description": "$checkdescription","status": "fail"},"
  checks="$checks $check"
  echo "fail"
fi

echo "{ "host": "$host", "checks": [${checks::-1}] }"  
```

The script will generate JSON output similar to that below.

```json
{
    "host": "vratest.grt.local",
    "checks": [{
        "check": "011",
        "check_description": "Use IPv4 TCP Syncookies",
        "status": "pass"
    }, {
        "check": "012",
        "check_description": "Deny IPv6 Router Advertisements",
        "status": "fail"
    }, {
        "check": "013",
        "check_description": "Deny IPv6 Router Solicitations",
        "status": "pass"
    }, {
        "check": "014",
        "check_description": "Deny IPv6 Router Preference in Router Solicitations",
        "status": "fail"
    }, {
        "check": "015",
        "check_description": "Deny IPv6 Router Prefix",
        "status": "fail"
    }, {
        "check": "016",
        "check_description": "Deny IPv6 Router Advertisement Hop Limit Settings",
        "status": "fail"
    }, {
        "check": "017",
        "check_description": "Deny IPv6 Router Advertisement Autoconf Settings",
        "status": "fail"
    }, {
        "check": "018",
        "check_description": "Deny IPv6 Neighbor Solicitations",
        "status": "pass"
    }, {
        "check": "019",
        "check_description": "Restrict IPv6 Max Addresses",
        "status": "pass"
    }]
}
```

#### vRO workflow

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_automation_7_2_hardening_compliance_with_vro_and_splunk/vRA72_Hardening_1.png)

The first task in the workflow is to dynamically generate the command to run on the vRA appliance. In this example the script is stored on a web server and one of the workflow inputs is the url of the script.

```javascript
script = 'curl -so script.sh ' + scriptUrl + ' && chmod +x script.sh && sh script.sh; rm script.sh';  
```

The second task is running the generated command against the vRA appliance and capturing the JSON output into an attribute that will later be sent to the Splunk server.

The third task in the workflow is to fetch the FQDN of the VM to be used as the source for Splunk.

```javascript
splunkSource = vm.guest.hostName  
```

The final task in the workflow is to send the JSON output from our compliance script to our Splunk server. For this task we're going to utilize the Splunk REST API to send data to the Splunk server. Before we can post the data we need to setup our REST API endpoint in vRO.

**Library > HTTP-REST > Configuration > Add a REST host**

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_automation_7_2_hardening_compliance_with_vro_and_splunk/vRA72_Hardening_2.png)

Select **"Basic"** host authentication

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_automation_7_2_hardening_compliance_with_vro_and_splunk/vRA72_Hardening_3.png)

We'll select **"Shared Session"** for the session mode and enter in a Splunk user account with the appropriate permissions. Click **"Submit"** to add the REST host.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_automation_7_2_hardening_compliance_with_vro_and_splunk/vRA72_Hardening_4.png)

Now that we've added our REST host we just need to add a REST operation.

**Library > HTTP-REST > Configuration > Add a REST operation**

Select the REST host that we just created as the **"Parent Host"**. Copy and past the **"Template URL"** below which utilizes a variable for the source name that was defined in the previous workflow step.

```bash
/services/receivers/simple?source={sourceName}&sourcetype=web_event
```

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_automation_7_2_hardening_compliance_with_vro_and_splunk/vRA72_Hardening_5.png)

#### Splunk vRA 7.2 compliance dashboard

Now that we've got our compliance data being ingested into our Splunk server let's turn that data into a dashboard to easily make sense of the the data.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vrealize_automation_7_2_hardening_compliance_with_vro_and_splunk/vRA72_Hardening_6.png)

#### References

[https://pubs.vmware.com/vrealize-automation-72/topic/com.vmware.ICbase/PDF/vrealize-automation-72-hardening.pdf](https://pubs.vmware.com/vrealize-automation-72/topic/com.vmware.ICbase/PDF/vrealize-automation-72-hardening.pdf)

[http://theithollow.com/2015/08/27/vrealize-orchestrator-rest-hosts-and-operations-for-rubrik/](http://theithollow.com/2015/08/27/vrealize-orchestrator-rest-hosts-and-operations-for-rubrik/)
