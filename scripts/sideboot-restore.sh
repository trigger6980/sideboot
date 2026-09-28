#!/system/bin/sh
# Best effort. Reboot if the PC still sees a disc.
A=/sys/class/android_usb/android0
if [ ! -d "$A" ]; then
  echo "Reboot the phone to rebuild the USB gadget."
  exit 0
fi
echo 0 > "$A/enable"
echo mtp,adb > "$A/functions"
echo "" > "$A/f_mass_storage/lun0/file" 2>/dev/null || true
echo 1 > "$A/enable"
echo "Asked for mtp,adb. Reboot if transfer is still wrong."
