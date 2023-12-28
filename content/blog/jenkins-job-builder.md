---
title: "Jenkins Job Builder"
description: "Jenkins Job Builder introduction"
date: "2016-01-13"
draft: false
author: "Martez Reed"
tags: ["DevOps", "Jenkins"]
categories: ["DevOps"]
---

Recently a co-worker of mine (Thanks Ken Erwin) introduced me to Jenkins Job Builder ([http://docs.openstack.org/infra/jenkins-job-builder/](http://docs.openstack.org/infra/jenkins-job-builder/)) which is a project created by the OpenStack infrastructure team that aims to automate the creation of Jenkins Jobs. The software is written in python and utilizes either yaml or json files as the framework for creating Jenkins jobs. A list of some of the primary features is provided below.

## Features:

- Supports job creation, modification, and deletion
- Supports templates to speed up the creation of similar jobs
- Supports all major plugins as well as extending the software to incorporate additional plugins
- The software has built-in test functionality to test changes before being deployed into production
- Many additional features

## Example:

The following section covers an example job in yaml format.

```
- job:
    name: puppet-module-profiles
    project-type: matrix
    execution-strategy:
        sequential: true
    axes:
      - axis:
         type: user-defined
         name: PUPPET_VERSION
         values:
           - 3.8.2
           - 3.8.4
           - 4.0.0
           - 4.1.0
      - axis:
         type: slave
         name: nodes
         values:
           - puppet
    description: 'Jenkins job to perform syntax and style checking on {name} puppet module.'
    disabled: false
    node: puppet
    scm:
    - git:
        url: ssh://git@stash.grt.local:7999/infrastructure/puppet-module-profiles.git
        branches:
          - origin/pr/{branch}
        credentials-id: 'f46gdb08-b25e-7h9e-ngef-nar52j732j98'
        browser: auto
    triggers:
      - pollscm:
          cron: ""
    wrappers:
      - ansicolor:
          colormap: xterm
      - workspace-cleanup:
          include:
            - "*"
      - rvm-env:
          implementation: 1.9.3@pupet-module-profiles
    builders:
      - system-groovy:
          command: |
            def currentBuild = Thread.currentThread().executable
            def PULL_REQUEST_URL = build.buildVariableResolver.resolve('PULL_REQUEST_URL')
            def PULL_REQUEST_ID = build.buildVariableResolver.resolve('PULL_REQUEST_ID')
            def description = "<a href='$PULL_REQUEST_URL'>PR #$PULL_REQUEST_ID</a>"
            currentBuild.setDescription(description)
      - conditional-step:
          condition-kind: regex-match
          regex: '^(BUTTON_TRIGGER|OPENED|REOPENED|UPDATED)$'
          label: ${{ENV,var="ACTION"}}
          steps:
            - shell: |
                #!/bin/bash
                echo "Build Trigger $ACTION"
                export PUPPET_VERSION="$PUPPET_VERSION"
                gem install bundler
                bundle install
            - shell: |
                find . -iname *.pp
                -exec puppet-lint --no-80chars-check
                --log-format "%{{path}}:%{{line}}:%{{check}}:%{{KIND}}:%{{message}}"
                {{}}
                ;
            - shell: |
                for file in $(find . -iname '*.pp');
                do
                puppet parser validate
                --render-as s
                --modulepath=modules
                "$file" || exit 1;
                done
      - conditional-step:
          condition-kind: regex-match
          regex: '^(MERGED)$'
          label: ${{ENV,var="ACTION"}}
          steps:
            - shell: |
                #!/bin/bash
                echo "Build Trigger $ACTION"

    publishers:
      - warnings:
          console-log-parsers:
            - Puppet-Lint
          run-always: true
      - stash:
          url: 'https://stash.grt.local:8443'
          ignore-ssl: true
```

## References:

[http://docslide.us/software/continuous-delivery-with-docker-and-jenkins-job-builder.html](http://docslide.us/software/continuous-delivery-with-docker-and-jenkins-job-builder.html)
