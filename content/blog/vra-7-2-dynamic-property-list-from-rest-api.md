---
title: "vRA 7.2 dynamic property list from REST API"
date: "2017-05-26"
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/vra_7_2_dynamic_property_list_from_rest_api/vRA_Dynamic_Properties_4.png"
author: "Martez Reed"
draft: false
categories: ["VMware","vRA"]
tags: ["VMware","vRA"]
---

In this post we're going to walk through how to dynamically populate a vRA request field using values retrieved from a REST API using vRO.

A common scenario when working with any software is wanting to test against multiple versions of the software.

In this example we're going to dynamically fetch the software version of StackStorm ([https://stackstorm.com/](https://stackstorm.com/)) from github so that we can select which version to install from the vRA request form.

### vRO Action

The first thing we need to do is create our action in vRealize Orchestrator that will dynamically fetch the tags from the StackStorm github repository. Below is the code used for the action, the steps to create an action can be found in a previous post ([http://www.greenreedtech.com/vro-building-a-dynamic-drop-down-for-vsphere-tags/](http://www.greenreedtech.com/vro-building-a-dynamic-drop-down-for-vsphere-tags/)).

From a high level the tasks being performed by the action are as follows.

**Typically a REST Host and REST Operation would be created but I wanted to try and do it all in code.**

- Import the [http://api.github.com](http://api.github.com) SSL certification into the vRO truststore
- Create a transient REST host
- Submit a GET request to [https://api.github.com/repos/StackStorm/st2/tags](https://api.github.com/repos/StackStorm/st2/tags) for the repo tags
- Iterate over the JSON to return just the name field and add it to an array
- Return the array of tags

```javascript
// vRO action to retrieve StackStorm Github repository tags

url = 'https://api.github.com';

// Import SSL certificate
var ld = Config.getKeystores().getImportCAFromUrlAction();  
var model = ld.getModel();  
model.value = url;  
error = ld.execute();

//  Retrieve StackStorm repository tags
var uri = "https://api.github.com/repos/StackStorm/st2/tags";  
var method = "GET";  
var body = "";  
var httpRestHost = null;

//  Create a dynamic REST host:

var restHost = RESTHostManager.createHost("dynamicRequest");  
restHost.operationTimeout = 900;  
httpRestHost = RESTHostManager.createTransientHostFrom(restHost);  
httpRestHost.operationTimeout = 900;

//  Remove the endpoint from the URI:
var urlEndpointSplit = uri.split("/");  
var urlEndpoint = urlEndpointSplit[urlEndpointSplit.length - 1];  
uri = uri.split(urlEndpoint)[0];

httpRestHost.url = uri;  
httpRestHost.hostVerification = false;

//  REST client only accepts method in all UPPER CASE:
method = method.toUpperCase();

var request = httpRestHost.createRequest(method, urlEndpoint, body);  
request.contentType = "application/json";

var response = request.execute();  
jsonResponse = response.contentAsString

var githubTags = [];

tags = JSON.parse(jsonResponse)  
for each (tag in tags){  
  githubTags.push(tag.name);
}

// Return array of tags
return githubTags;  
```

 ### vRA Property Definition

The next task is to create a property definition in vRealize Automation that utilizes the vRO action we just created to present the requestor with a dynamic drop-down list.

Select the "**External Value**" radio button next to "**Values:**" and click the "**Select...**" button next to "**Script action:**" to assign the vRO action.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vra_7_2_dynamic_property_list_from_rest_api/vRA_Dynamic_Properties_1-1.png)

Select the vRO action we created in the previous step and click "**OK**" to select the vRO action.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vra_7_2_dynamic_property_list_from_rest_api/vRA_Dynamic_Properties_2.png)

This step assumes that we have a blueprint already created to add our property definition to.

We now need to assign the property we just created to the machine vSphere machine object in our StackStorm blueprint.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vra_7_2_dynamic_property_list_from_rest_api/vRA_Dynamic_Properties_3-1.png)

With the blueprint published and properly entitled we can now verify that everything is working by requesting the StackStorm catalog item. If everything worked we should get a functioning drop down list of tags for the "**Tag**" field.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vra_7_2_dynamic_property_list_from_rest_api/vRA_Dynamic_Properties_4.png)

We can select one of the tags from the drop-down to select the particular version of StackStorm that we want to install. In this case "**v2.1.0**" was chosen.

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vra_7_2_dynamic_property_list_from_rest_api/vRA_Dynamic_Properties_5.png) With our tag selected we can submit our request. The "**StackStormTags**" property will be passed to our vRO workflow and can be used to set the particular version to install on our virtual machine.

 ### References

[https://get-creativetitle.com/2017/03/30/vrealize-orchestrator-http-rest-cannot-execute-the-request-read-timed-out/](https://get-creativetitle.com/2017/03/30/vrealize-orchestrator-http-rest-cannot-execute-the-request-read-timed-out/)

[http://www.jaas.co/tag/vco/page/2/](http://www.jaas.co/tag/vco/page/2/)

[http://theithollow.com/2017/05/22/vra-placement-decisions-dynamic-form/](http://theithollow.com/2017/05/22/vra-placement-decisions-dynamic-form/)

[https://developer.github.com/v3/repos/](https://developer.github.com/v3/repos/)
