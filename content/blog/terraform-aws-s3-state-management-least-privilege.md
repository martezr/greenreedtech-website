---
title: "Terraform AWS S3 State Management Least Privilege"
date: "2017-10-30"
image: ""
author: "Martez Reed"
draft: false
categories: ["terraform"]
tags: ["aws","devops","terraform"]
---

A very popular Terraform state management configuration is to utilize AWS S3 for state management and AWS DynamoDB for state locking. The problem is that there does not appear to be a publicly available document that details the minimum privileges required by an AWS user or role to leverage AWS S3 and DynamoDB for Terraform state management.

Ideally the concept of least privilege would be used when assigning permissions to AWS users/roles. The permissions discussed below are for administrators or users that utilize the S3 bucket and DynamoDB table and are not responsible for managing those resources.

##### S3 Bucket

S3 access should be restricted to the specific bucket that the user/role is using for storing state files.

- ListBucket: List the S3 bucket
- GetObject: Read access to the Terraform state files
- PutObject: Write access to the Terraform state files
- DeleteObject: Delete an existing Terraform state file

##### DynamoDB

DynamoDB access should be restricted to the specific table that the user/role is using for state locking.

- GetItem: Read an existing Terraform state lock
- PutItem: Write a new Terraform state lock
- DeleteItem: Delete an existing Terraform state lock

The example IAM policy below utilizes the permissions discussed in the previous section.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "TerraformStateLocking",
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:DeleteItem"
            ],
            "Resource": "arn:aws:dynamodb:::table/${dynamodb-table}"
        },
        {
            "Sid": "AllowTerraformStateBucketAccess",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::${s3-bucket}"
        },
        {
            "Sid": "AllowTerraformStateFileAccess",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::${s3-bucket}/*"
        }
    ]
}
```

The policy could be restricted even further by adding the specific account number and AWS region to the "resource" property.

### References

Terraform S3 Backend Configuration  
[https://www.terraform.io/docs/backends/types/s3.html](https://www.terraform.io/docs/backends/types/s3.html)

AWS S3 IAM Permissions  
[http://docs.aws.amazon.com/AmazonS3/latest/dev/using-with-s3-actions.html](http://docs.aws.amazon.com/AmazonS3/latest/dev/using-with-s3-actions.html)

AWS DynamoDB IAM Permissions  
[http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/api-permissions-reference.html](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/api-permissions-reference.html)
