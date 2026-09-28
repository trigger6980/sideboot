#!/system/bin/sh
# Host a Windows ISO as a USB CD-ROM.
# Run as root: su -c 'sh sideboot-host.sh'
# Reboot the phone to restore normal USB.
# Change ISO if the file is not in Downloads.
ISO="/sdcard/Download/windows.iso"
A=/sys/class/android_usb/android0

if [ ! -d "$A" ]; then
  echo "No legacy android_usb gadget."
  echo "Use DriveDroid's USB wizard instead."
  exit 1
fi
if [ ! -f "$ISO" ]; then
  echo "ISO not found: $ISO"
  exit 1
fi

LUN="$A/f_mass_storage/lun0"
if [ ! -e "$LUN/file" ]; then
  LUN="$A/f_mass_storage/lun"
fi
if [ ! -e "$LUN/file" ]; then
  echo "No mass-storage LUN on this kernel."
  exit 1
fi

echo 0 > "$A/enable"
echo mass_storage > "$A/functions"
echo "$ISO" > "$LUN/file"
if [ -e "$LUN/cdrom" ]; then echo 1 > "$LUN/cdrom"; fi
if [ -e "$LUN/ro" ]; then echo 1 > "$LUN/ro"; fi
echo 1 > "$A/enable"
echo "Hosting as CD-ROM: $ISO"
echo "Plug in a data cable and open the PC boot menu."
