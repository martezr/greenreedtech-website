---
title: Building the Homelab Hypervisor Installer
publishDate: 2025-03-14T00:00:00Z
excerpt: Building out a virtual lab environment to mimic complex production networks
image: /images/homelab_hypervisor_network_topology.png
category: Homelab
tags:
  - Hypervisor
  - Homelab
author: Martez Reed
---

This blog post picks up from where we left off with building a custom hypervisor for the home lab. There were a couple of design considerations mentioned in the previous post. The primary goal is to have an extremely lightweight solution to perform rapid testing without a lot of hassle with setup and configuration.

## Unique Functionality (Sort of)

Most hypervisor installers follow the standard pattern that general operating system installers do. The installer boots and provides options to “install” the hypervisor onto the system. After putting some thought into the problem, I didn’t want a persistent installation.

There are a few features that made sense after starting to work through the installer that are covered below:

* **Stateless:** This means we actually aren’t installing anything on our system. The operating system will work like a live CD where the operating system is loaded into memory. This one made a lot of sense as it reduces the “installation” time and also means that upgrades or fixing a bad configuration would be as simple reboot.
* **Minimal configuration:** Given that the installer isn’t really an installer, there should be sane defaults for the vast majority of configuration options and a simple way to provide the configurations that are needed.

The reason for the “sort of” comment as it relates to unique functionality is that VMware ESXi supports stateless deployments in which the “installation” of ESXi runs in memory and doesn’t persist across reboots. Configuration is supplied via a Host Profile to address the non-persistent local configuration problem.

## Building a Custom Alpine Linux ISO
So with those thoughts in mind, the process of making this a reality began. The base operating system that was selected was Alpine Linux due to it being a lightweight OS. Alpine Linux fortunately has an existing process for automating the build of custom ISOs. In this case we want a diskless install so we need to preconfigure the system as much as possible to reduce the steps that need to be performed after system boot.

**Reference Repository**

I’ve created a GitHub repository that holds all of the files used to generate the custom ISO.

https://github.com/martezr/nightlight-hypervisor-installer

**Packages**

The installer needs to include all of the virtualization components such as KVM and Open vSwitch. This means that the ISO will be much larger than the standard Alpine Linux installation ISO. Given that we want this to be a stateless deployment the larger ISO is expected but certainly there could be opportunities to further optimize the size.

**Alpine Linux Profile**

Alpine Linux uses profiles to define what the system configuration should look like. The only thing really being done in this case is adding the system packages for KVM and Open vSwitch.

```bash
profile_nightlight() {
        profile_standard
        boot_addons="amd-ucode intel-ucode"
        initrd_ucode="/boot/amd-ucode.img /boot/intel-ucode.img"
        apks="$apks openvswitch libvirt-daemon qemu-img qemu-system-x86_64 qemu-modules openrc virt-install libvirt dbus polkit
                cciss_vol_status lvm2 mdadm mkinitfs mtools nfs-utils
                parted rsync sfdisk syslinux util-linux xfsprogs
                dosfstools ntfs-3g
                "
        local _k _a
        for _k in $kernel_flavors; do
                apks="$apks linux-$_k"
                for _a in $kernel_addons; do
                        apks="$apks $_a-$_k"
                done
        done
        apks="$apks linux-firmware"
        apkovl="aports/scripts/genapkovl-mkimgnightlight.sh"
}
```

The APK overlay is used to define additional system configuration. Additionally, this is how the custom code for the API and TUI will be added to the “installer”.

```bash
#!/bin/sh -e

HOSTNAME="$1"
if [ -z "$HOSTNAME" ]; then
 echo "usage: $0 hostname"
 exit 1
fi

cleanup() {
 rm -rf "$tmp"
}

makefile() {
 OWNER="$1"
 PERMS="$2"
 FILENAME="$3"
 cat > "$FILENAME"
 chown "$OWNER" "$FILENAME"
 chmod "$PERMS" "$FILENAME"
}

rc_add() {
 mkdir -p "$tmp"/etc/runlevels/"$2"
 ln -sf /etc/init.d/"$1" "$tmp"/etc/runlevels/"$2"/"$1"
}

tmp="$(mktemp -d)"
trap cleanup EXIT

mkdir -p "$tmp"/etc

cp /src/aports/scripts/menu.py "$tmp"/etc/menu.py

makefile root:root 0644 "$tmp"/etc/hostname <<EOF
$HOSTNAME
EOF

mkdir -p "$tmp"/etc/network
makefile root:root 0644 "$tmp"/etc/network/interfaces <<EOF
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet dhcp
EOF

mkdir -p "$tmp"/etc/apk
makefile root:root 0644 "$tmp"/etc/apk/world <<EOF
alpine-base
openvswitch
libvirt-daemon 
qemu-img 
qemu-system-x86_64 
qemu-modules 
openrc 
virt-install 
libvirt 
dbus 
polkit
openssh
EOF

makefile root:root 0644 "$tmp"/etc/motd <<EOF
Welcome to Nightlight!
EOF

echo "tun bridge" | tee -a /etc/modules

rc_add ovs-vswitchd boot
rc_add sshd boot
rc_add libvirtd boot
rc_add libvirt-guests boot
rc_add polkit boot
rc_add devfs sysinit
rc_add dmesg sysinit
rc_add mdev sysinit
rc_add hwdrivers sysinit
rc_add modloop sysinit

rc_add hwclock boot
rc_add modules boot
rc_add sysctl boot
rc_add hostname boot
rc_add bootmisc boot
rc_add syslog boot

rc_add mount-ro shutdown
rc_add killprocs shutdown
rc_add savecache shutdown

tar -c -C "$tmp" etc | gzip -9n > $HOSTNAME.apkovl.tar.gz
```

The easiest way to build the ISO installer was using Docker. The reference GitHub repository can be downloaded to generate the ISO.

```bash
git clone https://github.com/martezr/nightlight-hypervisor-installer.git
```

Change directory to the repository

```bash
cd nightlight-hypervisor-installer
```

The following command builds the container image for the ISO build environment.

```bash
docker build --platform linux/amd64 -t alpine-iso-builder .
```

The actual ISO is generated by running the following Docker run command. The ISO should now be available in the current directory on the host system.

```bash
docker run --platform linux/amd64 -v "$(pwd):/build" -it alpine-iso-builder
```

The container should run for a few minutes and once it is done there should be an ISO file in the current directory.

## Installer Testing
The next step is to test the “installer” to make sure that it works. Running it in a virtual machine with support for nested virtualization is the quickest way.

If all went well we should have a functioning system running Alpine Linux and if we look closely we’ll see that Open vSwitch and Libvirt are being started on boot. This means that the packages we need for virtualization are bundled with the ISO.

## Conclusion

The creation of a “simple” installer evolved into something actually much more wonderful and compelling. There are a few outstanding things like how will we configure hostnames and IP addresses without needing to manually do that after every reboot. This is an opportunity to implement a host profile like capability that fetches the configuration from an external source on boot but that’s a different issue for another day.