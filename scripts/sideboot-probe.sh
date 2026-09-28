#!/system/bin/sh
# Sideboot probe. Read only. Does not change USB mode.
echo "=== Sideboot probe ==="
getprop ro.product.model
getprop ro.build.version.release
echo "usb.config=$(getprop sys.usb.config)"
echo "usb.state=$(getprop sys.usb.state)"
for p in /sys/class/android_usb/android0 \
  /config/usb_gadget /sys/kernel/config/usb_gadget
do
  if [ -e "$p" ]; then echo "FOUND $p"; else echo "MISS  $p"; fi
done
if [ -d /sys/class/android_usb/android0/f_mass_storage ]; then
  find /sys/class/android_usb/android0/f_mass_storage \
    -maxdepth 2 -type f 2>/dev/null | head -n 40
fi
