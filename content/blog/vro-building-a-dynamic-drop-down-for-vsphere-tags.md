---
title: "vRO - Building a dynamic drop-down for vSphere tags"
date: "2017-04-07"
tags: ["vRO","VMware"]
categories: ["VMware", "vRO"]
image: "https://s3.us-west-2.amazonaws.com/greenreedtech.com/vro_building_a_dynamic_drop_down_for_vsphere_tags/vROvSphereTags_9.png"
draft: false
author: "Martez Reed"
---

A recent blog post by Rob Nelson about using vRO to provision VMs with vSphere tags ([https://rnelson0.com/2017/04/06/vrealize-orchestrator-workflows-for-puppet-enterprise/](https://rnelson0.com/2017/04/06/vrealize-orchestrator-workflows-for-puppet-enterprise/)) got me thinking about how to present a dynamic list of vSphere tags in vRO. So in this post we'll walk through how to create a dynamic drop-down list of vSphere tags in vRO.

This post assumes that the VAPI plugin has been configured which is covered in this post.  
[http://www.thevirtualist.org/vsphere-6-automation-vro-7-tags-vapi-part-i/](http://www.thevirtualist.org/vsphere-6-automation-vro-7-tags-vapi-part-i/)

The first thing we need to do is create an action that retrieves the list of tags that we want. Click on the gray gear with the blue play button to change to actions section.

Create a folder to store the actions. I've used com.grt.vsphere for the folder name to align with the "com.orgname.function" naming schema.

Now we can create the action by clicking on the gray gear with the blue play button above the "General" tab. Provide a name for the action and click "Ok".

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vro_building_a_dynamic_drop_down_for_vsphere_tags/vROvSphereTags_1.png)

Now we need to add the Javascript code needed to fetch the vSphere tags from the category that we want. The code below does just that and all we need to modify is the 'var categoryname = "vROTags"' line at the second line and replace "vROTags" with the desired vSphere tag category.

```
// Modify with the name of the desired category
var categoryName = "vROTags"

// Set the VAPI endpoint to the first endpoint returned
var endpoints = VAPIManager.getAllEndpoints();  
var endpoint = endpoints[0]

if (endpoint == null) {  
  throw "'endpoint' parameter should not be null";
}

// Fetch tags and tag categories
var client = endpoint.client();  
var category = new com_vmware_cis_tagging_category(client);  
var categories = category.list();  
var tagging = new com_vmware_cis_tagging_tag(client);  
var tags = tagging.list();  
var outputTags = [];

// Iterate through tag categories to find the category specified in categoryName

for (var i in categories)  
{
  if (category.get(categories[i]).name == categoryName) {
    categoryId = categories[i];
    System.log("Name: " + category.get(categories[i]).name + " Id: " + categories[i]);
  }
}

// Iterate through tags to find the tags that belong to the categoryName and add them to the outputTags array

for (var i in tags)  
{
  if (tagging.get(tags[i]).category_id.toString() == categoryId.toString()) {
    outputTags.push(tagging.get(tags[i]).name);
  }
}

System.log(outputTags);  
return outputTags;  
```

Copy and paste the Javascript code and modify the categoryName variable value to the desired vSphere tag category name. Then click on the blue link next to "Return Type" under "Scripting" and ensure that it is set to "Array/string". Now that our action is configured click "Save and close".  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vro_building_a_dynamic_drop_down_for_vsphere_tags/vROvSphereTags_2.png)

With all the hard stuff out of the way let's create a workflow to test our action. We'll add a scriptable task just to provide output which tag we selected.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vro_building_a_dynamic_drop_down_for_vsphere_tags/vROvSphereTags_3.png)

Edit the scriptable task and add the following code to log the tag selection.

```
System.log(tag)  
```

![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vro_building_a_dynamic_drop_down_for_vsphere_tags/vROvSphereTags_4.png)

Close the scriptable task and create an input parameter named "tag".  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vro_building_a_dynamic_drop_down_for_vsphere_tags/vROvSphereTags_5.png)

We need to bind the "tag" input parameter to our scriptable task.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vro_building_a_dynamic_drop_down_for_vsphere_tags/vROvSphereTags_6.png)

Click on the "Presentation" tab and select the "tag" input. Then click the blue triangle to add a property and select "Predefined list of elements". Click the purple piece on the property we just added to add the action to dynamically fetch tags.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vro_building_a_dynamic_drop_down_for_vsphere_tags/vROvSphereTags_7.png)

We need to select the action that we created. We can use the filter text box to find the action we created by name and then click "Apply" to add it.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vro_building_a_dynamic_drop_down_for_vsphere_tags/vROvSphereTags_8.png)

If all goes well we should see a dropdown list of the tags in the category we specified in the action.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vro_building_a_dynamic_drop_down_for_vsphere_tags/vROvSphereTags_9.png)

Now that we've run the workflow we can check in the log output which tag we selected from the drop-down.  
![](https://s3.us-west-2.amazonaws.com/greenreedtech.com/vro_building_a_dynamic_drop_down_for_vsphere_tags/vROvSphereTags_10.png)

#### References

[http://www.thevirtualist.org/point-vapi-endpoint-javascript-vro/](http://www.thevirtualist.org/point-vapi-endpoint-javascript-vro/)

[https://www.vcoteam.info/articles/learn-vco/290-dynamic-input-values-based-on-other-inputs.html](https://www.vcoteam.info/articles/learn-vco/290-dynamic-input-values-based-on-other-inputs.html)

[http://www.thevirtualist.org/vsphere-6-automation-vro-7-tags-vapi-part-i/](http://www.thevirtualist.org/vsphere-6-automation-vro-7-tags-vapi-part-i/)

[http://www.thevirtualist.org/vsphere-automation-vro-7-tags-vapi-part-ii/](http://www.thevirtualist.org/vsphere-automation-vro-7-tags-vapi-part-ii/)
